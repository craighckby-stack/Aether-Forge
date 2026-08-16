/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/PlanetMap.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React from "react";
import { WorldState, Agent } from "../engine/types";

export const PlanetMap = ({ world, agents, selectedAgentId }: { world: WorldState, agents: Agent[], selectedAgentId: number | null }) => {
  return (
    <div className="w-full h-48 bg-slate-900 border border-slate-800 rounded relative overflow-hidden flex items-center justify-center">
      <div className="text-slate-500 font-mono text-xs uppercase tracking-widest text-center px-4">
        <p>Global Planet Map</p>
        <p>Phase: {world.phase}</p>
        <p>Agents Online: {agents.length}</p>
      </div>
    </div>
  );
};
