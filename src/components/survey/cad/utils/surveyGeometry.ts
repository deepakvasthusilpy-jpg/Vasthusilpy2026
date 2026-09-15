import {
  Point2D,
  SurveyPoint,
  SurveyTriangleEntity,
  SurveyTraverseStation,
  SurveyTraverseCalculation,
  SurveyLengthUnit,
  SurveyAreaUnit
} from "../types";

// Standard Land Unit Conversions (Kerala / Indian Standards)
export const SQM_TO_CENTS = 0.0247105;
export const CENTS_TO_SQM = 40.4686;
export const SQM_TO_SQFT = 10.7639;
export const SQFT_TO_SQM = 0.092903;
export const SQM_TO_ARES = 0.01;
export const ARES_TO_SQM = 100.0;
export const SQM_TO_ACRES = 0.000247105;
export const ACRES_TO_SQM = 4046.86;
export const METERS_TO_FEET = 3.28084;
export const FEET_TO_METERS = 0.3048;
export const METERS_TO_LINKS = 4.97096; // 1 Link = 0.201168 m (66ft chain / 100 links)
export const LINKS_TO_METERS = 0.201168;
export const METERS_TO_KOL = 1.388889; // 1 Kol = 72 cm (0.72 m) in traditional Kerala measurement
export const KOL_TO_METERS = 0.72;

export function convertLength(val: number, from: SurveyLengthUnit, to: SurveyLengthUnit): number {
  // normalize to meters first
  let inMeters = val;
  if (from === "cm") inMeters = val / 100;
  else if (from === "ft") inMeters = val * FEET_TO_METERS;
  else if (from === "links") inMeters = val * LINKS_TO_METERS;
  else if (from === "kol") inMeters = val * KOL_TO_METERS;
  else if (from === "chain") inMeters = val * 20.1168;

  // convert from meters to target
  if (to === "cm") return inMeters * 100;
  if (to === "ft") return inMeters * METERS_TO_FEET;
  if (to === "links") return inMeters * METERS_TO_LINKS;
  if (to === "kol") return inMeters * METERS_TO_KOL;
  if (to === "chain") return inMeters / 20.1168;
  return inMeters;
}

export function convertAreaFromSqM(areaSqM: number, targetUnit: SurveyAreaUnit): number {
  switch (targetUnit) {
    case "cents":
      return areaSqM * SQM_TO_CENTS;
    case "sqft":
      return areaSqM * SQM_TO_SQFT;
    case "ares":
      return areaSqM * SQM_TO_ARES;
    case "acres":
      return areaSqM * SQM_TO_ACRES;
    case "hectares":
      return areaSqM / 10000;
    case "sqm":
    default:
      return areaSqM;
  }
}

// Distance between 2 points
export function distance2D(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

// Whole Circle Bearing (WCB in degrees 0 - 360, measured clockwise from North (Y-axis))
export function calculateBearing(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x; // Departure
  const dy = p2.y - p1.y; // Latitude
  let rad = Math.atan2(dx, dy); // atan2(dx, dy) gives 0 at North (+Y), 90 at East (+X)
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

// Convert Bearing Decimal Degrees to Deg, Min, Sec (DMS)
export function degToDms(deg: number): { d: number; m: number; s: number; formatted: string } {
  let d = Math.floor(deg);
  let rem = (deg - d) * 60;
  let m = Math.floor(rem);
  let s = Math.round((rem - m) * 60);
  if (s >= 60) {
    s = 0;
    m += 1;
  }
  if (m >= 60) {
    m = 0;
    d = (d + 1) % 360;
  }
  return {
    d,
    m,
    s,
    formatted: `${d}° ${m.toString().padStart(2, "0")}' ${s.toString().padStart(2, "0")}"`
  };
}

// Convert Quadrant Bearing (e.g. N 45° 30' E)
export function toQuadrantBearing(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized === 0 || normalized === 360) return "Due North (0°)";
  if (normalized === 90) return "Due East (90°)";
  if (normalized === 180) return "Due South (180°)";
  if (normalized === 270) return "Due West (270°)";

  if (normalized > 0 && normalized < 90) {
    const { d, m, s } = degToDms(normalized);
    return `N ${d}°${m}'${s}" E`;
  } else if (normalized > 90 && normalized < 180) {
    const { d, m, s } = degToDms(180 - normalized);
    return `S ${d}°${m}'${s}" E`;
  } else if (normalized > 180 && normalized < 270) {
    const { d, m, s } = degToDms(normalized - 180);
    return `S ${d}°${m}'${s}" W`;
  } else {
    const { d, m, s } = degToDms(360 - normalized);
    return `N ${d}°${m}'${s}" W`;
  }
}

// Shoelace Polygon Area Formula
export function calculatePolygonAreaSqM(points: Point2D[]): number {
  if (!points || points.length < 3) return 0;
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    sum += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(sum) / 2;
}

// Polygon Perimeter
export function calculatePolygonPerimeter(points: Point2D[], isClosed = true): number {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distance2D(points[i], points[i + 1]);
  }
  if (isClosed && points.length > 2) {
    total += distance2D(points[points.length - 1], points[0]);
  }
  return total;
}

