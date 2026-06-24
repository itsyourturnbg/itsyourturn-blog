import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ImageCarouselProps {
  images?: string[];
  fallbackEmoji?: string;
  className?: string;
  aspectRatio?: string; // e.g., "aspect-[16/9]" or "h-full w-full absolute inset-0"
  showControls?: boolean;
  objectFit?: "object-cover" | "object-contain";
}

export default function ImageCarousel({
  images = [],
  fallbackEmoji = "🎲",
  className = "",
  aspectRatio = "aspect-[16/9]",
  showControls = true,
  objectFit = "object-cover",
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  // Clean the images array to remove empty strings
  const validImages = images.filter((img) => img && img.trim() !== "");

  if (validImages.length === 0) {
    return (
      <div className={`bg-cream flex flex-col items-center justify-center text-center p-8 select-none ${aspectRatio} ${className}`}>
        <span className="text-6xl mb-2 filter drop-shadow-sm">{fallbackEmoji}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-light">
          No cover illustration
        </span>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  return (
    <div className={`relative overflow-hidden bg-cream ${aspectRatio} ${className}`}>
      {/* Slides with smooth motion animations */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: "easeInOut", duration: 0.35 }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={validImages[currentIndex]}
              alt={`Slide ${currentIndex + 1}`}
              className={`w-full h-full filter saturate-[0.85] contrast-[1.03] ${
                objectFit === "object-contain" ? "object-contain bg-slate-950" : "object-cover"
              }`}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

      {/* Carousel Controls */}
      {showControls && validImages.length > 1 && (
        <>
          {/* Arrow Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-navy/60 hover:bg-navy text-white p-1.5 rounded-sm backdrop-blur-sm transition-all border border-white/10 hover:scale-105 active:scale-95 cursor-pointer z-10"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-navy/60 hover:bg-navy text-white p-1.5 rounded-sm backdrop-blur-sm transition-all border border-white/10 hover:scale-105 active:scale-95 cursor-pointer z-10"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Indicators / Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-navy/45 backdrop-blur-sm py-1 px-2 rounded-full border border-white/10">
            {validImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => handleDotClick(e, idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "bg-amber w-3"
                    : "bg-white/50 hover:bg-white"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Index Counter */}
          <div className="absolute top-3 right-3 bg-navy/60 backdrop-blur-sm text-[9px] font-mono font-bold text-white/95 px-2 py-0.5 rounded-sm border border-white/10">
            {currentIndex + 1} / {validImages.length}
          </div>
        </>
      )}
    </div>
  );
}
