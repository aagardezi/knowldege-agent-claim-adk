import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';

const BUCKET_NAME = process.env.WIKI_BUCKET_NAME || 'YOUR_WIKI_BUCKET_NAME';
const storage = new Storage();

interface Node {
  id: string;
  label: string;
  group: string;
}

interface Link {
  source: string;
  target: string;
  isExplicit?: boolean;
  label?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('claimId');

    if (!claimId) {
      return NextResponse.json({ error: 'Missing claimId parameter' }, { status: 400 });
    }

    const prefix = `${claimId}/`;
    const bucket = storage.bucket(BUCKET_NAME);
    const [files] = await bucket.getFiles({ prefix });
    
    const markdownFiles = files.filter(file => file.name.endsWith('.md'));
    
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    // Map to keep track of added nodes to avoid duplicates
    const nodeIds = new Set<string>();

    for (const file of markdownFiles) {
      // Strip claimId prefix to operate entirely on claim-relative paths
      const id = file.name.substring(prefix.length);
      
      // Skip schema.md, log.md, gaps.md
      if (id === 'schema.md' || id === 'log.md' || id === 'gaps.md' || id.startsWith('logs/')) {
          continue;
      }

      const label = path.basename(id, '.md');
      let group = 'other';
      
      if (id.includes('evidence/')) group = 'entity';
      else if (id.includes('assessments/')) group = 'concept';
      else if (id.startsWith('summary/')) group = 'index';
      else if (id.startsWith('sources/')) group = 'source';
      else if (id === 'index.md') group = 'index';

      if (!nodeIds.has(id)) {
        nodes.push({ id, label, group });
        nodeIds.add(id);
      }

      try {
        const [contentBuffer] = await file.download();
        const content = contentBuffer.toString('utf-8');

        // Parse frontmatter sources
        const frontmatterMatch = content.match(/^---[\s\S]*?---/);
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[0];
            const sourcesMatch = frontmatter.match(/sources:\s*\[(.*?)\]/);
            if (sourcesMatch) {
                const sourcesStr = sourcesMatch[1];
                const sources = sourcesStr.split(',').map(s => s.trim().replace(/['"]/g, ''));
                for (const source of sources) {
                    if (source) {
                        let sourcePath = source;
                        if (!sourcePath.startsWith('sources/')) {
                            sourcePath = `sources/${sourcePath}`;
                        }
                        if (!sourcePath.endsWith('.md')) {
                            sourcePath += '.md';
                        }
                        links.push({ source: id, target: sourcePath });
                        
                        if (!nodeIds.has(sourcePath)) {
                            nodes.push({ id: sourcePath, label: path.basename(sourcePath, '.md'), group: 'source' });
                            nodeIds.add(sourcePath);
                        }
                    }
                }
            }

            // Parse tags
            const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
            if (tagsMatch) {
                const tagsStr = tagsMatch[1];
                const tags = tagsStr.split(',').map(s => s.trim().replace(/['"]/g, ''));
                for (const tag of tags) {
                    if (tag) {
                        const tagNodeId = `tag:${tag.toLowerCase()}`;
                        links.push({ source: id, target: tagNodeId });
                        
                        if (!nodeIds.has(tagNodeId)) {
                            nodes.push({ id: tagNodeId, label: tag.toLowerCase(), group: 'tag' });
                            nodeIds.add(tagNodeId);
                        }
                    }
                }
            }

            // Parse explicit relationships using a robust line-by-line block parser
            const relationshipsMatch = frontmatter.match(/relationships:\s*\n((?:\s+.*\n?)+)/);
            if (relationshipsMatch) {
                const relsStr = relationshipsMatch[1];
                const lines = relsStr.split('\n');
                const relationships: any[] = [];
                let currentItem: any = null;

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (line.startsWith('  - ')) {
                        if (currentItem) relationships.push(currentItem);
                        currentItem = {};
                        const lineContent = line.substring(4).trim();
                        const match = lineContent.match(/^(\w+):\s*(.*)/);
                        if (match) {
                            const k = match[1];
                            let v = match[2].trim();
                            if (v.startsWith('"') || v.startsWith("'")) v = v.slice(1, -1);
                            currentItem[k] = v;
                        }
                    } else if (line.startsWith('    ') && currentItem) {
                        const match = trimmed.match(/^(\w+):\s*(.*)/);
                        if (match) {
                            const k = match[1];
                            let v = match[2].trim();
                            if (v.startsWith('"') || v.startsWith("'")) v = v.slice(1, -1);
                            currentItem[k] = v;
                        }
                    }
                }
                if (currentItem) relationships.push(currentItem);

                for (const rel of relationships) {
                    let targetId = rel.target;
                    const type = rel.type;

                    if (targetId) {
                        if (!targetId.endsWith('.md') && !targetId.includes('.')) {
                            targetId += '.md';
                        }

                        links.push({ source: id, target: targetId, isExplicit: true, label: type });

                        if (!nodeIds.has(targetId)) {
                            let group = 'other';
                            if (targetId.includes('evidence/')) group = 'entity';
                            else if (targetId.includes('assessments/')) group = 'concept';
                            else if (targetId.startsWith('summary/')) group = 'index';
                            else if (targetId.startsWith('sources/')) group = 'source';

                            nodes.push({ id: targetId, label: path.basename(targetId, '.md'), group });
                            nodeIds.add(targetId);
                        }
                    }
                }
            }
        }
        
        // Parse markdown links: [Text](path.md) or [[wikilink]]
        const linkRegex = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
          let targetId = match[3] || match[1];
          
          if (targetId && !targetId.startsWith('http') && !targetId.startsWith('#')) {
             if (!targetId.endsWith('.md') && !targetId.includes('.')) {
                 targetId += '.md';
             }
             
             let resolvedTarget = targetId;
             
             // Handle relative paths
             if (targetId.startsWith('../')) {
                 const idParts = id.split('/');
                 const targetParts = targetId.split('/');
                 
                 idParts.pop(); 
                 
                 for (const part of targetParts) {
                     if (part === '..') {
                         idParts.pop();
                     } else if (part !== '.') {
                         idParts.push(part);
                     }
                 }
                 resolvedTarget = idParts.join('/');
             } else if (!targetId.includes('/')) {
                 // Assume same directory as source file
                 const dir = path.dirname(id);
                 if (dir !== '.') {
                     resolvedTarget = path.join(dir, targetId);
                 }
             }
             
             if (resolvedTarget !== id) {
                 links.push({ source: id, target: resolvedTarget });
                 
                 if (!nodeIds.has(resolvedTarget)) {
                      let group = 'other';
                      if (resolvedTarget.includes('evidence/')) group = 'entity';
                      else if (resolvedTarget.includes('assessments/')) group = 'concept';
                      else if (resolvedTarget.startsWith('summary/')) group = 'index';
                      else if (resolvedTarget.startsWith('sources/')) group = 'source';
                      
                      nodes.push({ id: resolvedTarget, label: path.basename(resolvedTarget, '.md'), group });
                      nodeIds.add(resolvedTarget);
                 }
             }
          }
        }
      } catch (e) {
          console.error(`Error parsing links for ${id}:`, e);
      }
    }

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error('Error generating graph data:', error);
    return NextResponse.json({ error: 'Failed to generate graph data' }, { status: 500 });
  }
}
