import { SurveyCadProject, SurveyEntity, Point2D } from "../types";

export function generateSurveyDxf(project: SurveyCadProject): string {
  const lines: string[] = [];

  const add = (groupCode: number, value: string | number) => {
    lines.push(groupCode.toString().padStart(2, " "));
    lines.push(value.toString());
  };

  // 1. HEADER SECTION
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009"); // AutoCAD R12 DXF - maximum compatibility
  add(9, "$INSUNITS");
  add(70, 6); // 6 = Meters
  add(0, "ENDSEC");

  // 2. TABLES SECTION (LAYERS)
  add(0, "SECTION");
  add(2, "TABLES");

  // LAYER Table
  add(0, "TABLE");
  add(2, "LAYER");
  add(70, project.layers.length);

  const defaultLayers = [
    { name: "0", color: 7 },
    { name: "SURVEY_BOUNDARY", color: 3 }, // Cyan
    { name: "SURVEY_TRAVERSE", color: 1 }, // Red
    { name: "SURVEY_TRIANGULATION", color: 4 }, // Cyan
    { name: "SURVEY_CONTOURS", color: 30 }, // Orange
    { name: "SURVEY_POINTS", color: 2 }, // Yellow
    { name: "SURVEY_DIMENSIONS", color: 5 }, // Blue
    { name: "SURVEY_ANNOTATIONS", color: 7 }, // White
    { name: "SURVEY_SYMBOLS", color: 6 }, // Magenta
    { name: "SURVEY_TITLEBLOCK", color: 7 }
  ];

  defaultLayers.forEach((l) => {
    add(0, "LAYER");
    add(2, l.name);
    add(70, 0);
    add(62, l.color);
    add(6, "CONTINUOUS");
  });

  add(0, "ENDTAB");
  add(0, "ENDSEC");

  // 3. BLOCKS SECTION
  add(0, "SECTION");
  add(2, "BLOCKS");
  add(0, "ENDSEC");

  // 4. ENTITIES SECTION
  add(0, "SECTION");
  add(2, "ENTITIES");

  // Export Survey Points
  project.points.forEach((pt) => {
    // Point Entity
    add(0, "POINT");
    add(8, pt.layer || "SURVEY_POINTS");
    add(10, pt.x.toFixed(4));
    add(20, pt.y.toFixed(4));
    add(30, (pt.z || 0).toFixed(4));

    // Point Label Text
    add(0, "TEXT");
    add(8, "SURVEY_ANNOTATIONS");
    add(10, (pt.x + 0.3).toFixed(4));
    add(20, (pt.y + 0.3).toFixed(4));
    add(30, (pt.z || 0).toFixed(4));
    add(40, 0.5); // Text Height
    add(1, `${pt.name}${pt.z ? ` (Z:${pt.z.toFixed(2)})` : ""}`);
    add(50, 0); // Rotation
  });

  // Export Entities
  project.entities.forEach((ent: SurveyEntity) => {
    if (ent.visible === false) return;

    if (ent.type === "LINE") {
      add(0, "LINE");
      add(8, ent.layer || "SURVEY_BOUNDARY");
      add(10, ent.start.x.toFixed(4));
      add(20, ent.start.y.toFixed(4));
      add(30, 0);
      add(11, ent.end.x.toFixed(4));
      add(21, ent.end.y.toFixed(4));
      add(31, 0);
    } else if (ent.type === "POLYLINE" || ent.type === "POLYGON_PARCEL") {
      const pts = ent.points;
      if (pts.length < 2) return;

      add(0, "POLYLINE");
      add(8, ent.layer || "SURVEY_BOUNDARY");
      add(66, 1); // Vertices follow
      add(70, ent.type === "POLYGON_PARCEL" || (ent as any).closed ? 1 : 0); // 1 = closed

      pts.forEach((p) => {
        add(0, "VERTEX");
        add(8, ent.layer || "SURVEY_BOUNDARY");
        add(10, p.x.toFixed(4));
        add(20, p.y.toFixed(4));
        add(30, 0);
      });

      add(0, "SEQEND");
    } else if (ent.type === "TRIANGLE") {
      // 3D Face for Triangulation
      add(0, "3DFACE");
      add(8, "SURVEY_TRIANGULATION");
      add(10, ent.p1.x.toFixed(4));
      add(20, ent.p1.y.toFixed(4));
      add(30, 0);
      add(11, ent.p2.x.toFixed(4));
      add(21, ent.p2.y.toFixed(4));
      add(31, 0);
      add(12, ent.p3.x.toFixed(4));
      add(22, ent.p3.y.toFixed(4));
      add(31, 0);
      add(13, ent.p1.x.toFixed(4));
      add(23, ent.p1.y.toFixed(4));
      add(33, 0);
    } else if (ent.type === "CONTOUR") {
      const pts = ent.points;
      if (pts.length >= 2) {
        add(0, "LINE");
        add(8, "SURVEY_CONTOURS");
        add(10, pts[0].x.toFixed(4));
        add(20, pts[0].y.toFixed(4));
        add(30, ent.elevation.toFixed(4));
        add(11, pts[1].x.toFixed(4));
        add(21, pts[1].y.toFixed(4));
        add(31, ent.elevation.toFixed(4));
      }
    } else if (ent.type === "CIRCLE") {
      add(0, "CIRCLE");
      add(8, ent.layer || "SURVEY_BOUNDARY");
      add(10, ent.center.x.toFixed(4));
      add(20, ent.center.y.toFixed(4));
      add(30, 0);
      add(40, ent.radius.toFixed(4));
    } else if (ent.type === "RECTANGLE") {
      const minX = Math.min(ent.corner1.x, ent.corner2.x);
      const maxX = Math.max(ent.corner1.x, ent.corner2.x);
      const minY = Math.min(ent.corner1.y, ent.corner2.y);
      const maxY = Math.max(ent.corner1.y, ent.corner2.y);
      const rectPts = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY }
      ];
      add(0, "POLYLINE");
      add(8, ent.layer || "SURVEY_BOUNDARY");
      add(66, 1);
      add(70, 1); // closed
      rectPts.forEach((p) => {
        add(0, "VERTEX");
        add(8, ent.layer || "SURVEY_BOUNDARY");
        add(10, p.x.toFixed(4));
        add(20, p.y.toFixed(4));
        add(30, 0);
      });
      add(0, "SEQEND");
    } else if (ent.type === "TEXT") {
      add(0, "TEXT");
      add(8, ent.layer || "SURVEY_ANNOTATIONS");
      add(10, ent.position.x.toFixed(4));
      add(20, ent.position.y.toFixed(4));
      add(30, 0);
      add(40, ent.fontSize || 0.8);
      add(1, ent.text);
      add(50, ent.rotation || 0);
    }
  });

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join("\n");
}

export function downloadDxfFile(project: SurveyCadProject, filename?: string) {
  const dxfContent = generateSurveyDxf(project);
  const blob = new Blob([dxfContent], { type: "application/dxf;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `${project.title.replace(/[^a-z0-9_-]/gi, "_")}_survey.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonProject(project: SurveyCadProject) {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.title.replace(/[^a-z0-9_-]/gi, "_")}_surveycad.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
