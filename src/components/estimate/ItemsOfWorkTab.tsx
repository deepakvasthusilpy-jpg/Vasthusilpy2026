import React, { useState, useEffect } from "react";
import {
  MasterWorkItem,
  MasterSubItem,
  WorkItemCategory,
  WORK_ITEM_CATEGORIES,
  loadMasterWorkItems,
  saveMasterWorkItems,
  recalculateMasterItem,
  deleteMasterWorkItem,
  clearAllMasterWorkItems,
  STANDARD_KERALA_WORK_ITEMS
} from "../../data/itemsOfWorkData";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CornerDownRight,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Filter,
  PackagePlus,
  HelpCircle,
  Info,
  AlertTriangle,
  Download,
  Minus
} from "lucide-react";

export function ItemsOfWorkTab() {
  const [masterItems, setMasterItems] = useState<MasterWorkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterWorkItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Sub-item Quick Modal
  const [isSubItemModalOpen, setIsSubItemModalOpen] = useState(false);
  const [parentItemForSub, setParentItemForSub] = useState<MasterWorkItem | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<MasterSubItem | null>(null);
  const [subItemIndex, setSubItemIndex] = useState<number>(-1);

  // In-App Confirmation Modals (Replacing blocked window.confirm)
  const [itemToDelete, setItemToDelete] = useState<MasterWorkItem | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isImportStandardsModalOpen, setIsImportStandardsModalOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load items on mount & listen for storage events
  useEffect(() => {
    const loadItems = () => {
      const loaded = loadMasterWorkItems();
      setMasterItems(loaded);
      const initialExpanded: Record<string, boolean> = {};
      loaded.forEach((it) => {
        if (it.hasSubItems) initialExpanded[it.id] = true;
      });
      setExpandedItemIds(initialExpanded);
    };

    loadItems();

    window.addEventListener("vasthusilpy_items_of_work_updated", loadItems);
    return () => {
      window.removeEventListener("vasthusilpy_items_of_work_updated", loadItems);
    };
  }, []);

  const handleSaveItems = (items: MasterWorkItem[]) => {
    setMasterItems(items);
    saveMasterWorkItems(items);
  };

  const handleConfirmImportStandards = () => {
    handleSaveItems(STANDARD_KERALA_WORK_ITEMS);
    setIsImportStandardsModalOpen(false);
    showToast("Standard Kerala PWD / DSR Catalog imported successfully!");
  };

  const handleConfirmClearAll = () => {
    clearAllMasterWorkItems();
    setMasterItems([]);
    setIsClearAllModalOpen(false);
    showToast("All items of work removed.");
  };

  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Trigger Master Item Deletion Modal
  const requestDeleteMasterItem = (item: MasterWorkItem) => {
    setItemToDelete(item);
  };

  // Confirm Single Item Deletion
  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    const updated = masterItems.filter((i) => i.id !== itemToDelete.id);
    handleSaveItems(updated);
    setItemToDelete(null);
    showToast("Item of work deleted.");
  };

  // Duplicate Item
  const handleDuplicateMasterItem = (item: MasterWorkItem) => {
    const cloned: MasterWorkItem = {
      ...item,
      id: `mwi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemCode: item.itemCode ? `${item.itemCode}-COPY` : undefined,
      particulars: `${item.particulars} (Copy)`,
      subItems: item.subItems
        ? item.subItems.map((s, idx) => ({
            ...s,
            id: `sub_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`
          }))
        : []
    };
    const itemIndex = masterItems.findIndex((i) => i.id === item.id);
    const updated = [...masterItems];
    if (itemIndex >= 0) {
      updated.splice(itemIndex + 1, 0, cloned);
    } else {
      updated.push(cloned);
    }
    handleSaveItems(updated);
    showToast("Master item duplicated!");
  };

  // Delete Sub-Item Directly
  const handleDeleteSubItem = (parentId: string, subIdx: number) => {
    const target = masterItems.find((i) => i.id === parentId);
    if (!target) return;

    const newSubItems = (target.subItems || []).filter((_, idx) => idx !== subIdx);
    const updatedItem: MasterWorkItem = {
      ...target,
      hasSubItems: newSubItems.length > 0,
      subItems: newSubItems
    };

    const recalculated = recalculateMasterItem(updatedItem);
    const updatedAll = masterItems.map((it) => (it.id === parentId ? recalculated : it));
    handleSaveItems(updatedAll);
    showToast("Sub-item deleted.");
  };

  // Filter Items
  const filteredItems = masterItems.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchCode = item.itemCode?.toLowerCase().includes(q) || false;
    const matchParticulars = item.particulars.toLowerCase().includes(q);
    const matchCategoryText = item.category.toLowerCase().includes(q);
    const matchSubItems = item.subItems?.some((s) => s.particulars.toLowerCase().includes(q)) || false;

    return matchesCategory && (matchCode || matchParticulars || matchCategoryText || matchSubItems);
  });

  // Modal Open Handlers
  const openCreateModal = () => {
    const nextNumber = masterItems.length + 1;
    setEditingItem({
      id: `mwi_${Date.now()}`,
      itemCode: `CIV-${String(nextNumber).padStart(3, "0")}`,
      category: "Masonry & Walling",
      particulars: "",
      hasSubItems: false,
      nos: 1,
      length: 1,
      breadth: 1,
      depth: 1,
      quantity: 1,
      unit: "cum",
      rate: 1000,
      amount: 1000,
      subItems: []
    });
    setIsCreatingNew(true);
    setIsEditModalOpen(true);
  };

  const openEditModal = (item: MasterWorkItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setIsCreatingNew(false);
    setIsEditModalOpen(true);
  };

  const openAddSubItemModal = (parent: MasterWorkItem, isDeduction: boolean = false) => {
    setParentItemForSub(parent);
    setEditingSubItem({
      id: `sub_${Date.now()}`,
      particulars: isDeduction ? "↳ Deduct: Openings / Voids (e.g. Doors D1, Windows W1)..." : "",
      nos: isDeduction ? -1 : 1,
      length: 1,
      breadth: 1,
      depth: 1,
      quantity: isDeduction ? -1 : 1,
      unit: parent.unit || "cum",
      rate: 0,
      amount: 0,
      remarks: isDeduction ? "Deduction" : "Sub-item",
      isDeduction: isDeduction
    });
    setSubItemIndex(-1);
    setIsSubItemModalOpen(true);
  };

  const openEditSubItemModal = (parent: MasterWorkItem, sub: MasterSubItem, index: number) => {
    setParentItemForSub(parent);
    setEditingSubItem(JSON.parse(JSON.stringify(sub)));
    setSubItemIndex(index);
    setIsSubItemModalOpen(true);
  };

  const handleToggleSubItemDeduction = (parent: MasterWorkItem, subIndex: number) => {
    const subs = [...(parent.subItems || [])];
    if (subIndex < 0 || subIndex >= subs.length) return;
    const targetSub = { ...subs[subIndex] };
    const newIsDeduct = !targetSub.isDeduction;
    targetSub.isDeduction = newIsDeduct;
    if (newIsDeduct) {
      if (typeof targetSub.nos === "number" && targetSub.nos > 0) targetSub.nos = -targetSub.nos;
      if (typeof targetSub.quantity === "number" && targetSub.quantity > 0) targetSub.quantity = -targetSub.quantity;
    } else {
      if (typeof targetSub.nos === "number" && targetSub.nos < 0) targetSub.nos = Math.abs(targetSub.nos);
      if (typeof targetSub.quantity === "number" && targetSub.quantity < 0) targetSub.quantity = Math.abs(targetSub.quantity);
    }
    subs[subIndex] = targetSub;
    const updatedParent: MasterWorkItem = {
      ...parent,
      subItems: subs
    };
    const recalculated = recalculateMasterItem(updatedParent);
    const allUpdated = masterItems.map((it) => (it.id === recalculated.id ? recalculated : it));
    handleSaveItems(allUpdated);
    showToast(newIsDeduct ? "Sub-item marked as Deduction (-)" : "Sub-item marked as Addition (+)");
  };

  const handleToggleMasterItemDeduction = (item: MasterWorkItem) => {
    const updatedItem = {
      ...item,
      isDeduction: !item.isDeduction
    };
    const recalculated = recalculateMasterItem(updatedItem);
    const allUpdated = masterItems.map((it) => (it.id === recalculated.id ? recalculated : it));
    handleSaveItems(allUpdated);
    showToast(recalculated.isDeduction ? "Item marked as Deduction (-)" : "Item marked as Addition (+)");
  };

  // Save Modal Changes
  const handleSaveModalItem = (itemToSave: MasterWorkItem) => {
    if (!itemToSave.particulars.trim()) {
      showToast("Please enter a description for the item of work.");
      return;
    }

    const recalculated = recalculateMasterItem(itemToSave);
    let updated: MasterWorkItem[];
    if (isCreatingNew) {
      updated = [...masterItems, recalculated];
      showToast(`Master Item #${masterItems.length + 1} created successfully!`);
    } else {
      updated = masterItems.map((it) => (it.id === recalculated.id ? recalculated : it));
      showToast("Master Item updated!");
    }
    handleSaveItems(updated);
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Save Sub-Item Modal
  const handleSaveSubItemModal = (subItemToSave: MasterSubItem) => {
    if (!parentItemForSub) return;
    if (!subItemToSave.particulars.trim()) {
      showToast("Please enter sub-item particulars/description.");
      return;
    }

    const isDeduct = Boolean(
      subItemToSave.isDeduction ||
      (typeof subItemToSave.nos === "number" && subItemToSave.nos < 0) ||
      (typeof subItemToSave.particulars === "string" && /^\s*(-|deduct|subtraction|less)\b/i.test(subItemToSave.particulars))
    );

    const rawNos = Number(subItemToSave.nos) || 0;
    const l = Math.abs(Number(subItemToSave.length) || 0);
    const b = Math.abs(Number(subItemToSave.breadth) || 0);
    const d = Math.abs(Number(subItemToSave.depth) || 0);

    const nosMag = Math.abs(rawNos);
    const effectiveNosMag = nosMag > 0 ? nosMag : (l > 0 || b > 0 || d > 0 ? 1 : 0);
    const sign = isDeduct ? -1 : 1;

    let subQty = 0;
    if (l > 0 && b > 0 && d > 0) {
      subQty = effectiveNosMag * l * b * d;
    } else if (l > 0 && b > 0) {
      subQty = effectiveNosMag * l * b;
    } else if (l > 0) {
      subQty = effectiveNosMag * l;
    } else if (effectiveNosMag > 0) {
      subQty = effectiveNosMag;
    }

    const finalSub: MasterSubItem = {
      ...subItemToSave,
      isDeduction: isDeduct,
      nos: rawNos !== 0 ? (isDeduct ? -nosMag : nosMag) : 0,
      length: l,
      breadth: b,
      depth: d,
      quantity: Number((sign * subQty).toFixed(4)),
      rate: 0,
      amount: 0
    };

    let updatedSubItems = [...(parentItemForSub.subItems || [])];
    if (subItemIndex >= 0) {
      updatedSubItems[subItemIndex] = finalSub;
    } else {
      updatedSubItems.push(finalSub);
    }

    const updatedParent: MasterWorkItem = {
      ...parentItemForSub,
      hasSubItems: true,
      subItems: updatedSubItems
    };

    const recalculated = recalculateMasterItem(updatedParent);
    const allUpdated = masterItems.map((it) => (it.id === recalculated.id ? recalculated : it));
    handleSaveItems(allUpdated);

    // Auto expand parent
    setExpandedItemIds((prev) => ({ ...prev, [parentItemForSub.id]: true }));
    setIsSubItemModalOpen(false);
    setParentItemForSub(null);
    setEditingSubItem(null);
    showToast(subItemIndex >= 0 ? "Sub-item updated!" : "Sub-item added!");
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-mono font-bold animate-slideUp">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                ESTIMATE MASTER LIBRARY
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                Kerala PWD / DSR Specifications
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Layers className="w-7 h-7 text-indigo-400" />
              <span>ഐറ്റം ഓഫ് വർക്ക് ലൈബ്രറി (Items of Work Master)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Standard civil construction work specifications, measurement parameters, and hierarchical sub-items.
              If sub-items are added under a main item, measurements and unit rate are suppressed from the main item, and the total amount is automatically aggregated.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {masterItems.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="px-3.5 py-2.5 bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Delete all items of work"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete All Items</span>
              </button>
            )}

            <button
              onClick={() => setIsImportStandardsModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Import standard Kerala PWD / DSR specifications"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import PWD Standards</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Item of Work</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Total Items</div>
            <div className="text-lg font-black text-white font-mono">{masterItems.length}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <div className="text-[10px] font-mono text-indigo-400 uppercase">With Sub-Items</div>
            <div className="text-lg font-black text-indigo-300 font-mono">
              {masterItems.filter((i) => i.hasSubItems).length}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <div className="text-[10px] font-mono text-emerald-400 uppercase">Single Rate Items</div>
            <div className="text-lg font-black text-emerald-300 font-mono">
              {masterItems.filter((i) => !i.hasSubItems).length}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
            <div className="text-[10px] font-mono text-amber-400 uppercase">Total Sub-items</div>
            <div className="text-lg font-black text-amber-300 font-mono">
              {masterItems.reduce((acc, i) => acc + (i.subItems?.length || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code, keyword, concrete, brickwork, excavation, plastering..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 pl-10 pr-10 py-2.5 rounded-xl text-xs font-sans text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 shrink-0">
              Showing <span className="text-emerald-400 font-bold">{filteredItems.length}</span> of {masterItems.length} items
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800"
            }`}
          >
            All Categories ({masterItems.length})
          </button>
          {WORK_ITEM_CATEGORIES.map((cat) => {
            const count = masterItems.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                    : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Items Listing */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center mx-auto text-indigo-400">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">
                {masterItems.length === 0 ? "Items of Work Library is Empty" : "No matching items of work"}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {masterItems.length === 0
                  ? "Your items of work library is currently empty. You can create your own custom items of work or import standard Kerala PWD / DSR specifications."
                  : "No master items matched your active search and category filters."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Item of Work</span>
              </button>
              {masterItems.length === 0 && (
                <button
                  onClick={() => setIsImportStandardsModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Import Kerala PWD Standards</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isExpanded = expandedItemIds[item.id] !== false;
            const masterIdx = masterItems.findIndex((m) => m.id === item.id);
            const itemNumber = masterIdx >= 0 ? masterIdx + 1 : idx + 1;
            return (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg transition space-y-4"
              >
                {/* Item Header & Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-md">
                        #{itemNumber}
                      </span>
                      {item.itemCode && (
                        <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded-md">
                          {item.itemCode}
                        </span>
                      )}
                      <span className="text-[11px] font-mono font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      {item.isDeduction && (
                        <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/90 border border-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Minus className="w-3 h-3 text-rose-400" />
                          [-] DEDUCTION ITEM
                        </span>
                      )}
                      {item.hasSubItems ? (
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers className="w-3 h-3 text-amber-400" />
                          {item.subItems?.length || 0} Sub-Items Breakdown
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-md">
                          Direct Single Item
                        </span>
                      )}
                    </div>

                    {/* Main Description */}
                    <div className="text-sm font-semibold text-slate-100 leading-relaxed font-sans">
                      {item.particulars}
                    </div>

                    {item.remarks && (
                      <div className="text-xs font-mono text-slate-400">
                        <span className="text-slate-500">Note: </span>
                        {item.remarks}
                      </div>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        {item.hasSubItems ? "TOTAL AMOUNT (SUB-ITEMS SUM)" : "AMOUNT"}
                      </div>
                      <div className={`text-base sm:text-lg font-black font-mono ${item.amount < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        ₹{item.amount?.toLocaleString("en-IN") || 0}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                      {item.hasSubItems && (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          title={isExpanded ? "Collapse sub-items" : "Expand sub-items"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleMasterItemDeduction(item)}
                        className={`p-1.5 rounded-lg cursor-pointer transition ${
                          item.isDeduction
                            ? "bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900"
                            : "text-slate-400 hover:text-rose-300 hover:bg-rose-950/50"
                        }`}
                        title={item.isDeduction ? "Click to switch to Addition (+)" : "Click to mark as Deduction / Subtraction (-)"}
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openAddSubItemModal(item, false)}
                        className="p-1.5 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950 rounded-lg cursor-pointer"
                        title="Add Sub-item (+) under this main item"
                      >
                        <CornerDownRight className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openAddSubItemModal(item, true)}
                        className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950 rounded-lg cursor-pointer"
                        title="Add Deduction Sub-item (-) for doors/windows/openings"
                      >
                        <span className="text-[10px] font-bold font-mono">-↳</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateMasterItem(item)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Duplicate item"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Edit master item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Button with in-app confirmation modal */}
                      <button
                        onClick={() => requestDeleteMasterItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg cursor-pointer transition"
                        title="Delete item of work"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Measurements Specification Row / Table */}
                {item.hasSubItems ? (
                  <div className="space-y-2 border-t border-slate-800/80 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 font-bold">
                        <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Sub-Items Measurement Breakdown</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          (Main item parameters suppressed as per specifications)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAddSubItemModal(item, false)}
                          className="text-[11px] font-mono text-indigo-400 hover:text-indigo-200 underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Sub-Item (+)</span>
                        </button>
                        <button
                          onClick={() => openAddSubItemModal(item, true)}
                          className="text-[11px] font-mono text-rose-400 hover:text-rose-200 underline flex items-center gap-1 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                          <span>Add Deduction (-)</span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-Items Table */}
                    {isExpanded && item.subItems && item.subItems.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-indigo-950/60 bg-slate-950/70">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-indigo-950/40 text-indigo-300 text-[10px] uppercase border-b border-indigo-900/40">
                            <tr>
                              <th className="p-2 w-10 text-center">SUB</th>
                              <th className="p-2 min-w-[220px]">PARTICULARS / LOCATION</th>
                              <th className="p-2 w-12 text-center">NOS</th>
                              <th className="p-2 w-16 text-right">L (m)</th>
                              <th className="p-2 w-16 text-right">B (m)</th>
                              <th className="p-2 w-16 text-right">D (m)</th>
                              <th className="p-2 w-20 text-right font-bold text-amber-400">QTY</th>
                              <th className="p-2 w-16 text-center">UNIT</th>
                              <th className="p-2 w-20 text-right">RATE (₹)</th>
                              <th className="p-2 w-24 text-right font-bold text-emerald-400">AMOUNT</th>
                              <th className="p-2 w-16 text-center">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-950/40">
                            {item.subItems.map((sub, sIdx) => {
                              const subLetters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
                              const subLabel = subLetters[sIdx % subLetters.length] || `${sIdx + 1}`;
                              const isSubDeduct = sub.isDeduction || sub.quantity < 0;
                              return (
                                <tr
                                  key={sub.id}
                                  className={`transition ${
                                    isSubDeduct
                                      ? "bg-rose-950/20 hover:bg-rose-950/35 border-l-2 border-rose-500"
                                      : "hover:bg-indigo-950/20"
                                  }`}
                                >
                                  <td className={`p-2 text-center font-bold ${isSubDeduct ? "text-rose-400" : "text-indigo-400"}`}>
                                    {subLabel}
                                  </td>
                                  <td className="p-2 font-sans font-medium text-slate-200">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {isSubDeduct && (
                                        <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-mono font-bold">
                                          [-] DEDUCT
                                        </span>
                                      )}
                                      <span>{sub.particulars}</span>
                                      {sub.remarks && (
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          ({sub.remarks})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className={`p-2 text-center ${isSubDeduct ? "text-rose-300 font-bold" : "text-slate-300"}`}>
                                    {sub.nos !== undefined && sub.nos !== null ? sub.nos : "—"}
                                  </td>
                                  <td className="p-2 text-right text-slate-300">{sub.length || "—"}</td>
                                  <td className="p-2 text-right text-slate-300">{sub.breadth || "—"}</td>
                                  <td className="p-2 text-right text-slate-300">{sub.depth || "—"}</td>
                                  <td className={`p-2 text-right font-bold ${isSubDeduct ? "text-rose-400" : "text-amber-400"}`}>
                                    {sub.quantity}
                                  </td>
                                  <td className="p-2 text-center text-slate-300">{sub.unit}</td>
                                  <td className="p-2 text-right text-slate-500 font-mono text-xs">
                                    —
                                  </td>
                                  <td className="p-2 text-right text-slate-500 font-mono text-xs">
                                    —
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleToggleSubItemDeduction(item, sIdx)}
                                        className={`p-1 rounded cursor-pointer transition ${
                                          isSubDeduct
                                            ? "text-rose-300 hover:bg-rose-900/60"
                                            : "text-slate-400 hover:text-rose-300 hover:bg-rose-950/40"
                                        }`}
                                        title={isSubDeduct ? "Click to switch to Addition (+)" : "Click to switch to Deduction (-)"}
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => openEditSubItemModal(item, sub, sIdx)}
                                        className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                                        title="Edit sub-item"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubItem(item.id, sIdx)}
                                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer transition"
                                        title="Delete sub-item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single Item Parameters Box */
                  <div className="border-t border-slate-800/80 pt-3">
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 grid grid-cols-3 sm:grid-cols-7 gap-2 text-center font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">NOS</div>
                        <div className="text-xs font-bold text-slate-200">{item.nos || "1"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">L (m)</div>
                        <div className="text-xs font-bold text-slate-200">{item.length || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">B (m)</div>
                        <div className="text-xs font-bold text-slate-200">{item.breadth || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">D (m)</div>
                        <div className="text-xs font-bold text-slate-200">{item.depth || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-500 uppercase">QTY</div>
                        <div className="text-xs font-black text-amber-400">{item.quantity}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">UNIT</div>
                        <div className="text-xs font-bold text-slate-300">{item.unit}</div>
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <div className="text-[10px] text-emerald-500 uppercase">RATE (₹)</div>
                        <div className="text-xs font-black text-emerald-400">
                          ₹{item.rate?.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ====================================================================================================
          SINGLE ITEM DELETE CONFIRMATION MODAL
         ==================================================================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950/80 text-rose-400 rounded-2xl border border-rose-800/80">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Item of Work</h3>
                <p className="text-xs text-slate-400">This action will remove the item from library.</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5 font-sans">
              <div className="text-xs font-mono text-indigo-300 font-bold">{itemToDelete.itemCode || "NO CODE"}</div>
              <div className="text-xs font-medium text-slate-200 line-clamp-3">{itemToDelete.particulars}</div>
              <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                Category: {itemToDelete.category} {itemToDelete.hasSubItems ? `(${itemToDelete.subItems?.length || 0} sub-items)` : ""}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================================
          CLEAR ALL ITEMS CONFIRMATION MODAL
         ==================================================================================================== */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950/80 text-rose-400 rounded-2xl border border-rose-800/80">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Items of Work?</h3>
                <p className="text-xs text-slate-400">All {masterItems.length} items will be deleted.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              This will remove all master items of work from your library. You can always import the Kerala PWD standard catalog later or add your own custom items.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================================
          IMPORT STANDARDS CONFIRMATION MODAL
         ==================================================================================================== */}
      {isImportStandardsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-950/80 text-indigo-400 rounded-2xl border border-indigo-800/80">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Import Kerala PWD Catalog?</h3>
                <p className="text-xs text-slate-400">Standard Civil work specifications & sub-items</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              This will load standard Kerala PWD / DSR work specifications (Excavation, PCC 1:4:8, RR Masonry, Brickwork, RCC, Plastering, Woodwork, Painting, and Plumbing).
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsImportStandardsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImportStandards}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-900/40 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Import Standards</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================================
          CREATE / EDIT MASTER WORK ITEM MODAL
         ==================================================================================================== */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-800">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isCreatingNew ? "Create Master Item of Work" : "Edit Master Item of Work"}
                  </h3>
                  <p className="text-xs text-slate-400">Standard Civil work specification parameters</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans">
              {/* Category & Item Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-bold uppercase">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, category: e.target.value as WorkItemCategory })
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    {WORK_ITEM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 font-bold uppercase">Item Code / DSR Code</label>
                  <input
                    type="text"
                    value={editingItem.itemCode || ""}
                    placeholder="e.g. CIV-EXC-01 / DSR-2.8"
                    onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Particulars of Work */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase">
                  Particulars of Work Specification *
                </label>
                <textarea
                  rows={3}
                  value={editingItem.particulars}
                  placeholder="Full engineering description of work, materials, mix proportions, scaffolding, curing..."
                  onChange={(e) => setEditingItem({ ...editingItem, particulars: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-y leading-relaxed font-sans"
                />
              </div>

              {/* Remarks / Tag */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase">Short Note / Remarks</label>
                <input
                  type="text"
                  value={editingItem.remarks || ""}
                  placeholder="e.g. Foundation Excavation, 1:4:8 Bed Concrete"
                  onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Structure Selection: Single vs Sub-Items */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Item Structure Type</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, hasSubItems: false })}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                      !editingItem.hasSubItems
                        ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold font-mono text-cyan-300">Direct Single Rate Item</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Direct measurements (NOS, L, B, D) and unit rate specified on the item itself.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, hasSubItems: true })}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                      editingItem.hasSubItems
                        ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold font-mono text-amber-300">Sub-Items Breakdown</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Item contains sub-measurements (Long walls, short walls, steps, etc.). Main item fields suppressed.
                    </div>
                  </button>
                </div>
              </div>

              {/* Direct Parameters Form if NOT Sub-Items */}
              {!editingItem.hasSubItems ? (
                <div className={`space-y-3 p-4 rounded-2xl border ${
                  editingItem.isDeduction ? "bg-rose-950/20 border-rose-900/60" : "bg-slate-950 border-slate-800"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Direct Measurement & Rate Values
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentNos = editingItem.nos !== undefined ? Math.abs(editingItem.nos) : 1;
                          setEditingItem({ ...editingItem, isDeduction: false, nos: currentNos });
                        }}
                        className={`py-1 px-2.5 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition ${
                          !editingItem.isDeduction
                            ? "bg-indigo-950 text-indigo-200 border-indigo-600 shadow-sm"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <Plus className="w-3 h-3 text-indigo-400" />
                        <span>Addition (+)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentNos = editingItem.nos !== undefined ? -Math.abs(editingItem.nos || 1) : -1;
                          setEditingItem({ ...editingItem, isDeduction: true, nos: currentNos });
                        }}
                        className={`py-1 px-2.5 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition ${
                          editingItem.isDeduction
                            ? "bg-rose-950 text-rose-200 border-rose-600 shadow-sm"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <Minus className="w-3 h-3 text-rose-400" />
                        <span>Deduction (-)</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className={`text-[10px] font-mono uppercase font-bold ${editingItem.isDeduction ? "text-rose-400" : "text-slate-400"}`}>
                        NOS {editingItem.isDeduction ? "(-)" : "(+)"}
                      </label>
                      <input
                        type="number"
                        value={editingItem.nos !== undefined ? editingItem.nos : (editingItem.isDeduction ? -1 : 1)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditingItem({ ...editingItem, nos: val, isDeduction: val < 0 || editingItem.isDeduction });
                        }}
                        className={`w-full border p-2 rounded-lg text-xs font-mono font-bold text-center ${
                          editingItem.isDeduction
                            ? "bg-rose-950 text-rose-200 border-rose-800"
                            : "bg-slate-900 text-slate-100 border-slate-800"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">L (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingItem.length || 0}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, length: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono text-slate-100 text-right"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">B (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingItem.breadth || 0}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, breadth: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono text-slate-100 text-right"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">D (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingItem.depth || 0}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, depth: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono text-slate-100 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Unit</label>
                      <input
                        type="text"
                        value={editingItem.unit || "cum"}
                        placeholder="e.g. cum, sqm, kg, l/s, nos"
                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono text-slate-100 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Rate (₹)</label>
                      <input
                        type="number"
                        value={editingItem.rate || 0}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, rate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono text-emerald-400 font-bold text-right"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Total Quantity</label>
                      <input
                        type="number"
                        step="0.001"
                        value={editingItem.quantity || 0}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs font-mono text-amber-400 font-bold text-right"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-950/30 border border-indigo-900/60 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 font-bold">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Sub-Items Breakdown Mode Active</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Main item fields (NOS, L, B, D, QTY, UNIT, RATE) will remain blank/suppressed. You can add and manage constituent sub-items after creating this item or using the Sub-Item button.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer with Delete Button */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950">
              <div>
                {!isCreatingNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      requestDeleteMasterItem(editingItem);
                    }}
                    className="px-3.5 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Item</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveModalItem(editingItem)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-900/40"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Item of Work</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================================
          ADD / EDIT SUB-ITEM QUICK MODAL
         ==================================================================================================== */}
      {isSubItemModalOpen && editingSubItem && parentItemForSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl animate-scaleUp overflow-hidden">
            {/* Sub-item Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-indigo-950/40">
              <div className="flex items-center gap-2">
                <CornerDownRight className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {subItemIndex >= 0 ? "Edit Sub-Item" : "Add Sub-Item"}
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono truncate max-w-md">
                    Parent: {parentItemForSub.particulars}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubItemModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-item Form Body */}
            <div className="p-6 space-y-4 font-sans text-xs">
              {/* Type Selection: Normal Addition (+) vs Deduction (-) */}
              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 font-bold uppercase">Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentNos = editingSubItem.nos !== undefined ? Math.abs(editingSubItem.nos) : 1;
                      setEditingSubItem({ ...editingSubItem, isDeduction: false, nos: currentNos });
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      !editingSubItem.isDeduction
                        ? "bg-indigo-950 text-indigo-200 border-indigo-600 shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Addition (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentNos = editingSubItem.nos !== undefined ? -Math.abs(editingSubItem.nos || 1) : -1;
                      setEditingSubItem({ ...editingSubItem, isDeduction: true, nos: currentNos });
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      editingSubItem.isDeduction
                        ? "bg-rose-950 text-rose-200 border-rose-600 shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5 text-rose-400" />
                    <span>Deduction (-)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 font-bold uppercase">
                  Sub-Item Description / Measurement Location *
                </label>
                <input
                  type="text"
                  value={editingSubItem.particulars}
                  placeholder={editingSubItem.isDeduction ? "e.g. Deduct Door Opening D1 (1 x 1.2m x 2.1m)" : "e.g. Long wall foundation excavation (2 x 24.5m x 0.9m x 0.8m)"}
                  onChange={(e) => setEditingSubItem({ ...editingSubItem, particulars: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Dimensions (NOS, L, B, D) */}
              <div className={`grid grid-cols-4 gap-2 p-3 rounded-xl border font-mono ${
                editingSubItem.isDeduction ? "bg-rose-950/20 border-rose-900/60" : "bg-slate-950 border-slate-800"
              }`}>
                <div>
                  <label className={`text-[10px] uppercase font-bold ${editingSubItem.isDeduction ? "text-rose-400" : "text-slate-400"}`}>
                    NOS {editingSubItem.isDeduction ? "(-)" : "(+)"}
                  </label>
                  <input
                    type="number"
                    value={editingSubItem.nos !== undefined ? editingSubItem.nos : (editingSubItem.isDeduction ? -1 : 1)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditingSubItem({ ...editingSubItem, nos: val, isDeduction: val < 0 || editingSubItem.isDeduction });
                    }}
                    className={`w-full border p-1.5 rounded text-center font-bold ${
                      editingSubItem.isDeduction
                        ? "bg-rose-950 text-rose-200 border-rose-800"
                        : "bg-slate-900 text-slate-100 border-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">L (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSubItem.length || 0}
                    onChange={(e) =>
                      setEditingSubItem({ ...editingSubItem, length: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-right text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">B (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSubItem.breadth || 0}
                    onChange={(e) =>
                      setEditingSubItem({ ...editingSubItem, breadth: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-right text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">D (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSubItem.depth || 0}
                    onChange={(e) =>
                      setEditingSubItem({ ...editingSubItem, depth: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-right text-slate-100"
                  />
                </div>
              </div>

              {/* Unit & Information */}
              <div className="space-y-3 font-mono">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Unit</label>
                  <input
                    type="text"
                    value={editingSubItem.unit || "cum"}
                    onChange={(e) => setEditingSubItem({ ...editingSubItem, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-center text-slate-100"
                  />
                </div>
                <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-2.5 text-[11px] text-indigo-300 font-sans">
                  ℹ️ <strong>Quantity Rule:</strong> Sub-items contain measurement parameters (NOS, L, B, D) and calculated quantity only. Sub-items cannot have rate. The sum of all sub-item quantities forms the quantity of the main item, where the unit rate and amount are defined.
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="font-mono text-slate-400 uppercase text-[10px]">Remarks / Note</label>
                <input
                  type="text"
                  value={editingSubItem.remarks || ""}
                  placeholder="e.g. Long walls, Foundation footing"
                  onChange={(e) => setEditingSubItem({ ...editingSubItem, remarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-slate-300 font-sans"
                />
              </div>
            </div>

            {/* Sub-item Modal Footer with Delete Option */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950">
              <div>
                {subItemIndex >= 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteSubItem(parentItemForSub.id, subItemIndex);
                      setIsSubItemModalOpen(false);
                    }}
                    className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Sub-Item</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubItemModal(editingSubItem)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-900/40"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Sub-Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