// Heron's Formula for a triangle
export function heronTriangleArea(a: number, b: number, c: number): number {
  const s = (a + b + c) / 2;
  const val = s * (s - a) * (s - b) * (s - c);
  return val > 0 ? Math.sqrt(val) : 0;
}

// Delaunay Triangulation using Bowyer-Watson Algorithm
interface Triangle {
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;
}

function circumcircleContains(tri: Triangle, pt: Point2D): boolean {
  const { p1, p2, p3 } = tri;
  const ax = p1.x - pt.x;
  const ay = p1.y - pt.y;
  const bx = p2.x - pt.x;
  const by = p2.y - pt.y;
  const cx = p3.x - pt.x;
  const cy = p3.y - pt.y;

  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);

  // Check counter-clockwise orientation of triangle
  const ccw = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  return ccw > 0 ? det > 0 : det < 0;
}

export function computeDelaunayTriangulation(points: Point2D[]): SurveyTriangleEntity[] {
  if (!points || points.length < 3) return [];

  // 1. Determine bounding box for super-triangle
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  points.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });

  const dx = maxX - minX || 10;
  const dy = maxY - minY || 10;
  const deltaMax = Math.max(dx, dy);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  // Super triangle vertices far outside the bounding box
  const st1: Point2D = { x: midX - 20 * deltaMax, y: midY - deltaMax };
  const st2: Point2D = { x: midX, y: midY + 20 * deltaMax };
  const st3: Point2D = { x: midX + 20 * deltaMax, y: midY - deltaMax };

  let triangles: Triangle[] = [{ p1: st1, p2: st2, p3: st3 }];

  // 2. Incremental point insertion
  for (const pt of points) {
    const badTriangles: Triangle[] = [];
    const polygonEdges: [Point2D, Point2D][] = [];

    // Find all triangles that pt is inside circumcircle of
    for (const tri of triangles) {
      if (circumcircleContains(tri, pt)) {
        badTriangles.push(tri);
      }
    }

    // Find the boundary of the polygonal hole
    for (const tri of badTriangles) {
      const edges: [Point2D, Point2D][] = [
        [tri.p1, tri.p2],
        [tri.p2, tri.p3],
        [tri.p3, tri.p1]
      ];

      for (const [e1, e2] of edges) {
        // Edge is shared if another bad triangle has it (reversed)
        const isShared = badTriangles.some(
          (other) =>
            other !== tri &&
            ((other.p1 === e2 && other.p2 === e1) ||
              (other.p2 === e2 && other.p3 === e1) ||
              (other.p3 === e2 && other.p1 === e1) ||
              (other.p1 === e1 && other.p2 === e2) ||
              (other.p2 === e1 && other.p3 === e2) ||
              (other.p3 === e1 && other.p1 === e2))
        );
        if (!isShared) {
          polygonEdges.push([e1, e2]);
        }
      }
    }

    // Remove bad triangles
    triangles = triangles.filter((tri) => !badTriangles.includes(tri));

    // Re-triangulate the polygonal hole with pt
    for (const [e1, e2] of polygonEdges) {
      triangles.push({ p1: e1, p2: e2, p3: pt });
    }
  }

  // 3. Remove triangles that share vertices with super-triangle
  const isSuperVertex = (p: Point2D) => p === st1 || p === st2 || p === st3;
  const validTriangles = triangles.filter(
    (tri) => !isSuperVertex(tri.p1) && !isSuperVertex(tri.p2) && !isSuperVertex(tri.p3)
  );

  // 4. Map to SurveyTriangleEntity
  return validTriangles.map((t, idx) => {
    const a = distance2D(t.p1, t.p2);
    const b = distance2D(t.p2, t.p3);
    const c = distance2D(t.p3, t.p1);
    const areaSqM = heronTriangleArea(a, b, c);
    return {
      id: `tri_auto_${idx + 1}_${Date.now()}`,
      type: "TRIANGLE",
      triangleId: `T${idx + 1}`,
      p1: t.p1,
      p2: t.p2,
      p3: t.p3,
      sideA: Number(a.toFixed(3)),
      sideB: Number(b.toFixed(3)),
      sideC: Number(c.toFixed(3)),
      areaSqM: Number(areaSqM.toFixed(3)),
      areaCents: Number((areaSqM * SQM_TO_CENTS).toFixed(3)),
      layer: "SURVEY_TRIANGULATION",
      color: "#38bdf8",
      lineWidth: 1.5
    };
  });
}

