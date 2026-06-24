import React, { useState, useEffect } from "react";
import { Review, ReviewList } from "./types";
import { INITIAL_REVIEWS, INITIAL_LISTS } from "./data/initialData";
import Navbar from "./components/Navbar";
import ReviewsTab from "./components/ReviewsTab";
import ListsTab from "./components/ListsTab";
import AboutTab from "./components/AboutTab";
import AffiliatesTab from "./components/AffiliatesTab";
import ReviewModal from "./components/ReviewModal";
import AdminLoginModal from "./components/AdminLoginModal";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"reviews" | "lists" | "about" | "affiliates">("reviews");

  // Dynamic tab-based SEO Document Title updates
  useEffect(() => {
    switch (currentTab) {
      case "reviews":
        document.title = "ItsYourTurn.bg — ADHD-Friendly Board Game Overviews & Spoon Ratings";
        break;
      case "lists":
        document.title = "Curated Board Game Lists & Recommendations — ItsYourTurn.bg";
        break;
      case "about":
        document.title = "About ItsYourTurn.bg — ADHD Impatience, Spoons & Board Games";
        break;
      case "affiliates":
        document.title = "Affiliates & Partner Links — ItsYourTurn.bg";
        break;
      default:
        document.title = "ItsYourTurn.bg — ADHD-Friendly Board Game Overviews & Spoon Ratings";
    }
  }, [currentTab]);

  // State-based lists and reviews with local persistence
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem("iy_reviews");
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [lists, setLists] = useState<ReviewList[]>(() => {
    const saved = localStorage.getItem("iy_lists");
    return saved ? JSON.parse(saved) : INITIAL_LISTS;
  });

  // Admin authentication state
  const [adminPasscode, setAdminPasscode] = useState(() => sessionStorage.getItem("admin_passcode") || "");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Auto-verify saved passcode on load
  useEffect(() => {
    if (adminPasscode) {
      fetch("/api/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: adminPasscode }),
      })
        .then((res) => {
          if (res.ok) {
            setIsAdminUnlocked(true);
          } else {
            sessionStorage.removeItem("admin_passcode");
            setAdminPasscode("");
            setIsAdminUnlocked(false);
          }
        })
        .catch((err) => console.error("Error auto-verifying saved passcode:", err));
    }
  }, [adminPasscode]);

  // Fetch hosted server reviews on load
  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.reviews) {
          setReviews(data.reviews);
          localStorage.setItem("iy_reviews", JSON.stringify(data.reviews));
        }
      })
      .catch((err) => console.error("Error loading reviews from server:", err));

    fetch("/api/lists")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lists) {
          setLists(data.lists);
          localStorage.setItem("iy_lists", JSON.stringify(data.lists));
        }
      })
      .catch((err) => console.error("Error loading lists from server:", err));
  }, []);

  // Modals state
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);

  const handleOpenReview = (id: number) => {
    setSelectedReviewId(id);
  };

  const handleCloseReview = () => {
    setSelectedReviewId(null);
  };

  const selectedReview = reviews.find((r) => r.id === selectedReviewId) || null;

  const handleReRoll = () => {
    if (reviews.length <= 1) return;
    const pool = reviews.filter((r) => r.id !== selectedReviewId);
    const randomReview = pool[Math.floor(Math.random() * pool.length)];
    setSelectedReviewId(randomReview.id);
  };

  const handleReviewsUpdated = (updatedReviews: Review[]) => {
    setReviews(updatedReviews);
    localStorage.setItem("iy_reviews", JSON.stringify(updatedReviews));
  };

  const handleListsUpdated = (updatedLists: ReviewList[]) => {
    setLists(updatedLists);
    localStorage.setItem("iy_lists", JSON.stringify(updatedLists));
  };

  const handleAdminToggle = () => {
    setIsAdminModalOpen(true);
  };

  const handleAdminLogin = (passcode: string) => {
    sessionStorage.setItem("admin_passcode", passcode);
    setAdminPasscode(passcode);
    setIsAdminUnlocked(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("admin_passcode");
    setAdminPasscode("");
    setIsAdminUnlocked(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans selection:bg-amber selection:text-navy bg-off-white text-text-main">
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

      <main className="flex-1 w-full">
        {/* Main Tab Renderings */}
        {currentTab === "reviews" && (
          <ReviewsTab
            reviews={reviews}
            onOpenReview={handleOpenReview}
            onReviewsUpdated={handleReviewsUpdated}
            isAdminUnlocked={isAdminUnlocked}
            adminPasscode={adminPasscode}
          />
        )}

        {currentTab === "lists" && (
          <ListsTab
            lists={lists}
            reviews={reviews}
            onOpenReview={handleOpenReview}
            isAdminUnlocked={isAdminUnlocked}
            adminPasscode={adminPasscode}
            onListsUpdated={handleListsUpdated}
          />
        )}

        {currentTab === "about" && <AboutTab />}

        {currentTab === "affiliates" && (
          <AffiliatesTab isAdminUnlocked={isAdminUnlocked} adminPasscode={adminPasscode} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy border-t border-white/5 py-8 px-4 text-center mt-12">
        <p className="font-mono text-xs text-white/30 tracking-wider flex items-center justify-center gap-2 flex-wrap">
          <span>&copy; 2026 It's Your Turn</span>
          <span>·</span>
          <a
            href="https://www.instagram.com/itsyourturn.bg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:underline hover:text-amber-light"
          >
            @itsyourturn.bg
          </a>
          <span>·</span>
          <button
            onClick={handleAdminToggle}
            className="text-white/20 hover:text-amber transition-colors text-xs flex items-center gap-1 cursor-pointer"
            title="Admin Lock"
          >
            {isAdminUnlocked ? "🔓 Admin Active" : "🔒 Admin"}
          </button>
        </p>
      </footer>

      {/* Review Viewer Modal */}
      <ReviewModal
        review={selectedReview}
        onClose={handleCloseReview}
        onReRoll={handleReRoll}
        isAdminUnlocked={isAdminUnlocked}
        adminPasscode={adminPasscode}
        onReviewsUpdated={handleReviewsUpdated}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdminUnlocked={isAdminUnlocked}
        onLoginSuccess={handleAdminLogin}
        onLogout={handleAdminLogout}
      />
    </div>
  );
}
