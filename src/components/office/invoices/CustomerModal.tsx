import React, { useState, useEffect } from "react";
import { Customer } from "../../../types";
import { X, User, MapPin, Phone, Mail, Building, FileText, Check } from "lucide-react";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSaveCustomer: (customer: Customer) => void;
  onChooseDifferentCustomer?: () => void;
  allCustomers?: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSaveCustomer,
  onChooseDifferentCustomer,
  allCustomers = [],
  onSelectCustomer
}) => {
  const [activeTab, setActiveTab] = useState<"Contact" | "Billing" | "Shipping" | "More">("Contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [houseName, setHouseName] = useState("");
  const [villagePanchayat, setVillagePanchayat] = useState("");
  const [district, setDistrict] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [isPickingExisting, setIsPickingExisting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setName(customerToEdit.name || "");
        setEmail(customerToEdit.email || "");
        setPhone(customerToEdit.phone || "");
        setContactPerson(customerToEdit.contactPerson || "");
        setAddressLine(customerToEdit.addressLine || "");
        setHouseName(customerToEdit.houseName || "");
        setVillagePanchayat(customerToEdit.villagePanchayat || "");
        setDistrict(customerToEdit.district || "");
        setGstNo(customerToEdit.gstNo || "");
      } else {
        setName("");
        setEmail("");
        setPhone("");
        setContactPerson("");
        setAddressLine("");
        setHouseName("");
        setVillagePanchayat("");
        setDistrict("Palakkad");
        setGstNo("");
      }
      setIsPickingExisting(false);
    }
  }, [isOpen, customerToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved: Customer = {
      id: customerToEdit?.id || `cust_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      addressLine: addressLine.trim() || undefined,
      houseName: houseName.trim() || undefined,
      villagePanchayat: villagePanchayat.trim() || undefined,
      district: district.trim() || "Palakkad",
      gstNo: gstNo.trim() || undefined
    };

    onSaveCustomer(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="invoice-modal-container bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">
            {customerToEdit ? `Edit ${customerToEdit.name}` : "Add a customer"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Customers Quick Picker Toggle */}
        {allCustomers.length > 0 && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
            <span className="text-slate-600 font-medium">
              {isPickingExisting ? "Select from saved directory:" : `Saved Customers (${allCustomers.length})`}
            </span>
            <button
              type="button"
              onClick={() => setIsPickingExisting(!isPickingExisting)}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline"
            >
              {isPickingExisting ? "Enter details manually" : "Choose existing customer"}
            </button>
          </div>
        )}

        {isPickingExisting ? (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {allCustomers.map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => {
                  if (onSelectCustomer) {
                    onSelectCustomer(cust);
                  } else {
                    setName(cust.name);
                    setPhone(cust.phone);
                    setEmail(cust.email || "");
                    setContactPerson(cust.contactPerson || "");
                    setAddressLine(cust.addressLine || "");
                    setHouseName(cust.houseName || "");
                    setVillagePanchayat(cust.villagePanchayat || "");
                    setDistrict(cust.district || "");
                    setGstNo(cust.gstNo || "");
                  }
                  setIsPickingExisting(false);
                }}
                className="w-full text-left p-3 hover:bg-blue-50/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {cust.phone} {cust.contactPerson ? `• ${cust.contactPerson}` : ""} {cust.addressLine || cust.villagePanchayat ? `• ${cust.addressLine || cust.villagePanchayat}` : ""}
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  Select
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Tabs matching Reference Screenshot 5 */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {(["Contact", "Billing", "Shipping", "More"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {customerToEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-slate-700">
                You're making changes to <strong className="text-slate-900">{customerToEdit.name}</strong>. If this invoice is for a different customer, then{" "}
                <button
                  type="button"
                  onClick={() => {
                    if (onChooseDifferentCustomer) onChooseDifferentCustomer();
                    setIsPickingExisting(true);
                  }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Choose a different customer
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {activeTab === "Contact" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABDUL MAJEED P"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-blue-400 focus:border-blue-600 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="client@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9495229693"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Person / House Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BISMILLAH"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Address / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KOTTAKUNNU , MANNUR"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === "Billing" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      House / Building Name
                    </label>
                    <input
                      type="text"
                      placeholder="House Name / Building"
                      value={houseName}
                      onChange={(e) => setHouseName(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Village / Panchayath
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Keralassery, Mannur"
                      value={villagePanchayat}
                      onChange={(e) => setVillagePanchayat(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      District / State
                    </label>
                    <input
                      type="text"
                      placeholder="Palakkad, Kerala"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="32AAAAA0000A1Z5"
                      value={gstNo}
                      onChange={(e) => setGstNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              {activeTab === "Shipping" && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
                  <div className="font-semibold text-slate-800">Project / Site Delivery Location</div>
                  <p>
                    By default, Architectural drawings, KSMART permit copies, and survey certificates are delivered to the registered client address or site location: <strong>{addressLine || villagePanchayat || "Mannur / Keralassery"}</strong>.
                  </p>
                </div>
              )}

              {activeTab === "More" && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <div>Customer ID: <code className="font-mono text-blue-600">{customerToEdit?.id || "Auto-generated"}</code></div>
                    <div className="mt-1">All invoices, proposals, and CRM project records linked to this customer will synchronize automatically across Vasthusilpy.</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-full text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-xs shadow-md shadow-blue-500/20 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
