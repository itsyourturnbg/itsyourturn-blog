import React, { useState } from "react";
import { Review, ReviewList } from "../types";
import { 
  FolderHeart, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  PlusCircle, 
  ChevronDown, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface ListsTabProps {
  lists: ReviewList[];
  reviews: Review[];
  onOpenReview: (id: number) => void;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  onListsUpdated: (updatedLists: ReviewList[]) => void;
}

export default function ListsTab({ 
  lists, 
  reviews, 
  onOpenReview, 
  isAdminUnlocked, 
  adminPasscode,
  onListsUpdated 
}: ListsTabProps) {
  // Filter lists state
  const [activeFilter, setActiveFilter] = useState("all");

  // Create List Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTag, setNewTag] = useState("");

  // Edit List Form State
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listIdToConfirmDelete, setListIdToConfirmDelete] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editReviewIds, setEditReviewIds] = useState<number[]>([]);
  const [editCustomNotes, setEditCustomNotes] = useState<Record<number, string>>({});
  
  // Game to Add state
  const [selectedReviewToAdd, setSelectedReviewToAdd] = useState<number | "">("");

  const SPOON_MAP = { low: "🥄", medium: "🥄🥄", high: "🥄🥄🥄" };

  const getCoverPhoto = (rev: Review) => {
    if (rev.image && rev.image.trim() !== "") {
      return rev.image;
    }
    if (rev.images && rev.images.length > 0) {
      const firstImg = rev.images.find((img) => img && img.trim() !== "");
      if (firstImg) return firstImg;
    }
    return null;
  };

  // Collect all unique categories/tags among the lists for filtering
  const uniqueTags = ["all", ...Array.from(new Set(lists.map((l) => l.tag)))];

  const filteredLists = activeFilter === "all" 
    ? lists 
    : lists.filter((l) => l.tag.toLowerCase() === activeFilter.toLowerCase());

  // Handle create list
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const listPayload = {
      title: newTitle.trim(),
      desc: newDesc.trim(),
      tag: newTag.trim() || "General",
      reviewIds: [],
      customNotes: {}
    };

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: adminPasscode, list: listPayload })
      });
      const data = await res.json();
      if (data.success) {
        onListsUpdated(data.lists);
        setIsCreating(false);
        setNewTitle("");
        setNewDesc("");
        setNewTag("");
      } else {
        alert(data.error || "Failed to create collection");
      }
    } catch (err) {
      console.error("Error creating collection:", err);
      alert("Failed to communicate with server.");
    }
  };

  // Start Edit mode
  const handleStartEdit = (list: ReviewList) => {
    setEditingListId(list.id);
    setEditTitle(list.title);
    setEditDesc(list.desc);
    setEditTag(list.tag);
    setEditReviewIds(list.reviewIds || []);
    setEditCustomNotes(list.customNotes || {});
    setSelectedReviewToAdd("");
  };

  // Save edited list
  const handleSaveEdit = async (listId: string) => {
    if (!editTitle.trim()) return;

    const updatedList = {
      id: listId,
      title: editTitle.trim(),
      desc: editDesc.trim(),
      tag: editTag.trim() || "General",
      reviewIds: editReviewIds,
      customNotes: editCustomNotes
    };

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: adminPasscode, list: updatedList })
      });
      const data = await res.json();
      if (data.success) {
        onListsUpdated(data.lists);
        setEditingListId(null);
      } else {
        alert(data.error || "Failed to update collection");
      }
    } catch (err) {
      console.error("Error saving collection:", err);
      alert("Failed to save changes to the server.");
    }
  };

  // Delete list
  const handleDeleteList = async (listId: string) => {
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: adminPasscode })
      });
      const data = await res.json();
      if (data.success) {
        onListsUpdated(data.lists);
        if (editingListId === listId) {
          setEditingListId(null);
        }
      } else {
        console.error(data.error || "Failed to delete collection");
      }
    } catch (err) {
      console.error("Error deleting collection:", err);
    }
  };

  // Add review to list
  const handleAddReviewToList = () => {
    if (selectedReviewToAdd === "") return;
    const revId = Number(selectedReviewToAdd);
    if (!editReviewIds.includes(revId)) {
      setEditReviewIds([...editReviewIds, revId]);
    }
    setSelectedReviewToAdd("");
  };

  // Remove review from list
  const handleRemoveReviewFromList = (revId: number) => {
    setEditReviewIds(editReviewIds.filter((id) => id !== revId));
    const updatedNotes = { ...editCustomNotes };
    delete updatedNotes[revId];
    setEditCustomNotes(updatedNotes);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Tab Header Card */}
      <div className="bg-white border border-navy/10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
            <FolderHeart className="w-6 h-6 text-navy animate-pulse" />
            Curated Collections &amp; Playlists
          </h2>
          <p className="text-navy/75 text-sm max-w-xl mt-1.5 font-sans leading-relaxed">
            Not sure where to start? Have a look at some collections we've compiled based on recommendations.
          </p>
        </div>

        {/* Create List Button for Admin */}
        {isAdminUnlocked && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 text-amber" />
            <span>Create New List</span>
          </button>
        )}
      </div>

      {/* Admin Creating Form Box */}
      {isCreating && (
        <form onSubmit={handleCreateList} className="bg-white border-2 border-dashed border-amber p-6 space-y-4 rounded-sm shadow-md max-w-3xl mx-auto">
          <div className="flex justify-between items-center pb-2 border-b border-navy/5">
            <h3 className="font-display font-bold text-navy text-lg flex items-center gap-2">
              <FolderHeart className="w-5 h-5 text-amber" />
              Create A Curated Collection
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-text-light hover:text-navy cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                Collection Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chill Cooperative Evenings"
                className="w-full border border-navy/15 p-2.5 font-sans text-sm text-navy bg-cream/5 focus:outline-none focus:border-amber"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                Category Vibe / Tag
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Spoon Friendly, Player Count, Social"
                className="w-full border border-navy/15 p-2.5 font-sans text-sm text-navy bg-cream/5 focus:outline-none focus:border-amber"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase text-navy font-bold">
              Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="What binds these games together? Tell your readers what to expect..."
              className="w-full border border-navy/15 p-2.5 font-sans text-sm text-navy bg-cream/5 focus:outline-none focus:border-amber"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="border border-navy/15 hover:bg-navy/5 text-navy font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm transition-all shadow-xs"
            >
              Save List
            </button>
          </div>
        </form>
      )}

      {/* Categories/Tags Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap bg-white border border-navy/10 p-3 shadow-2xs">
        <span className="font-mono text-[10px] tracking-wider uppercase text-text-light pl-2 pr-1 font-bold">
          Category Vibe
        </span>
        {uniqueTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={`font-mono text-xs px-3 py-1 cursor-pointer transition-colors border ${
              activeFilter === tag
                ? "bg-navy text-amber border-navy font-bold"
                : "bg-transparent text-text-muted border-navy/15 hover:border-navy hover:text-navy"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Curated Playlists / Collections Grid */}
      <div className="space-y-8">
        {filteredLists.map((list, index) => {
          const isEditing = editingListId === list.id;

          // Resolve reviewIds to actual review models
          const listReviews = isEditing
            ? editReviewIds.map((id) => reviews.find((r) => r.id === id)).filter((r): r is Review => !!r)
            : list.reviewIds.map((id) => reviews.find((r) => r.id === id)).filter((r): r is Review => !!r);

          if (isEditing) {
            // Edit Form Render in place of the list item
            return (
              <div key={list.id} className="border-2 border-amber bg-white overflow-hidden shadow-md rounded-sm p-6 space-y-6 animate-fade-in">
                <div className="flex justify-between items-start pb-4 border-b border-navy/10">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-amber">LIST EDITOR ACTIVE</span>
                    <h3 className="font-display text-xl font-bold text-navy mt-0.5">Editing: {list.title}</h3>
                  </div>
                  <div className="flex gap-2 items-center">
                    {listIdToConfirmDelete === list.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 p-1.5 rounded-sm">
                        <span className="text-[10px] font-mono text-red-700 font-bold px-1">Are you sure?</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteList(list.id);
                            setListIdToConfirmDelete(null);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 cursor-pointer rounded-xs"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setListIdToConfirmDelete(null)}
                          className="bg-white border border-navy/20 hover:bg-cream text-navy font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 cursor-pointer rounded-xs"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setListIdToConfirmDelete(list.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 rounded-sm cursor-pointer transition-all flex items-center gap-1 text-xs font-mono font-bold"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>DELETE LIST</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingListId(null);
                        setListIdToConfirmDelete(null);
                      }}
                      className="border border-navy/15 p-2 rounded-sm cursor-pointer hover:bg-navy/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">List Title</label>
                    <input
                      type="text"
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy bg-cream/5 focus:outline-none focus:border-amber"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Category Vibe / Tag</label>
                    <input
                      type="text"
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy bg-cream/5 focus:outline-none focus:border-amber"
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Collection Description</label>
                  <textarea
                    rows={2}
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy bg-cream/5 focus:outline-none focus:border-amber"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>

                {/* Games Manager inside the editing list */}
                <div className="space-y-3 bg-cream/15 p-4 border border-navy/5">
                  <h4 className="font-mono text-xs font-bold uppercase text-navy tracking-wider flex items-center gap-1">
                    <span>Manage Games in Collection</span>
                    <span className="text-text-light font-normal">({listReviews.length})</span>
                  </h4>

                  {/* List of current games with notes fields */}
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {listReviews.map((rev) => (
                      <div key={rev.id} className="bg-white border border-navy/10 p-3 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between rounded-sm">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-2xl shrink-0">{rev.emoji || "🎲"}</span>
                          <div className="min-w-0 flex-1">
                            <span className="font-display font-bold text-navy text-sm block truncate">{rev.title}</span>
                            <span className="text-[10px] font-mono text-text-light block">{rev.subtitle}</span>
                          </div>
                        </div>

                        {/* List-specific customized note input */}
                        <div className="w-full md:w-2/3 space-y-1">
                          <label className="block text-[8px] font-mono uppercase text-text-light font-bold">Curated Play Recommendation/Note</label>
                          <input
                            type="text"
                            placeholder="Add list-specific notes (e.g. why this game is in this list)..."
                            className="w-full border border-navy/10 p-1.5 font-sans text-xs text-navy bg-cream/5 focus:outline-none focus:border-amber italic"
                            value={editCustomNotes[rev.id] || ""}
                            onChange={(e) => setEditCustomNotes({
                              ...editCustomNotes,
                              [rev.id]: e.target.value
                            })}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveReviewFromList(rev.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-sm cursor-pointer hover:bg-red-50 align-middle shrink-0"
                          title="Remove Game"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {listReviews.length === 0 && (
                      <p className="text-center italic text-xs text-text-light font-mono py-4">This collection currently has no games added.</p>
                    )}
                  </div>

                  {/* Add Game Section */}
                  <div className="pt-3 border-t border-navy/10 flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 space-y-1 w-full">
                      <label className="block text-[9px] font-mono uppercase text-navy font-bold">Add Game to Collection</label>
                      <select
                        className="w-full border border-navy/15 p-2 font-sans text-xs text-navy bg-white focus:outline-none focus:border-amber"
                        value={selectedReviewToAdd}
                        onChange={(e) => setSelectedReviewToAdd(e.target.value === "" ? "" : Number(e.target.value))}
                      >
                        <option value="">-- Choose a board game --</option>
                        {reviews
                          .filter((r) => !editReviewIds.includes(r.id))
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={selectedReviewToAdd === ""}
                      onClick={handleAddReviewToList}
                      className="w-full sm:w-auto bg-navy hover:bg-navy-mid text-white disabled:opacity-40 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <PlusCircle className="w-4 h-4 text-amber" />
                      <span>Add Game</span>
                    </button>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex justify-end gap-3 pt-3 border-t border-navy/5">
                  <button
                    type="button"
                    onClick={() => setEditingListId(null)}
                    className="border border-navy/15 hover:bg-navy/5 text-navy font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(list.id)}
                    className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-5 py-2 rounded-sm flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Check className="w-4 h-4 text-amber" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            );
          }

          // Default View mode
          return (
            <div key={list.id} className="border border-navy/15 bg-white overflow-hidden shadow-sm flex flex-col group/list relative">
              {/* List Header */}
              <div className="bg-navy p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-amber font-bold mb-1">
                    {list.tag}
                  </div>
                  <h3 className="font-display text-xl text-white font-black leading-snug">
                    {list.title}
                  </h3>
                  <p className="text-white/60 text-xs md:text-sm mt-1 max-w-2xl font-sans">
                    {list.desc}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber bg-white/10 border border-amber/35 px-3 py-1.5 whitespace-nowrap">
                    {listReviews.length} game{listReviews.length !== 1 ? "s" : ""}
                  </div>

                  {/* Admin Edit Trigger */}
                  {isAdminUnlocked && (
                    <button
                      onClick={() => handleStartEdit(list)}
                      className="bg-amber hover:bg-amber-light text-navy p-2 rounded-sm transition-all flex items-center justify-center cursor-pointer shadow-xs"
                      title="Edit List Collection"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Game Entries in List */}
              <div className="divide-y divide-navy/5">
                {listReviews.length > 0 ? (
                  listReviews.map((rev) => (
                    <div
                      key={rev.id}
                      onClick={() => onOpenReview(rev.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-cream/40 transition-all cursor-pointer group"
                    >
                      {/* Left Side: Thumbnail & Details */}
                      <div className="flex gap-4 items-center flex-1 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-16 sm:w-20 aspect-square shrink-0 bg-cream overflow-hidden border border-navy/10 relative shadow-sm flex items-center justify-center rounded-md">
                          {getCoverPhoto(rev) ? (
                            <img
                              src={getCoverPhoto(rev)!}
                              alt={rev.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xl select-none" role="img" aria-label={rev.title}>
                              {rev.emoji || "🎲"}
                            </span>
                          )}
                        </div>

                        {/* Game info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {getCoverPhoto(rev) ? null : <span className="text-lg">{rev.emoji}</span>}
                            <h4 className="font-display font-bold text-navy text-base leading-tight group-hover:text-amber transition-colors">
                              {rev.title}
                            </h4>
                          </div>
                          <p className="text-text-muted text-xs font-medium leading-relaxed italic">
                            {rev.subtitle}
                          </p>
                          
                          {/* List-specific curated note */}
                          {list.customNotes?.[rev.id] && (
                            <div className="bg-cream/45 border-l-2 border-amber p-2.5 mt-2 text-xs text-text-muted font-sans italic leading-relaxed">
                              {list.customNotes[rev.id]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Spoon meta pills */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1.5 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                        <span className="text-xs bg-cream/70 text-navy font-bold px-2 py-0.5 rounded-sm">
                          {SPOON_MAP[rev.spoons]}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-text-light">
                          {rev.spoons} spoons
                        </span>

                        {/* Affiliate Link */}
                        {rev.buyUrl && rev.buyUrl.trim() !== "" && (
                          <a
                            href={rev.buyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-wider text-amber hover:text-navy transition-all bg-cream hover:bg-amber/10 border border-amber/20 hover:border-amber/40 px-2.5 py-1 rounded-md shadow-xs"
                          >
                            Buy here <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}

                        <span className="font-mono text-[9px] text-amber opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity uppercase font-bold mt-1">
                          Read Review &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-text-light uppercase tracking-wider">
                    This playlist is currently empty.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredLists.length === 0 && (
          <div className="p-12 border border-dashed border-navy/15 text-center text-text-light font-mono text-xs uppercase tracking-widest bg-white">
            No playlists found in the "{activeFilter}" category.
          </div>
        )}
      </div>
    </div>
  );
}
