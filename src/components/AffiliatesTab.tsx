import React, { useState, useEffect } from "react";
import { ExternalLink, Plus, Trash2, Edit2, Check, X, Shield, Landmark } from "lucide-react";

export interface Affiliate {
  id: string;
  name: string;
  url: string;
  discountCode: string;
  receivesMoney: boolean;
}

const DEFAULT_AFFILIATES: Affiliate[] = [
  {
    id: "1",
    name: "Zatu Games",
    url: "https://www.board-game.co.uk",
    discountCode: "ITS_YOUR_TURN_5",
    receivesMoney: true,
  },
  {
    id: "2",
    name: "Amazon Affiliate",
    url: "https://www.amazon.co.uk",
    discountCode: "Applied via URL",
    receivesMoney: true,
  },
  {
    id: "3",
    name: "Rules of Play",
    url: "https://rulesofplay.co.uk",
    discountCode: "PLAY10",
    receivesMoney: false,
  },
  {
    id: "4",
    name: "Kienda Board Games",
    url: "https://kienda.co.uk",
    discountCode: "YOURTURN",
    receivesMoney: true,
  },
  {
    id: "5",
    name: "Element Games",
    url: "https://elementgames.co.uk",
    discountCode: "ITY5",
    receivesMoney: true,
  },
];

interface AffiliatesTabProps {
  isAdminUnlocked: boolean;
  adminPasscode?: string;
}

