import React, { useState, useEffect } from "react";
import { Review } from "../types";
import { X, Clock, Users, Award, ShieldAlert, Camera, Heart, MessageCircle, Instagram, ExternalLink } from "lucide-react";
import ReplaceImageModal from "./ReplaceImageModal";
import ImageCarousel from "./ImageCarousel";

interface ReviewModalProps {
  review: Review | null;
  onClose: () => void;
  onReRoll?: () => void;
  isAdminUnlocked?: boolean;
  adminPasscode?: string;
  onReviewsUpdated?: (reviews: Review[]) => void;
}

export default function ReviewModal({
  review,
  onClose,
  onReRoll,
  isAdminUnlocked = false,
  adminPasscode = "",
  onReviewsUpdated,
}: ReviewModalProps) {
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable Form States
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editScore, setEditScore] = useState<number | string>(8);
  const [editSpoons, setEditSpoons] = useState<"low" | "medium" | "high">("medium");
  const [editType, setEditType] = useState("");
  const [editPlayers, setEditPlayers] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editVerdict, setEditVerdict] = useState("");
  const [editInstagramUrl, setEditInstagramUrl] = useState("");
  const [editBuyUrl, setEditBuyUrl] = useState("");
  const [editLikesCount, setEditLikesCount] = useState<number | "">("");
  const [editCommentsCount, setEditCommentsCount] = useState<number | "">("");
  const [editEmoji, setEditEmoji] = useState("🎲");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form fields when review changes or when editing mode is activated
  useEffect(() => {
    if (review) {
      setEditTitle(review.title || "");
      setEditSubtitle(review.subtitle || "");
      setEditScore(review.score || 8);
      setEditSpoons(review.spoons || "medium");
      setEditType(review.type || "strategy");
      setEditPlayers(review.players || "2-4");
      setEditTime(review.time || "30-60 min");
      setEditBody(review.body || "");
      setEditVerdict(review.verdict || "");
      setEditInstagramUrl(review.instagramUrl || "");
      setEditBuyUrl(review.buyUrl || "");
      setEditLikesCount(review.likesCount !== undefined && review.likesCount !== null ? review.likesCount : "");
      setEditCommentsCount(review.commentsCount !== undefined && review.commentsCount !== null ? review.commentsCount : "");
      setEditEmoji(review.emoji || "🎲");
      setEditTagsInput(review.tags ? review.tags.join(", ") : "");
      setSaveError(null);
    }
  }, [review, isEditing]);

  // Dynamic SEO Title & Meta Description update
  useEffect(() => {
    if (!review) return;

    const originalTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const originalDescription = metaDescription ? metaDescription.getAttribute("content") : "";

    // Set new SEO title
    document.title = `${review.title} Board Game Overviews & Spoon Ratings — ItsYourTurn.bg`;

    // Set new meta description for dynamic search engines
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `${review.title}: ${review.subtitle || ""}. Read our quick, honest overview including the ${review.spoons} spoon rating at ItsYourTurn.bg!`
      );
    }

    return () => {
      document.title = originalTitle;
      if (metaDescription && originalDescription) {
        metaDescription.setAttribute("content", originalDescription);
      }
    };
  }, [review]);

  const handleSaveText = async () => {
    if (!review) return;
    setIsSaving(true);
    setSaveError(null);

    const finalTags = editTagsInput
      ? editTagsInput.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    const updatedReview: Review = {
      ...review,
      title: editTitle,
      subtitle: editSubtitle,
      score: isNaN(Number(editScore)) ? editScore : Number(editScore),
      spoons: editSpoons,
      type: editType,
      players: editPlayers,
      time: editTime,
      body: editBody,
      verdict: editVerdict,
      emoji: editEmoji,
      tags: finalTags,
      instagramUrl: editInstagramUrl.trim() || undefined,
      buyUrl: editBuyUrl.trim() || undefined,
      likesCount: editLikesCount === "" ? undefined : Number(editLikesCount),
      commentsCount: editCommentsCount === "" ? undefined : Number(editCommentsCount),
    };

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: adminPasscode,
          review: updatedReview,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save review changes.");
      }

      const data = await response.json();
      if (data.success && data.reviews) {
        if (onReviewsUpdated) {
          onReviewsUpdated(data.reviews);
        }
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error("Error saving review text:", err);
      setSaveError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!review || !onReviewsUpdated) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: adminPasscode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete review.");
      }

      const data = await response.json();
      if (data.success && data.reviews) {
        onReviewsUpdated(data.reviews);
        onClose();
      }
    } catch (err: any) {
      console.error("Error deleting review:", err);
      setSaveError(err.message || "An unexpected error occurred while deleting.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!review) return null;

  const SPOON_MAP = { low: "🥄", medium: "🥄🥄", high: "🥄🥄🥄" };
  const SPOON_DESC = {
    low: "Easy to learn, quick setup, minimal rules to remember.",
    medium: "Some rules overhead, moderate complexity, and moderate setup time.",
    high: "Heavy rulebook, long setup, lots of things to track and remember."
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto backdrop-blur-sm">
      <div className="bg-off-white max-w-2xl w-full my-4 md:my-8 rounded-none relative border border-navy/20 shadow-2xl overflow-hidden">
        
        {/* Admin Action Buttons (Top-Left) */}
        {isAdminUnlocked && adminPasscode && onReviewsUpdated && (
          <div className="absolute top-4 left-4 z-25 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsReplaceModalOpen(true)}
              className="bg-navy hover:bg-navy-mid text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-sm flex items-center gap-1 cursor-pointer shadow-md transform active:scale-95 transition-all border border-white/20"
              title="Admin: Replace this review's cover image"
            >
              <Camera className="w-3.5 h-3.5 text-amber" />
              <span>{review.image ? "REPLACE" : "ADD IMAGE"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`${
                isEditing ? "bg-amber text-navy hover:bg-amber-light" : "bg-navy text-white hover:bg-navy-mid"
              } font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-sm flex items-center gap-1 cursor-pointer shadow-md transform active:scale-95 transition-all border border-white/20`}
              title="Admin: Edit review text and metadata visually"
            >
              <span>{isEditing ? "CANCEL" : "✏️ EDIT DETAILS"}</span>
            </button>
          </div>
        )}

        {/* Re-roll Button */}
        {onReRoll && (
          <button
            onClick={onReRoll}
            className="absolute top-4 right-14 bg-amber hover:bg-amber-light text-navy font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-sm z-20 flex items-center gap-1.5 cursor-pointer shadow-md transform active:scale-95 transition-all"
            title="Roll another random game review!"
          >
            <span>🎲</span>
            <span>RE-ROLL</span>
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/40 text-white hover:bg-black/60 transition-colors p-2 rounded-full z-20 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Game Banner Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-navy/10 group bg-cream flex items-center justify-center">
          {review.image || (review.images && review.images.length > 0) ? (
            <img
              src={review.image || (review.images && review.images[0])}
              alt={review.title}
              className="w-full h-full object-cover filter saturate-[0.85] contrast-[1.03]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center space-y-1.5 opacity-30 select-none">
              <span className="text-5xl">{review.emoji}</span>
              <div className="font-mono text-[10px] tracking-wider uppercase text-navy font-bold">Cover Art</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-black/30 pointer-events-none" />
          
          {/* Inline image replacement button overlay on hover */}
          {isAdminUnlocked && adminPasscode && onReviewsUpdated && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-15">
              <button
                onClick={() => setIsReplaceModalOpen(true)}
                className="bg-amber hover:bg-amber-light text-navy font-mono text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm shadow-lg flex items-center gap-2 cursor-pointer transform hover:scale-105 transition-all"
              >
                <Camera className="w-4 h-4" />
                Manage Media Gallery
              </button>
            </div>
          )}
        </div>

        {/* Modal Header */}
        <div className="bg-navy p-6 md:p-8 pr-14 md:pr-16 text-white relative">
          <div className="text-amber font-mono text-[10px] tracking-widest uppercase mb-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span>{isEditing ? editType : review.type}</span>
            <span>•</span>
            <span>{isEditing ? editPlayers : review.players} players</span>
            <span>•</span>
            <span>{isEditing ? editTime : review.time}</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-black mb-2 leading-tight">
            {isEditing ? editTitle : review.title}
          </h2>
          <p className="text-white/60 text-xs md:text-sm font-sans italic">
            {isEditing ? editSubtitle : review.subtitle}
          </p>
        </div>

        {/* Modal Body / Visual Editor */}
        {isEditing ? (
          <div className="p-6 md:p-8 space-y-5 bg-white overflow-y-auto max-h-[60vh] border-t border-navy/10">
            <div className="border-b border-navy/10 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-black text-navy uppercase tracking-tight">
                  Visual Review Editor
                </h3>
                <p className="text-[11px] text-text-light font-mono leading-none mt-1">
                  Edit fields below. Changes apply instantly on save.
                </p>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest bg-amber text-navy font-bold px-2 py-0.5 rounded-sm">
                ADMIN WORKSPACE
              </span>
            </div>

            {saveError && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 text-xs font-mono rounded-sm">
                ⚠️ {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Game Title */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Game Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Subtitle / Teaser
                </label>
                <input
                  type="text"
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                />
              </div>

              {/* Game Type */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Game Category
                </label>
                <input
                  type="text"
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  placeholder="e.g. strategy, card, family"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                />
              </div>

              {/* Emoji */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Emoji Icon
                </label>
                <input
                  type="text"
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                />
              </div>

              {/* Players */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Players Count
                </label>
                <input
                  type="text"
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  placeholder="e.g. 2-4"
                  value={editPlayers}
                  onChange={(e) => setEditPlayers(e.target.value)}
                />
              </div>

              {/* Playtime */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Playtime
                </label>
                <input
                  type="text"
                  className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  placeholder="e.g. 30-60 min"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>

              {/* Spoons Overheads */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Spoons Overhead Rating
                </label>
                <select
                  className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  value={editSpoons}
                  onChange={(e) => setEditSpoons(e.target.value as "low" | "medium" | "high")}
                >
                  <option value="low">Low (1 Spoon) — Easy learning</option>
                  <option value="medium">Medium (2 Spoons) — Moderate rules</option>
                  <option value="high">High (3 Spoons) — Heavy overhead</option>
                </select>
              </div>
            </div>

            {/* Verdict */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                The Verdict
              </label>
              <input
                type="text"
                className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none font-medium italic"
                placeholder="The quick takeaway verdict sentence..."
                value={editVerdict}
                onChange={(e) => setEditVerdict(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                Tags (comma separated)
              </label>
              <input
                type="text"
                className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                placeholder="strategy, card-game, draft"
                value={editTagsInput}
                onChange={(e) => setEditTagsInput(e.target.value)}
              />
            </div>

            {/* Affiliate & Purchase Links */}
            <div className="bg-cream/20 border border-navy/10 p-3 space-y-3">
              <span className="block text-[10px] font-mono uppercase font-black tracking-wider text-navy">
                Affiliate &amp; Purchase Information
              </span>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-text-muted font-bold">
                  Buy Link (e.g., Affiliate URL)
                </label>
                <input
                  type="text"
                  className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  placeholder="e.g. https://www.amazon.com/dp/B08XYZ123"
                  value={editBuyUrl}
                  onChange={(e) => setEditBuyUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Instagram Meta details */}
            <div className="bg-cream/20 border border-navy/10 p-3 space-y-3">
              <span className="block text-[10px] font-mono uppercase font-black tracking-wider text-navy">
                Instagram Meta Information &amp; Engagement Stats
              </span>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono uppercase text-text-muted font-bold">
                  Instagram Post URL
                </label>
                <input
                  type="text"
                  className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                  placeholder="e.g. https://www.instagram.com/p/C_abc123/"
                  value={editInstagramUrl}
                  onChange={(e) => setEditInstagramUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase text-text-muted font-bold">
                    Likes Count
                  </label>
                  <input
                    type="number"
                    className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                    placeholder="e.g. 142"
                    value={editLikesCount}
                    onChange={(e) => setEditLikesCount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase text-text-muted font-bold">
                    Comments Count
                  </label>
                  <input
                    type="number"
                    className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:border-navy focus:outline-none"
                    placeholder="e.g. 18"
                    value={editCommentsCount}
                    onChange={(e) => setEditCommentsCount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Review Body Text (HTML area) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                  Review Text Body (HTML Supported)
                </label>
                <span className="text-[9px] font-mono text-text-light">
                  Use &lt;p&gt; tags to design clean paragraphs.
                </span>
              </div>
              <textarea
                rows={8}
                className="w-full border border-navy/15 p-2.5 font-mono text-[11px] text-navy focus:border-navy focus:outline-none bg-cream/10 leading-relaxed"
                placeholder="Write the full review HTML..."
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-navy/10 flex-wrap gap-2">
              {onReviewsUpdated && (
                <div className="flex items-center gap-2">
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSaving}
                      className="bg-red-600 hover:bg-red-700 text-white font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      Delete Review
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-1.5 rounded-sm">
                      <span className="text-[10px] font-mono text-red-700 font-bold px-1">Are you sure?</span>
                      <button
                        type="button"
                        onClick={handleDeleteReview}
                        disabled={isSaving}
                        className="bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 cursor-pointer rounded-xs"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-white border border-navy/20 hover:bg-cream text-navy font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 cursor-pointer rounded-xs"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setShowDeleteConfirm(false);
                  }}
                  className="border border-navy/20 bg-white text-navy font-mono text-[11px] font-bold uppercase tracking-wider px-4 py-2 cursor-pointer hover:bg-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveText}
                  disabled={isSaving || !editTitle.trim()}
                  className="bg-navy hover:bg-navy-mid text-white font-mono text-[11px] font-bold uppercase tracking-wider px-4 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-6">
            {/* Instagram stats & button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-cream/30 border border-navy/10 p-3.5 rounded-none">
              <div className="flex items-center gap-4 text-xs font-mono text-navy">
                {typeof review.likesCount === "number" && (
                  <span className="flex items-center gap-1.5 font-bold">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>{review.likesCount}</span>
                    <span className="text-text-light font-normal">likes</span>
                  </span>
                )}
                {typeof review.commentsCount === "number" && (
                  <span className="flex items-center gap-1.5 font-bold">
                    <MessageCircle className="w-4 h-4 text-sky-500" />
                    <span>{review.commentsCount}</span>
                    <span className="text-text-light font-normal">comments</span>
                  </span>
                )}
                {!(review.likesCount || review.commentsCount) && (
                  <span className="text-text-light italic flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <span>Join the conversation</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={review.instagramUrl || "https://www.instagram.com/itsyourturn.bg"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-navy hover:bg-navy-mid text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-xs"
                >
                  <Instagram className="w-3.5 h-3.5 text-amber" />
                  <span>View on Instagram</span>
                </a>

                {review.buyUrl && review.buyUrl.trim() !== "" && (
                  <a
                    href={review.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber hover:bg-amber-light text-navy font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-sm flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buy Here</span>
                  </a>
                )}
              </div>
            </div>

            {/* Spoons Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy/10 pb-4">
              <div className="flex items-center gap-3 bg-cream p-3 border-l-4 border-navy w-full">
                <span className="text-2xl shrink-0">{SPOON_MAP[review.spoons]}</span>
                <div>
                  <div className="font-mono text-[10px] tracking-wider uppercase text-text-muted font-bold">
                    Spoon Rating — {review.spoons}
                  </div>
                  <div className="text-xs text-text-muted">
                    {SPOON_DESC[review.spoons]}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Body HTML content */}
            <div 
              className="prose text-sm text-text-muted space-y-4 leading-relaxed max-h-[30vh] overflow-y-auto pr-2 border-b border-navy/5 pb-4"
              dangerouslySetInnerHTML={{ __html: review.body }}
            />

            {/* Verdict Box */}
            <div className="bg-navy text-amber p-4 border-l-4 border-amber-light">
              <div className="font-mono text-[10px] tracking-widest uppercase text-amber/60 font-bold mb-1">
                The Verdict
              </div>
              <p className="font-sans italic text-sm text-white font-medium">
                "{review.verdict}"
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono border-t border-navy/10 pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-text-light" />
                <div>
                  <div className="text-[9px] uppercase text-text-light font-bold">Players</div>
                  <div className="text-text-muted font-bold">{review.players}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-light" />
                <div>
                  <div className="text-[9px] uppercase text-text-light font-bold">Playtime</div>
                  <div className="text-text-muted font-bold">{review.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-text-light" />
                <div>
                  <div className="text-[9px] uppercase text-text-light font-bold">Released</div>
                  <div className="text-text-muted font-bold">{review.date}</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {review.tags.map((tag) => (
                <span key={tag} className="font-mono text-[9px] uppercase tracking-wider bg-cream px-2 py-0.5 text-text-muted">
                  {tag}
                </span>
              ))}
            </div>

            {/* Gameplay Carousel (4:5 Aspect Ratio) */}
            {review.images && review.images.filter(img => img && img.trim() !== "").length > 0 && (
              <div className="space-y-3 border-t border-navy/10 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-text-muted font-bold flex items-center gap-1">
                    <span>📷</span> Gameplay &amp; Component Gallery
                  </span>
                </div>
                <div className="max-w-md mx-auto border border-navy/15 shadow-sm bg-white p-1">
                  <ImageCarousel
                    images={review.images}
                    fallbackEmoji={review.emoji}
                    aspectRatio="aspect-[4/5]"
                    objectFit="object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Replace Image Modal */}
      {isReplaceModalOpen && adminPasscode && onReviewsUpdated && (
        <ReplaceImageModal
          isOpen={isReplaceModalOpen}
          onClose={() => setIsReplaceModalOpen(false)}
          review={review}
          adminPasscode={adminPasscode}
          onSuccess={onReviewsUpdated}
        />
      )}
    </div>
  );
}
