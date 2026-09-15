import { SurveyCadProject, SurveyLayer } from "../types";
import { SQM_TO_CENTS, calculatePolygonAreaSqM } from "./surveyGeometry";

export const DEFAULT_SURVEY_LAYERS: SurveyLayer[] = [
  { id: "lay_boundary", name: "SURVEY_BOUNDARY", color: "#38bdf8", lineWidth: 2.5, visible: true, locked: false },
  { id: "lay_traverse", name: "SURVEY_TRAVERSE", color: "#ef4444", lineWidth: 2, lineDash: [6, 4], visible: true, locked: false },
  { id: "lay_triangulation", name: "SURVEY_TRIANGULATION", color: "#06b6d4", lineWidth: 1.2, lineDash: [4, 4], visible: true, locked: false },
  { id: "lay_contours", name: "SURVEY_CONTOURS", color: "#f97316", lineWidth: 1.5, visible: true, locked: false },
  { id: "lay_points", name: "SURVEY_POINTS", color: "#fbbf24", lineWidth: 2, visible: true, locked: false },
  { id: "lay_dimensions", name: "SURVEY_DIMENSIONS", color: "#60a5fa", lineWidth: 1.2, visible: true, locked: false },
  { id: "lay_symbols", name: "SURVEY_SYMBOLS", color: "#a855f7", lineWidth: 1.5, visible: true, locked: false },
  { id: "lay_annotations", name: "SURVEY_ANNOTATIONS", color: "#f1f5f9", lineWidth: 1, visible: true, locked: false }
];

