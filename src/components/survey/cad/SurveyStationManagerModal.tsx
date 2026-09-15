import React, { useState } from "react";
import { SurveyPoint, SurveyCadProject, Point2D } from "./types";
import { distance2D, calculateBearing, degToDms, SQM_TO_CENTS, SQM_TO_SQFT, calculatePolygonAreaSqM } from "./utils/surveyGeometry";
import {
  X,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  Download,
  Upload,
  ArrowRight,
  Maximize2,
  FileSpreadsheet,
  Link2
} from "lucide-react";

interface SurveyStationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SurveyCadProject;
  onAddPoint: (pt: SurveyPoint) => void;
  onUpdatePoint: (pt: SurveyPoint) => void;
  onDeletePoint: (id: string) => void;
  onBatchImportPoints: (pts: SurveyPoint[]) => void;
  onAddEntity: (ent: any) => void;
}

export const SurveyStationManagerModal: React.FC<SurveyStationManagerModalProps> = ({
  isOpen,
  onClose,
  project,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onBatchImportPoints,
  onAddEntity
}) => {
  // New Station Form State
  const [name, setName] = useState(`ST-${project.points.length + 1}`);
  const [easting, setEasting] = useState<string>("");
  const [northing, setNorthing] = useState<string>("");
  const [elevation, setElevation] = useState<string>("");
  const [code, setCode] = useState<string>("BD_STONE");
  const [description, setDescription] = useState<string>("");

  // Edit Inline State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editX, setEditX] = useState("");
  const [editY, setEditY] = useState("");
  const [editZ, setEditZ] = useState("");
  const [editCode, setEditCode] = useState("");

  if (!isOpen) return null;

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    const x = parseFloat(easting);
    const y = parseFloat(northing);
    if (isNaN(x) || isNaN(y)) {
      alert("Please enter valid numeric Easting (X) and Northing (Y) coordinates.");
      return;
    }

    const z = elevation ? parseFloat(elevation) : undefined;

    const newPt: SurveyPoint = {
      id: `st_pt_${Date.now()}`,
      name: name.trim() || `ST-${project.points.length + 1}`,
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      z: isNaN(z as number) ? undefined : Number((z as number).toFixed(3)),
      code,
      description: description.trim() || undefined,
      isControlPoint: true,
      layer: "SURVEY_POINTS"
    };

    onAddPoint(newPt);

    // Reset Form
    setName(`ST-${project.points.length + 2}`);
    setEasting("");
    setNorthing("");
    setElevation("");
    setDescription("");
  };

  const startEdit = (pt: SurveyPoint) => {
    setEditingId(pt.id);
    setEditName(pt.name);
    setEditX(pt.x.toString());
    setEditY(pt.y.toString());
    setEditZ(pt.z !== undefined ? pt.z.toString() : "");
    setEditCode(pt.code || "BD_STONE");
  };

  const saveEdit = (pt: SurveyPoint) => {
    const x = parseFloat(editX);
    const y = parseFloat(editY);
    if (isNaN(x) || isNaN(y)) {
      alert("Invalid numeric coordinates.");
      return;
    }
    const z = editZ ? parseFloat(editZ) : undefined;

    onUpdatePoint({
      ...pt,
      name: editName.trim() || pt.name,
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      z: isNaN(z as number) ? undefined : Number((z as number).toFixed(3)),
      code: editCode
    });
    setEditingId(null);
  };

  // Connect all stations into a Closed Boundary Polygon Parcel
  const handleConnectStationsAsBoundary = () => {
    if (project.points.length < 3) {
      alert("Need at least 3 station points to form a closed plot boundary.");
      return;
    }

    const pts: Point2D[] = project.points.map((p) => ({ x: p.x, y: p.y }));
    const areaSqM = calculatePolygonAreaSqM(pts);
    const areaCents = areaSqM * SQM_TO_CENTS;

    onAddEntity({
      id: `parcel_stations_${Date.now()}`,
      type: "POLYGON_PARCEL",
      name: `Plot Boundary (${project.points.length} Stations)`,
      points: pts,
      areaSqM: Number(areaSqM.toFixed(2)),
      areaCents: Number(areaCents.toFixed(3)),
      areaAres: Number((areaSqM / 100).toFixed(3)),
      areaSqFt: Number((areaSqM * SQM_TO_SQFT).toFixed(2)),
      areaAcres: Number((areaSqM / 4046.86).toFixed(4)),
      color: "#38bdf8",
      fillColor: "rgba(56, 189, 248, 0.08)",
      layer: "SURVEY_BOUNDARY",
      lineWidth: 2.5
    });

    onClose();
  };

  // Compute station-to-station legs (Consecutive measurements)
  const stationLegs = project.points.map((pt, idx, arr) => {
    const nextPt = arr[(idx + 1) % arr.length];
    const isClosing = idx === arr.length - 1;
    const dist = distance2D(pt, nextPt);
    const bearing = calculateBearing(pt, nextPt);
    const dms = degToDms(bearing);
    const deltaX = nextPt.x - pt.x; // Departure
    const deltaY = nextPt.y - pt.y; // Latitude
    return {
      from: pt.name,
      to: nextPt.name,
      dist,
      bearing,
      dms: dms.formatted,
      deltaX,
      deltaY,
      isClosing
    };
  });

  // Export CSV
  const exportCoordinatesCSV = () => {
    if (project.points.length === 0) return;
    const header = "Station_Name,Easting_X_m,Northing_Y_m,Elevation_Z_m,Code,Description\n";
    const rows = project.points
      .map(
        (p) =>
          `"${p.name}",${p.x},${p.y},${p.z !== undefined ? p.z : ""},"${p.code || ""}","${p.description || ""}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title}_Stations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Survey Station Points & Measurements Hub
              </h2>
              <p className="text-xs text-slate-400">
                Add, Edit, Delete Stations & View Station-to-Station Distance & Bearing Measurements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
          {/* Left Column: Add Station Form & Batch Options (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <form
              onSubmit={handleAddStation}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  Add New Station Point
                </span>
                <span className="text-[10px] text-slate-500">
                  Total: {project.points.length}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Station Name / Pillar ID</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ST-1, A, P1, BM1"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Easting (X in {project.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={easting}
                    onChange={(e) => setEasting(e.target.value)}
                    placeholder="e.g. 100.50"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Northing (Y in {project.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={northing}
                    onChange={(e) => setNorthing(e.target.value)}
                    placeholder="e.g. 150.25"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Elevation Z (Optional, MSL in m)
                </label>
                <input
                  type="number"
                  step="any"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  placeholder="e.g. 14.85"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Feature / Code</label>
                <select
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="BD_STONE">Boundary Stone Pillar</option>
                  <option value="TRAVERSE_STATION">Traverse Control Station</option>
                  <option value="BENCHMARK">Benchmark (TBM)</option>
                  <option value="WELL">Open Well</option>
                  <option value="TREE">Tree / Landmark</option>
                  <option value="BUILDING_CORNER">Building Corner</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Station Point</span>
              </button>
            </form>

            {/* Quick Actions */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 block text-xs uppercase tracking-wider mb-2">
                Automated Plot Actions
              </span>
              <button
                type="button"
                onClick={handleConnectStationsAsBoundary}
                disabled={project.points.length < 3}
                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Link2 className="w-4 h-4" />
                <span>Connect Stations as Closed Plot</span>
              </button>

              <button
                type="button"
                onClick={exportCoordinatesCSV}
                disabled={project.points.length === 0}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Coordinates (CSV)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Station Table & Inter-Station Measurements (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. All Station Points Table */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Station Points Coordinates Registry ({project.points.length})
                </span>
                <span className="text-[11px] text-cyan-400">Unit: {project.unit}</span>
              </div>

              {project.points.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                  No survey station points added yet. Use the form on the left or click on the canvas to place points.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Easting (X)</th>
                        <th className="p-2">Northing (Y)</th>
                        <th className="p-2">Elev (Z)</th>
                        <th className="p-2">Code</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {project.points.map((pt) => {
                        const isEditing = editingId === pt.id;
                        return (
                          <tr key={pt.id} className="hover:bg-slate-900/50">
                            {isEditing ? (
                              <>
                                <td className="p-1">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white w-20"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="number"
                                    step="any"
                                    value={editX}
                                    onChange={(e) => setEditX(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400 w-20"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="number"
                                    step="any"
                                    value={editY}
                                    onChange={(e) => setEditY(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400 w-20"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="number"
                                    step="any"
                                    value={editZ}
                                    onChange={(e) => setEditZ(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-emerald-400 w-16"
                                  />
                                </td>
                                <td className="p-1">
                                  <select
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-slate-300 text-[10px]"
                                  >
                                    <option value="BD_STONE">Stone</option>
                                    <option value="TRAVERSE_STATION">Station</option>
                                    <option value="BENCHMARK">BM</option>
                                    <option value="WELL">Well</option>
                                    <option value="TREE">Tree</option>
                                  </select>
                                </td>
                                <td className="p-1 text-right">
                                  <button
                                    onClick={() => saveEdit(pt)}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded mr-1 cursor-pointer"
                                    title="Save"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-2 font-bold text-white flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                  {pt.name}
                                </td>
                                <td className="p-2 text-cyan-400 font-bold">{pt.x.toFixed(3)}</td>
                                <td className="p-2 text-cyan-400 font-bold">{pt.y.toFixed(3)}</td>
                                <td className="p-2 text-emerald-400">
                                  {pt.z !== undefined ? `${pt.z.toFixed(2)}m` : "-"}
                                </td>
                                <td className="p-2 text-slate-400 text-[10px]">{pt.code || "Point"}</td>
                                <td className="p-2 text-right space-x-1">
                                  <button
                                    onClick={() => startEdit(pt)}
                                    className="p-1 bg-slate-800 hover:bg-blue-600/30 text-slate-400 hover:text-blue-400 rounded cursor-pointer transition"
                                    title="Edit Station"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeletePoint(pt.id)}
                                    className="p-1 bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-400 rounded cursor-pointer transition"
                                    title="Delete Station"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Station-to-Station Measurements (Side lengths & Bearings) */}
            {project.points.length >= 2 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  Station-to-Station Distance & Bearing Measurements
                </span>

                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-2">Leg</th>
                        <th className="p-2">Distance (Length)</th>
                        <th className="p-2">Whole Circle Bearing</th>
                        <th className="p-2">Departure (ΔX)</th>
                        <th className="p-2">Latitude (ΔY)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {stationLegs.map((leg, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-900/50 ${leg.isClosing ? "bg-cyan-950/20 text-cyan-200" : ""}`}
                        >
                          <td className="p-2 font-bold flex items-center gap-1">
                            <span>{leg.from}</span>
                            <span className="text-slate-500">→</span>
                            <span>{leg.to}</span>
                            {leg.isClosing && (
                              <span className="text-[9px] px-1 bg-cyan-900/50 text-cyan-400 rounded">
                                Close
                              </span>
                            )}
                          </td>
                          <td className="p-2 font-bold text-emerald-400">
                            {project.unit === "cm"
                              ? `${(leg.dist * 100).toFixed(1)} cm`
                              : `${leg.dist.toFixed(3)} m`}
                          </td>
                          <td className="p-2 text-amber-400">
                            {leg.bearing.toFixed(1)}° ({leg.dms})
                          </td>
                          <td className="p-2 text-slate-400">{leg.deltaX.toFixed(3)}</td>
                          <td className="p-2 text-slate-400">{leg.deltaY.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3 font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
