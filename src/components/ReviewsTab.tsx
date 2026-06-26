import React, { useState } from "react";
import { Review } from "../types";
import { Sparkles, Dice5, SlidersHorizontal, Plus, Camera, Search, X } from "lucide-react";
import ReviewWriterModal from "./ReviewWriterModal";
import ReplaceImageModal from "./ReplaceImageModal";
import ImageCarousel from "./ImageCarousel";

interface ReviewsTabProps {
  reviews: Review[];
  onOpenReview: (id: number) => void;
  onReviewsUpdated?: (reviews: Review[]) => void;
  isAdminUnlocked?: boolean;
  adminPasscode?: string;
}

export default function ReviewsTab({
  reviews,
  onOpenReview,
  onReviewsUpdated,
  isAdminUnlocked = false,
  adminPasscode = "",
}: ReviewsTabProps) {
  const [activeCategory, setActiveFilterCategory] = useState("all");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeSpoons, setActiveSpoons] = useState<string | null>(null);
  const [lastRolledId, setLastRolledId] = useState<number | null>(null);
  const [imageReplacementReview, setImageReplacementReview] = useState<Review | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoExists, setLogoExists] = useState(true);

  const SPOON_MAP = { low: "⚬ 🥄", medium: "⚬ 🥄🥄", high: "⚬ 🥄🥄🥄" };

  const featuredReview = reviews.find((r) => r.featured) || reviews[0];

  const getReviewImagesList = (r: Review | undefined) => {
    if (!r) return [];
    const list: string[] = [];
    if (r.image && r.image.trim() !== "") {
      list.push(r.image);
    }
    if (r.images && r.images.length > 0) {
      r.images.forEach((img) => {
        if (img && img.trim() !== "" && img !== r.image) {
          list.push(img);
        }
      });
    }
    return list;
  };

  // Filters logic
  const handleCategoryFilter = (category: string) => {
    setActiveFilterCategory(category);
    setActiveSpoons(null); // Reset spoons filter when choosing category
  };

  const handleSpoonsFilter = (spoonCount: string) => {
    setActiveSpoons(spoonCount);
    setActiveFilterCategory("all"); // Reset category filter when choosing spoons
  };

  const rollRandom = () => {
    if (reviews.length === 0) return;
    if (reviews.length === 1) {
      onOpenReview(reviews[0].id);
      return;
    }
    
    // Filter out the last rolled review to ensure a different one is chosen each time
    const pool = lastRolledId !== null 
      ? reviews.filter((r) => r.id !== lastRolledId)
      : reviews;
      
    const randomReview = pool[Math.floor(Math.random() * pool.length)];
    setLastRolledId(randomReview.id);
    onOpenReview(randomReview.id);
  };

  const filteredReviews = reviews.filter((r) => {
    // Hide featured from the general list as in original design, unless filtered
    if (r.id === featuredReview.id && activeCategory === "all" && !activeSpoons && searchQuery.trim() === "") {
      return false;
    }
    if (activeSpoons) {
      if (r.spoons !== activeSpoons) return false;
    }
    if (activeCategory !== "all") {
      if (r.type.toLowerCase() !== activeCategory.toLowerCase()) return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const titleMatch = r.title.toLowerCase().includes(q);
      const genreMatch = r.type.toLowerCase().includes(q);
      const tagMatch = r.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!titleMatch && !genreMatch && !tagMatch) return false;
    }
    return true;
  });

  return (
    <div className="w-full">
      
      {/* ── HERO BANNER ── */}
      <section 
        className="p-6 sm:p-8 md:p-16 text-center rounded-none relative overflow-hidden bg-stripe-pattern border-b-4 border-amber w-full flex items-center justify-center min-h-[424px]"
        style={{ backgroundColor: '#691563' }}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
          {logoExists && (
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden shrink-0 select-none bg-[#f2bd5a] shadow-2xl">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-cover scale-[1.15]"
                referrerPolicy="no-referrer"
                onError={() => setLogoExists(false)}
              />
            </div>
          )}
          <div className="space-y-4 max-w-2xl">
            <div className="font-mono text-[10px] sm:text-xs text-amber tracking-wider sm:tracking-[0.15em] uppercase flex items-center justify-center md:justify-start gap-2 sm:gap-3">
              <span className="w-6 sm:w-10 h-[1px] bg-amber/50 md:hidden"></span>
              BOARD GAME REVIEWS &amp; COLLECTIONS
              <span className="w-6 sm:w-10 h-[1px] bg-amber/50"></span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight">
              Roll the dice.<br />
              <em className="text-amber italic font-normal">Read our take.</em>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm md:text-base max-w-md mx-auto md:mx-0 font-sans leading-relaxed">
              Quick hot takes, collection suggestions, and game night opinions from someone who owns too many boxes. For giveaways, fun hashtag posts and casual posting - follow us on Instagram!
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <button
                onClick={rollRandom}
                className="bg-amber text-navy font-mono text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-amber-light transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
              >
                <Dice5 className="w-4 h-4 animate-spin-slow" />
                Surprise me
              </button>

              {onReviewsUpdated && isAdminUnlocked && (
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="bg-navy hover:bg-navy-mid text-white border-2 border-white/20 font-mono text-xs font-bold uppercase tracking-widest px-6 py-2.5 hover:text-amber transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-amber" />
                  Write Review / Blog Post
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
        {/* ── FEATURED REVIEW SECTION ── */}
        {featuredReview && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 max-w-7xl mx-auto">
              <span className="flex-1 h-[1px] bg-navy/12"></span>
              <div className="hex-pip-shape w-2.5 h-2.5 bg-amber"></div>
              <span className="font-mono text-xs uppercase tracking-widest text-text-muted px-3">
                LATEST OVERVIEW
              </span>
              <div className="hex-pip-shape w-2.5 h-2.5 bg-amber"></div>
              <span className="flex-1 h-[1px] bg-navy/12"></span>
            </div>

            <div className="bg-white grid grid-cols-1 md:grid-cols-2 max-w-7xl mx-auto min-h-[380px] shadow-lg border border-navy/12">
              {/* Image Box */}
              <div className="bg-cream aspect-[16/9] md:aspect-auto md:h-full relative flex items-center justify-center overflow-hidden group/featured w-full">
                <ImageCarousel
                  images={getReviewImagesList(featuredReview)}
                  fallbackEmoji={featuredReview.emoji}
                  className="absolute inset-0 w-full h-full"
                  aspectRatio="h-full w-full absolute inset-0"
                />
                
                {/* Admin Replace Image button overlay */}
                {isAdminUnlocked && onReviewsUpdated && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/featured:opacity-100 flex items-center justify-center transition-all duration-300 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageReplacementReview(featuredReview);
                      }}
                      className="bg-navy hover:bg-navy-mid border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm flex items-center gap-2 cursor-pointer shadow-xl transform hover:scale-105 transition-all"
                    >
                      <Camera className="w-4 h-4 text-amber" />
                      Replace Cover
                    </button>
                  </div>
                )}
              </div>

              {/* Content Box */}
              <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-between text-navy space-y-6">
                <div className="space-y-3">
                  <div className="text-felt font-mono text-xs tracking-widest uppercase flex items-center gap-2 font-bold">
                    <span>★</span>
                    <span>Featured Overview</span>
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-black leading-tight text-navy">
                    {featuredReview.title}
                  </h2>
                  <p className="text-text-muted text-sm italic font-sans leading-relaxed">
                    {featuredReview.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="font-mono text-[10px] tracking-wider uppercase bg-cream px-2 py-1 text-text-muted font-semibold border border-navy/5">
                      {featuredReview.type}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider uppercase bg-cream px-2 py-1 text-text-muted font-semibold border border-navy/5">
                      {featuredReview.players} Players
                    </span>
                    <span className="font-mono text-[10px] tracking-wider uppercase bg-cream px-2 py-1 text-text-muted font-semibold border border-navy/5">
                      {featuredReview.time}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider uppercase bg-amber/20 px-2 py-1 text-navy font-bold">
                      {SPOON_MAP[featuredReview.spoons]} Spoons
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-end mt-4">
                  <button
                    onClick={() => onOpenReview(featuredReview.id)}
                    className="font-mono text-xs font-bold uppercase tracking-widest text-navy hover:text-amber flex items-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    Read review
                    <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* ── ALL REVIEWS SECTION ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 max-w-7xl mx-auto" id="reviews-grid-section">
          <span className="flex-1 h-[1px] bg-navy/12"></span>
          <div className="hex-pip-shape w-2.5 h-2.5 bg-amber"></div>
          <span className="font-mono text-xs uppercase tracking-widest text-text-muted px-3">
            ALL REVIEWS
          </span>
          <div className="hex-pip-shape w-2.5 h-2.5 bg-amber"></div>
          <span className="flex-1 h-[1px] bg-navy/12"></span>
        </div>

        {/* Spoon Legend */}
        <div className="max-w-7xl mx-auto flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-muted bg-cream p-3 border border-navy/5 font-sans leading-relaxed">
          <span className="font-mono font-bold uppercase text-[10px] text-text-light flex items-center gap-1.5">
            🥄 Spoon rating guide:
          </span>
          <span><strong>🥄 Low</strong> — Easy rules, quick setup, minimal memory tracking.</span>
          <span><strong>🥄🥄 Medium</strong> — Some rules overhead, moderate setups.</span>
          <span><strong>🥄🥄🥄 High</strong> — Heavy rules, long setups, high memory tracking load.</span>
        </div>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <input
              type="text"
              id="game-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by game title, genre (e.g. strategy, party, cooperative), or tags..."
              className="w-full bg-white border border-navy/15 text-navy font-sans text-sm px-10 py-3 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 transition-all placeholder:text-text-light/40"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40">
              <Search className="w-4 h-4" />
            </div>
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy cursor-pointer p-1"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-y-3 gap-x-2 bg-white border border-navy/10 p-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-light pl-2 font-bold flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Type
          </span>
          <div className="flex flex-wrap gap-1.5">
            {["all", "strategy", "party", "cooperative", "family", "thematic"].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`font-mono text-[11px] px-3 py-1 cursor-pointer transition-colors border capitalize ${
                  activeCategory === cat && !activeSpoons
                    ? "bg-navy text-amber border-navy font-bold"
                    : "bg-transparent text-text-muted border-navy/15 hover:border-navy hover:text-navy"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="w-[1px] h-6 bg-navy/15 mx-2 hidden sm:block"></span>

          <span className="font-mono text-[10px] uppercase tracking-wider text-text-light pl-2 font-bold">
            Spoons
          </span>
          <div className="flex flex-wrap gap-1.5">
            {["low", "medium", "high"].map((sp) => (
              <button
                key={sp}
                onClick={() => handleSpoonsFilter(sp)}
                className={`font-mono text-[11px] px-3 py-1 cursor-pointer transition-colors border ${
                  activeSpoons === sp
                    ? "bg-navy text-amber border-navy font-bold"
                    : "bg-transparent text-text-muted border-navy/15 hover:border-navy hover:text-navy"
                }`}
              >
                {sp === "low" ? "🥄 Low" : sp === "medium" ? "🥄🥄 Med" : "🥄🥄🥄 High"}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              onClick={() => onOpenReview(r.id)}
              className="bg-white border border-navy/12 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative"
            >
              {/* Card Image */}
              <div className="bg-cream aspect-[16/9] relative flex items-center justify-center overflow-hidden group/card w-full">
                <ImageCarousel
                  images={getReviewImagesList(r)}
                  fallbackEmoji={r.emoji}
                  className="absolute inset-0 w-full h-full"
                  aspectRatio="h-full w-full absolute inset-0"
                  showControls={false}
                />
                {/* Spoon badge absolute positioning */}
                <div className="absolute top-3 left-3 bg-navy/85 backdrop-blur-sm px-2 py-0.5 rounded-sm text-[10px] text-white/90 font-bold shadow-sm">
                  {r.spoons === "low" ? "🥄" : r.spoons === "medium" ? "🥄🥄" : "🥄🥄🥄"}
                </div>

                {/* Admin Replace Image Button on Card Hover */}
                {isAdminUnlocked && onReviewsUpdated && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 flex items-center justify-center transition-all duration-300 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Stop from opening the review modal
                        setImageReplacementReview(r);
                      }}
                      className="bg-navy hover:bg-navy-mid border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-md transform hover:scale-105 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber" />
                      Replace Cover
                    </button>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-felt font-bold">
                      {r.type}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-navy leading-tight">
                    {r.title}
                  </h3>
                  <p className="text-text-muted text-xs font-sans leading-relaxed">
                    {r.subtitle}
                  </p>
                </div>

                <div className="border-t border-navy/5 pt-3 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-text-light">{r.date}</span>
                  <div className="flex gap-1">
                    {r.tags.slice(0, 2).map((t) => (
                      <span key={t} className="bg-cream text-text-muted px-1.5 py-0.5 rounded-sm lowercase">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="col-span-full p-12 text-center text-text-light font-mono text-xs uppercase tracking-widest bg-white border border-navy/10">
              No reviews match the selected filter.
            </div>
          )}
        </div>
      </section>

      {/* Review Writer Modal */}
      {isImportOpen && onReviewsUpdated && (
        <ReviewWriterModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          reviews={reviews}
          onReviewsUpdated={onReviewsUpdated}
          adminPasscode={adminPasscode}
        />
      )}

      {/* Admin Replace Image Modal */}
      {imageReplacementReview && adminPasscode && onReviewsUpdated && (
        <ReplaceImageModal
          isOpen={!!imageReplacementReview}
          onClose={() => setImageReplacementReview(null)}
          review={imageReplacementReview}
          adminPasscode={adminPasscode}
          onSuccess={onReviewsUpdated}
        />
      )}
    </div>
  </div>
);
}