export function createBlankSurveyProject(title = "New Land Survey Plan"): SurveyCadProject {
  return {
    id: `survey_proj_${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unit: "m",
    areaUnit: "cents",
    layers: [...DEFAULT_SURVEY_LAYERS],
    points: [],
    entities: [],
    traverse: [],
    contourInterval: 1.0,
    titleBlock: {
      projectTitle: title,
      ownerName: "Sri. K. V. Narayanan",
      surveyorName: "Vasthusilpy Surveys (Deepak V.)",
      licenseNo: "LSGD/E-10492/2022",
      surveyDate: new Date().toISOString().split("T")[0],
      district: "Palakkad",
      taluk: "Palakkad",
      village: "Keralassery",
      reSurveyNo: "142/3",
      blockNo: "12",
      wardNo: "IV",
      sheetSize: "A3",
      orientation: "LANDSCAPE",
      drawingScale: "1:200",
      northAngle: 0,
      notes: "Boundary surveyed as per local physical possession and stone pillars."
    }
  };
}

export function createKeralaFmbTemplate(): SurveyCadProject {
  const boundaryPts = [
    { x: 0, y: 0 },
    { x: 24.5, y: 4.2 },
    { x: 32.8, y: 22.6 },
    { x: 14.2, y: 31.0 },
    { x: -3.5, y: 18.4 }
  ];

  const areaSqM = calculatePolygonAreaSqM(boundaryPts);

  return {
    id: "template_kerala_fmb",
    title: "Kerala FMB Field Sketch - Re-Sy. 142/3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unit: "m",
    areaUnit: "cents",
    layers: [...DEFAULT_SURVEY_LAYERS],
    points: [
      { id: "p1", name: "A (B.Stone)", x: 0, y: 0, z: 12.5, code: "BOUNDARY_STONE", isControlPoint: true, layer: "SURVEY_POINTS" },
      { id: "p2", name: "B (B.Stone)", x: 24.5, y: 4.2, z: 12.8, code: "BOUNDARY_STONE", isControlPoint: true, layer: "SURVEY_POINTS" },
      { id: "p3", name: "C (B.Stone)", x: 32.8, y: 22.6, z: 13.4, code: "BOUNDARY_STONE", isControlPoint: true, layer: "SURVEY_POINTS" },
      { id: "p4", name: "D (B.Stone)", x: 14.2, y: 31.0, z: 14.1, code: "BOUNDARY_STONE", isControlPoint: true, layer: "SURVEY_POINTS" },
      { id: "p5", name: "E (B.Stone)", x: -3.5, y: 18.4, z: 13.0, code: "BOUNDARY_STONE", isControlPoint: true, layer: "SURVEY_POINTS" },
      { id: "p_well", name: "Open Well", x: 10.5, y: 16.0, z: 13.2, code: "WELL", layer: "SURVEY_POINTS" },
      { id: "p_bm", name: "TBM #1 (Pillar)", x: -6.0, y: -4.0, z: 12.0, code: "BENCH_MARK", isControlPoint: true, layer: "SURVEY_POINTS" }
    ],
    entities: [
      // Outer Boundary
      {
        id: "ent_fmb_poly",
        type: "POLYGON_PARCEL",
        name: "Re-Sy 142/3 (Plot Extent)",
        points: boundaryPts,
        areaSqM: Number(areaSqM.toFixed(2)),
        areaCents: Number((areaSqM * SQM_TO_CENTS).toFixed(3)),
        areaAres: Number((areaSqM / 100).toFixed(3)),
        areaSqFt: Number((areaSqM * 10.7639).toFixed(2)),
        areaAcres: Number((areaSqM / 4046.86).toFixed(4)),
        color: "#38bdf8",
        fillColor: "rgba(56, 189, 248, 0.08)",
        surveyNumber: "142/3",
        ownerName: "Sri. K. V. Narayanan",
        layer: "SURVEY_BOUNDARY",
        lineWidth: 3
      },
      // Triangulation Diagonal 1 (A to C)
      {
        id: "tri_1",
        type: "TRIANGLE",
        triangleId: "T1 (A-B-C)",
        p1: { x: 0, y: 0 },
        p2: { x: 24.5, y: 4.2 },
        p3: { x: 32.8, y: 22.6 },
        sideA: 24.86,
        sideB: 20.18,
        sideC: 39.82,
        areaSqM: 207.4,
        areaCents: 5.12,
        color: "#06b6d4",
        layer: "SURVEY_TRIANGULATION",
        lineWidth: 1.5,
        lineDash: [4, 4]
      },
      // Triangulation Diagonal 2 (A to D)
      {
        id: "tri_2",
        type: "TRIANGLE",
        triangleId: "T2 (A-C-D)",
        p1: { x: 0, y: 0 },
        p2: { x: 32.8, y: 22.6 },
        p3: { x: 14.2, y: 31.0 },
        sideA: 39.82,
        sideB: 20.42,
        sideC: 34.10,
        areaSqM: 348.6,
        areaCents: 8.61,
        color: "#06b6d4",
        layer: "SURVEY_TRIANGULATION",
        lineWidth: 1.5,
        lineDash: [4, 4]
      },
      // Triangulation Diagonal 3 (A to E)
      {
        id: "tri_3",
        type: "TRIANGLE",
        triangleId: "T3 (A-D-E)",
        p1: { x: 0, y: 0 },
        p2: { x: 14.2, y: 31.0 },
        p3: { x: -3.5, y: 18.4 },
        sideA: 34.10,
        sideB: 21.72,
        sideC: 18.73,
        areaSqM: 184.2,
        areaCents: 4.55,
        color: "#06b6d4",
        layer: "SURVEY_TRIANGULATION",
        lineWidth: 1.5,
        lineDash: [4, 4]
      },
      // Building Footprint (Proposed Villa)
      {
        id: "ent_building",
        type: "RECTANGLE",
        corner1: { x: 8.0, y: 6.0 },
        corner2: { x: 18.5, y: 14.5 },
        areaSqM: 89.25,
        layer: "SURVEY_SYMBOLS",
        color: "#f59e0b",
        lineWidth: 2
      },
      // Well Symbol
      {
        id: "sym_well",
        type: "SYMBOL",
        symbolType: "WELL",
        position: { x: 10.5, y: 16.0 },
        scale: 1.8,
        rotation: 0,
        label: "Open Well (Ø 2.5m)",
        layer: "SURVEY_SYMBOLS"
      },
      // Benchmark Symbol
      {
        id: "sym_bm",
        type: "SYMBOL",
        symbolType: "BENCH_MARK",
        position: { x: -6.0, y: -4.0 },
        scale: 1.8,
        rotation: 0,
        label: "TBM #1 (+12.00m MSL)",
        layer: "SURVEY_SYMBOLS"
      },
      // Boundary Stones
      {
        id: "sym_bs1",
        type: "SYMBOL",
        symbolType: "BOUNDARY_STONE",
        position: { x: 0, y: 0 },
        scale: 1.2,
        rotation: 0,
        layer: "SURVEY_SYMBOLS"
      },
      {
        id: "sym_bs2",
        type: "SYMBOL",
        symbolType: "BOUNDARY_STONE",
        position: { x: 24.5, y: 4.2 },
        scale: 1.2,
        rotation: 0,
        layer: "SURVEY_SYMBOLS"
      },
      {
        id: "sym_bs3",
        type: "SYMBOL",
        symbolType: "BOUNDARY_STONE",
        position: { x: 32.8, y: 22.6 },
        scale: 1.2,
        rotation: 0,
        layer: "SURVEY_SYMBOLS"
      },
      {
        id: "sym_bs4",
        type: "SYMBOL",
        symbolType: "BOUNDARY_STONE",
        position: { x: 14.2, y: 31.0 },
        scale: 1.2,
        rotation: 0,
        layer: "SURVEY_SYMBOLS"
      },
      {
        id: "sym_bs5",
        type: "SYMBOL",
        symbolType: "BOUNDARY_STONE",
        position: { x: -3.5, y: 18.4 },
        scale: 1.2,
        rotation: 0,
        layer: "SURVEY_SYMBOLS"
      },
      // Text Annotation
      {
        id: "txt_title",
        type: "TEXT",
        position: { x: 12.0, y: 20.0 },
        text: "PARCEL A : 18.28 CENTS",
        fontSize: 1.2,
        rotation: 0,
        layer: "SURVEY_ANNOTATIONS",
        color: "#ffffff"
      }
    ],
    traverse: [],
    contourInterval: 1.0,
    titleBlock: {
      projectTitle: "KERALA FMB FIELD SKETCH & VASTHU SURVEY PLAN",
      ownerName: "Sri. K. V. Narayanan",
      surveyorName: "Deepak V. (Consulting Engineer & Surveyor)",
      licenseNo: "LSGD/E-10492/2022",
      surveyDate: new Date().toISOString().split("T")[0],
      district: "Palakkad",
      taluk: "Palakkad",
      village: "Keralassery",
      reSurveyNo: "142/3",
      blockNo: "12",
      wardNo: "IV",
      sheetSize: "A3",
      orientation: "LANDSCAPE",
      drawingScale: "1:200",
      northAngle: 0,
      notes: "Field measurements verified with total station & chain triangulation."
    }
  };
}
