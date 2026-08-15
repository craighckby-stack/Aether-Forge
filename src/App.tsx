/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { Viewport } from "./components/Viewport";
import { HUD } from "./components/HUD";
import { AgentProbe } from "./components/AgentProbe";
import { PrayerInboxModal } from "./components/PrayerInboxModal";
import { GenealogyView } from "./components/GenealogyView";
import { TopTickerBanner } from "./components/TopTickerBanner";
import { useAetherForge } from "./engine/useAetherForge";
import { Agent, Ideology } from "./engine/types";
import { motion, AnimatePresence } from "motion/react";
import { db } from "./lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function App() {
  const [selectedWorldId, setSelectedWorldId] = useState("prime-resonance");
  const [allWorlds, setAllWorlds] = useState<any[]>([]);

  // Listen to all worlds in real-time for our global analytics and genealogy lattice
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "worlds"), (snapshot) => {
      const worldsList: any[] = [];
      snapshot.forEach((doc) => {
        worldsList.push(doc.data());
      });
      setAllWorlds(worldsList);
    });
    return () => unsub();
  }, []);

  const { 
    agents, 
    world, 
    resources, 
    isPaused, 
    setIsPaused, 
    simSpeed, 
    setSimSpeed, 
    triggerCataclysm,
    triggerMiracle,
    setNationIdeology,
    injectGitHubTech,
    resolvePrayer,
    ignorePrayer,
    triggerAwarenessSpike,
    godVirusSelfCreateWorld,
    createNewWorld,
    init, 
    update,
    isStoryPlaying,
    setIsStoryPlaying,
    storyFrames,
    setStoryFrames
  } = useAetherForge(selectedWorldId);

  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isGenealogyOpen, setIsGenealogyOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [logFilter, setLogFilter] = useState("");

  const [ghUsername, setGhUsername] = useState(() => localStorage.getItem("af_github_username") || "craighckby-stack");
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem("af_github_repo") || "AetherForge-2");
  const [ghToken, setGhToken] = useState(() => {
    // Migration fallback check: prefer sessionStorage, fall back to localStorage
    const savedSessionToken = sessionStorage.getItem("af_github_token");
    if (savedSessionToken) return savedSessionToken;
    const legacyLocalToken = localStorage.getItem("af_github_token");
    if (legacyLocalToken) {
      // Migrate to sessionStorage and remove from localStorage securely
      sessionStorage.setItem("af_github_token", legacyLocalToken);
      localStorage.removeItem("af_github_token");
      return legacyLocalToken;
    }
    return "";
  });

  const handleStartGenesis = () => {
    localStorage.setItem("af_github_username", ghUsername.trim());
    localStorage.setItem("af_github_repo", ghRepo.trim());
    
    // Store token securely in sessionStorage and clear custom legacy storage
    sessionStorage.setItem("af_github_token", ghToken.trim());
    localStorage.removeItem("af_github_token");
    
    setShowSplash(false);
  };

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === selectedAgentId) || null
  , [agents, selectedAgentId]);

  const handleReset = useCallback(() => {
    init(window.innerWidth > 1024 ? window.innerWidth - 320 : window.innerWidth, window.innerHeight);
  }, [init]);

  useEffect(() => {
    if (!showSplash) {
      handleReset();
    }
  }, [showSplash, handleReset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSplash) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsPaused(p => !p);
      }
      if (e.code === "KeyR") {
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSplash, setIsPaused, handleReset]);

  // Memoize HUD props to prevent unnecessary re-renders
  const hudProps = useMemo(() => ({
    agents,
    world,
    selectedAgentId,
    isPaused,
    setIsPaused,
    simSpeed,
    setSimSpeed,
    onReset: () => { handleReset(); setIsMobileMenuOpen(false); },
    onTriggerCataclysm: triggerCataclysm,
    onTriggerMiracle: triggerMiracle,
    onSetNationIdeology: setNationIdeology,
    onInjectGitHubTech: injectGitHubTech,
    onResolvePrayer: resolvePrayer,
    onIgnorePrayer: ignorePrayer,
    logFilter,
    setLogFilter,
    isInboxOpen,
    setIsInboxOpen
  }), [agents, world, selectedAgentId, isPaused, setIsPaused, simSpeed, setSimSpeed, handleReset, triggerCataclysm, triggerMiracle, setNationIdeology, injectGitHubTech, resolvePrayer, ignorePrayer, logFilter, setLogFilter, isInboxOpen, setIsInboxOpen]);

  // Memoize Viewport props
  const viewportProps = useMemo(() => ({
    agents,
    resources,
    world,
    isPaused,
    onUpdate: update,
    onSelectAgent: setSelectedAgentId,
    selectedAgentId,
    isStoryPlaying,
    setIsStoryPlaying,
    storyFrames
  }), [agents, resources, world, isPaused, update, setSelectedAgentId, selectedAgentId, isStoryPlaying, setIsStoryPlaying, storyFrames]);

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden font-mono text-indigo-500">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="space-y-6 max-w-xl my-auto"
            >
              <h1 className="text-6xl font-black tracking-tighter text-indigo-400 monospace uppercase glitch-text">
                AetherForge Ω: Global Genesis
              </h1>
              <div className="h-[1px] w-full bg-indigo-500/30 relative overflow-hidden">
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                />
              </div>
              <p className="text-indigo-700 monospace text-sm leading-relaxed uppercase tracking-widest opacity-80">
                Recursive Evolutionary Simulation Engine <br/> 
                <span className="text-indigo-400 text-xs">AetherForge Ω: Global Genesis v3.0-Ω | Substrate Active</span>
              </p>
              
              <div className="mt-8 flex flex-col space-y-3 max-w-xs mx-auto p-4 border border-indigo-900 rounded bg-slate-950">
                 <p className="text-[10px] monospace text-indigo-400 uppercase text-left mb-1 border-b border-indigo-500/30 pb-2">Dark AGI Github Storage (Optional)</p>
                 <input type="text" value={ghUsername} onChange={e => setGhUsername(e.target.value)} placeholder="GH Username (craighckby-stack)" className="bg-slate-950 border border-indigo-900 p-2 text-xs text-indigo-500 monospace focus:outline-none focus:border-indigo-500 transition-colors" />
                 <input type="text" value={ghRepo} onChange={e => setGhRepo(e.target.value)} placeholder="GH Repository (aetherforge-archive)" className="bg-slate-950 border border-indigo-900 p-2 text-xs text-indigo-500 monospace focus:outline-none focus:border-indigo-500 transition-colors" />
                 <input type="password" value={ghToken} onChange={e => setGhToken(e.target.value)} placeholder="Access Token (For Agent Memoirs)" className="bg-slate-950 border border-indigo-900 p-2 text-xs text-indigo-500 monospace focus:outline-none focus:border-indigo-500 transition-colors" />
                 <p className="text-[9px] text-indigo-800 text-left mt-1">Leave blank to simulate without archiving.</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGenesis}
                className="mt-8 px-12 py-4 bg-indigo-500 text-black font-bold uppercase tracking-widest text-sm rounded-full hover:bg-indigo-400 transition-colors shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                Initialize Genesis
              </motion.button>
            </motion.div>
            
            <div className="p-8 text-[10px] monospace text-indigo-900 uppercase flex flex-col sm:flex-row gap-4 justify-center w-full">
              <span>© 2026 craighckby-stack | ALL RIGHTS RESERVED</span>
              <span className="hidden sm:inline">|</span>
              <span>DECRYPT_LATTICE: 0x8F22A0...</span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex flex-col flex-1 overflow-hidden"
          >
            <TopTickerBanner world={world} />
            
            <div className="relative flex flex-1 overflow-hidden">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden fixed top-4 right-4 z-[100] p-3 bg-slate-950 border border-indigo-900 rounded-full text-indigo-400 shadow-lg"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                <span className={`h-0.5 w-full bg-current transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`h-0.5 w-full bg-current transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 w-full bg-current transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>

            {/* Left Panel: Sidebar HUD */}
            <div className={`fixed inset-0 lg:relative z-[90] lg:z-auto transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <HUD {...hudProps} />
              {/* Mobile Overlay */}
              {isMobileMenuOpen && (
                <div 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="lg:hidden fixed inset-0 -z-10 bg-slate-950/60 backdrop-blur-sm"
                />
              )}
            </div>

            {/* Center Panel: Viewport */}
            <main className="flex-1 relative overflow-hidden bg-slate-950">
              {/* Floating button to view the Genealogy Lattice of spawned universes */}
              <div className="absolute top-4 left-4 lg:left-6 z-40 flex items-center gap-2">
                <button
                  onClick={() => setIsGenealogyOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-950 border border-indigo-500/30 hover:border-indigo-400 text-indigo-400 hover:text-indigo-300 font-mono text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)] rounded-lg transition-all uppercase tracking-wider backdrop-blur-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  Genealogy Lattice ({allWorlds.length})
                </button>
              </div>

              <Viewport {...viewportProps} />
            </main>

            {/* Agent Detail Modal */}
            <AgentProbe 
              agent={selectedAgent}
              world={world}
              agents={agents}
              onClose={() => setSelectedAgentId(null)}
              onTriggerAwarenessSpike={triggerAwarenessSpike}
              onAgentSelfCreateWorld={(agentId) => {
                godVirusSelfCreateWorld(agentId, window.innerWidth, window.innerHeight);
              }}
            />

            {/* Divine Prayer Terminal Modal */}
            <PrayerInboxModal
              isOpen={isInboxOpen}
              onClose={() => setIsInboxOpen(false)}
              world={world}
              agents={agents}
              onResolvePrayer={resolvePrayer}
              onIgnorePrayer={ignorePrayer}
            />

            {/* Genealogy Tree Modal */}
            {isGenealogyOpen && (
              <GenealogyView
                isOpen={isGenealogyOpen}
                onClose={() => setIsGenealogyOpen(false)}
                worlds={allWorlds}
                selectedWorldId={selectedWorldId}
                onSelectWorld={(worldId) => {
                  setSelectedWorldId(worldId);
                  setIsGenealogyOpen(false);
                }}
                onCreateWorld={async (name, parentId) => {
                  const newId = await createNewWorld(name, parentId, window.innerWidth, window.innerHeight);
                  return newId;
                }}
              />
            )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

