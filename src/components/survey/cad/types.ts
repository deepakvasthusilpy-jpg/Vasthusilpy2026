export type Point2D = { x: number; y: number };
export type Point3D = { x: number; y: number; z: number };

export type SurveyLengthUnit = "m" | "cm" | "ft" | "links" | "kol" | "chain";
export type SurveyAreaUnit = "cents" | "sqm" | "sqft" | "ares" | "acres" | "hectares";

export interface SurveyPoint {
  id: string;
  name: string; // e.g. "A", "P1", "BM1", "ST1"
  x: number; // Easting in meters
  y: number; // Northing in meters
  z?: number; // Spot Elevation in meters
  code?: string; // e.g. "BD_STONE", "TREE", "WELL", "BUILDING_CORNER", "BENCHMARK"
  description?: string;
  isControlPoint?: boolean;
  layer?: string;
}

export type SurveyEntityType =
  | "LINE"
  | "POLYLINE"
  | "RECTANGLE"
  | "CIRCLE"
  | "POLYGON_PARCEL"
  | "OFFSET_LINE"
  | "TRIANGLE"
  | "CONTOUR"
  | "SPOT_LEVEL"
  | "DIMENSION"
  | "TEXT"
  | "SYMBOL";

export type SymbolType =
  | "BOUNDARY_STONE"
  | "BENCH_MARK"
  | "WELL"
  | "BORE_WELL"
  | "TREE"
  | "BUILDING"
  | "ELECTRIC_POLE"
  | "NORTH_ARROW";

export interface BaseSurveyEntity {
  id: string;
  type: SurveyEntityType;
  layer: string;
  color?: string;
  lineWidth?: number;
  lineDash?: number[];
  visible?: boolean;
  locked?: boolean;
}

export interface SurveyLineEntity extends BaseSurveyEntity {
  type: "LINE";
  start: Point2D;
  end: Point2D;
  label?: string;
  showLength?: boolean;
  showBearing?: boolean;
}

export interface SurveyPolylineEntity extends BaseSurveyEntity {
  type: "POLYLINE";
  points: Point2D[];
  closed: boolean;
  label?: string;
  showSegmentDimensions?: boolean;
  showBearings?: boolean;
  areaSqM?: number;
  offsetDistance?: number;
}

export interface SurveyRectangleEntity extends BaseSurveyEntity {
  type: "RECTANGLE";
  corner1: Point2D;
  corner2: Point2D;
  rotation?: number; // in degrees
  areaSqM?: number;
}

export interface SurveyCircleEntity extends BaseSurveyEntity {
  type: "CIRCLE";
  center: Point2D;
  radius: number; // in meters
  radiusUnit?: SurveyLengthUnit;
  areaSqM?: number;
  areaCents?: number;
  circumferenceM?: number;
  label?: string;
}

export interface SurveyParcelEntity extends BaseSurveyEntity {
  type: "POLYGON_PARCEL";
  name: string; // e.g. "Parcel 1", "Plot A", "Sy.No 142/2A"
  points: Point2D[];
  areaSqM: number;
  areaCents: number;
  areaAres: number;
  areaSqFt: number;
  areaAcres: number;
  color: string;
  fillColor?: string;
  surveyNumber?: string;
  ownerName?: string;
}

export interface SurveyTriangleEntity extends BaseSurveyEntity {
  type: "TRIANGLE";
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;
  sideA: number; // length p1-p2
  sideB: number; // length p2-p3
  sideC: number; // length p3-p1
  areaSqM: number;
  areaCents: number;
  triangleId?: string; // e.g. "T1", "T2"
}

export interface SurveyContourEntity extends BaseSurveyEntity {
  type: "CONTOUR";
  elevation: number;
  points: Point2D[];
  isMajor: boolean;
}

export interface SurveySpotLevelEntity extends BaseSurveyEntity {
  type: "SPOT_LEVEL";
  position: Point2D;
  elevation: number; // Z in meters
  pointName?: string;
  code?: string;
}