export default function AffiliatesTab({ isAdminUnlocked, adminPasscode = "" }: AffiliatesTabProps) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>(() => {
    const saved = localStorage.getItem("iy_affiliates");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse affiliates:", e);
      }
    }
    return DEFAULT_AFFILIATES;
  });

  // Fetch affiliates from server on mount
  useEffect(() => {
    fetch("/api/affiliates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.affiliates) {
          setAffiliates(data.affiliates);
          localStorage.setItem("iy_affiliates", JSON.stringify(data.affiliates));
        }
      })
      .catch((err) => console.error("Failed to load affiliates from server:", err));
  }, []);

  // State for adding a new affiliate
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [newReceivesMoney, setNewReceivesMoney] = useState(false);

  // State for editing an affiliate
  const [editingId, setEditingId] = useState<string | null>(null);
  const [affiliateIdToConfirmDelete, setAffiliateIdToConfirmDelete] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDiscountCode, setEditDiscountCode] = useState("");
  const [editReceivesMoney, setEditReceivesMoney] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newAff = {
      name: newName.trim(),
      url: formattedUrl,
      discountCode: newDiscountCode.trim() || "N/A",
      receivesMoney: newReceivesMoney,
    };

    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: adminPasscode,
          affiliate: newAff,
        }),
      });
      const data = await res.json();
      if (data.success && data.affiliates) {
        setAffiliates(data.affiliates);
        localStorage.setItem("iy_affiliates", JSON.stringify(data.affiliates));
      } else {
        throw new Error(data.error || "Failed to add affiliate on server");
      }
    } catch (err) {
      console.error("Failed to add affiliate on server, falling back to local storage:", err);
      const fallbackAff: Affiliate = {
        ...newAff,
        id: Date.now().toString(),
      };
      const updated = [...affiliates, fallbackAff];
      setAffiliates(updated);
      localStorage.setItem("iy_affiliates", JSON.stringify(updated));
    }

    // Reset inputs
    setNewName("");
    setNewUrl("");
    setNewDiscountCode("");
    setNewReceivesMoney(false);
    setIsAdding(false);
  };

  const handleStartEdit = (aff: Affiliate) => {
    setEditingId(aff.id);
    setEditName(aff.name);
    setEditUrl(aff.url);
    setEditDiscountCode(aff.discountCode);
    setEditReceivesMoney(aff.receivesMoney);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !editUrl.trim()) return;

    let formattedUrl = editUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const updatedAff = {
      name: editName.trim(),
      url: formattedUrl,
      discountCode: editDiscountCode.trim() || "N/A",
      receivesMoney: editReceivesMoney,
    };

    try {
      const res = await fetch(`/api/affiliates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: adminPasscode,
          affiliate: updatedAff,
        }),
      });
      const data = await res.json();
      if (data.success && data.affiliates) {
        setAffiliates(data.affiliates);
        localStorage.setItem("iy_affiliates", JSON.stringify(data.affiliates));
      } else {
        throw new Error(data.error || "Failed to update affiliate on server");
      }
    } catch (err) {
      console.error("Failed to update affiliate on server, falling back to local storage:", err);
      const updated = affiliates.map((aff) => {
        if (aff.id === id) {
          return {
            ...aff,
            name: editName.trim(),
            url: formattedUrl,
            discountCode: editDiscountCode.trim() || "N/A",
            receivesMoney: editReceivesMoney,
          };
        }
        return aff;
      });
      setAffiliates(updated);
      localStorage.setItem("iy_affiliates", JSON.stringify(updated));
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/affiliates/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: adminPasscode,
        }),
      });
      const data = await res.json();
      if (data.success && data.affiliates) {
        setAffiliates(data.affiliates);
        localStorage.setItem("iy_affiliates", JSON.stringify(data.affiliates));
      } else {
        throw new Error(data.error || "Failed to delete affiliate on server");
      }
    } catch (err) {
      console.error("Failed to delete affiliate on server, falling back to local storage:", err);
      const updated = affiliates.filter((aff) => aff.id !== id);
      setAffiliates(updated);
      localStorage.setItem("iy_affiliates", JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto font-sans px-4 md:px-8 py-10 animate-fade-in">
      {/* Intro section */}
      <section className="bg-white border border-navy/10 p-6 md:p-10 space-y-6 shadow-xs">
        <div className="font-mono text-xs text-text-light tracking-widest uppercase flex items-center gap-2">
          <span>PARTNERSHIPS</span>
          <span>•</span>
          <span>Full Disclosure</span>
        </div>
        <h2 className="font-display text-3xl font-black text-navy leading-tight">
          Affiliates & Transparency
        </h2>
        <div className="text-sm md:text-base text-text-muted space-y-4 leading-relaxed">
          <p>
            Welcome to our <strong>Affiliates</strong> directory. Here at <em>ItsYourTurn.bg</em>, we value honest relationships with our readers. We only support and recommend retailers we actually purchase from and trust ourselves.
          </p>
          <p>
            In the spirit of complete, radical transparency, we want you to know exactly how each of these links behaves. Some of the links listed below earn us a small commission when you make a purchase, while others are purely local friendly game shops we want to promote without receiving a single penny.
          </p>
          <p>
            By using our affiliate links or discount codes, you directly help fund our content, hosting costs, and purchase of new games for review—at absolutely <strong>no extra cost to you</strong>. Thank you for supporting the page!
          </p>
        </div>

        {/* Highlight box */}
        <div className="border-l-4 border-amber bg-cream p-5 text-navy font-sans text-sm leading-relaxed rounded-sm flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Our Transparency Promise:</span>
            We will never write a positive review in exchange for money. All board game opinions are genuinely our own, rated purely on their spoon-theory accessibility and gameplay merits.
          </div>
        </div>
      </section>

      {/* Main Table section */}
      <section className="bg-white border border-navy/10 p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-display text-xl font-black text-navy">Affiliates Directory</h3>
            <p className="text-xs text-text-light mt-1">Browse our verified partner links and special codes.</p>
          </div>
          {isAdminUnlocked && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber" />
              <span>Add Affiliate</span>
            </button>
          )}
        </div>

        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleAdd} className="bg-cream/20 border border-navy/10 p-4 space-y-4 rounded-sm">
            <h4 className="font-mono text-xs font-bold uppercase text-navy">Add New Affiliate</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Board Game Shop"
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-amber focus:outline-none bg-white"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">URL</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. www.store.com"
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-amber focus:outline-none bg-white"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">Discount Code</label>
                <input
                  type="text"
                  placeholder="e.g. ITSYOURTURN10"
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-amber focus:outline-none bg-white"
                  value={newDiscountCode}
                  onChange={(e) => setNewDiscountCode(e.target.value)}
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold uppercase text-navy select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-navy border-navy/20 rounded-sm focus:ring-0"
                    checked={newReceivesMoney}
                    onChange={(e) => setNewReceivesMoney(e.target.checked)}
                  />
                  <span>Commission Earned?</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="border border-navy/15 hover:bg-navy/5 text-navy font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm transition-all"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Responsive Affiliate Container */}
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto border border-navy/10 rounded-sm">
          <table className="w-full text-left border-collapse font-sans text-sm">
            <thead>
              <tr className="bg-navy text-white text-[10px] sm:text-xs font-mono uppercase tracking-wider">
                <th className="p-4 border-b border-navy/10 font-bold">Partner Name</th>
                <th className="p-4 border-b border-navy/10 font-bold">Discount Code</th>
                <th className="p-4 border-b border-navy/10 font-bold text-center">Commission Received?</th>
                <th className="p-4 border-b border-navy/10 font-bold text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5 text-navy">
              {affiliates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-light italic font-mono text-xs">
                    No affiliates registered yet.
                  </td>
                </tr>
              ) : (
                affiliates.map((aff) => {
                  const isEditing = editingId === aff.id;
                  return (
                    <tr key={aff.id} className="hover:bg-cream/10 transition-colors group">
                      {/* Name & Admin actions if isEditing */}
                      <td className="p-4 font-medium align-middle">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              className="w-full border border-navy/15 p-1 text-xs text-navy bg-white focus:outline-none focus:border-amber font-sans"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                            <input
                              type="text"
                              className="w-full border border-navy/15 p-1 text-xs text-navy bg-white focus:outline-none focus:border-amber font-sans"
                              placeholder="URL"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="font-display font-bold text-navy text-base">{aff.name}</span>
                            {isAdminUnlocked && (
                              <div className="flex gap-2.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleStartEdit(aff)}
                                  className="text-navy/50 hover:text-navy text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3 text-amber" /> Edit
                                </button>
                                {affiliateIdToConfirmDelete === aff.id ? (
                                  <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded-sm">
                                    <span className="text-[9px] font-mono text-red-700 font-bold px-0.5">Sure?</span>
                                    <button
                                      onClick={() => {
                                        handleDelete(aff.id);
                                        setAffiliateIdToConfirmDelete(null);
                                      }}
                                      className="bg-red-600 text-white font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-xs"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setAffiliateIdToConfirmDelete(null)}
                                      className="bg-white border border-navy/20 text-navy font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-xs"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setAffiliateIdToConfirmDelete(aff.id)}
                                    className="text-red-500 hover:text-red-700 text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Discount Code */}
                      <td className="p-4 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            className="w-full border border-navy/15 p-1 text-xs text-navy bg-white focus:outline-none focus:border-amber font-mono"
                            value={editDiscountCode}
                            onChange={(e) => setEditDiscountCode(e.target.value)}
                          />
                        ) : (
                          <span className="font-mono text-xs bg-cream/60 px-2.5 py-1.5 border border-navy/5 font-bold uppercase text-navy shadow-2xs rounded-sm">
                            {aff.discountCode}
                          </span>
                        )}
                      </td>

                      {/* Receive Money / Commission check status */}
                      <td className="p-4 text-center align-middle">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-mono select-none">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-navy rounded-sm"
                              checked={editReceivesMoney}
                              onChange={(e) => setEditReceivesMoney(e.target.checked)}
                            />
                            <span>Earns $?</span>
                          </label>
                        ) : (
                          <div className="flex items-center justify-center">
                            {aff.receivesMoney ? (
                              <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200/50 px-2.5 py-1 text-xs font-bold font-mono uppercase tracking-wide rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Yes
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-400 border border-gray-200 px-2.5 py-1 text-xs font-bold font-mono uppercase tracking-wide rounded-full">
                                No
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Direct Link button */}
                      <td className="p-4 text-right align-middle">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 border border-navy/15 hover:bg-navy/5 text-navy rounded-sm"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSaveEdit(aff.id)}
                              className="p-1 bg-navy hover:bg-navy-mid text-white rounded-sm"
                              title="Save"
                            >
                              <Check className="w-4 h-4 text-amber" />
                            </button>
                          </div>
                        ) : (
                          <a
                            href={aff.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-navy hover:bg-navy-mid text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm transition-all shadow-2xs hover:shadow-xs"
                          >
                            <span>Shop Site</span>
                            <ExternalLink className="w-3.5 h-3.5 text-amber" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {affiliates.length === 0 ? (
            <div className="p-8 text-center text-text-light italic font-mono text-xs bg-white border border-navy/10 rounded-sm">
              No affiliates registered yet.
            </div>
          ) : (
            affiliates.map((aff) => {
              const isEditing = editingId === aff.id;
              return (
                <div key={aff.id} className="bg-white border border-navy/10 p-5 rounded-sm space-y-4 shadow-2xs">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase text-navy font-bold">Partner Name</label>
                        <input
                          type="text"
                          className="w-full border border-navy/15 p-2 text-xs text-navy bg-white focus:outline-none focus:border-amber font-sans"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase text-navy font-bold">URL</label>
                        <input
                          type="text"
                          className="w-full border border-navy/15 p-2 text-xs text-navy bg-white focus:outline-none focus:border-amber font-sans"
                          placeholder="URL"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase text-navy font-bold">Discount Code</label>
                        <input
                          type="text"
                          className="w-full border border-navy/15 p-2 text-xs text-navy bg-white focus:outline-none focus:border-amber font-mono"
                          value={editDiscountCode}
                          onChange={(e) => setEditDiscountCode(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center pt-2">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-mono select-none">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-navy rounded-sm"
                            checked={editReceivesMoney}
                            onChange={(e) => setEditReceivesMoney(e.target.checked)}
                          />
                          <span>Commission Earned?</span>
                        </label>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-navy/5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="border border-navy/15 hover:bg-navy/5 text-navy font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(aff.id)}
                          className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-base text-navy truncate">{aff.name}</h4>
                          <span className="text-[10px] font-mono text-text-light break-all max-w-xs block mt-0.5 truncate">
                            {aff.url}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {aff.receivesMoney ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100/50 px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wide rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              Earns Comm.
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-400 border border-gray-200 px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wide rounded-full">
                              Direct Link
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-cream/30 border border-navy/5 p-2.5 rounded-sm">
                        <span className="text-[10px] font-mono uppercase text-text-light font-bold">Discount Code:</span>
                        <span className="font-mono text-xs bg-cream/80 px-2.5 py-1 border border-navy/5 font-bold uppercase text-navy rounded-sm">
                          {aff.discountCode}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-navy/5">
                        <div>
                          {isAdminUnlocked && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleStartEdit(aff)}
                                className="text-navy/50 hover:text-navy text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-amber" /> Edit
                              </button>
                              {affiliateIdToConfirmDelete === aff.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded-sm">
                                  <span className="text-[9px] font-mono text-red-700 font-bold px-0.5">Sure?</span>
                                  <button
                                    onClick={() => {
                                      handleDelete(aff.id);
                                      setAffiliateIdToConfirmDelete(null);
                                    }}
                                    className="bg-red-600 text-white font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-xs"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setAffiliateIdToConfirmDelete(null)}
                                    className="bg-white border border-navy/20 text-navy font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-xs"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAffiliateIdToConfirmDelete(aff.id)}
                                  className="text-red-500 hover:text-red-700 text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <a
                          href={aff.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm transition-all shadow-2xs"
                        >
                          <span>Shop Site</span>
                          <ExternalLink className="w-3 h-3 text-amber" />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
