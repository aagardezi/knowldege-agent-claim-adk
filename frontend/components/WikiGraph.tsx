'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// ForceGraph2D must be imported dynamically since it uses browser APIs
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphData {
  nodes: any[];
  links: any[];
}

interface WikiGraphProps {
  onNodeClick: (nodeId: string) => void;
  focusedNodeId?: string;
  claimId: string;
}

export default function WikiGraph({ onNodeClick, focusedNodeId, claimId }: WikiGraphProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [filteredData, setFilteredData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [hasCentered, setHasCentered] = useState(false);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (!claimId) return;

    setLoading(true);
    fetch(`/api/wiki/graph?claimId=${claimId}`)
      .then(res => res.json())
      .then(data => {
        if (data.nodes && data.links) {
            setGraphData(data);
            setFilteredData(data);
            
            // Zoom to fit after data is loaded and state is updated
            setTimeout(() => {
                if (fgRef.current) {
                    fgRef.current.zoomToFit(400, 50);
                }
            }, 500);
        } else {
            console.error('Invalid graph data received:', data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load graph data:', err);
        setLoading(false);
      });
  }, [claimId]);

  useEffect(() => {
    if (focusedNodeId && focusedNodeId !== 'index.md' && graphData.nodes?.length > 0) {
        // Find neighbors
        const neighbors = new Set<string>();
        neighbors.add(focusedNodeId);
        
        graphData.links.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (sourceId === focusedNodeId) {
                neighbors.add(targetId);
            } else if (targetId === focusedNodeId) {
                neighbors.add(sourceId);
            }
        });
        
        const filteredNodes = graphData.nodes.filter(node => neighbors.has(node.id));
        const filteredLinks = graphData.links.filter(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return neighbors.has(sourceId) && neighbors.has(targetId);
        });
        
        setFilteredData({ nodes: filteredNodes, links: filteredLinks });
        setIsFiltered(true);
        
        // Center on node
        const node = graphData.nodes.find(n => n.id === focusedNodeId);
        if (node && fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(2, 1000);
        }
    } else if (focusedNodeId === 'index.md' && graphData.nodes?.length > 0) {
        // Reset to full graph when index is selected
        setFilteredData(graphData);
        setIsFiltered(false);
        if (fgRef.current && hasCentered) {
            fgRef.current.centerAt(0, 0, 1000);
            fgRef.current.zoom(1, 1000);
        }
    }
  }, [focusedNodeId, graphData, hasCentered]);

  const handleReset = () => {
      setFilteredData(graphData);
      setIsFiltered(false);
      if (fgRef.current) {
          fgRef.current.centerAt(0, 0, 1000);
          fgRef.current.zoom(1, 1000);
      }
  };

  const getColor = (group: string) => {
    switch (group) {
      case 'entity': return '#60a5fa'; // blue (evidence)
      case 'concept': return '#34d399'; // green (assessments)
      case 'source': return '#f87171'; // red (raw sources)
      case 'index': return '#e879f9'; // pink (index & summary)
      case 'tag': return '#fbbf24'; // amber (tags)
      default: return '#9ca3af'; // gray (others)
    }
  };

  return (
    <div className="h-full bg-zinc-950 relative">
      {loading ? (
        <div className="text-zinc-500 absolute inset-0 flex items-center justify-center text-sm font-mono">Generating Knowledge Graph...</div>
      ) : graphData.nodes.length === 0 ? (
        <div className="text-zinc-600 absolute inset-0 flex items-center justify-center text-xs italic">No nodes to map yet.</div>
      ) : (
        <ForceGraph2D
          ref={fgRef}
          graphData={filteredData}
          nodeLabel="label"
          nodeColor={node => getColor((node as any).group)}
          nodeRelSize={6}
          linkDirectionalParticles={link => (link as any).isExplicit ? 4 : 2}
          linkDirectionalParticleSpeed={0.005}
          linkColor={link => (link as any).isExplicit ? '#60a5fa' : '#3f3f46'}
          linkWidth={link => (link as any).isExplicit ? 2 : 1}
          linkLabel={link => (link as any).isExplicit ? `<span class="text-blue-400 text-xs font-mono font-bold">${(link as any).label}</span>` : ''}
          onNodeClick={(node) => onNodeClick((node as any).id)}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = (node as any).label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            
            ctx.beginPath();
            ctx.arc((node as any).x, (node as any).y, 6, 0, 2 * Math.PI, false);
            ctx.fillStyle = getColor((node as any).group);
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#a1a1aa';
            ctx.fillText(label, (node as any).x, (node as any).y + 12);
          }}
        />
      )}
      {isFiltered && (
        <button
            onClick={handleReset}
            className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded shadow-lg transition-colors cursor-pointer"
        >
            Reset View
        </button>
      )}
      <div className="absolute bottom-4 left-4 bg-zinc-900/85 p-3 rounded text-[10px] font-semibold text-zinc-400 backdrop-blur-sm border border-zinc-800 flex flex-col gap-1.5">
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#e879f9] rounded-full"></span> Index & Summary</div>
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#60a5fa] rounded-full"></span> Evidence (Docs/medical)</div>
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#34d399] rounded-full"></span> Assessments (Liability/damage)</div>
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#f87171] rounded-full"></span> Raw Sources</div>
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#fbbf24] rounded-full"></span> Tag Nodes</div>
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#9ca3af] rounded-full"></span> Other</div>
      </div>
    </div>
  );
}
