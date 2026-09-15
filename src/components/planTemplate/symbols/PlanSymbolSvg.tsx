import React from "react";
import { PlanSymbolItem } from "../../../types/buildingPlanTemplate";

interface PlanSymbolSvgProps {
  symbol: PlanSymbolItem;
  className?: string;
  isGhost?: boolean;
}

export const PlanSymbolSvg: React.FC<PlanSymbolSvgProps> = ({
  symbol,
  className = "",
  isGhost = false
}) => {
  const strokeColor = isGhost ? "#64748b" : (symbol.color || "#0f172a");
  const fillColor = isGhost ? "none" : (symbol.fillColor || "#ffffff");
  const strokeWidth = 1.8;

  // Render specific architectural SVG elements based on type
  const renderSymbolGraphic = () => {
    switch (symbol.type) {
      // -------------------------------------------------------------
      // 1. DOORS (Standard Architectural CAD Symbol)
      // -------------------------------------------------------------
      case "door_single": {
        // Standard single swing door:
        // Jamb at left (0,0), Door leaf standing open at 90° (0,0) to (0,100),
        // and 90° swing circular arc from (100,0) to (0,100).
        return (
          <g transform={symbol.flipH ? "scale(-1, 1) translate(-100, 0)" : undefined}>
            {/* Wall opening line / threshold (dotted or subtle) */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />

            {/* Door Jambs (hinge side and strike side) */}
            <rect x="0" y="-4" width="8" height="8" fill={strokeColor} rx="1" />
            <rect x="92" y="-4" width="8" height="8" fill={strokeColor} rx="1" />

            {/* Swing Clearance Arc (quarter circle) */}
            <path
              d="M 100,0 A 100,100 0 0,0 0,100"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="4,3"
            />

            {/* Door Leaf (thickness ~6) */}
            <rect
              x="0"
              y="0"
              width="6"
              height="100"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rx="1"
            />

            {/* Door handle indicator */}
            <circle cx="3" cy="85" r="2" fill={strokeColor} />
          </g>
        );
      }

      case "door_double": {
        // Double swing door meeting at center (50, 0)
        return (
          <g>
            <line x1="0" y1="0" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
            <rect x="0" y="-4" width="6" height="8" fill={strokeColor} rx="1" />
            <rect x="94" y="-4" width="6" height="8" fill={strokeColor} rx="1" />

            {/* Left Leaf & Arc */}
            <path
              d="M 50,0 A 50,50 0 0,0 0,50"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="3,2"
            />
            <rect x="0" y="0" width="5" height="50" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="1" />

            {/* Right Leaf & Arc */}
            <path
              d="M 50,0 A 50,50 0 0,1 100,50"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="3,2"
            />
            <rect x="95" y="0" width="5" height="50" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="1" />
          </g>
        );
      }

      case "door_sliding": {
        // Sliding Door (2 overlapping panels with directional arrow)
        return (
          <g>
            <line x1="0" y1="50" x2="100" y2="50" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            {/* Panel 1 (Left fixed or slider) */}
            <rect x="0" y="38" width="54" height="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="1" />
            {/* Panel 2 (Right overlapping slider) */}
            <rect x="46" y="54" width="54" height="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} rx="1" />
            {/* Slide directional arrow */}
            <line x1="60" y1="68" x2="85" y2="68" stroke={strokeColor} strokeWidth="1.5" />
            <polyline points="80,65 85,68 80,71" fill="none" stroke={strokeColor} strokeWidth="1.5" />
          </g>
        );
      }

      // -------------------------------------------------------------
      // 2. BEDS (Single, Double, King)
      // -------------------------------------------------------------
      case "bed_single": {
        return (
          <g>
            {/* Headboard */}
            <rect x="5" y="5" width="90" height="10" rx="2" fill={strokeColor} />
            {/* Mattress Frame */}
            <rect x="10" y="15" width="80" height="125" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Single Pillow */}
            <rect x="25" y="22" width="50" height="24" rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Duvet / Blanket crease */}
            <line x1="10" y1="60" x2="90" y2="60" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3,2" />
            <path d="M 20,80 Q 50,85 80,80" fill="none" stroke="#94a3b8" strokeWidth="1" />
          </g>
        );
      }

      case "bed_double": {
        return (
          <g>
            {/* Headboard */}
            <rect x="4" y="4" width="132" height="10" rx="2" fill={strokeColor} />
            {/* Mattress Frame */}
            <rect x="8" y="14" width="124" height="135" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Left & Right Pillows */}
            <rect x="16" y="20" width="48" height="26" rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeWidth} />
            <rect x="76" y="20" width="48" height="26" rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Duvet fold */}
            <line x1="8" y1="65" x2="132" y2="65" stroke={strokeColor} strokeWidth="1.4" strokeDasharray="3,2" />
            <path d="M 20,90 Q 70,95 120,90" fill="none" stroke="#94a3b8" strokeWidth="1" />
          </g>
        );
      }

      case "bed_king": {
        return (
          <g>
            {/* Headboard extending to nightstands */}
            <rect x="2" y="4" width="156" height="10" rx="2" fill={strokeColor} />
            {/* Left Nightstand */}
            <rect x="2" y="14" width="22" height="22" rx="2" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="13" cy="25" r="4" fill={strokeColor} opacity="0.3" />
            {/* Right Nightstand */}
            <rect x="136" y="14" width="22" height="22" rx="2" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="147" cy="25" r="4" fill={strokeColor} opacity="0.3" />
            {/* King Mattress Frame */}
            <rect x="26" y="14" width="108" height="135" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Pillows */}
            <rect x="34" y="20" width="42" height="26" rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeWidth} />
            <rect x="84" y="20" width="42" height="26" rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Duvet */}
            <line x1="26" y1="65" x2="134" y2="65" stroke={strokeColor} strokeWidth="1.4" strokeDasharray="4,2" />
            <path d="M 35,95 Q 80,102 125,95" fill="none" stroke="#94a3b8" strokeWidth="1" />
          </g>
        );
      }

      // -------------------------------------------------------------
      // 3. SOFAS & CHAIRS
      // -------------------------------------------------------------
      case "chair": {
        return (
          <g>
            {/* Seat */}
            <rect x="10" y="20" width="60" height="55" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Curved Backrest */}
            <path d="M 10,20 Q 40,5 70,20" fill="none" stroke={strokeColor} strokeWidth={strokeWidth + 1} strokeLinecap="round" />
            {/* Armrests */}
            <line x1="8" y1="25" x2="8" y2="65" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="72" y1="25" x2="72" y2="65" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        );
      }

      case "sofa_1seater": {
        return (
          <g>
            {/* Outer Frame */}
            <rect x="5" y="5" width="70" height="70" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Backrest cushion */}
            <rect x="15" y="8" width="50" height="16" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Left and Right Arm cushions */}
            <rect x="8" y="12" width="10" height="58" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="62" y="12" width="10" height="58" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Seat cushion */}
            <rect x="20" y="26" width="40" height="44" rx="4" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" />
          </g>
        );
      }

      case "sofa_2seater": {
        return (
          <g>
            <rect x="5" y="5" width="120" height="70" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Backrest */}
            <rect x="18" y="8" width="94" height="16" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Arms */}
            <rect x="8" y="12" width="12" height="58" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="110" y="12" width="12" height="58" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Two Cushions */}
            <rect x="22" y="26" width="42" height="44" rx="4" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="66" y="26" width="42" height="44" rx="4" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" />
          </g>
        );
      }

      case "sofa_3seater": {
        return (
          <g>
            <rect x="5" y="5" width="165" height="70" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Backrest */}
            <rect x="18" y="8" width="139" height="16" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Arms */}
            <rect x="8" y="12" width="12" height="58" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="155" y="12" width="12" height="58" rx="4" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Three Cushions */}
            <rect x="22" y="26" width="42" height="44" rx="4" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="66" y="26" width="42" height="44" rx="4" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="110" y="26" width="42" height="44" rx="4" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" />
          </g>
        );
      }

      case "sofa_l_shape": {
        // L-Shape Sectional Sofa
        return (
          <g>
            {/* Base L outline */}
            <path
              d="M 5,5 L 140,5 L 140,65 L 75,65 L 75,130 L 5,130 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rx="6"
            />
            {/* Backrest Top & Left */}
            <rect x="18" y="8" width="118" height="14" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1" />
            <rect x="8" y="22" width="14" height="100" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1" />
            {/* Cushions */}
            <rect x="24" y="24" width="36" height="38" rx="3" fill="#ffffff" stroke={strokeColor} strokeWidth="1" />
            <rect x="62" y="24" width="36" height="38" rx="3" fill="#ffffff" stroke={strokeColor} strokeWidth="1" />
            <rect x="100" y="24" width="36" height="38" rx="3" fill="#ffffff" stroke={strokeColor} strokeWidth="1" />
            <rect x="24" y="64" width="48" height="30" rx="3" fill="#ffffff" stroke={strokeColor} strokeWidth="1" />
            <rect x="24" y="96" width="48" height="30" rx="3" fill="#ffffff" stroke={strokeColor} strokeWidth="1" />
          </g>
        );
      }

      // -------------------------------------------------------------
      // 4. KITCHEN SINK & KITCHEN SLAB
      // -------------------------------------------------------------
      case "kitchen_sink_single": {
        // Single Bowl with Drainboard
        return (
          <g>
            {/* Outer Rim */}
            <rect x="4" y="4" width="100" height="54" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Left Deep Bowl */}
            <rect x="10" y="10" width="44" height="42" rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth="1.5" />
            {/* Drainer Hole */}
            <circle cx="32" cy="31" r="5" fill="#e2e8f0" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="32" cy="31" r="2" fill={strokeColor} />
            {/* Faucet / Tap at back */}
            <circle cx="32" cy="7" r="3" fill={strokeColor} />
            <line x1="32" y1="7" x2="32" y2="13" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            {/* Right Drainboard with slanted draining ridges */}
            <rect x="58" y="10" width="40" height="42" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="64" y1="16" x2="92" y2="16" stroke={strokeColor} strokeWidth="1" />
            <line x1="64" y1="23" x2="92" y2="23" stroke={strokeColor} strokeWidth="1" />
            <line x1="64" y1="30" x2="92" y2="30" stroke={strokeColor} strokeWidth="1" />
            <line x1="64" y1="37" x2="92" y2="37" stroke={strokeColor} strokeWidth="1" />
            <line x1="64" y1="44" x2="92" y2="44" stroke={strokeColor} strokeWidth="1" />
          </g>
        );
      }

      case "kitchen_sink_double": {
        return (
          <g>
            {/* Outer Rim */}
            <rect x="4" y="4" width="112" height="54" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Bowl 1 */}
            <rect x="10" y="10" width="42" height="42" rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth="1.5" />
            <circle cx="31" cy="31" r="4.5" fill="#e2e8f0" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="31" cy="31" r="1.8" fill={strokeColor} />
            {/* Bowl 2 */}
            <rect x="60" y="10" width="42" height="42" rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth="1.5" />
            <circle cx="81" cy="31" r="4.5" fill="#e2e8f0" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="81" cy="31" r="1.8" fill={strokeColor} />
            {/* Swivel Faucet in Center */}
            <circle cx="56" cy="7" r="3.5" fill={strokeColor} />
            <line x1="56" y1="7" x2="56" y2="14" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        );
      }

      case "kitchen_slab_straight": {
        // Standard Granite Countertop (60cm depth standard)
        return (
          <g>
            {/* Solid Granite Top */}
            <rect x="2" y="4" width="160" height="48" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Front Beveled Edge */}
            <line x1="2" y1="48" x2="162" y2="48" stroke={strokeColor} strokeWidth="1" strokeDasharray="3,2" />
            {/* Integrated 3-Burner Stove zone */}
            <rect x="80" y="10" width="55" height="34" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="95" cy="27" r="7" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="120" cy="27" r="9" fill="#ffffff" stroke={strokeColor} strokeWidth="1.4" />
            <circle cx="107" cy="18" r="5" fill="#ffffff" stroke={strokeColor} strokeWidth="1" />
            {/* Text label */}
            <text x="25" y="32" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="monospace">KITCHEN SLAB</text>
          </g>
        );
      }

      case "kitchen_slab_l": {
        // L-Shape Kitchen Slab Counter
        return (
          <g>
            <path
              d="M 4,4 L 140,4 L 140,48 L 52,48 L 52,130 L 4,130 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* 3-Burner Stove on horizontal run */}
            <rect x="70" y="10" width="55" height="32" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="85" cy="26" r="7" fill="#fff" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="108" cy="26" r="8" fill="#fff" stroke={strokeColor} strokeWidth="1.2" />
            {/* Sink on vertical run */}
            <rect x="10" y="65" width="34" height="45" rx="3" fill="#f8fafc" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="27" cy="87" r="4.5" fill="#e2e8f0" stroke={strokeColor} strokeWidth="1" />
          </g>
        );
      }

      case "kitchen_gas_stove": {
        return (
          <g>
            {/* Hob Plate */}
            <rect x="4" y="4" width="80" height="52" rx="5" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* 4 Burners with cross trivets */}
            {/* Burner 1 */}
            <circle cx="24" cy="20" r="10" fill="#fff" stroke={strokeColor} strokeWidth="1.4" />
            <line x1="24" y1="10" x2="24" y2="30" stroke={strokeColor} strokeWidth="1" />
            <line x1="14" y1="20" x2="34" y2="20" stroke={strokeColor} strokeWidth="1" />
            {/* Burner 2 */}
            <circle cx="64" cy="20" r="10" fill="#fff" stroke={strokeColor} strokeWidth="1.4" />
            <line x1="64" y1="10" x2="64" y2="30" stroke={strokeColor} strokeWidth="1" />
            <line x1="54" y1="20" x2="74" y2="20" stroke={strokeColor} strokeWidth="1" />
            {/* Burner 3 */}
            <circle cx="24" cy="40" r="7" fill="#fff" stroke={strokeColor} strokeWidth="1.2" />
            {/* Burner 4 */}
            <circle cx="64" cy="40" r="7" fill="#fff" stroke={strokeColor} strokeWidth="1.2" />
            {/* Knobs */}
            <circle cx="44" cy="28" r="2.5" fill={strokeColor} />
            <circle cx="44" cy="34" r="2.5" fill={strokeColor} />
          </g>
        );
      }

      // -------------------------------------------------------------
      // 5. DINING TABLES
      // -------------------------------------------------------------
      case "dining_4seater": {
        return (
          <g>
            {/* Rectangular Table */}
            <rect x="25" y="20" width="80" height="50" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* 4 Chairs tucked in */}
            {/* Top Chair 1 */}
            <rect x="35" y="6" width="26" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Top Chair 2 */}
            <rect x="69" y="6" width="26" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Bottom Chair 1 */}
            <rect x="35" y="72" width="26" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* Bottom Chair 2 */}
            <rect x="69" y="72" width="26" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
          </g>
        );
      }

      case "dining_6seater": {
        return (
          <g>
            {/* Large Table */}
            <rect x="25" y="20" width="115" height="52" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* 3 Top Chairs */}
            <rect x="32" y="6" width="24" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="70" y="6" width="24" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="108" y="6" width="24" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            {/* 3 Bottom Chairs */}
            <rect x="32" y="74" width="24" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="70" y="74" width="24" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
            <rect x="108" y="74" width="24" height="12" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth="1.2" />
          </g>
        );
      }

      // -------------------------------------------------------------
      // 6. SANITARY (Commode / Washbasin)
      // -------------------------------------------------------------
      case "toilet_commode": {
        return (
          <g>
            {/* Water Cistern / Tank */}
            <rect x="12" y="4" width="46" height="20" rx="3" fill="#f1f5f9" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Dual flush button */}
            <circle cx="35" cy="14" r="3.5" fill="#e2e8f0" stroke={strokeColor} strokeWidth="1" />
            {/* Toilet Bowl (Oval) */}
            <path
              d="M 18,24 C 18,50 22,68 35,68 C 48,68 52,50 52,24 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Inner Water Hole */}
            <ellipse cx="35" cy="46" rx="8" ry="12" fill="#f8fafc" stroke={strokeColor} strokeWidth="1.2" />
          </g>
        );
      }

      case "wash_basin": {
        return (
          <g>
            {/* Basin Perimeter */}
            <path
              d="M 6,8 C 6,42 20,54 36,54 C 52,54 66,42 66,8 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Inner Basin Oval */}
            <path
              d="M 12,12 C 12,38 22,46 36,46 C 50,46 60,38 60,12 Z"
              fill="#f8fafc"
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            {/* Faucet */}
            <circle cx="36" cy="10" r="3.5" fill={strokeColor} />
            <circle cx="36" cy="30" r="3" fill="#cbd5e1" stroke={strokeColor} strokeWidth="1" />
          </g>
        );
      }

      default: {
        return (
          <rect x="2" y="2" width="60" height="40" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        );
      }
    }
  };

  // Dimensions for ViewBox
  const getViewBox = () => {
    switch (symbol.type) {
      case "door_single": return "-10 -10 120 120";
      case "door_double": return "-5 -10 110 70";
      case "door_sliding": return "-5 25 110 55";
      case "bed_single": return "0 0 100 145";
      case "bed_double": return "0 0 140 155";
      case "bed_king": return "0 0 160 155";
      case "chair": return "0 0 80 80";
      case "sofa_1seater": return "0 0 80 80";
      case "sofa_2seater": return "0 0 130 80";
      case "sofa_3seater": return "0 0 175 80";
      case "sofa_l_shape": return "0 0 145 135";
      case "kitchen_sink_single": return "0 0 108 62";
      case "kitchen_sink_double": return "0 0 120 62";
      case "kitchen_slab_straight": return "0 0 165 56";
      case "kitchen_slab_l": return "0 0 145 135";
      case "kitchen_gas_stove": return "0 0 88 60";
      case "dining_4seater": return "20 0 90 90";
      case "dining_6seater": return "20 0 125 92";
      case "toilet_commode": return "6 0 58 74";
      case "wash_basin": return "0 0 72 62";
      default: return "0 0 100 100";
    }
  };

  return (
    <svg
      viewBox={getViewBox()}
      className={`w-full h-full overflow-visible select-none pointer-events-none ${className}`}
      style={{
        transform: `rotate(${symbol.rotation || 0}deg) scale(${symbol.scale || 1}) ${symbol.flipV ? "scaleY(-1)" : ""}`
      }}
    >
      {renderSymbolGraphic()}

      {/* Symbol Label (e.g. D1, D2, Bed) */}
      {symbol.label && (
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#1e293b"
          fontSize="9"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          className="pointer-events-none"
        >
          {symbol.label}
        </text>
      )}
    </svg>
  );
};
