import React, { useState, useEffect } from "react";
import { Review } from "../types";
import { 
  X, Sparkles, AlertCircle, Loader2, Check, Eye, HelpCircle, 
  Bold, Italic, List, Heading, Save, RefreshCw, FileText 
} from "lucide-react";

interface ReviewWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  onReviewsUpdated: (reviews: Review[]) => void;
  adminPasscode?: string;
}

export default function ReviewWriterModal({
  isOpen,
  onClose,
  reviews,
  onReviewsUpdated,
  adminPasscode = "",
}: ReviewWriterModalProps) {
  // Mode: "add" to create a new review, or "edit" to update/replace an existing one
  const [writerMode, setWriterMode] = useState<"add" | "edit">("add");
  const [targetReviewId, setTargetReviewId] = useState<number>(reviews[0]?.id || 1);
  const [passcode, setPasscode] = useState(adminPasscode);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form states for the manual blog entry
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [type, setType] = useState("strategy");
  const [players, setPlayers] = useState("2-4");
  const [time, setTime] = useState("30-60 min");
  const [score, setScore] = useState<number>(8);
  const [verdict, setVerdict] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [emoji, setEmoji] = useState("🎲");
  const [spoons, setSpoons] = useState<"low" | "medium" | "high">("medium");
  const [imageUrl, setImageUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [buyUrl, setBuyUrl] = useState("");
  const [likesCount, setLikesCount] = useState<number | "">("");
  const [commentsCount, setCommentsCount] = useState<number | "">("");
  const [autoParagraph, setAutoParagraph] = useState(true);

  // Active tab in writer modal: "edit" (form) or "preview" (mobile preview)
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  useEffect(() => {
    if (writerMode === "edit") {
      const selected = reviews.find((r) => r.id === targetReviewId);
      if (selected) {
        setTitle(selected.title || "");
        setSubtitle(selected.subtitle || "");
        setType(selected.type || "strategy");
        setPlayers(selected.players || "2-4");
        setTime(selected.time || "30-60 min");
        setScore(Number(selected.score) || 8);
        setVerdict(selected.verdict || "");
        setBody(selected.body || "");
        setTagsInput(selected.tags ? selected.tags.join(", ") : "");
        setEmoji(selected.emoji || "🎲");
        setSpoons(selected.spoons || "medium");
        setImageUrl(selected.image || "");
        setInstagramUrl(selected.instagramUrl || "");
        setBuyUrl(selected.buyUrl || "");
        setLikesCount(selected.likesCount !== undefined && selected.likesCount !== null ? selected.likesCount : "");
        setCommentsCount(selected.commentsCount !== undefined && selected.commentsCount !== null ? selected.commentsCount : "");
      }
    } else {
      // Reset form to defaults
      setTitle("");
      setSubtitle("");
      setType("strategy");
      setPlayers("2-4");
      setTime("30-60 min");
      setScore(8);
      setVerdict("");
      setBody("");
      setTagsInput("");
      setEmoji("🎲");
      setSpoons("medium");
      setImageUrl("");
      setInstagramUrl("");
      setBuyUrl("");
      setLikesCount("");
      setCommentsCount("");
    }
    setError(null);
    setSuccess(null);
  }, [writerMode, targetReviewId, reviews]);

  if (!isOpen) return null;

  // Insert HTML tags helper
  const insertHtmlTag = (tagType: "bold" | "italic" | "p" | "h3" | "ul" | "li") => {
    const textarea = document.getElementById("review-body-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    switch (tagType) {
      case "bold":
        replacement = `<strong>${selectedText || "bold text"}</strong>`;
        break;
      case "italic":
        replacement = `<em>${selectedText || "italic text"}</em>`;
        break;
      case "p":
        replacement = `<p>${selectedText || "Paragraph text."}</p>`;
        break;
      case "h3":
        replacement = `<h3>${selectedText || "Section Heading"}</h3>`;
        break;
      case "ul":
        replacement = `<ul>\n  <li>${selectedText || "List item 1"}</li>\n  <li>List item 2</li>\n</ul>`;
        break;
      case "li":
        replacement = `<li>${selectedText || "List item"}</li>`;
        break;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setBody(newText);

    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  // Process manual body to double breaks -> <p> if auto-paragraph is on
  const getProcessedBody = () => {
    if (!autoParagraph) return body;
    
    // If the body doesn't look like HTML (e.g., no <p> or <div> tag at the start), 
    // we convert double line breaks into paragraphs.
    const trimmed = body.trim();
    if (trimmed && !trimmed.startsWith("<p>") && !trimmed.startsWith("<div>") && !trimmed.startsWith("<section>")) {
      const paragraphs = trimmed.split(/\n\s*\n/);
      return paragraphs
        .map((p) => {
          // Wrap in paragraph if it doesn't already have one
          const inner = p.replace(/\n/g, "<br />");
          return `<p>${inner}</p>`;
        })
        .join("\n");
    }
    return body;
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError("Board game title is required.");
      return;
    }

    if (!passcode.trim()) {
      setError("Admin passcode is required to publish review changes to the server.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const finalBody = getProcessedBody();

    const reviewPayload: Partial<Review> = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      type: type.toLowerCase(),
      players: players.trim(),
      time: time.trim(),
      score: Number(score) || 8,
      verdict: verdict.trim(),
      body: finalBody,
      tags: tagsInput.split(",").map(t => t.trim()).filter(t => t !== ""),
      date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      featured: false,
      emoji: emoji.trim() || "🎲",
      spoons,
      image: imageUrl.trim() || "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=1200",
      instagramUrl: instagramUrl.trim() || undefined,
      buyUrl: buyUrl.trim() || undefined,
      likesCount: likesCount === "" ? undefined : Number(likesCount),
      commentsCount: commentsCount === "" ? undefined : Number(commentsCount),
    };

    try {
      const url = writerMode === "edit" ? `/api/reviews/${targetReviewId}` : "/api/reviews";
      const method = writerMode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, review: reviewPayload }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to publish review. Check your admin passcode.");
      }

      onReviewsUpdated(data.reviews);
      setSuccess(writerMode === "edit" ? "Review updated successfully!" : "New review published successfully!");
      
      // Auto close modal on success after 1s
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unauthorized: Check that your passcode is correct.");
    } finally {
      setIsLoading(false);
    }
  };

  const SPOON_MAP = { low: "🥄 Low", medium: "🥄🥄 Med", high: "🥄🥄🥄 High" };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-navy/10 shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col relative rounded-none">
        
        {/* Header */}
        <div className="bg-navy p-4 text-white flex items-center justify-between border-b-2 border-amber">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber animate-pulse" />
            <span className="font-display text-sm uppercase tracking-wider font-bold">
              Review Writer &amp; HTML Blog Editor
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Grid - Two Columns (Form + Live Preview) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Form (8 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col overflow-y-auto p-6 space-y-6 border-r border-navy/10">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 border-l-4 border-red-500 flex items-start gap-2 font-sans text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold">Error:</span> {error}
                </div>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 text-emerald-800 p-4 border-l-4 border-emerald-500 flex items-start gap-2 font-sans text-sm">
                <Check className="w-5 h-5 shrink-0 text-emerald-600" />
                <div>{success}</div>
              </div>
            )}

            {/* Writer Mode Selection */}
            <div className="bg-cream/30 p-4 border border-navy/5 space-y-4">
              <label className="block text-xs font-mono font-bold uppercase text-navy">
                Action Mode
              </label>
              
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-navy font-sans cursor-pointer">
                  <input
                    type="radio"
                    name="writerMode"
                    checked={writerMode === "add"}
                    onChange={() => setWriterMode("add")}
                    className="text-amber focus:ring-amber"
                  />
                  <span>Create a brand new blog review</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-navy font-sans cursor-pointer">
                  <input
                    type="radio"
                    name="writerMode"
                    checked={writerMode === "edit"}
                    onChange={() => setWriterMode("edit")}
                    className="text-amber focus:ring-amber"
                  />
                  <span>Edit / Overwrite an existing review</span>
                </label>
              </div>

              {writerMode === "edit" && (
                <div className="pt-2 space-y-2">
                  <label className="block text-[10px] font-mono uppercase text-text-muted mb-1">
                    Select Review to Overwrite
                  </label>
                  <select
                    className="w-full border border-navy/15 bg-white p-2.5 font-sans text-sm text-navy focus:outline-none"
                    value={targetReviewId}
                    onChange={(e) => setTargetReviewId(Number(e.target.value))}
                  >
                    {reviews.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.type} • {r.spoons} spoons)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Game Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ark Nova"
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-cream/10"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Subtitle / Hook</label>
                  <input
                    type="text"
                    placeholder="e.g. A gorgeous, brain-burning zoo building simulator"
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-cream/10"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Category</label>
                  <select
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-white"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="strategy">Strategy</option>
                    <option value="party">Party</option>
                    <option value="cooperative">Cooperative</option>
                    <option value="family">Family</option>
                    <option value="thematic">Thematic</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Spoons Level (Energy)</label>
                  <select
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-white"
                    value={spoons}
                    onChange={(e) => setSpoons(e.target.value as any)}
                  >
                    <option value="low">Low Spoon (Easy learning, cozy)</option>
                    <option value="medium">Medium Spoon (Moderate depth)</option>
                    <option value="high">High Spoon (Heavy brain burner)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Spoon Score out of 10</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-cream/10"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Players</label>
                  <input
                    type="text"
                    placeholder="e.g. 1-4"
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none bg-cream/10"
                    value={players}
                    onChange={(e) => setPlayers(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Play Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 45-90 min"
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none bg-cream/10"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Emoji Icon</label>
                  <input
                    type="text"
                    placeholder="e.g. 🦒"
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy text-center focus:outline-none bg-cream/10"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="worker placement, hex grid, hand management"
                  className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none bg-cream/10"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">The Verdict (Short sentence)</label>
                <input
                  type="text"
                  placeholder="e.g. An elegant board game that rewards planning, but keep some extra spoons ready!"
                  className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none bg-cream/10 font-medium italic"
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-navy font-bold">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none bg-cream/10"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              {/* HTML Blog Editor with Toolbar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-navy text-white p-2 border-b-2 border-amber">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold pl-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber" />
                    Review Body Copy (HTML paragraphs)
                  </span>
                  
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertHtmlTag("bold")}
                      className="p-1 hover:bg-white/10 text-white rounded transition-colors text-xs flex items-center"
                      title="Bold text (strong)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag("italic")}
                      className="p-1 hover:bg-white/10 text-white rounded transition-colors text-xs flex items-center"
                      title="Italic text (em)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag("p")}
                      className="p-1 hover:bg-white/10 text-white rounded transition-colors text-[10px] font-mono font-bold flex items-center px-1"
                      title="Wrap in paragraph (p)"
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag("h3")}
                      className="p-1 hover:bg-white/10 text-white rounded transition-colors text-xs flex items-center"
                      title="Heading 3 (h3)"
                    >
                      <Heading className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertHtmlTag("ul")}
                      className="p-1 hover:bg-white/10 text-white rounded transition-colors text-xs flex items-center"
                      title="Bullet list (ul)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  id="review-body-textarea"
                  rows={8}
                  className="w-full border border-t-0 border-navy/15 p-3 font-mono text-xs text-navy focus:outline-none bg-cream/5 leading-relaxed whitespace-pre-wrap"
                  placeholder="Write your review block here... Use double-enters for empty spaces to make paragraphs."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />

                {/* Auto paragraph toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="auto-paragraph-checkbox"
                    checked={autoParagraph}
                    onChange={(e) => setAutoParagraph(e.target.checked)}
                    className="rounded text-amber focus:ring-amber"
                  />
                  <label htmlFor="auto-paragraph-checkbox" className="text-[11px] text-text-muted font-sans cursor-pointer select-none">
                    <strong>Auto-Format:</strong> Convert double line-breaks to HTML <code className="bg-cream px-1 rounded">&lt;p&gt;</code> blocks on publish (highly recommended)
                  </label>
                </div>
              </div>

              {/* Optional Affiliate Links */}
              <div className="bg-cream/15 p-4 border border-navy/10 space-y-3">
                <h4 className="font-mono text-[10px] uppercase text-navy font-bold tracking-wider">
                  Optional Purchase &amp; Instagram Meta Info
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-navy font-bold">Buy Here URL</label>
                    <input
                      type="url"
                      placeholder="https://www.amazon.com/..."
                      className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:outline-none"
                      value={buyUrl}
                      onChange={(e) => setBuyUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-navy font-bold">Instagram URL Reference</label>
                    <input
                      type="url"
                      placeholder="https://www.instagram.com/p/..."
                      className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:outline-none"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-navy font-bold">Likes Count</label>
                    <input
                      type="number"
                      placeholder="e.g. 145"
                      className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:outline-none"
                      value={likesCount}
                      onChange={(e) => setLikesCount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-navy font-bold">Comments Count</label>
                    <input
                      type="number"
                      placeholder="e.g. 21"
                      className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:outline-none"
                      value={commentsCount}
                      onChange={(e) => setCommentsCount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Admin passcode confirmation */}
              <div className="bg-amber/10 p-4 border-l-4 border-amber space-y-2">
                <label className="block text-xs font-mono font-bold uppercase text-navy">
                  Confirm Admin Passcode *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your administrative key..."
                  className="w-full border border-navy/15 bg-white p-2 font-sans text-xs text-navy focus:outline-none"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
              </div>

              {/* Reset to Curated Defaults */}
              <div className="pt-4 border-t border-navy/10 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <span className="block font-sans text-[11px] text-text-muted">
                    Need to restore the site reviews to original default database?
                  </span>
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="text-[10px] uppercase font-mono font-black text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset all site reviews
                    </button>
                  ) : (
                    <div className="bg-red-50 p-3 border border-red-200 space-y-2">
                      <p className="text-[10px] text-red-700 font-medium">
                        Are you sure? This will remove all custom added reviews and restore defaults.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setIsLoading(true);
                            setError(null);
                            try {
                              const response = await fetch("/api/reviews/reset", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ passcode }),
                              });
                              const data = await response.json();
                              if (!response.ok) {
                                throw new Error(data.error || "Reset failed.");
                              }
                              onReviewsUpdated(data.reviews);
                              setShowResetConfirm(false);
                              onClose();
                            } catch (err: any) {
                              setError(err.message || "Failed to reset reviews.");
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-1 cursor-pointer"
                        >
                          Confirm Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="bg-cream border border-navy/10 text-navy font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions for Mobile-sized */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy/10 lg:hidden">
              <button
                type="button"
                onClick={onClose}
                className="border border-navy/20 bg-white text-navy font-mono text-xs font-bold uppercase tracking-widest px-4 py-2.5 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isLoading || !title.trim()}
                className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-widest px-6 py-2.5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {writerMode === "edit" ? "Update Review" : "Publish Review"}
              </button>
            </div>
          </div>

          {/* Right Column: Live HTML Rendering Preview (5 cols on lg) */}
          <div className="lg:col-span-5 bg-cream/15 p-6 flex flex-col overflow-y-auto max-h-[90vh] lg:max-h-full">
            <div className="border-b border-navy/10 pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-navy">
                <Eye className="w-4 h-4 text-felt" />
                <h3 className="font-display text-sm font-black uppercase tracking-wider">
                  Live HTML Preview
                </h3>
              </div>
              <span className="font-mono text-[9px] uppercase text-text-light">
                Updates in real-time
              </span>
            </div>

            {/* Simulated Review Card/Detail Visual Layout */}
            <div className="bg-white border border-navy/15 shadow-md flex-1 flex flex-col justify-between overflow-hidden">
              <div>
                {/* Header Image box */}
                <div className="bg-cream aspect-[16/9] relative flex items-center justify-center overflow-hidden border-b border-navy/5">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover filter saturate-[0.85]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center space-y-1 text-navy/20 select-none p-4">
                      <span className="text-4xl block">{emoji || "🎲"}</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider font-bold">Image Cover Art Preview</span>
                    </div>
                  )}
                  
                  {/* Spoons Overlay Badge */}
                  <div className="absolute top-3 left-3 bg-navy/90 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider rounded-xs font-mono">
                    {spoons === "low" ? "🥄 Low Spoon" : spoons === "medium" ? "🥄🥄 Medium" : "🥄🥄🥄 High"}
                  </div>
                  
                  {/* Score Overlay Badge */}
                  <div className="absolute top-3 right-3 bg-amber text-navy font-bold text-xs px-2 py-0.5 font-mono flex items-center gap-0.5 shadow-sm">
                    <span>★</span>
                    <span>{score}/10</span>
                  </div>
                </div>

                {/* Review Header Detail */}
                <div className="bg-navy p-5 text-white">
                  <div className="font-mono text-[9px] text-amber tracking-wider uppercase flex items-center gap-2">
                    <span>{type || "genre"}</span>
                    <span>•</span>
                    <span>{players || "1-4"} players</span>
                    <span>•</span>
                    <span>{time || "30 mins"}</span>
                  </div>
                  <h2 className="font-display text-xl font-black mt-1 leading-tight text-white">
                    {title || "Unpublished Board Game Title"}
                  </h2>
                  <p className="text-white/60 text-xs italic font-sans mt-1">
                    {subtitle || "No subtitle written yet."}
                  </p>
                </div>

                {/* Body Content Preview with Rendered HTML */}
                <div className="p-5 space-y-4 text-navy">
                  
                  {/* Embedded Rich Content */}
                  <div 
                    className="prose text-xs text-text-muted space-y-3 leading-relaxed max-h-56 overflow-y-auto pr-1"
                    dangerouslySetInnerHTML={{ __html: getProcessedBody() || "<p className='italic text-text-light'>Start writing your review in the copy area to see the live HTML blog layout render here...</p>" }}
                  />

                  {/* Verdict Block */}
                  <div className="bg-navy/5 border-l-4 border-amber p-3.5 text-xs text-navy">
                    <div className="font-mono text-[8px] uppercase tracking-wider font-bold text-navy/50 mb-0.5">
                      The Verdict
                    </div>
                    <p className="font-sans italic font-medium">
                      "{verdict || "A stunning game that you should definitely try out!"}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags & Dates */}
              <div className="p-4 border-t border-navy/5 flex flex-wrap items-center justify-between gap-2 bg-cream/10 text-[9px] font-mono text-text-light">
                <span>📅 {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                <div className="flex gap-1">
                  {tagsInput ? tagsInput.split(",").slice(0, 3).map(tag => (
                    <span key={tag} className="bg-white border border-navy/5 text-text-muted px-1.5 py-0.5 rounded-sm lowercase">
                      #{tag.trim()}
                    </span>
                  )) : (
                    <span className="italic text-text-light/50">#tags-here</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions for Desktop */}
        <div className="bg-cream/10 p-4 border-t border-navy/10 hidden lg:flex items-center justify-between">
          <div className="text-xs text-text-light font-mono">
            {writerMode === "edit" ? "Modifying existing record" : "Ready to create new server record"}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-navy/20 bg-white hover:bg-cream text-navy font-mono text-xs font-bold uppercase tracking-widest px-5 py-2.5 cursor-pointer transition-colors"
            >
              Cancel &amp; Exit
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isLoading || !title.trim()}
              className="bg-navy hover:bg-navy-mid text-white hover:text-amber font-mono text-xs font-bold uppercase tracking-widest px-8 py-2.5 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber" />
                  {writerMode === "edit" ? "Save Review Updates" : "Publish Review Blog Entry"}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
