import React, { useState } from "react";
import {
  SurveyTraverseStation,
  SurveyTraverseCalculation,
  SurveyCadProject,
  Point2D
} from "./types";
import { calculateBowditchTraverse } from "./utils/surveyGeometry";
import { X, Plus, Trash2, CheckCircle2, AlertTriangle, Compass, ArrowRight, Play } from "lucide-react";

interface SurveyTraverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SurveyCadProject;
  onApplyTraverseToCanvas: (calc: SurveyTraverseCalculation) => void;
}

export const SurveyTraverseModal: React.FC<SurveyTraverseModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyTraverseToCanvas
}) => {
  const [startE, setStartE] = useState<number>(1000);
  const [startN, setStartN] = useState<number>(1000);
  const [isClosed, setIsClosed] = useState<boolean>(true);

  // Default initial traverse stations (Closed 4-sided loop)
  const [stations, setStations] = useState<SurveyTraverseStation[]>([
    { id: "st_1", stationName: "A -> B", bearingDeg: 45, bearingMin: 30, bearingSec: 0, distanceMeters: 45.2 },
    { id: "st_2", stationName: "B -> C", bearingDeg: 135, bearingMin: 15, bearingSec: 0, distanceMeters: 38.6 },
    { id: "st_3", stationName: "C -> D", bearingDeg: 228, bearingMin: 45, bearingSec: 0, distanceMeters: 42.0 },
    { id: "st_4", stationName: "D -> A", bearingDeg: 318, bearingMin: 10, bearingSec: 0, distanceMeters: 41.8 }
  ]);

  if (!isOpen) return null;

  const calculation = calculateBowditchTraverse(stations, startE, startN, isClosed);

  const addStation = () => {
    const nextIdx = stations.length + 1;
    setStations((prev) => [
      ...prev,
      {
        id: `st_${Date.now()}`,
        stationName: `Station ${nextIdx}`,
        bearingDeg: 0,
        bearingMin: 0,
        bearingSec: 0,
        distanceMeters: 20
      }
    ]);
  };

  const removeStation = (id: string) => {
    if (stations.length <= 2) return;
    setStations((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStation = (id: string, field: keyof SurveyTraverseStation, val: any) => {
    setStations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleApply = () => {
    onApplyTraverseToCanvas(calculation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Survey Traverse & Bowditch Compass Rule Balancing
              </h2>
              <p className="text-xs text-slate-400">
                Closed / Open Traverse Calculation, Consecutive Coordinates & Precision Check
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          {/* Traverse Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                Start Easting (X₀)
              </label>
              <input
                type="number"
                value={startE}
                onChange={(e) => setStartE(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                Start Northing (Y₀)
              </label>
              <input
                type="number"
                value={startN}
                onChange={(e) => setStartN(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                Traverse Type
              </label>
              <select
                value={isClosed ? "closed" : "open"}
                onChange={(e) => setIsClosed(e.target.value === "closed")}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
              >
                <option value="closed">Closed Traverse (Loop)</option>
                <option value="open">Open Traverse (Link)</option>
              </select>
            </div>
          </div>

          {/* Traverse Stations Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Station / Line</th>
                  <th className="p-2.5">Bearing (Deg °)</th>
                  <th className="p-2.5">Min (')</th>
                  <th className="p-2.5">Sec ('')</th>
                  <th className="p-2.5">Distance (m)</th>
                  <th className="p-2.5">Corr. Lat (ΔY)</th>
                  <th className="p-2.5">Corr. Dep (ΔX)</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60 text-slate-200">
                {calculation.stations.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-800/40">
                    <td className="p-2">
                      <input
                        type="text"
                        value={st.stationName}
                        onChange={(e) => updateStation(st.id, "stationName", e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        max="359"
                        value={st.bearingDeg}
                        onChange={(e) => updateStation(st.id, "bearingDeg", parseFloat(e.target.value) || 0)}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={st.bearingMin}
                        onChange={(e) => updateStation(st.id, "bearingMin", parseFloat(e.target.value) || 0)}
                        className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={st.bearingSec}
                        onChange={(e) => updateStation(st.id, "bearingSec", parseFloat(e.target.value) || 0)}
                        className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={st.distanceMeters}
                        onChange={(e) => updateStation(st.id, "distanceMeters", parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold text-cyan-400"
                      />
                    </td>
                    <td className="p-2 text-emerald-400">
                      {st.correctedLatitude?.toFixed(3)} m
                    </td>
                    <td className="p-2 text-blue-400">
                      {st.correctedDeparture?.toFixed(3)} m
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeStation(st.id)}
                        disabled={stations.length <= 2}
                        className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addStation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Station Leg</span>
          </button>

          {/* Bowditch Adjustment Statistics Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
            <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Traverse Balancing Summary & Precision</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Perimeter (P)</span>
                <span className="text-sm font-bold text-white">{calculation.totalPerimeter} m</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Linear Misclosure (e)</span>
                <span className="text-sm font-bold text-amber-400">{calculation.linearMisclosure} m</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Relative Precision</span>
                <span className="text-sm font-bold text-emerald-400">
                  1 in {calculation.relativePrecision.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Area</span>
                <span className="text-sm font-bold text-cyan-400">
                  {calculation.areaCents} Cents ({calculation.areaSqM} m²)
                </span>
              </div>
            </div>

            {calculation.linearMisclosure > 0.5 && isClosed && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Notice: Closing error is above 0.50m. Verify field bearings and distances.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-red-600/30 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Apply & Plot Traverse to CAD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