// Polyline Parallel Offset Algorithm
export function offsetPolyline(points: Point2D[], offsetDist: number): Point2D[] {
  if (points.length < 2) return [...points];
  const offsetPoints: Point2D[] = [];

  const segments: { start: Point2D; end: Point2D; normal: Point2D }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    // Normal vector perpendicular to segment
    const nx = -dy / len;
    const ny = dx / len;
    segments.push({
      start: { x: p1.x + nx * offsetDist, y: p1.y + ny * offsetDist },
      end: { x: p2.x + nx * offsetDist, y: p2.y + ny * offsetDist },
      normal: { x: nx, y: ny }
    });
  }

  // Compute intersections of offset segments
  offsetPoints.push(segments[0].start);
  for (let i = 0; i < segments.length - 1; i++) {
    const s1 = segments[i];
    const s2 = segments[i + 1];
    // Line-line intersection
    const inter = lineIntersection(s1.start, s1.end, s2.start, s2.end);
    if (inter) {
      offsetPoints.push(inter);
    } else {
      offsetPoints.push(s1.end);
    }
  }
  offsetPoints.push(segments[segments.length - 1].end);

  return offsetPoints;
}

export function lineIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): Point2D | null {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 1e-9) return null; // Parallel

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y)
  };
}

// Bowditch (Compass Rule) Traverse Calculation & Balancing
export function calculateBowditchTraverse(
  stations: SurveyTraverseStation[],
  startE = 1000,
  startN = 1000,
  isClosed = true
): SurveyTraverseCalculation {
  if (!stations || stations.length === 0) {
    return {
      stations: [],
      isClosed,
      startEasting: startE,
      startNorthing: startN,
      totalPerimeter: 0,
      closingErrorLat: 0,
      closingErrorDep: 0,
      linearMisclosure: 0,
      relativePrecision: 0,
      areaSqM: 0,
      areaCents: 0
    };
  }

  let totalPerimeter = 0;
  let sumLat = 0;
  let sumDep = 0;

  // Step 1: Calculate raw consecutive latitudes and departures
  const calculatedStations = stations.map((st) => {
    const totalDeg = st.bearingDeg + st.bearingMin / 60 + st.bearingSec / 3600;
    const rad = (totalDeg * Math.PI) / 180;
    const lat = st.distanceMeters * Math.cos(rad); // Northing delta
    const dep = st.distanceMeters * Math.sin(rad); // Easting delta

    totalPerimeter += st.distanceMeters;
    sumLat += lat;
    sumDep += dep;

    return {
      ...st,
      rawLatitude: lat,
      rawDeparture: dep
    };
  });

  const closingErrorLat = sumLat;
  const closingErrorDep = sumDep;
  const linearMisclosure = isClosed ? Math.hypot(closingErrorLat, closingErrorDep) : 0;
  const relativePrecision =
    isClosed && linearMisclosure > 0.0001
      ? Math.round(totalPerimeter / linearMisclosure)
      : 999999;

  // Step 2: Apply Bowditch adjustment (Compass Rule):
  // Correction to Lat = - (Length of side / Total Perimeter) * Total Closing Error in Lat
  // Correction to Dep = - (Length of side / Total Perimeter) * Total Closing Error in Dep
  let curE = startE;
  let curN = startN;
  const polygonPoints: Point2D[] = [{ x: curE, y: curN }];

  const balancedStations = calculatedStations.map((st) => {
    let corrLat = st.rawLatitude || 0;
    let corrDep = st.rawDeparture || 0;

    if (isClosed && totalPerimeter > 0) {
      const latCorr = -(st.distanceMeters / totalPerimeter) * closingErrorLat;
      const depCorr = -(st.distanceMeters / totalPerimeter) * closingErrorDep;
      corrLat += latCorr;
      corrDep += depCorr;
    }

    curN += corrLat;
    curE += corrDep;
    polygonPoints.push({ x: curE, y: curN });

    return {
      ...st,
      correctedLatitude: corrLat,
      correctedDeparture: corrDep,
      northing: curN,
      easting: curE
    };
  });

  const areaSqM = isClosed ? calculatePolygonAreaSqM(polygonPoints) : 0;
  const areaCents = areaSqM * SQM_TO_CENTS;

  return {
    stations: balancedStations,
    isClosed,
    startEasting: startE,
    startNorthing: startN,
    totalPerimeter: Number(totalPerimeter.toFixed(3)),
    closingErrorLat: Number(closingErrorLat.toFixed(4)),
    closingErrorDep: Number(closingErrorDep.toFixed(4)),
    linearMisclosure: Number(linearMisclosure.toFixed(4)),
    relativePrecision,
    areaSqM: Number(areaSqM.toFixed(2)),
    areaCents: Number(areaCents.toFixed(3))
  };
}

