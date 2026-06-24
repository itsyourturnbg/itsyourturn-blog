import React, { useState, useRef, useEffect } from "react";
import { Review } from "../types";
import { X, Upload, Link, Check, Image as ImageIcon, AlertCircle, Loader2, Trash2, Plus, ArrowLeftRight, Star } from "lucide-react";

interface ReplaceImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  adminPasscode: string;
  onSuccess: (updatedReviews: Review[]) => void;
}

export default function ReplaceImageModal({
  isOpen,
  onClose,
  review,
  adminPasscode,
  onSuccess,
}: ReplaceImageModalProps) {
  // Extract initial images array (strictly from review.images gallery)
  const initialImages = review.images && review.images.length > 0 
    ? [...review.images] 
    : [];

  const [images, setImages] = useState<string[]>(initialImages);
  const [coverImage, setCoverImage] = useState<string>(review.image || "");
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  
  // Cropper States
  const [sourceImageSrc, setSourceImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0); // offset in pixels
  const [panY, setPanY] = useState(0); // offset in pixels
  
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Keep state synced if the review changes
  useEffect(() => {
    if (isOpen) {
      const currentImages = review.images && review.images.length > 0 
        ? [...review.images] 
        : [];
      setImages(currentImages);
      setCoverImage(review.image || "");
      setSourceImageSrc(null);
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setImageUrl("");
      setError(null);
    }
  }, [isOpen, review]);

  if (!isOpen) return null;

  // Process an uploaded or chosen file and load it into the cropper
  const handleSourceImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (.png, .jpg, .jpeg, .webp)");
      return;
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setError("Could not read file. Please try again.");
        setIsLoading(false);
        return;
      }
      setSourceImageSrc(result);
      // Reset cropper controls
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSourceImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSourceImage(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Load URL into the cropper
  const handleLoadUrl = () => {
    if (!imageUrl.trim()) {
      setError("Please enter a valid image URL first.");
      return;
    }
    setSourceImageSrc(imageUrl.trim());
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  };

  // Render cropped image to HTML5 Canvas to bake crop details
  const bakeCroppedImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!sourceImageSrc) {
        reject(new Error("No image source loaded."));
        return;
      }

      const img = new Image();
      // Set crossOrigin in case it is a hotlinked web URL so we can crop it
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // We will output exactly a high-quality 16:9 landscape image (e.g., 960x540)
        const canvasWidth = 960;
        const canvasHeight = 540;

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context."));
          return;
        }

        // Fill background with elegant dark slate in case of transparent PNGs or margins
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Calculate fitted width/height at zoom = 1
        const imgAspect = img.width / img.height;
        const canvasAspect = canvasWidth / canvasHeight; // 1.777

        let fitWidth = canvasWidth;
        let fitHeight = canvasHeight;

        if (imgAspect > canvasAspect) {
          // Image is wider than 16:9 - match heights
          const scale = canvasHeight / img.height;
          fitHeight = canvasHeight;
          fitWidth = img.width * scale;
        } else {
          // Image is taller or exact 16:9 - match widths
          const scale = canvasWidth / img.width;
          fitWidth = canvasWidth;
          fitHeight = img.height * scale;
        }

        // Get preview container width to scale panning correctly from screen preview to canvas
        const previewContainerWidth = previewCanvasRef.current?.clientWidth || 600;
        const scaleFactor = canvasWidth / previewContainerWidth;
        const actualPanX = panX * scaleFactor;
        const actualPanY = panY * scaleFactor;

        // Apply transformations centered around canvas center
        ctx.translate(
          canvasWidth / 2 + actualPanX, 
          canvasHeight / 2 + actualPanY
        );
        ctx.scale(zoom, zoom);

        // Draw image relative to translation center point
        ctx.drawImage(
          img,
          -fitWidth / 2,
          -fitHeight / 2,
          fitWidth,
          fitHeight
        );

        // Compress base64 to balanced quality (0.82) to avoid bloating reviews_store.json
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      img.onerror = () => {
        reject(new Error("Error loading image for crop. It might be blocked by CORS policy. Try downloading the image and dragging it here instead!"));
      };

      img.src = sourceImageSrc;
    });
  };

  // Draw the WYSIWYG crop preview to the canvas dynamically
  useEffect(() => {
    if (!sourceImageSrc || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvasWidth = 960;
      const canvasHeight = 540;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Fill background with elegant slate
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const imgAspect = img.width / img.height;
      const canvasAspect = canvasWidth / canvasHeight;

      let fitWidth = canvasWidth;
      let fitHeight = canvasHeight;

      if (imgAspect > canvasAspect) {
        const scale = canvasHeight / img.height;
        fitHeight = canvasHeight;
        fitWidth = img.width * scale;
      } else {
        const scale = canvasWidth / img.width;
        fitWidth = canvasWidth;
        fitHeight = img.height * scale;
      }

      const previewContainerWidth = canvas.clientWidth || 600;
      const scaleFactor = canvasWidth / previewContainerWidth;
      const actualPanX = panX * scaleFactor;
      const actualPanY = panY * scaleFactor;

      ctx.save();
      ctx.translate(
        canvasWidth / 2 + actualPanX, 
        canvasHeight / 2 + actualPanY
      );
      ctx.scale(zoom, zoom);

      ctx.drawImage(
        img,
        -fitWidth / 2,
        -fitHeight / 2,
        fitWidth,
        fitHeight
      );
      ctx.restore();
    };
    img.src = sourceImageSrc;
  }, [sourceImageSrc, zoom, panX, panY]);

  // Save cropped 16:9 image AS ONLY the primary cover photo, without adding anything to the carousel gallery
  const handleSetAsCoverOnly = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const croppedBase64 = await bakeCroppedImage();
      setCoverImage(croppedBase64);
      // Reset cropper states
      setSourceImageSrc(null);
      setImageUrl("");
    } catch (err: any) {
      console.error("Cropping error:", err);
      setError(err.message || "Failed to crop image. Try local file upload if CORS blocks the web URL.");
    } finally {
      setIsLoading(false);
    }
  };

  // Set the current uncropped original image directly as the cover image without cropping it
  const handleSetAsCoverOriginal = async () => {
    if (!sourceImageSrc) return;
    setIsLoading(true);
    setError(null);
    try {
      const optimizedBase64 = await compressOriginalImage(sourceImageSrc);
      setCoverImage(optimizedBase64);
      // Reset cropper states
      setSourceImageSrc(null);
      setImageUrl("");
    } catch (err: any) {
      console.error("Cover optimization error:", err);
      setError(err.message || "Failed to set cover image.");
    } finally {
      setIsLoading(false);
    }
  };

  // Triggered when selecting a file specifically for the cover photo slot
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (.png, .jpg, .jpeg, .webp)");
        return;
      }

      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (!result) {
          setError("Could not read cover file.");
          setIsLoading(false);
          return;
        }
        try {
          const optimizedBase64 = await compressOriginalImage(result);
          setCoverImage(optimizedBase64);
        } catch (err: any) {
          setError(err.message || "Failed to optimize cover photo.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCoverFileInput = () => {
    coverFileInputRef.current?.click();
  };

  // Add baked crop to cover photo, AND automatically add the optimized uncropped original to the carousel!
  const handleSetAsCoverAndAddToCarousel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Bake the cropped 16:9 cover image
      const croppedBase64 = await bakeCroppedImage();
      setCoverImage(croppedBase64);

      // 2. Automatically compress & add the original, uncropped image to the gallery carousel so it stays uncropped
      if (sourceImageSrc) {
        const optimizedBase64 = await compressOriginalImage(sourceImageSrc);
        setImages((prev) => {
          if (prev.includes(optimizedBase64)) return prev;
          return [...prev, optimizedBase64];
        });
      }

      // Reset cropper states
      setSourceImageSrc(null);
      setImageUrl("");
    } catch (err: any) {
      console.error("Cropping error:", err);
      setError(err.message || "Failed to crop image. Try local file upload if CORS blocks the web URL.");
    } finally {
      setIsLoading(false);
    }
  };

  // Optimize and compress original image without cropping, keeping its original aspect ratio (e.g., 4:5)
  const compressOriginalImage = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const maxDimension = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for optimization."));
      };
      img.src = src;
    });
  };

  // Add original uncropped image to the collection (Carousel Only)
  const handleAddToCarouselOnly = async () => {
    if (!sourceImageSrc) return;
    setIsLoading(true);
    setError(null);
    try {
      const optimizedBase64 = await compressOriginalImage(sourceImageSrc);
      setImages((prev) => [...prev, optimizedBase64]);
      // Reset states
      setSourceImageSrc(null);
      setImageUrl("");
    } catch (err: any) {
      console.error("Optimization error:", err);
      setError(err.message || "Failed to optimize image. Try local file upload if CORS blocks the web URL.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete image from review collection
  const handleDeleteImage = (indexToDelete: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToDelete));
  };

  // Move an image to index 0 (Primary Cover art)
  const handleSetAsPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  // Save changes to Server
  const handleSaveAll = async () => {
    setIsLoading(true);
    setError(null);

    // Filter out empty spaces
    const finalImages = images.filter((img) => img && img.trim() !== "");

    const updatedReview: Review = {
      ...review,
      images: finalImages,
      image: coverImage || finalImages[0] || "", // Keep the cover image and the gallery synchronized with proper fallbacks!
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
        throw new Error(data.error || "Failed to update review image gallery.");
      }

      const data = await response.json();
      if (data.success && data.reviews) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess(data.reviews);
          setIsSuccess(false);
          onClose();
        }, 1200);
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err: any) {
      console.error("Error updating image gallery:", err);
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-off-white border border-navy/20 w-full max-w-2xl p-6 relative shadow-2xl space-y-6 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading || isSuccess}
          className="absolute top-4 right-4 text-text-muted hover:text-navy cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-navy text-xs font-mono uppercase tracking-widest font-bold">
            <ImageIcon className="w-4 h-4 text-amber" />
            <span>Admin Media Station</span>
          </div>
          <h3 className="font-display text-2xl font-black text-navy">
            Manage Gallery &amp; Alignment
          </h3>
          <p className="text-xs text-text-muted">
            Add multiple images for the <span className="font-bold text-navy">Carousel</span> on <span className="font-bold text-navy">{review.title}</span>, and crop them to a crisp 16:9 layout.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 flex gap-2 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 flex gap-2 text-xs text-emerald-700 font-bold items-center animate-fadeIn">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Success! Media gallery saved on server.</span>
          </div>
        )}

        {/* ── PART 1: CURRENT MEDIA CONFIGURATION ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Cover Photo Slot */}
          <div className="md:col-span-1 bg-cream p-4 border border-navy/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-navy font-bold block mb-1">
                Primary Cover Photo
              </span>
              <span className="text-[9px] font-mono text-text-light block mb-3 leading-tight">
                16:9 cropped banner for lists and header artwork.
              </span>
            </div>
            <div className="relative aspect-[16/9] border border-amber bg-white overflow-hidden shadow-xs flex items-center justify-center">
              {coverImage ? (
                <img 
                  src={coverImage} 
                  alt="Cover Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[9px] font-mono text-text-light text-center px-2 select-none">
                  No separate cover. Falls back to first gallery image.
                </div>
              )}
              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-sm cursor-pointer shadow-md transition-colors"
                  title="Remove separate cover photo (fallback to gallery)"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="mt-3">
              <input
                type="file"
                ref={coverFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileChange}
              />
              <button
                type="button"
                onClick={triggerCoverFileInput}
                disabled={isLoading}
                className="w-full bg-navy hover:bg-navy-mid text-white font-mono text-[9px] font-bold uppercase tracking-widest py-1.5 rounded-sm flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-colors"
              >
                <Upload className="w-3 h-3 text-amber" />
                <span>Upload Cover</span>
              </button>
            </div>
          </div>

          {/* Carousel Gallery Slots */}
          <div className="md:col-span-2 bg-cream p-4 border border-navy/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-navy font-bold block mb-1">
                Gameplay Carousel Gallery ({images.length})
              </span>
              <span className="text-[9px] font-mono text-text-light block mb-3">
                Original uncropped (4:5, 1:1, etc.) images shown in bottom carousel.
              </span>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-6 text-xs text-text-muted font-sans border border-dashed border-navy/10 bg-white">
                No images currently in gallery. Add one below!
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-28 overflow-y-auto pr-1">
                {images.map((imgSrc, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-[4/5] border border-navy/15 bg-white group/thumb overflow-hidden flex items-center justify-center"
                  >
                    <img 
                      src={imgSrc} 
                      alt={`Thumb ${index}`} 
                      className="max-h-full max-w-full object-contain"
                    />
                    {/* Hover overlays for thumbs */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-1 transition-opacity duration-150">
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        className="bg-red-600 text-white p-1 rounded-sm hover:scale-105 active:scale-95 cursor-pointer hover:bg-red-700"
                        title="Remove from Carousel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── PART 2: CROP AND ALIGN EDITOR ── */}
        {sourceImageSrc ? (
          <div className="border border-navy/15 p-4 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-navy/10 pb-2">
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-navy flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber" />
                Step 2: Crop &amp; Align (16:9 Aspect Ratio)
              </span>
              <button 
                onClick={() => setSourceImageSrc(null)}
                className="text-[10px] font-mono text-text-light hover:text-navy cursor-pointer uppercase tracking-wider"
              >
                Change source
              </button>
            </div>

            {/* WYSIWYG 16:9 Cropping Preview Box */}
            <div className="aspect-[16/9] w-full relative overflow-hidden bg-slate-900 border border-navy/15 shadow-inner flex items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-cover pointer-events-none select-none"
              />
              {/* Overlay Gridlines to help user line up art */}
              <div className="absolute inset-0 border border-amber/20 pointer-events-none flex flex-col justify-between">
                <div className="h-[33%] w-full border-b border-white/10" />
                <div className="h-[33%] w-full border-b border-white/10" />
              </div>
              <div className="absolute inset-0 pointer-events-none flex justify-between">
                <div className="w-[33%] h-full border-r border-white/10" />
                <div className="w-[33%] h-full border-r border-white/10" />
              </div>
              {/* Watermark badge */}
              <div className="absolute bottom-2 left-2 bg-black/60 text-[9px] font-mono text-white/80 px-2 py-0.5 rounded-sm">
                16:9 Crop Preview
              </div>
            </div>

            {/* Micro Adjustment Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-cream p-3 border border-navy/5">
              {/* Zoom Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-navy font-bold uppercase">
                  <span>Zoom Factor</span>
                  <span>{zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-navy cursor-pointer"
                />
              </div>

              {/* Horizontal Shift (X) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-navy font-bold uppercase">
                  <span>Pan X (Left/Right)</span>
                  <span>{panX > 0 ? `+${panX}` : panX}px</span>
                </div>
                <input
                  type="range"
                  min="-600"
                  max="600"
                  step="2"
                  value={panX}
                  onChange={(e) => setPanX(parseInt(e.target.value))}
                  className="w-full accent-navy cursor-pointer"
                />
              </div>

              {/* Vertical Shift (Y) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-navy font-bold uppercase">
                  <span>Pan Y (Up/Down)</span>
                  <span>{panY > 0 ? `+${panY}` : panY}px</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="2"
                  value={panY}
                  onChange={(e) => setPanY(parseInt(e.target.value))}
                  className="w-full accent-navy cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Presets & Add */}
            <div className="flex flex-wrap gap-2 justify-between items-center pt-2">
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setZoom(1.0); setPanX(0); setPanY(0); }}
                  className="text-[10px] font-mono bg-cream border border-navy/10 px-2 py-1 text-text-muted hover:text-navy cursor-pointer"
                >
                  Reset Fit
                </button>
                <button
                  onClick={() => setPanY(-60)}
                  className="text-[10px] font-mono bg-cream border border-navy/10 px-2 py-1 text-text-muted hover:text-navy cursor-pointer"
                >
                  Top Shift
                </button>
                <button
                  onClick={() => setPanY(60)}
                  className="text-[10px] font-mono bg-cream border border-navy/10 px-2 py-1 text-text-muted hover:text-navy cursor-pointer"
                >
                  Bottom Shift
                </button>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={handleAddToCarouselOnly}
                  disabled={isLoading}
                  className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Adds the original uncropped image directly to the bottom carousel (retains 4:5, 1:1, etc.)"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 text-amber" />
                  )}
                  <span>Add to Carousel Only</span>
                </button>

                <button
                  onClick={handleSetAsCoverOnly}
                  disabled={isLoading}
                  className="bg-cream hover:bg-navy/5 text-navy border border-navy/25 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Aligns and crops this image to 16:9 aspect ratio and sets as cover, without adding to carousel"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowLeftRight className="w-3.5 h-3.5 text-navy" />
                  )}
                  <span>Set as Cover Only (16:9 Crop)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetAsCoverOriginal}
                  disabled={isLoading}
                  className="bg-cream hover:bg-navy/5 text-navy border border-navy/25 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Sets this image as the cover photo in its original aspect ratio, without cropping and without adding to the carousel"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowLeftRight className="w-3.5 h-3.5 text-amber" />
                  )}
                  <span>Set as Cover Only (No Crop)</span>
                </button>

                <button
                  onClick={handleSetAsCoverAndAddToCarousel}
                  disabled={isLoading}
                  className="bg-amber hover:bg-amber-light text-navy font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Sets the cropped 16:9 version as cover AND adds the uncropped original image to the carousel"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  )}
                  <span>Set Cover &amp; Add Original</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── PART 3: LOAD SOURCE SELECTOR (TAB SYSTEM) ── */
          <div className="border border-navy/10 p-4 bg-white space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-navy block">
              Step 2: Select New Photo Source
            </span>

            {/* Tabs switcher */}
            <div className="flex border-b border-navy/10 font-mono text-[10px] uppercase tracking-wider font-bold">
              <button
                onClick={() => {
                  setActiveTab("upload");
                  setError(null);
                }}
                disabled={isLoading}
                className={`flex-1 py-2 text-center border-b-2 cursor-pointer transition-colors ${
                  activeTab === "upload"
                    ? "border-navy text-navy"
                    : "border-transparent text-text-light hover:text-navy"
                }`}
              >
                <Upload className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Upload Local File
              </button>
              <button
                onClick={() => {
                  setActiveTab("url");
                  setError(null);
                }}
                disabled={isLoading}
                className={`flex-1 py-2 text-center border-b-2 cursor-pointer transition-colors ${
                  activeTab === "url"
                    ? "border-navy text-navy"
                    : "border-transparent text-text-light hover:text-navy"
                }`}
              >
                <Link className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Direct Web Image URL
              </button>
            </div>

            {activeTab === "upload" ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-amber bg-amber-pale/30 scale-[0.99]"
                    : "border-navy/15 hover:border-navy hover:bg-cream/10"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="space-y-2 py-2">
                  <Upload className="w-8 h-8 text-text-light mx-auto" />
                  <p className="text-xs font-semibold text-navy">
                    Drag and drop your board game photo here, or click to browse
                  </p>
                  <p className="text-[10px] text-text-light font-mono">
                    Any aspect ratio (you will align/crop it next) up to 8MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-bold block">
                    Paste Direct Image Link (CORS compatible or Unsplash)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-white border border-navy/15 focus:border-navy outline-none px-3 py-2 text-xs font-sans text-navy"
                    />
                    <button
                      onClick={handleLoadUrl}
                      className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 cursor-pointer"
                    >
                      Load
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-navy/10">
          <button
            onClick={onClose}
            disabled={isLoading || isSuccess}
            className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-text-muted hover:text-navy border border-transparent hover:border-navy/15 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isLoading || isSuccess}
            className="bg-navy hover:bg-navy-mid text-white font-mono text-xs font-bold uppercase tracking-widest px-5 py-2.5 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Gallery...</span>
              </>
            ) : (
              <span>Save Media Gallery</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
