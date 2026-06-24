import React, { useState } from "react";
import { Review } from "../types";
import { X, Sparkles, AlertCircle, ArrowLeft, Loader2, Save, HelpCircle, RefreshCw, Upload, Search, FileJson, Check, FileText } from "lucide-react";

interface InstagramImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  onReviewsUpdated: (reviews: Review[]) => void;
  adminPasscode?: string;
}

type Mode = "add" | "replace";

interface ExtractedPost {
  caption: string;
  dateStr: string;
  timestamp: number;
  imageUrl?: string;
}

function extractInstagramPosts(json: any): ExtractedPost[] {
  let rawItems: any[] = [];
  
  if (Array.isArray(json)) {
    rawItems = json;
  } else if (json && typeof json === "object") {
    if (Array.isArray(json.posts)) {
      rawItems = json.posts;
    } else if (Array.isArray(json.media)) {
      rawItems = [json];
    } else {
      // Look for any array
      for (const key of Object.keys(json)) {
        if (Array.isArray(json[key])) {
          rawItems = json[key];
          break;
        }
      }
    }
  }

  const extracted: ExtractedPost[] = [];

  for (const item of rawItems) {
    let caption = "";
    let timestamp = 0;
    let imageUrl = "";

    // Extract caption
    if (item.title && typeof item.title === "string") {
      caption = item.title;
    }
    
    if (item.media && Array.isArray(item.media) && item.media.length > 0) {
      const firstMedia = item.media[0];
      if (!caption && firstMedia.title && typeof firstMedia.title === "string") {
        caption = firstMedia.title;
      }
      if (!caption && firstMedia.caption && typeof firstMedia.caption === "string") {
        caption = firstMedia.caption;
      }
      if (firstMedia.uri && typeof firstMedia.uri === "string") {
        imageUrl = firstMedia.uri;
      }
      if (firstMedia.creation_timestamp) {
        timestamp = Number(firstMedia.creation_timestamp);
      }
    }

    if (item.creation_timestamp) {
      timestamp = Number(item.creation_timestamp);
    } else if (item.date) {
      timestamp = Math.floor(new Date(item.date).getTime() / 1000);
    }

    if (!caption.trim()) {
      continue;
    }

    const dateStr = timestamp 
      ? new Date(timestamp * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      : "Unknown Date";

    extracted.push({
      caption,
      dateStr,
      timestamp: timestamp || 0,
      imageUrl: imageUrl || ""
    });
  }

  return extracted.sort((a, b) => b.timestamp - a.timestamp);
}

export default function InstagramImportModal({
  isOpen,
  onClose,
  reviews,
  onReviewsUpdated,
  adminPasscode = "",
}: InstagramImportModalProps) {
  const [activeStep, setActiveStep] = useState<"paste" | "edit">("paste");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [initialBuyUrl, setInitialBuyUrl] = useState("");
  const [importMode, setImportMode] = useState<Mode>("add");
  const [targetReviewId, setTargetReviewId] = useState<number>(reviews[0]?.id || 1);
  const [passcode, setPasscode] = useState(adminPasscode);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // New Instagram Data Export States
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const [exportedPosts, setExportedPosts] = useState<ExtractedPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for editable draft
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [type, setType] = useState("strategy");
  const [players, setPlayers] = useState("");
  const [time, setTime] = useState("");
  const [score, setScore] = useState<number>(8);
  const [verdict, setVerdict] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [emoji, setEmoji] = useState("🎲");
  const [spoons, setSpoons] = useState<"low" | "medium" | "high">("medium");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [buyUrl, setBuyUrl] = useState("");
  const [likesCount, setLikesCount] = useState<number | "">("");
  const [commentsCount, setCommentsCount] = useState<number | "">("");

  if (!isOpen) return null;

  // Handle Gemini parsing
  const handleAnalyze = async () => {
    if (!caption.trim()) {
      setError("Please paste an Instagram caption first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/parse-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageUrl }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze caption.");
      }

      const parsed: Review = data.review;

      // Populate draft editor form
      setTitle(parsed.title || "");
      setSubtitle(parsed.subtitle || "");
      setType(parsed.type || "strategy");
      setPlayers(parsed.players || "2-4");
      setTime(parsed.time || "30-60 min");
      setScore(Number(parsed.score) || 8);
      setVerdict(parsed.verdict || "");
      setBody(parsed.body || "");
      setTagsInput(parsed.tags ? parsed.tags.join(", ") : "");
      setEmoji(parsed.emoji || "🎲");
      setSpoons(parsed.spoons || "medium");
      setFormImageUrl(parsed.image || "");
      setInstagramUrl(parsed.instagramUrl || "");
      setBuyUrl(parsed.buyUrl || initialBuyUrl || "");
      setLikesCount(parsed.likesCount !== undefined ? parsed.likesCount : "");
      setCommentsCount(parsed.commentsCount !== undefined ? parsed.commentsCount : "");

      setActiveStep("edit");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while calling the parsing API.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError("Game title is required.");
      return;
    }

    if (!passcode.trim()) {
      setError("Admin passcode is required to publish review to the hosted server.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const reviewPayload: Partial<Review> = {
      title,
      subtitle,
      type: type.toLowerCase(),
      players,
      time,
      score,
      verdict,
      body,
      tags: tagsInput.split(",").map(t => t.trim()).filter(t => t !== ""),
      date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      featured: false,
      emoji,
      spoons,
      image: formImageUrl || "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=1200",
      instagramUrl: instagramUrl.trim() || undefined,
      buyUrl: buyUrl.trim() || undefined,
      likesCount: likesCount === "" ? undefined : Number(likesCount),
      commentsCount: commentsCount === "" ? undefined : Number(commentsCount),
    };

    try {
      const url = importMode === "replace" ? `/api/reviews/${targetReviewId}` : "/api/reviews";
      const method = importMode === "replace" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, review: reviewPayload }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to publish review. Check your admin passcode.");
      }

      // Update parent list
      onReviewsUpdated(data.reviews);

      // Reset states and close
      setCaption("");
      setImageUrl("");
      setInitialBuyUrl("");
      setInstagramUrl("");
      setLikesCount("");
      setCommentsCount("");
      setPasscode("");
      setActiveStep("paste");
      setError(null);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unauthorized: Check that your passcode is correct.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-navy/10 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative rounded-none">
        
        {/* Header */}
        <div className="bg-navy p-4 text-white flex items-center justify-between border-b-2 border-amber">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber animate-pulse" />
            <span className="font-mono text-sm uppercase tracking-wider font-bold">
              Instagram Review Importer (Gemini AI Parser)
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 border-l-4 border-red-500 flex items-start gap-2 font-sans text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold">Error:</span> {error}
              </div>
            </div>
          )}

          {activeStep === "paste" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Form / Browse Side */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Tab Switcher */}
                <div className="flex border-b border-navy/10 font-mono text-xs uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("upload");
                      setSuccessMessage(null);
                    }}
                    className={`flex-1 py-3 px-4 text-center border-b-2 font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "upload"
                        ? "border-amber text-navy bg-cream/10 font-bold"
                        : "border-transparent text-text-muted hover:text-navy hover:border-navy/20"
                    }`}
                  >
                    <FileJson className="w-4 h-4 text-amber" /> Option 1: Instagram Export (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("manual");
                      setSuccessMessage(null);
                    }}
                    className={`flex-1 py-3 px-4 text-center border-b-2 font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "manual"
                        ? "border-amber text-navy bg-cream/10 font-bold"
                        : "border-transparent text-text-muted hover:text-navy hover:border-navy/20"
                    }`}
                  >
                    <FileText className="w-4 h-4 text-navy/60" /> Option 2: Copy/Paste Caption
                  </button>
                </div>

                {successMessage && (
                  <div className="bg-emerald-50 text-emerald-800 p-3.5 border-l-4 border-emerald-500 flex items-start gap-2 font-sans text-xs">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <div>{successMessage}</div>
                  </div>
                )}

                {activeTab === "upload" ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-navy">Option 1: Scrape &amp; Browse Downloaded Instagram Data</h3>
                      <p className="text-text-muted text-xs mt-1 font-sans leading-relaxed">
                        Avoid manually copying captions. Drag and drop or upload your Instagram data file (e.g. <code className="font-mono bg-cream px-1">your_posts_1.json</code> or <code className="font-mono bg-cream px-1">posts_1.json</code>) to search and import posts directly.
                      </p>
                    </div>

                    {exportedPosts.length === 0 ? (
                      <div className="border-2 border-dashed border-navy/20 bg-cream/5 p-8 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center text-navy/45">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-navy font-mono uppercase tracking-wider">Drag &amp; Drop your JSON export file here</p>
                          <p className="text-[10px] text-text-muted font-sans">Accepts posts_1.json or any Instagram data export JSON</p>
                        </div>
                        <label className="inline-block bg-navy hover:bg-navy-mid text-white font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 cursor-pointer transition-colors">
                          Choose JSON File
                          <input
                            type="file"
                            accept=".json"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                try {
                                  const parsed = JSON.parse(event.target?.result as string);
                                  const posts = extractInstagramPosts(parsed);
                                  if (posts.length === 0) {
                                    setError("Could not find any Instagram posts with captions in this file. Please make sure it is a valid posts_1.json.");
                                  } else {
                                    setExportedPosts(posts);
                                    setError(null);
                                    setSuccessMessage(`Successfully loaded ${posts.length} Instagram posts!`);
                                  }
                                } catch (err) {
                                  setError("Failed to parse JSON. Please check that the file is a valid JSON export.");
                                }
                              };
                              reader.readAsText(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-navy/5 p-2.5 border border-navy/10 text-xs">
                          <span className="font-mono text-navy font-medium">Loaded <strong className="text-amber-800 font-bold">{exportedPosts.length}</strong> posts</span>
                          <button
                            type="button"
                            onClick={() => {
                              setExportedPosts([]);
                              setSelectedPostIndex(null);
                              setSuccessMessage(null);
                            }}
                            className="text-[10px] font-mono font-bold uppercase text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            Reset &amp; Upload another file
                          </button>
                        </div>

                        {/* Search bar */}
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-navy/30" />
                          <input
                            type="text"
                            placeholder="Search your Instagram posts (e.g. game name, caption keywords)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-navy/15 pl-9 pr-3 py-2 font-sans text-xs text-navy focus:outline-none focus:border-amber bg-white"
                          />
                        </div>

                        {/* Scrollable list of posts */}
                        <div className="border border-navy/15 max-h-56 overflow-y-auto bg-white divide-y divide-navy/10">
                          {(() => {
                            const filtered = exportedPosts.filter(p =>
                              p.caption.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            if (filtered.length === 0) {
                              return (
                                <p className="text-center p-6 text-xs text-text-muted italic font-sans">
                                  No posts match your search query.
                                </p>
                              );
                            }

                            return filtered.map((post, index) => {
                              // Find actual index in exportedPosts array
                              const realIndex = exportedPosts.findIndex(p => p.caption === post.caption && p.timestamp === post.timestamp);
                              const isSelected = selectedPostIndex === realIndex;
                              const previewText = post.caption.length > 100 
                                ? post.caption.substring(0, 100) + "..." 
                                : post.caption;

                              return (
                                <div
                                  key={realIndex}
                                  onClick={() => setSelectedPostIndex(realIndex)}
                                  className={`p-3 text-left transition-colors cursor-pointer flex flex-col gap-1.5 ${
                                    isSelected 
                                      ? "bg-cream/40 border-l-4 border-amber" 
                                      : "hover:bg-cream/15"
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                                    <span>📅 {post.dateStr}</span>
                                    {post.imageUrl && (
                                      <span className="bg-navy/5 px-1.5 py-0.5 rounded text-[8px] tracking-wide uppercase font-bold text-navy/60">
                                        With Image
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-navy line-clamp-2 font-sans">{previewText}</p>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {selectedPostIndex !== null && (
                          <div className="bg-cream/20 p-4 border border-navy/15 space-y-3">
                            <div className="flex justify-between items-center border-b border-navy/10 pb-1.5">
                              <span className="text-[10px] font-mono uppercase font-bold text-navy">
                                Selected Post Preview ({exportedPosts[selectedPostIndex].dateStr})
                              </span>
                              <span className="text-[9px] font-sans text-text-muted">
                                Character length: {exportedPosts[selectedPostIndex].caption.length}
                              </span>
                            </div>
                            <div className="max-h-24 overflow-y-auto text-xs text-navy font-sans bg-white p-2.5 border border-navy/5 leading-relaxed whitespace-pre-wrap">
                              {exportedPosts[selectedPostIndex].caption}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const selected = exportedPosts[selectedPostIndex];
                                setCaption(selected.caption);
                                if (selected.imageUrl && !selected.imageUrl.startsWith("media/")) {
                                  setImageUrl(selected.imageUrl);
                                } else {
                                  setImageUrl("");
                                }
                                setActiveTab("manual");
                                setSuccessMessage("Successfully loaded selected post caption into the analyzer form below!");
                              }}
                              className="w-full bg-felt hover:bg-felt/90 text-white font-mono text-[10px] font-bold uppercase tracking-wider py-2 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-amber" /> Load selected post into manual editor
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-navy">Option 2: Copy &amp; Paste Caption</h3>
                      <p className="text-text-muted text-xs mt-1 font-sans leading-relaxed">
                        Paste the raw text caption from your Instagram post. The Gemini 3.5 Flash model parses the game info, sets the ratings, and structures your post paragraphs into professional web review articles.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-semibold uppercase text-navy">
                        Instagram Post Caption *
                      </label>
                      <textarea
                        rows={8}
                        className="w-full border border-navy/15 p-3 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-cream/10"
                        placeholder="Example:
Just finished playing Everdell! 🌳✨ 
This is a stunning worker-placement game. Every decision feels impactful. We played with 3 players in about 60 mins.
Score: 9/10! 
Cognitive energy is medium (moderate brain load, lovely cozy vibe). #boardgames #everdell"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-semibold uppercase text-navy">
                        Optional Photo/Image URL
                      </label>
                      <input
                        type="url"
                        className="w-full border border-navy/15 p-2.5 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-cream/10"
                        placeholder="https://images.unsplash.com/photo... (or Instagram image URL)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-semibold uppercase text-navy">
                        Optional Buy Here Link / Affiliate URL
                      </label>
                      <input
                        type="url"
                        className="w-full border border-navy/15 p-2.5 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-cream/10"
                        placeholder="e.g. https://www.amazon.com/..."
                        value={initialBuyUrl}
                        onChange={(e) => setInitialBuyUrl(e.target.value)}
                      />
                    </div>

                    <div className="bg-cream/20 p-4 border border-navy/5 space-y-3">
                      <label className="block text-xs font-mono font-semibold uppercase text-navy">
                        Import Destination
                      </label>
                      
                      <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center gap-2 text-sm text-navy font-sans cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === "add"}
                            onChange={() => setImportMode("add")}
                            className="text-amber focus:ring-amber"
                          />
                          Add as a new review
                        </label>
                        <label className="flex items-center gap-2 text-sm text-navy font-sans cursor-pointer">
                          <input
                            type="radio"
                            name="importMode"
                            checked={importMode === "replace"}
                            onChange={() => setImportMode("replace")}
                            className="text-amber focus:ring-amber"
                          />
                          Replace an existing review
                        </label>
                      </div>

                      {importMode === "replace" && (
                        <div className="pt-2 space-y-2">
                          <label className="block text-[10px] font-mono uppercase text-text-muted mb-1">
                            Select Review to Overwrite
                          </label>
                          <div className="flex gap-2">
                            <select
                              className="flex-1 border border-navy/15 bg-white p-2 font-sans text-sm text-navy focus:outline-none"
                              value={targetReviewId}
                              onChange={(e) => setTargetReviewId(Number(e.target.value))}
                            >
                              {reviews.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.title} ({r.type})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const selected = reviews.find(r => r.id === targetReviewId);
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
                                  setFormImageUrl(selected.image || "");
                                  setInstagramUrl(selected.instagramUrl || "");
                                  setBuyUrl(selected.buyUrl || "");
                                  setLikesCount(selected.likesCount !== undefined ? selected.likesCount : "");
                                  setCommentsCount(selected.commentsCount !== undefined ? selected.commentsCount : "");
                                  setActiveStep("edit");
                                  setError(null);
                                }
                              }}
                              className="bg-navy hover:bg-navy-mid text-white font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-2 cursor-pointer transition-colors shrink-0"
                            >
                              Load Fields
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleAnalyze}
                      className="w-full bg-navy text-white hover:bg-navy-mid font-mono text-xs font-bold uppercase tracking-widest py-3 hover:text-amber transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gemini is parsing post details...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber" />
                          Analyze &amp; Generate Draft
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Informative Help Guide */}
              <div className="bg-cream/40 p-5 space-y-4 border border-navy/5 font-sans text-xs text-navy leading-relaxed h-fit">
                <div className="flex items-center gap-2 text-amber">
                  <HelpCircle className="w-5 h-5 shrink-0" />
                  <span className="font-mono font-bold tracking-wider uppercase text-[10px]">Import Tips</span>
                </div>
                <div className="space-y-3">
                  <p>
                    <strong className="text-navy">Auto-Deduction:</strong> Our server-side parser identifies keys in your post:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-muted">
                    <li>Scores like <span className="font-mono text-navy font-bold">9/10</span> or <span className="font-mono text-navy font-bold">8.5</span>.</li>
                    <li>Spoon level based on keywords: <span className="italic">"cozy"</span>, <span className="italic">"easy rules"</span> vs. <span className="italic">"brain-burner"</span>.</li>
                    <li>Optimal players and average duration.</li>
                  </ul>
                  <p className="border-t border-navy/10 pt-3">
                    <strong className="text-navy">Reset to Defaults:</strong> Need to restore the original 8 curated board game reviews? Use the quick restore trigger below:
                  </p>
                  
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold text-red-600 hover:text-red-800 transition-colors mt-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset site reviews
                    </button>
                  ) : (
                    <div className="mt-2 bg-red-50 p-3 border border-red-200 space-y-2">
                      <p className="text-[10px] text-red-700 font-medium">
                        Are you sure? This will remove all custom imported/edited reviews and restore defaults.
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
                                body: JSON.stringify({ passcode: adminPasscode }),
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
          ) : (
            /* STEP 2: EDITING DRAFT */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Form Fields - 3 Cols */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between border-b border-navy/10 pb-2">
                  <h3 className="font-display text-lg font-bold text-navy flex items-center gap-1.5">
                    Review Metadata Draft
                  </h3>
                  <button
                    onClick={() => setActiveStep("paste")}
                    className="font-mono text-[10px] text-text-muted hover:text-navy uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to caption
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Game Title</label>
                    <input
                      type="text"
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Subtitle / Tagline</label>
                    <input
                      type="text"
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Game Type</label>
                    <select
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-white"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="strategy">Strategy</option>
                      <option value="party">Party</option>
                      <option value="cooperative">Cooperative</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Spoons Level</label>
                    <select
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none focus:border-amber bg-white"
                      value={spoons}
                      onChange={(e) => setSpoons(e.target.value as any)}
                    >
                      <option value="low">Low Spoon (Easy)</option>
                      <option value="medium">Medium Spoon (Moderate)</option>
                      <option value="high">High Spoon (Brain-Burner)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Players</label>
                    <input
                      type="text"
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none"
                      placeholder="e.g. 1-4"
                      value={players}
                      onChange={(e) => setPlayers(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Play Time</label>
                    <input
                      type="text"
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none"
                      placeholder="e.g. 45-60 min"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Emoji</label>
                    <input
                      type="text"
                      className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none text-center"
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none"
                    placeholder="cooperative, deck building, worker placement"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Verdict</label>
                  <input
                    type="text"
                    className="w-full border border-navy/15 p-2 font-sans text-sm text-navy focus:outline-none"
                    placeholder="Short summary rating description"
                    value={verdict}
                    onChange={(e) => setVerdict(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Review Body Copy (HTML Paragraphs)</label>
                  <textarea
                    rows={6}
                    className="w-full border border-navy/15 p-3 font-mono text-xs text-navy focus:outline-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Cover Image URL</label>
                  <input
                    type="text"
                    className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:outline-none"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-navy font-bold">Buy/Affiliate Link</label>
                  <input
                    type="text"
                    className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:outline-none"
                    placeholder="e.g. https://www.amazon.com/dp/B08XYZ123"
                    value={buyUrl}
                    onChange={(e) => setBuyUrl(e.target.value)}
                  />
                </div>

                <div className="border-t border-navy/10 pt-4 mt-4 space-y-4">
                  <h4 className="font-mono text-[10px] uppercase text-navy font-black tracking-widest">Instagram Meta Information</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">Instagram Post URL</label>
                    <input
                      type="text"
                      className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:outline-none"
                      placeholder="e.g. https://www.instagram.com/p/C_abc123/"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-navy font-bold">Likes Count</label>
                      <input
                        type="number"
                        className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:outline-none"
                        placeholder="e.g. 142"
                        value={likesCount}
                        onChange={(e) => setLikesCount(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-navy font-bold">Comments Count</label>
                      <input
                        type="number"
                        className="w-full border border-navy/15 p-2 font-sans text-xs text-navy focus:outline-none"
                        placeholder="e.g. 18"
                        value={commentsCount}
                        onChange={(e) => setCommentsCount(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Review Card Preview - 2 Cols */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-mono text-xs uppercase tracking-wider text-navy font-bold border-b border-navy/10 pb-2 flex items-center justify-between">
                  <span>Live Preview</span>
                  <span className="bg-amber text-navy text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                    {importMode === "replace" ? "OVERWRITE" : "NEW"}
                  </span>
                </h4>

                <div className="bg-white border border-navy/15 shadow-md overflow-hidden flex flex-col h-fit">
                  <div className="h-44 bg-cream relative overflow-hidden flex items-center justify-center">
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=1200";
                        }}
                      />
                    ) : (
                      <span className="text-4xl">{emoji}</span>
                    )}
                    <span className="absolute top-2 right-2 bg-navy/80 text-white font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold">
                      {type}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-amber font-bold flex items-center gap-1">
                        <span>{emoji}</span>
                        <span>{spoons.toUpperCase()} SPOON</span>
                      </span>
                    </div>

                    <h5 className="font-display font-bold text-navy text-lg tracking-tight line-clamp-1">{title || "Untitled"}</h5>
                    <p className="text-text-muted text-xs italic line-clamp-2">{subtitle || "No tagline added."}</p>
                    
                    <div className="flex flex-wrap gap-1 pt-1">
                      {players && (
                        <span className="font-mono text-[9px] bg-cream px-1.5 py-0.5 text-text-muted">{players} Players</span>
                      )}
                      {time && (
                        <span className="font-mono text-[9px] bg-cream px-1.5 py-0.5 text-text-muted">{time}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="space-y-1 bg-amber/5 p-3 border border-amber/15">
                    <label className="block text-[10px] font-mono uppercase text-navy font-bold">
                      Admin Passcode *
                    </label>
                    <input
                      type="password"
                      className="w-full border border-navy/15 p-2 font-mono text-xs text-navy focus:outline-none focus:border-amber bg-white"
                      placeholder="Enter secret passcode to publish"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                    />
                    <p className="text-[9px] text-text-muted mt-0.5">
                      Enter passcode to authorize. Default preview passcode is <code className="font-mono bg-cream px-1">admin123</code>.
                    </p>
                  </div>

                  <button
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="w-full bg-felt hover:bg-felt/90 text-white font-mono text-xs font-bold uppercase tracking-widest py-3 hover:text-amber transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publishing Review...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Confirm &amp; Publish Review
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-text-muted">
                    {importMode === "replace" 
                      ? "Replacing review: " + (reviews.find(r => r.id === targetReviewId)?.title || "Selected")
                      : "Adding as a fresh review in your collection."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
