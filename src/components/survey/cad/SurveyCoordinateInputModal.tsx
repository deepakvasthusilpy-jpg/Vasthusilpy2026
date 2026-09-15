import React, { useState } from "react";
import { SurveyPoint, Point2D } from "./types";
import { X, Plus, Upload, Download, MapPin, Compass, FileText, CheckCircle2 } from "lucide-react";

interface SurveyCoordinateInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPoints: SurveyPoint[];
  onAddPoint: (pt: SurveyPoint) => void;
  onBatchImportPoints: (pts: SurveyPoint[]) => void;
}

export const SurveyCoordinateInputModal: React.FC<SurveyCoordinateInputModalProps> = ({
  isOpen,
  onClose,
  existingPoints,
  onAddPoint,
  onBatchImportPoints
}) => {
  const [activeMode, setActiveMode] = useState<"single" | "bearing_dist" | "csv_batch">("single");

  // Single Point Form
  const [ptName, setPtName] = useState(`P${existingPoints.length + 1}`);
  const [easting, setEasting] = useState<string>("100.0");
  const [northing, setNorthing] = useState<string>("100.0");
  const [elevation, setElevation] = useState<string>("10.0");
  const [code, setCode] = useState<string>("BOUNDARY_STONE");
  const [description, setDescription] = useState<string>("");

  // Bearing & Distance Form
  const [basePointId, setBasePointId] = useState<string>(existingPoints[0]?.id || "");
  const [bearingDeg, setBearingDeg] = useState<string>("45");
  const [distanceVal, setDistanceVal] = useState<string>("25.0");

  // CSV Batch Text
  const [csvText, setCsvText] = useState<string>(
    "PointName,Easting,Northing,Elevation,Code\nA,0.0,0.0,12.5,BOUNDARY_STONE\nB,24.5,4.2,12.8,BOUNDARY_STONE\nC,32.8,22.6,13.4,BOUNDARY_STONE\nD,14.2,31.0,14.1,BOUNDARY_STONE\nE,-3.5,18.4,13.0,BOUNDARY_STONE"
  );
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const x = parseFloat(easting);
    const y = parseFloat(northing);
    const z = parseFloat(elevation);
    if (isNaN(x) || isNaN(y)) return;

    onAddPoint({
      id: `pt_${Date.now()}`,
      name: ptName,
      x,
      y,
      z: isNaN(z) ? undefined : z,
      code,
      description,
      layer: "SURVEY_POINTS"
    });

    setPtName(`P${existingPoints.length + 2}`);
    onClose();
  };

  const handleAddBearingDist = (e: React.FormEvent) => {
    e.preventDefault();
    const basePt = existingPoints.find((p) => p.id === basePointId) || { x: 0, y: 0 };
    const deg = parseFloat(bearingDeg) || 0;
    const dist = parseFloat(distanceVal) || 0;

    const rad = (deg * Math.PI) / 180;
    const newX = basePt.x + dist * Math.sin(rad); // Easting
    const newY = basePt.y + dist * Math.cos(rad); // Northing

    onAddPoint({
      id: `pt_${Date.now()}`,
      name: ptName,
      x: Number(newX.toFixed(3)),
      y: Number(newY.toFixed(3)),
      code,
      description: `From ${basePt.name || "origin"} @ ${deg}° / ${dist}m`,
      layer: "SURVEY_POINTS"
    });

    onClose();
  };

  const handleCsvImport = () => {
    try {
      const lines = csvText.trim().split("\n");
      const parsedPoints: SurveyPoint[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith("#") || (i === 0 && line.toLowerCase().includes("easting"))) continue;

        const parts = line.split(",").map((s) => s.trim());
        if (parts.length >= 3) {
          const name = parts[0];
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          const z = parts[3] ? parseFloat(parts[3]) : undefined;
          const pointCode = parts[4] || "SURVEY_POINT";

          if (!isNaN(x) && !isNaN(y)) {
            parsedPoints.push({
              id: `csv_pt_${Date.now()}_${i}`,
              name,
              x,
              y,
              z: isNaN(z as any) ? undefined : z,
              code: pointCode,
              layer: "SURVEY_POINTS"
            });
          }
        }
      }

      if (parsedPoints.length > 0) {
        onBatchImportPoints(parsedPoints);
        setImportStatus(`Successfully imported ${parsedPoints.length} survey points!`);
        setTimeout(() => onClose(), 800);
      } else {
        setImportStatus("No valid point rows found in CSV data.");
      }
    } catch (err: any) {
      setImportStatus(`Error importing CSV: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">Precision Coordinate Entry</h2>
              <p className="text-xs text-slate-400">
                Easting/Northing, Bearing/Distance & CSV Point Table Import
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

        {/* Tab Sub-Nav */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5 font-mono text-xs">
          <button
            onClick={() => setActiveMode("single")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
              activeMode === "single"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Easting / Northing</span>
          </button>
          <button
            onClick={() => setActiveMode("bearing_dist")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
              activeMode === "bearing_dist"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Bearing & Distance</span>
          </button>
          <button
            onClick={() => setActiveMode("csv_batch")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
              activeMode === "csv_batch"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV Batch Import</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {activeMode === "single" && (
            <form onSubmit={handleAddSingle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Point Name / ID
                  </label>
                  <input
                    type="text"
                    required
                    value={ptName}
                    onChange={(e) => setPtName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Feature Code
                  </label>
                  <select
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  >
                    <option value="BOUNDARY_STONE">Boundary Stone (Pillar)</option>
                    <option value="BENCH_MARK">Benchmark (TBM)</option>
                    <option value="WELL">Open Well</option>
                    <option value="TREE">Tree / Landmark</option>
                    <option value="BUILDING">Building Corner</option>
                    <option value="SPOT_LEVEL">Spot Elevation Point</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Easting (X in m)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={easting}
                    onChange={(e) => setEasting(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Northing (Y in m)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={northing}
                    onChange={(e) => setNorthing(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Elevation (Z in m MSL)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. North-East boundary stone with neighboring plot"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert Survey Point</span>
                </button>
              </div>
            </form>
          )}

          {activeMode === "bearing_dist" && (
            <form onSubmit={handleAddBearingDist} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Base Station
                  </label>
                  <select
                    value={basePointId}
                    onChange={(e) => setBasePointId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  >
                    {existingPoints.length > 0 ? (
                      existingPoints.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (E: {p.x.toFixed(2)}, N: {p.y.toFixed(2)})
                        </option>
                      ))
                    ) : (
                      <option value="">Origin (0.00, 0.00)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Target Point Name
                  </label>
                  <input
                    type="text"
                    value={ptName}
                    onChange={(e) => setPtName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Whole Circle Bearing (Degrees 0 - 360°)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="360"
                    required
                    value={bearingDeg}
                    onChange={(e) => setBearingDeg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Horizontal Distance (meters)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={distanceVal}
                    onChange={(e) => setDistanceVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Plot Point from Bearing</span>
                </button>
              </div>
            </form>
          )}

          {activeMode === "csv_batch" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                  Paste CSV Points Data (PointName, Easting, Northing, Elevation, Code)
                </label>
                <textarea
                  rows={7}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-cyan-300 font-mono resize-none focus:outline-none focus:border-cyan-500"
                />
              </div>

              {importStatus && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Format: Name, X, Y, [Z], [Code]
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCsvImport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import Points Batch</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
