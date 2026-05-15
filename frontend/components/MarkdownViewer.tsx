'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Basename helper working in browser
const basename = (path: string, ext?: string) => {
    if (!path) return '';
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    if (ext && name.endsWith(ext)) {
        return name.slice(0, -ext.length);
    }
    return name;
};

const normalizePath = (path: string) => {
    if (!path) return '';
    const parts = path.split('/');
    const stack: string[] = [];
    for (const part of parts) {
        if (part === '.' || part === '') {
            continue;
        }
        if (part === '..') {
            stack.pop();
        } else {
            stack.push(part);
        }
    }
    return (path.startsWith('/') ? '/' : '') + stack.join('/');
};

interface MarkdownViewerProps {
  filePath: string;
  onNavigate: (path: string) => void;
  claimId: string;
}

export default function MarkdownViewer({ filePath, onNavigate, claimId }: MarkdownViewerProps) {
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allFiles, setAllFiles] = useState<{name: string, tags: string[]}[]>([]);

  useEffect(() => {
    if (!claimId) return;
    
    fetch(`/api/wiki/list?claimId=${claimId}`)
      .then(res => res.json())
      .then(data => {
        setAllFiles(data.files || []);
      })
      .catch(err => console.error('Failed to load file list:', err));
  }, [claimId]);

  useEffect(() => {
    if (!claimId) return;
    
    if (filePath.startsWith('tag:')) {
        setLoading(false);
        setContent('');
        setMetadata({});
        return;
    }

    setLoading(true);
    fetch(`/api/wiki/content?path=${encodeURIComponent(filePath)}&claimId=${claimId}`)
      .then(res => res.json())
      .then(data => {
        const rawContent = data.content || 'No content found.';
        
        // Parse frontmatter
        const frontmatterMatch = rawContent.match(/^---([\s\S]*?)---\n?/);
        let cleanedContent = rawContent;
        let metadata: any = {};
        
        if (frontmatterMatch) {
            cleanedContent = rawContent.replace(frontmatterMatch[0], '');
            const fmStr = frontmatterMatch[1];
            
            // Robust YAML-like line-by-line block parser
            const lines = fmStr.split('\n');
            let currentKey = '';
            let currentList: any[] = [];
            let currentItem: any = null;

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (line.startsWith('  - ')) {
                    if (currentItem) currentList.push(currentItem);
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
                } else {
                    if (currentItem) {
                        currentList.push(currentItem);
                        currentItem = null;
                    }
                    if (currentKey && currentList.length > 0) {
                        metadata[currentKey] = currentList;
                        currentList = [];
                    }

                    const match = trimmed.match(/^(\w+):\s*(.*)/);
                    if (match) {
                        currentKey = match[1];
                        let value = match[2].trim();

                        if (value.startsWith('[') && value.endsWith(']')) {
                            metadata[currentKey] = value.slice(1, -1).split(',').map((s: string) => s.trim().replace(/['"]/g, '')).filter(Boolean);
                        } else if (value === 'true') {
                            metadata[currentKey] = true;
                        } else if (value === 'false') {
                            metadata[currentKey] = false;
                        } else if (!isNaN(Number(value)) && value !== '') {
                            metadata[currentKey] = Number(value);
                        } else {
                            if (value.startsWith('"') || value.startsWith("'")) value = value.slice(1, -1);
                            metadata[currentKey] = value;
                        }
                    }
                }
            }

            if (currentItem) currentList.push(currentItem);
            if (currentKey && currentList.length > 0) {
                metadata[currentKey] = currentList;
            }
        }
        
        setMetadata(metadata);
        setContent(cleanedContent);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load content:', err);
        setContent('Error loading content.');
        setMetadata({});
        setLoading(false);
      });
  }, [filePath, claimId]);

  // Helper to resolve relative paths
  const resolvePath = (currentPath: string, relativePath: string) => {
    if (relativePath.startsWith('http') || relativePath.startsWith('#')) {
        return relativePath;
    }
    
    let resolved = relativePath;
    
    if (!relativePath.startsWith('.') && relativePath.includes('/')) {
        resolved = relativePath;
    } else {
        const pathParts = currentPath.split('/').filter(Boolean);
        pathParts.pop(); // Remove file name
        const currentDir = pathParts.join('/');
        
        if (relativePath.startsWith('../')) {
            const parts = currentDir.split('/').filter(Boolean);
            const relParts = relativePath.split('/');
            
            for (const part of relParts) {
                if (part === '..') {
                    parts.pop();
                } else if (part !== '.') {
                    parts.push(part);
                }
            }
            resolved = parts.join('/');
        } else if (!relativePath.startsWith('/')) {
            // Same directory
            if (currentDir && currentDir !== '.') {
                resolved = `${currentDir}/${relativePath}`;
            } else {
                resolved = relativePath;
            }
        }
    }
    
    return normalizePath(resolved);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black text-zinc-100 p-8">
      {loading ? (
        <div className="text-zinc-500">Loading {filePath}...</div>
      ) : filePath.startsWith('tag:') ? (
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 text-zinc-500 text-xs font-mono uppercase tracking-wider">tag // {filePath.substring(4)}</div>
          <div className="mb-6 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="text-xl font-bold text-zinc-100 mb-2">Tag: <span className="text-blue-400 font-mono">{filePath.substring(4)}</span></div>
            <div className="text-zinc-400 text-sm mb-4">Files associated with this tag under claim:</div>
            
            <ul className="space-y-2">
                {allFiles
                    .filter(file => file.tags && file.tags.map(t => t.toLowerCase()).includes(filePath.substring(4).toLowerCase()))
                    .map(file => (
                        <li key={file.name} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <button
                                onClick={() => onNavigate(file.name)}
                                className="text-blue-400 hover:underline text-sm text-left font-medium"
                            >
                                {basename(file.name, '.md')}
                            </button>
                            <span className="text-zinc-600 text-xs font-mono">({file.name})</span>
                        </li>
                    ))
                }
            </ul>
            {allFiles.filter(file => file.tags && file.tags.map(t => t.toLowerCase()).includes(filePath.substring(4).toLowerCase())).length === 0 && (
                <div className="text-zinc-500 text-sm italic">No files found with this tag.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 text-zinc-500 text-xs font-mono uppercase tracking-wider">claim file // {filePath}</div>

          {/* Render Metadata */}
          {Object.keys(metadata).length > 0 && (
            <div className="mb-6 p-6 bg-zinc-900 rounded-lg border border-zinc-800 text-sm flex flex-col gap-4">
                {metadata.title && <div className="text-xl font-bold text-white tracking-tight">{metadata.title}</div>}
                {metadata.description && <div className="text-zinc-400">{metadata.description}</div>}
                
                {/* Styled Badges for Status and Confidence */}
                <div className="flex flex-wrap items-center gap-2">
                    {metadata.status && (
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                            metadata.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            metadata.status === 'stub' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                            {metadata.status.toUpperCase()}
                        </span>
                    )}
                    {metadata.confidence !== undefined && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                            Confidence: {Math.round(metadata.confidence * 100)}%
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" style={{ opacity: metadata.confidence }}></span>
                        </span>
                    )}
                    {metadata.evidence_count !== undefined && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Evidence Count: {metadata.evidence_count}
                        </span>
                    )}
                </div>

                {/* Contested Alert Banner */}
                {metadata.contested === true && (
                    <div className="p-3.5 bg-rose-950/30 border border-rose-800/60 text-rose-200 text-xs rounded-lg flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <div>
                            <strong className="text-rose-400">CONTESTED KNOWLEDGE:</strong> This page contains conflicting or contradictory claims. Please verify sources below.
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 border-t border-zinc-800/50 pt-4">
                    {metadata.created_at && <div><span className="font-semibold">Created:</span> {metadata.created_at}</div>}
                    {metadata.updated_at && <div><span className="font-semibold">Updated:</span> {metadata.updated_at}</div>}
                    {metadata.date_created && <div><span className="font-semibold">Date Created:</span> {metadata.date_created}</div>}
                    {metadata.source && (
                        <div className="col-span-2">
                            <span className="font-semibold">Source:</span>{' '}
                            {metadata.source.startsWith('http') ? (
                                <a href={metadata.source} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{metadata.source}</a>
                            ) : (
                                <span>{metadata.source}</span>
                            )}
                        </div>
                    )}
                    {metadata.sources && (
                        <div className="col-span-2">
                            <span className="font-semibold">Sources:</span>{' '}
                            {metadata.sources.map((s: string) => (
                                <button 
                                    key={s}
                                    onClick={() => onNavigate(`sources/${s.endsWith('.md') ? s : s + '.md'}`)}
                                    className="text-blue-400 hover:underline mr-2"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                    {metadata.tags && (
                        <div className="col-span-2">
                            <span className="font-semibold">Tags:</span>{' '}
                            {metadata.tags.map((t: string) => (
                                <button 
                                    key={t} 
                                    onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                                    className={`px-2 py-0.5 rounded-full mr-1 cursor-pointer text-xs ${selectedTag === t ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                    {metadata.relationships && (
                        <div className="col-span-2 mt-2 border-t border-zinc-800/50 pt-3">
                            <div className="font-semibold mb-1.5 text-zinc-400">Ontological Connections:</div>
                            <ul className="space-y-1">
                                {metadata.relationships.map((rel: any, index: number) => (
                                    <li key={index} className="text-zinc-400 flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide bg-blue-950 text-blue-400 border border-blue-900/50">
                                            {rel.type}
                                        </span>
                                        <button
                                            onClick={() => onNavigate(rel.target)}
                                            className="text-blue-400 hover:underline font-medium text-xs"
                                        >
                                            {basename(rel.target, '.md')}
                                        </button>
                                        {rel.description && (
                                            <span className="text-zinc-500 italic text-xs">- {rel.description}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
          )}

          <div className="prose prose-invert max-w-none mt-8">
             <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node, ...props }) => {
                        const href = props.href || '';
                        const isExternal = href.startsWith('http');
                        
                        if (isExternal) {
                            return <a {...props} target="_blank" rel="noopener noreferrer" />;
                        }
                        
                        return (
                            <button
                                onClick={() => {
                                    const resolved = resolvePath(filePath, href);
                                    console.log(`Navigating to: ${resolved} (from ${filePath} + ${href})`);
                                    onNavigate(resolved);
                                }}
                                className="text-blue-400 hover:underline cursor-pointer text-left font-medium"
                            >
                                {props.children}
                            </button>
                        );
                    }
                }}
             >
                 {content}
             </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
