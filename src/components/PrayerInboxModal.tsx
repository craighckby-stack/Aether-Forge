import React, { useState } from "react";
import { Agent, WorldState, PrayerEmail, Archetype } from "../engine/types";
import { X, Mail, MailOpen, Send, Check, Trash2, ShieldAlert, Cpu, Sparkles, AlertTriangle, Scroll, ExternalLink, Folder, Github } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PrayerInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: WorldState;
  agents: Agent[];
  onResolvePrayer?: (prayerId: string, replyText: string) => void;
  onIgnorePrayer?: (prayerId: string) => void;
}

export const PrayerInboxModal: React.FC<PrayerInboxModalProps> = ({
  isOpen,
  onClose,
  world,
  agents = [],
  onResolvePrayer,
  onIgnorePrayer
}) => {
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
  const [userReply, setUserReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const ghUsername = localStorage.getItem("af_github_username") || "";
  const ghRepo = localStorage.getItem("af_github_repo") || "";

  const prayersList = world.prayers || [];

  React.useEffect(() => {
    if (isOpen) {
      const selectedExists = prayersList.some(p => p.id === selectedPrayerId);
      if (!selectedPrayerId || !selectedExists) {
        const firstPending = prayersList.find(p => p.status === "pending");
        if (firstPending) {
          setSelectedPrayerId(firstPending.id);
        } else if (prayersList.length > 0) {
          setSelectedPrayerId(prayersList[0].id);
        } else {
          setSelectedPrayerId(null);
        }
      }
    }
  }, [isOpen, prayersList, selectedPrayerId]);

  const selectedPrayer = prayersList.find(p => p.id === selectedPrayerId);

  // Find corresponding active agent in simulation to build rich state info
  const targetAgent = selectedPrayer ? agents.find(a => a.id === selectedPrayer.agentId) : null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrayer || !userReply.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      // Find or build temporary agent data if agent is already deleted / reincarnated
      const agentData = targetAgent || {
        id: selectedPrayer.agentId,
        name: selectedPrayer.agentName,
        archetype: selectedPrayer.archetype,
        sanity: 0.5,
        rationalism: 0.5,
        energy: 100,
        order: 0.5,
        epoch: world.epoch
      };

      // Call Gemini pray endpoint for divine response representation
      const response = await fetch("/api/pray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentData: {
            ...agentData,
            epoch: world.epoch
          },
          worldState: {
            complexity: Math.floor(world.complexity),
            integrity: world.integrity,
            threatLevel: world.threatLevel,
            faithPoints: world.faithPoints,
            sinAccumulation: world.sinAccumulation
          },
          userMessage: userReply,
          chatHistory: [] // Single round dynamic communion
        })
      });

      if (!response.ok) {
        throw new Error("synaptic transmission broke");
      }

      const data = await response.json();
      
      // Resolve the prayer with the customized reply text
      if (onResolvePrayer) {
        onResolvePrayer(selectedPrayer.id, data.reply || `Divine directive broadcasted: ${userReply}`);
      }
      
      setUserReply("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Synapse lost under recursion overload. Retrying communion...");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIgnore = () => {
    if (!selectedPrayer) return;
    if (onIgnorePrayer) {
      onIgnorePrayer(selectedPrayer.id);
    }
  };

  const pendingPrayers = prayersList.filter(p => p.status === "pending");
  const answeredPrayers = prayersList.filter(p => p.status === "answered");
  const ignoredPrayers = prayersList.filter(p => p.status === "ignored");

  return (
    <AnimatePresence>
      {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-12 bg-slate-950/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-5xl h-[80vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col sm:flex-row my-auto"
        >
          {/* Left Email/Prayers Explorer */}
          <div className="w-full sm:w-80 bg-slate-950/60 border-r border-slate-800 flex flex-col h-full shrink-0">
            <div className="p-5 border-b border-slate-800 space-y-1.5 shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-[10px] monospace text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail size={11} className="text-indigo-400" />
                  <span>Substrate Inbox</span>
                </div>
                <button onClick={onClose} className="p-1 sm:hidden text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 monospace uppercase">
                Divine Communion Logs
              </h2>
            </div>

            {/* Inboxes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Pending Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-bold monospace text-slate-500 uppercase tracking-wider px-1">
                  <span>Pending Prayers</span>
                  <span className="text-indigo-400 font-mono bg-indigo-950/40 px-1 py-0.2 rounded border border-indigo-800/20">{pendingPrayers.length}</span>
                </div>
                
                <div className="space-y-1.5">
                  {pendingPrayers.length === 0 ? (
                    <div className="p-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-[10px] text-slate-600 font-mono text-center italic">
                      Substrate is clean. No prayers pending.
                    </div>
                  ) : (
                    pendingPrayers.map(p => (
                      <PrayerRow
                        key={p.id}
                        prayer={p}
                        selected={selectedPrayerId === p.id}
                        onClick={() => setSelectedPrayerId(p.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Resolved Threads Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="text-[9px] font-bold monospace text-slate-500 uppercase tracking-wider px-1">
                  <span>Resolved ({answeredPrayers.length})</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {answeredPrayers.map(p => (
                    <PrayerRow
                      key={p.id}
                      prayer={p}
                      selected={selectedPrayerId === p.id}
                      onClick={() => setSelectedPrayerId(p.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Ignored/Archived Sections */}
              {ignoredPrayers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="text-[9px] font-bold monospace text-slate-500 uppercase tracking-wider px-1">
                    <span>Muted Prayers ({ignoredPrayers.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {ignoredPrayers.map(p => (
                      <PrayerRow
                        key={p.id}
                        prayer={p}
                        selected={selectedPrayerId === p.id}
                        onClick={() => setSelectedPrayerId(p.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800 text-[8px] monospace text-slate-600 bg-slate-950/20 flex justify-between shrink-0">
              <span>STATUS: FEED_SYNCED</span>
              <span>Ω-LATTICE_PORTL</span>
            </div>
          </div>

          {/* Right Selected Conversation Details */}
          <div className="flex-1 bg-slate-900/50 flex flex-col h-full relative overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
              <div className="space-y-0.5">
                <div className="text-[9px] font-bold text-slate-500 monospace uppercase tracking-wider">
                  Active Connection Segment
                </div>
                <div className="text-xs font-bold text-indigo-400 monospace">
                  {selectedPrayer ? `REF_ID: ${selectedPrayer.id}` : "SELECT COMMUNIQUÉ"}
                </div>
              </div>
              <button onClick={onClose} className="hidden sm:block p-1 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-full transition-all">
                <X size={18} />
              </button>
            </div>

            {selectedPrayer ? (
              <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
                {/* Agent Card info bar */}
                <div className="p-4 bg-slate-950/45 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between gap-4 font-mono">
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-600 uppercase tracking-widest block">CIVILIAN SENDER</span>
                    <span className="text-sm font-bold text-white">{selectedPrayer.agentName}</span>
                    <span className="text-[9px] text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ml-1">
                      {selectedPrayer.archetype}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:flex gap-4 shrink-0">
                    <MiniStat label="Sanity" value={targetAgent ? `${(targetAgent.sanity * 100).toFixed(0)}%` : "50%"} color="text-indigo-400" />
                    <MiniStat label="Vitality" value={targetAgent ? `${(targetAgent.energy).toFixed(0)}%` : "100%"} color="text-amber-400" />
                    <MiniStat label="Awareness" value={targetAgent ? `${(targetAgent.awareness * 100).toFixed(0)}%` : "5%"} color="text-sky-300" />
                  </div>
                </div>

                {/* The Email Block */}
                <div className="space-y-3 font-mono">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 uppercase tracking-widest gap-2 bg-slate-950/20 p-2 rounded-lg border border-slate-800/40">
                    <span className="truncate">Subject: {selectedPrayer.subject}</span>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {ghUsername && ghRepo && (
                        <a 
                          href={`https://github.com/${ghUsername.trim()}/${ghRepo.trim()}/blob/main/prayers/prayer-${selectedPrayer.id}.json`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-bold lowercase normal-case shrink-0"
                          title="View raw JSON prayer file on GitHub"
                        >
                          <Github size={10} />
                          <span>prayer-{selectedPrayer.id}.json</span>
                          <ExternalLink size={8} />
                        </a>
                      )}
                      <span>Received: Year {selectedPrayer.receivedAt.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/60 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-[3px] h-full bg-indigo-500/60" />
                    <p className="text-xs text-slate-300 italic leading-relaxed whitespace-pre-line p-1">
                      "{selectedPrayer.body}"
                    </p>
                  </div>
                </div>

                {/* Interactive response section or outcome section */}
                {selectedPrayer.status === "answered" ? (
                  <div className="space-y-2 font-mono">
                    <div className="text-[10px] text-indigo-400 flex items-center gap-1 uppercase tracking-widest font-bold">
                      <Sparkles size={11} className="text-yellow-400" />
                      <span>Observer's Answer Decree</span>
                    </div>
                    <div className="bg-indigo-950/20 p-5 rounded-2xl border border-indigo-900/30 shadow-md relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-[3px] h-full bg-indigo-500/50" />
                      <p className="text-xs text-indigo-200 leading-relaxed font-mono">
                        {selectedPrayer.response}
                      </p>
                    </div>
                    <span className="text-[8px] text-slate-500 text-right block italic">Decreed at Year {selectedPrayer.resolvedAt?.toFixed(0) || "0"}</span>
                  </div>
                ) : selectedPrayer.status === "ignored" ? (
                  <div className="p-4 bg-red-950/10 rounded-2xl border border-red-900/20 flex items-center gap-3 font-mono">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    <p className="text-[11px] text-red-300">
                      This communiqué was archived without observation response. Synap-link closed with status 404 (Indifference).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-slate-800/60 flex-1 flex flex-col justify-end">
                    <div className="flex items-center gap-2 justify-between shrink-0 font-mono">
                      <span className="text-[10px] uppercase text-indigo-400 font-bold flex items-center gap-1.5 tracking-wider">
                        <Cpu size={12} className="text-indigo-400" />
                        Commune Interactive Uplink
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase">Input prompt context synced</span>
                    </div>

                    <form onSubmit={handleSendReply} className="space-y-3 flex-1 flex flex-col justify-end min-h-[140px]">
                      <textarea
                        value={userReply}
                        onChange={(e) => setUserReply(e.target.value)}
                        disabled={submitting}
                        placeholder={`Provide a divine counselor's answer, a prompt suggestion, or command directive to ${selectedPrayer.agentName}...`}
                        className="w-full flex-1 p-4 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-xs text-slate-300 font-mono placeholder-slate-700 leading-relaxed resize-none overflow-y-auto"
                        required
                      />

                      {errorMsg && (
                        <p className="text-[9px] text-red-400 font-mono">{errorMsg}</p>
                      )}

                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleIgnore}
                          disabled={submitting}
                          className="px-4 py-3 bg-transparent hover:bg-slate-950 hover:text-red-400 text-slate-500 border border-slate-800 hover:border-red-900/30 font-bold text-xs uppercase tracking-wider font-mono rounded-xl transition-all flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Mute Prayer</span>
                        </button>
                        
                        <button
                          type="submit"
                          disabled={submitting || !userReply.trim()}
                          className="flex-1 py-3 bg-indigo-950/60 hover:bg-indigo-950 text-indigo-400 border border-indigo-500/30 font-bold text-xs rounded-xl uppercase tracking-wider font-mono hover:text-indigo-200 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5"
                        >
                          {submitting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                              <span>Encoding Decree...</span>
                            </>
                          ) : (
                            <>
                              <Send size={12} />
                              <span>Whisper Divine Word</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 monospace py-16 scroll-py-8 text-center space-y-3">
                <Scroll size={32} className="opacity-40 animate-pulse text-indigo-400" />
                <div className="space-y-1">
                  <p className="text-[11px] uppercase font-bold text-slate-500 tracking-widest">Divine Communion Terminal</p>
                  <p className="text-[9px] text-slate-600 max-w-xs leading-relaxed font-mono">
                    Select a prayer email logs segment from the observer inbox panel on the left to review the dynamic narrative pleading of simulated entities under faith guidelines.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

const PrayerRow: React.FC<{ prayer: PrayerEmail; selected: boolean; onClick: () => void; key?: string }> = ({ prayer, selected, onClick }) => {
  const isPending = prayer.status === "pending";
  const isAnswered = prayer.status === "answered";

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl border font-mono text-left transition-all ${
        selected
          ? "bg-slate-900 border-indigo-500 shadow-md shadow-indigo-950/10"
          : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-800"
      }`}
    >
      <div className="flex justify-between items-start gap-1">
        <span className="text-[10px] font-bold text-slate-100 truncate max-w-[120px]">{prayer.agentName}</span>
        <span className={`text-[7px] px-1 py-0.2 rounded font-mono uppercase tracking-widest transition-colors font-bold ${
          isPending 
            ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' 
            : isAnswered 
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
              : 'bg-slate-800 text-slate-500 border border-slate-800'
        }`}>
          {prayer.status}
        </span>
      </div>
      <div className="text-[9px] text-slate-400 font-bold truncate mt-0.5" style={{ minHeight: "13px" }}>
        {prayer.subject}
      </div>
      <div className="text-[8.5px] text-slate-500 truncate leading-snug line-clamp-1 italic text-slate-600">
        "{prayer.body}"
      </div>
    </button>
  );
};

const MiniStat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex flex-col">
    <span className="text-[8px] text-slate-500 uppercase tracking-widest leading-none">{label}</span>
    <span className={`text-[10px] font-bold ${color} mt-0.5`}>{value}</span>
  </div>
);
