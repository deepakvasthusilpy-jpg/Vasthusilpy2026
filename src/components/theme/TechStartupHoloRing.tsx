import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck, Activity, Cpu, Sparkles, Layers, Globe, Radio, Play, Pause } from "lucide-react";

interface TechStartupHoloRingProps {
  onExploreMore?: () => void;
}

export const TechStartupHoloRing: React.FC<TechStartupHoloRingProps> = ({ onExploreMore }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeFrequency, setActiveFrequency] = useState(148.4);
  const [rotationSpeed, setRotationSpeed] = useState<"normal" | "fast" | "hyper">("normal");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFrequency((prev) => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#030712] via-[#081020] to-[#030712] border border-cyan-500/30 p-6 md:p-8 overflow-hidden shadow-2xl">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,242,254,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,242,254,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40 pointer-events-none" />

      {/* Cyber Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Tech Startup Value & Architecture */}
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>TECH STARTUP NEXT-GEN ARCHITECTURE</span>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Autonomous Structural <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">Civil Intelligence</span>
          </h2>

          <p className="text-sm text-cyan-100/80 leading-relaxed">
            Pioneering algorithmic Vasthu synthesis, real-time load simulations, and ultra-high precision CAD drafting for the future of sustainable architecture.
          </p>

          {/* Realtime Telemetry Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20">
              <span className="text-[10px] font-mono text-cyan-400 block">PRECISION RATE</span>
              <span className="text-lg font-mono font-bold text-white">99.98%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20">
              <span className="text-[10px] font-mono text-cyan-400 block">FREQUENCY</span>
              <span className="text-lg font-mono font-bold text-cyan-300">{activeFrequency} GHz</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20">
              <span className="text-[10px] font-mono text-cyan-400 block">SYNC LATENCY</span>
              <span className="text-lg font-mono font-bold text-emerald-400">0.4 ms</span>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:shadow-[0_0_30px_rgba(0,242,254,0.7)] transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Pause Holo Core" : "Engage Holo Core"}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-950/80 border border-cyan-500/30 p-1 rounded-xl text-[11px] font-mono">
              <span className="px-2 text-cyan-400">SPEED:</span>
              {(["normal", "fast", "hyper"] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setRotationSpeed(spd)}
                  className={`px-2 py-0.5 rounded-lg uppercase transition-all cursor-pointer ${
                    rotationSpeed === spd
                      ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Holographic 3D Interactive Cyber Ring (Matching uploaded mockup) */}
        <div className="lg:col-span-6 flex items-center justify-center relative py-6">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Outer Orbit Halo Ring */}
            <div
              className={`absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/30 ${
                isPlaying
                  ? rotationSpeed === "hyper"
                    ? "animate-spin"
                    : rotationSpeed === "fast"
                    ? "animate-tech-spin"
                    : "animate-tech-spin"
                  : ""
              }`}
              style={{
                animationDuration:
                  rotationSpeed === "hyper" ? "4s" : rotationSpeed === "fast" ? "10s" : "22s"
              }}
            />

            {/* Glowing Concentric Segmented Tech Ring 1 */}
            <div
              className={`absolute inset-4 rounded-full border-4 border-cyan-400/40 border-t-cyan-300 border-r-transparent ${
                isPlaying ? "animate-tech-spin-reverse" : ""
              }`}
              style={{
                animationDuration:
                  rotationSpeed === "hyper" ? "3s" : rotationSpeed === "fast" ? "8s" : "16s",
                boxShadow: "0 0 25px rgba(0,242,254,0.3)"
              }}
            />

            {/* Segmented Heavy Metallic Tech Ring 2 */}
            <div
              className={`absolute inset-8 rounded-full border-8 border-slate-800 border-l-cyan-400 border-b-sky-500/60 ${
                isPlaying ? "animate-tech-spin" : ""
              }`}
              style={{
                animationDuration:
                  rotationSpeed === "hyper" ? "5s" : rotationSpeed === "fast" ? "12s" : "28s"
              }}
            />

            {/* Inner Glowing Holographic Glass Disc Core */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-400 to-teal-300 p-1 shadow-[0_0_40px_rgba(0,242,254,0.7)] flex items-center justify-center animate-tech-pulse">
              <div className="w-full h-full rounded-full bg-[#030d1a] flex flex-col items-center justify-center p-3 text-center border border-cyan-300/60">
                <Cpu className="w-6 h-6 text-cyan-300 mb-1 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-black">
                  VASTHUSILPY
                </span>
                <span className="text-[8px] font-mono text-cyan-200/80">CORE ENGINE</span>
                <div className="mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[9px] font-mono font-bold text-white">ONLINE</span>
                </div>
              </div>
            </div>

            {/* Floating Cyber Nodes */}
            <div className="absolute top-2 right-8 px-2 py-1 rounded bg-cyan-950/80 border border-cyan-400/60 text-[9px] font-mono text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.4)]">
              NODE 01: AKT
            </div>
            <div className="absolute bottom-4 left-6 px-2 py-1 rounded bg-blue-950/80 border border-blue-400/60 text-[9px] font-mono text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.4)]">
              CAD AI: V3.4
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
