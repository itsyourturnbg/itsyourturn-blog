import React from "react";

interface NavbarProps {
  currentTab: "reviews" | "lists" | "about" | "affiliates";
  onTabChange: (tab: "reviews" | "lists" | "about" | "affiliates") => void;
}

export default function Navbar({ currentTab, onTabChange }: NavbarProps) {
  return (
    <nav className="bg-navy border-b-2 border-amber sticky top-0 z-50 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between py-2.5 md:py-0 min-h-[60px] md:h-[60px] gap-2 md:gap-0 shadow-sm">
      <button
        onClick={() => onTabChange("reviews")}
        className="font-display text-lg text-amber hover:opacity-90 transition-opacity cursor-pointer font-bold tracking-wide shrink-0"
      >
        It's Your <span className="text-white">Turn</span>
      </button>

      <ul className="hidden md:flex items-center gap-8 list-none">
        <li>
          <button
            onClick={() => onTabChange("reviews")}
            className={`cursor-pointer text-xs font-semibold tracking-widest uppercase transition-colors duration-200 ${
              currentTab === "reviews" ? "text-amber" : "text-white/75 hover:text-amber"
            }`}
          >
            Reviews
          </button>
        </li>
        <li>
          <button
            onClick={() => onTabChange("lists")}
            className={`cursor-pointer text-xs font-semibold tracking-widest uppercase transition-colors duration-200 ${
              currentTab === "lists" ? "text-amber" : "text-white/75 hover:text-amber"
            }`}
          >
            Lists
          </button>
        </li>
        <li>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              onTabChangeWithAboutHash();
            }}
            className={`cursor-pointer text-xs font-semibold tracking-widest uppercase transition-all duration-200 ${
              currentFilterIsAbout() ? 'text-amber' : 'text-white/75 hover:text-amber'
            }`}
          >
            About
          </a>
        </li>
        <li>
          <button
            onClick={() => onTabChange("affiliates")}
            className={`cursor-pointer text-xs font-semibold tracking-widest uppercase transition-colors duration-200 ${
              currentTab === "affiliates" ? "text-amber" : "text-white/75 hover:text-amber"
            }`}
          >
            Affiliates
          </button>
        </li>
      </ul>

      <div className="flex items-center justify-center w-full md:w-auto gap-4 shrink-0">
        {/* Small screen menu icons as quick tabs to ensure mobile responsive utility */}
        <div className="flex md:hidden items-center gap-1 bg-navy-mid/60 p-1 rounded-sm border border-white/5 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => onTabChange("reviews")}
            className={`px-3 py-1 text-[11px] font-mono font-bold tracking-wider uppercase rounded-sm transition-all shrink-0 ${
              currentTab === "reviews" ? "bg-amber text-navy font-black shadow-xs" : "text-white/75"
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => onTabChange("lists")}
            className={`px-3 py-1 text-[11px] font-mono font-bold tracking-wider uppercase rounded-sm transition-all shrink-0 ${
              currentTab === "lists" ? "bg-amber text-navy font-black shadow-xs" : "text-white/75"
            }`}
          >
            Lists
          </button>
          <button
            onClick={() => onTabChange("about")}
            className={`px-3 py-1 text-[11px] font-mono font-bold tracking-wider uppercase rounded-sm transition-all shrink-0 ${
              currentTab === "about" ? "bg-amber text-navy font-black shadow-xs" : "text-white/75"
            }`}
          >
            About
          </button>
          <button
            onClick={() => onTabChange("affiliates")}
            className={`px-3 py-1 text-[11px] font-mono font-bold tracking-wider uppercase rounded-sm transition-all shrink-0 ${
              currentTab === "affiliates" ? "bg-amber text-navy font-black shadow-xs" : "text-white/75"
            }`}
          >
            Affiliates
          </button>
        </div>

        <a
          href="https://www.instagram.com/itsyourturn.bg"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-2 text-white/75 hover:text-amber transition-colors text-xs font-mono"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber"></span>
          </span>
          @itsyourturn.bg
        </a>
      </div>
    </nav>
  );

  function currentFilterIsAbout() {
    return currentTab === "about";
  }

  function onTabChangeWithAboutHash() {
    onTabChange("about");
    const element = document.getElementById("about-section-top");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }
}