// Generate simple contour lines using linear grid interpolation
export function generateContoursFromSpotLevels(
  points: SurveyPoint[],
  interval = 1.0
): { elevation: number; points: Point2D[]; isMajor: boolean }[] {
  const validPoints = points.filter((p) => typeof p.z === "number" && !isNaN(p.z));
  if (validPoints.length < 3) return [];

  let minZ = Infinity,
    maxZ = -Infinity;
  validPoints.forEach((p) => {
    if (p.z! < minZ) minZ = p.z!;
    if (p.z! > maxZ) maxZ = p.z!;
  });

  const contours: { elevation: number; points: Point2D[]; isMajor: boolean }[] = [];
  const startZ = Math.ceil(minZ / interval) * interval;

  // Triangulate spot levels to interpolate contour lines along triangle edges
  const tris = computeDelaunayTriangulation(validPoints);

  for (let z = startZ; z <= maxZ; z += interval) {
    const isMajor = Math.round(z / interval) % 5 === 0;
    const segments: [Point2D, Point2D][] = [];

    for (const tri of tris) {
      // Find point elevations
      const p1Obj = validPoints.find(
        (vp) => Math.abs(vp.x - tri.p1.x) < 0.001 && Math.abs(vp.y - tri.p1.y) < 0.001
      );
      const p2Obj = validPoints.find(
        (vp) => Math.abs(vp.x - tri.p2.x) < 0.001 && Math.abs(vp.y - tri.p2.y) < 0.001
      );
      const p3Obj = validPoints.find(
        (vp) => Math.abs(vp.x - tri.p3.x) < 0.001 && Math.abs(vp.y - tri.p3.y) < 0.001
      );

      if (!p1Obj || !p2Obj || !p3Obj) continue;
      const z1 = p1Obj.z!;
      const z2 = p2Obj.z!;
      const z3 = p3Obj.z!;

      const intersects: Point2D[] = [];

      // Edge 1-2
      if ((z >= z1 && z <= z2) || (z >= z2 && z <= z1)) {
        if (Math.abs(z2 - z1) > 0.0001) {
          const t = (z - z1) / (z2 - z1);
          intersects.push({ x: tri.p1.x + t * (tri.p2.x - tri.p1.x), y: tri.p1.y + t * (tri.p2.y - tri.p1.y) });
        }
      }
      // Edge 2-3
      if ((z >= z2 && z <= z3) || (z >= z3 && z <= z2)) {
        if (Math.abs(z3 - z2) > 0.0001) {
          const t = (z - z2) / (z3 - z2);
          intersects.push({ x: tri.p2.x + t * (tri.p3.x - tri.p2.x), y: tri.p2.y + t * (tri.p3.y - tri.p2.y) });
        }
      }
      // Edge 3-1
      if ((z >= z3 && z <= z1) || (z >= z1 && z <= z3)) {
        if (Math.abs(z1 - z3) > 0.0001) {
          const t = (z - z3) / (z1 - z3);
          intersects.push({ x: tri.p3.x + t * (tri.p1.x - tri.p3.x), y: tri.p3.y + t * (tri.p1.y - tri.p3.y) });
        }
      }

      if (intersects.length >= 2) {
        segments.push([intersects[0], intersects[1]]);
      }
    }

    if (segments.length > 0) {
      // Collect segments for this contour level
      segments.forEach((seg) => {
        contours.push({
          elevation: z,
          points: [seg[0], seg[1]],
          isMajor
        });
      });
    }
  }

  return contours;
}
