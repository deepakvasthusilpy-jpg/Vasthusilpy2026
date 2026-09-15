import React, { useState, useEffect } from "react";
import {
  MasterWorkItem,
  MasterSubItem,
  WorkItemCategory,
  WORK_ITEM_CATEGORIES,
  loadMasterWorkItems,
  convertMasterToEstimateItems
} from "../../../data/itemsOfWorkData";
import { EstimateItem } from "../../../data/estimateData";
import {
  Search,
  Plus,
  Layers,
  Check,
  X,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Building,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface ItemOfWorkSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncludeItems: (newItems: EstimateItem[]) => void;
  floorTitle: string;
  nextSlNo: number;
}

export function ItemOfWorkSearchModal({
  isOpen,
  onClose,
  onIncludeItems,
  floorTitle,
  nextSlNo
}: ItemOfWorkSearchModalProps) {
  const [masterItems, setMasterItems] = useState<MasterWorkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      const items = loadMasterWorkItems();
      setMasterItems(items);
      const exp: Record<string, boolean> = {};
      items.forEach((i) => {
        if (i.hasSubItems) exp[i.id] = true;
      });
      setExpandedIds(exp);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredItems = masterItems.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchCode = item.itemCode?.toLowerCase().includes(q) || false;
    const matchParticulars = item.particulars.toLowerCase().includes(q);
    const matchCat = item.category.toLowerCase().includes(q);
    const matchSubs = item.subItems?.some((s) => s.particulars.toLowerCase().includes(q)) || false;

    return matchesCategory && (matchCode || matchParticulars || matchCat || matchSubs);
  });

  const handleIncludeSingleMaster = (masterItem: MasterWorkItem) => {
    const estimateItems = convertMasterToEstimateItems(masterItem, nextSlNo);
    onIncludeItems(estimateItems);
    onClose();
  };

  const handleIncludeSubItemOnly = (parent: MasterWorkItem, sub: MasterSubItem) => {
    const rate = Number(parent.rate) || 0;
    const nos = Number(sub.nos) || 0;
    const l = Number(sub.length) || 0;
    const b = Number(sub.breadth) || 0;
    const d = Number(sub.depth) || 0;
    const effectiveNos = nos > 0 ? nos : (l > 0 || b > 0 || d > 0 ? 1 : 0);

    let qty = Number(sub.quantity) || 0;
    if (l > 0 && b > 0 && d > 0) {
      qty = Number((effectiveNos * l * b * d).toFixed(4));
    } else if (l > 0 && b > 0) {
      qty = Number((effectiveNos * l * b).toFixed(4));
    } else if (l > 0) {
      qty = Number((effectiveNos * l).toFixed(4));
    } else if (nos > 0) {
      qty = nos;
    }

    const singleEstimateItem: EstimateItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      slNo: `${nextSlNo}`,
      particulars: `${parent.itemCode ? `[${parent.itemCode}] ` : ""}${sub.particulars}`,
      nos: nos,
      length: l,
      breadth: b,
      depth: d,
      quantity: qty,
      unit: sub.unit || parent.unit || "cum",
      rate: rate,
      amount: Math.round(qty * rate),
      remarks: sub.remarks || "",
      isSubItem: false
    };
    onIncludeItems([singleEstimateItem]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase">
                SEARCH MASTER LIBRARY
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Target: {floorTitle || "Current Floor"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Search Items of Work & Add to Floor</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search master items (e.g. Earthwork excavation, RCC beam, Plastering, Brickwork, Doors...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 pl-10 pr-10 py-2.5 rounded-xl text-xs font-sans text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categories Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              All Categories ({masterItems.length})
            </button>
            {WORK_ITEM_CATEGORIES.map((cat) => {
              const count = masterItems.filter((i) => i.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 divide-y divide-slate-800/60">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <p className="text-sm font-semibold">No items matching your search</p>
              <p className="text-xs">Try searching for concrete, excavation, masonry, plaster, etc.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExp = expandedIds[item.id] !== false;
              return (
                <div key={item.id} className="pt-3 first:pt-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.itemCode && (
                          <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded">
                            {item.itemCode}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.hasSubItems && (
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950 border border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {item.subItems.length} Sub-Items
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-200 leading-snug">
                        {item.particulars}
                      </div>

                      {/* Values badge / summary */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-0.5">
                        {item.hasSubItems ? (
                          <span className="text-amber-400 font-bold">
                            Main item fields suppressed • {item.subItems.length} Sub-measurements
                          </span>
                        ) : (
                          <>
                            <span>Qty: <strong className="text-amber-400">{item.quantity} {item.unit}</strong></span>
                            <span>Rate: <strong className="text-emerald-400">₹{item.rate?.toLocaleString("en-IN")}</strong></span>
                          </>
                        )}
                        <span>Total Est: <strong className="text-white">₹{item.amount?.toLocaleString("en-IN")}</strong></span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      {item.hasSubItems && (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-xs flex items-center gap-1"
                        >
                          {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span className="text-[10px] font-mono">Breakdown</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleIncludeSingleMaster(item)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Include in Floor</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Items Expanded Preview */}
                  {item.hasSubItems && isExp && item.subItems && item.subItems.length > 0 && (
                    <div className="bg-slate-950/70 border border-indigo-950 rounded-xl p-2.5 ml-0 sm:ml-4 space-y-1.5">
                      <div className="text-[10px] font-mono text-indigo-300 uppercase font-bold flex items-center gap-1.5">
                        <CornerDownRight className="w-3 h-3 text-indigo-400" />
                        <span>Sub-items to be inserted under SL #{nextSlNo}:</span>
                      </div>

                      <div className="space-y-1">
                        {item.subItems.map((sub, sIdx) => {
                          const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
                          const letter = letters[sIdx % letters.length] || `${sIdx + 1}`;
                          return (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between gap-2 p-1.5 bg-slate-900/60 rounded-lg text-xs font-mono border border-slate-800/60 hover:border-slate-700 transition"
                            >
                              <div className="flex items-center gap-2 flex-1 truncate">
                                <span className="text-indigo-400 font-bold w-6">{nextSlNo}.{letter}</span>
                                <span className="text-slate-300 font-sans truncate text-xs">
                                  {sub.particulars}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 text-[11px]">
                                <span className="text-amber-400 font-bold">{sub.quantity} {sub.unit}</span>
                                <span className="text-slate-500 font-mono text-[10px]">(Rate on parent)</span>
                                <button
                                  onClick={() => handleIncludeSubItemOnly(item, sub)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-200 underline cursor-pointer"
                                  title="Add only this sub-item as a standalone item"
                                >
                                  Add Solo
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Click <strong className="text-emerald-400">Include in Floor</strong> to insert item & sub-items into this floor specification.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