export interface SurveyDimensionEntity extends BaseSurveyEntity {
  type: "DIMENSION";
  start: Point2D;
  end: Point2D;
  textOverride?: string;
  offset: number; // perpendicular offset for dimension line
}

export interface SurveyTextEntity extends BaseSurveyEntity {
  type: "TEXT";
  position: Point2D;
  text: string;
  fontSize: number;
  rotation: number;
}

export interface SurveySymbolEntity extends BaseSurveyEntity {
  type: "SYMBOL";
  symbolType: SymbolType;
  position: Point2D;
  scale: number;
  rotation: number;
  label?: string;
}

export type SurveyEntity =
  | SurveyLineEntity
  | SurveyPolylineEntity
  | SurveyRectangleEntity
  | SurveyCircleEntity
  | SurveyParcelEntity
  | SurveyTriangleEntity
  | SurveyContourEntity
  | SurveySpotLevelEntity
  | SurveyDimensionEntity
  | SurveyTextEntity
  | SurveySymbolEntity;

export interface SurveyLayer {
  id: string;
  name: string;
  color: string;
  lineWidth: number;
  lineDash?: number[];
  visible: boolean;
  locked: boolean;
}

export interface SurveyTraverseStation {
  id: string;
  stationName: string; // e.g. "A", "B", "C", "D"
  bearingDeg: number;
  bearingMin: number;
  bearingSec: number;
  distanceMeters: number;
  // Computed consecutively
  rawLatitude?: number; // L * cos(theta)
  rawDeparture?: number; // L * sin(theta)
  correctedLatitude?: number;
  correctedDeparture?: number;
  northing?: number;
  easting?: number;
}

export interface SurveyTraverseCalculation {
  stations: SurveyTraverseStation[];
  isClosed: boolean;
  startEasting: number;
  startNorthing: number;
  totalPerimeter: number;
  closingErrorLat: number; // sum of latitudes
  closingErrorDep: number; // sum of departures
  linearMisclosure: number; // sqrt(deltaL^2 + deltaD^2)
  relativePrecision: number; // 1 in (Perimeter / Misclosure)
  areaSqM: number;
  areaCents: number;
}

export interface SurveyTitleBlock {
  projectTitle: string;
  ownerName: string;
  surveyorName: string;
  licenseNo: string;
  surveyDate: string;
  district: string;
  taluk: string;
  village: string;
  reSurveyNo: string;
  blockNo: string;
  wardNo: string;
  sheetSize: "A4" | "A3" | "A2" | "A1" | "A0";
  orientation: "LANDSCAPE" | "PORTRAIT";
  drawingScale: string; // e.g. "1:100", "1:200", "1:500", "1:1000", "FIT"
  northAngle: number; // Angle in degrees (0 = straight up)
  notes: string;
}

export interface SurveyCadProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  unit: SurveyLengthUnit;
  areaUnit: SurveyAreaUnit;
  layers: SurveyLayer[];
  points: SurveyPoint[];
  entities: SurveyEntity[];
  traverse: SurveyTraverseStation[];
  traverseCalculation?: SurveyTraverseCalculation;
  titleBlock: SurveyTitleBlock;
  contourInterval: number; // meters e.g. 0.5, 1.0, 2.0
}

export type SurveyCadTool =
  | "SELECT"
  | "PAN"
  | "ERASE"
  | "LINE"
  | "POLYLINE"
  | "TRIANGLE"
  | "RECTANGLE"
  | "CIRCLE"
  | "OFFSET"
  | "TRIANGULATE"
  | "DELAUNAY"
  | "SPOT_LEVEL"
  | "CONTOUR_GEN"
  | "PARCEL_SUBDIVIDE"
  | "DIMENSION"
  | "TEXT"
  | "SYMBOL"
  | "MEASURE_DISTANCE"
  | "MEASURE_AREA"
  | "COORDINATE_INPUT"
  | "TRAVERSE_TOOL";

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number; // pixels per meter
}

export interface SnapPoint {
  x: number;
  y: number;
  type: "ENDPOINT" | "MIDPOINT" | "CENTER" | "INTERSECTION" | "POINT_NODE" | "GRID" | "PERPENDICULAR";
  label?: string;
}
