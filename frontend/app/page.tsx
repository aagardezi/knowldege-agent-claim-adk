'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

import MarkdownViewer from '@/components/MarkdownViewer';
import WikiGraph from '@/components/WikiGraph';
import { Network, FileText, Maximize2, Minimize2, LogOut, Shield, Loader } from 'lucide-react';

export default function Home() {
  const [claimId, setClaimId] = useState<string | null>(null);
  const [claimInput, setClaimInput] = useState('');
  const [selectedFile, setSelectedFile] = useState('index.md');
  const [showGraph, setShowGraph] = useState(true);
  const [fullscreenGraph, setFullscreenGraph] = useState(false);
  const [availableClaims, setAvailableClaims] = useState<string[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);

  useEffect(() => {
    fetch('/api/claims')
      .then(res => res.json())
      .then(data => {
        if (data.claims) {
          setAvailableClaims(data.claims);
        }
        setLoadingClaims(false);
      })
      .catch(err => {
        console.error('Failed to load available claims:', err);
        setLoadingClaims(false);
      });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = claimInput.trim().toUpperCase();
    if (trimmed) {
      setClaimId(trimmed);
      setSelectedFile('index.md'); // Reset view to claim index
    }
  };

  const handleLogout = () => {
    setClaimId(null);
    setClaimInput('');
  };

  if (!claimId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 px-4">
        <div className="w-full max-w-md p-8 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-blue-600/10 rounded-full border border-blue-500/20 text-blue-400 mb-2">
              <Shield size={32} />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Claims Knowledge Portal</h1>
            <p className="text-sm text-zinc-400">
              Select or enter a Claim ID to access documents, assessments, and evidence.
            </p>
          </div>

          {loadingClaims ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-zinc-500 text-xs">
              <Loader size={20} className="animate-spin text-blue-500" />
              Retrieving active claim folders from GCS...
            </div>
          ) : (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                {availableClaims.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="claimSelect" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Select Active Claim
                    </label>
                    <select
                      id="claimSelect"
                      value={claimInput}
                      onChange={(e) => setClaimInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none transition-colors text-sm font-mono cursor-pointer"
                    >
                      <option value="" className="text-zinc-600">-- Choose an active claim --</option>
                      {availableClaims.map(claim => (
                        <option key={claim} value={claim} className="text-white">
                          {claim}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label htmlFor="claimId" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {availableClaims.length > 0 ? 'Or Enter Claim ID Manually' : 'Claim ID'}
                  </label>
                  <input
                    id="claimId"
                    type="text"
                    placeholder="e.g. CLM-2026-001"
                    value={claimInput}
                    onChange={(e) => setClaimInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none transition-colors placeholder-zinc-600 text-sm font-mono"
                    autoFocus={availableClaims.length === 0}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!claimInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium py-2.5 rounded text-sm transition-colors shadow-lg shadow-blue-900/20 cursor-pointer mt-2"
              >
                Access Claim Wiki
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden">
      <Sidebar onSelectFile={setSelectedFile} claimId={claimId} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-950/50 border border-blue-900/50 rounded text-xs font-mono font-bold text-blue-400 uppercase">
              <Shield size={12} /> {claimId}
            </div>
            <span className="text-sm font-medium text-zinc-400">{selectedFile}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGraph(!showGraph)}
              className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${showGraph ? 'text-white' : 'text-zinc-500'}`}
              title={showGraph ? 'Hide Graph' : 'Show Graph'}
            >
              <Network size={18} />
            </button>
            {showGraph && (
              <button
                onClick={() => setFullscreenGraph(!fullscreenGraph)}
                className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-white"
                title={fullscreenGraph ? 'Restore View' : 'Fullscreen Graph'}
              >
                {fullscreenGraph ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
            <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
            <button
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
              title="Exit Claim Portal"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {(!showGraph || !fullscreenGraph) && (
            <MarkdownViewer filePath={selectedFile} onNavigate={setSelectedFile} claimId={claimId} />
          )}
          
          {showGraph && (
            <div className={`${fullscreenGraph ? 'w-full' : 'w-1/2'} border-l border-zinc-800`}>
              <WikiGraph onNodeClick={setSelectedFile} focusedNodeId={selectedFile} claimId={claimId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
