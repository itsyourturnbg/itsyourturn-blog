import React from "react";
import { Coffee, Layers, BookOpen, Brain, Users, ExternalLink } from "lucide-react";

export default function AboutTab() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto font-sans px-4 md:px-8 py-10" id="about-section-top">
      
      {/* Introduction */}
      <section className="bg-white border border-navy/10 p-6 md:p-10 space-y-6">
        <div className="font-mono text-xs text-text-light tracking-widest uppercase flex items-center gap-2">
          <span>THE ESSENCE</span>
          <span>•</span>
          <span>Spoon Theory</span>
        </div>
        <h2 className="font-display text-3xl font-black text-navy leading-tight">
          What is Spoon Theory?
        </h2>
        <div className="text-sm md:text-base text-text-muted space-y-4 leading-relaxed">
          <p>
            Spoon theory was first described by <strong>Christine Miserandino</strong> in 2003 as a way to explain the lived experience of managing chronic illness, disability, or neurodivergence.
          </p>
          <p>
            Imagine you start each day with a limited set of <strong>spoons</strong>—representing your finite daily energy units. Healthy, neurotypical individuals often wake up with an abundant or seemingly unlimited supply of spoons, while those managing mental or physical differences start with a severely restricted number.
          </p>
          <p>
            Every single activity, from taking a shower to answering an email, costs one or more spoons. When the spoons run out, your day is effectively over—you cannot simply push through without borrowing spoons from tomorrow's reserve, causing a compounding exhaustion or "crash".
          </p>
        </div>

        {/* Pull Quote */}
        <div className="border-l-4 border-amber bg-cream p-5 italic text-navy font-display text-base md:text-lg leading-relaxed rounded-sm">
          "The difference in being sick and being healthy is having to make choices or to consciously think about things when the rest of the world doesn't have to."
          <span className="block font-mono text-[10px] uppercase tracking-wider text-text-light not-italic mt-2">
            — Christine Miserandino, The Spoon Theory
          </span>
        </div>
      </section>

      {/* Spoons at the Board Game Table */}
      <section className="bg-white border border-navy/10 p-6 md:p-10 space-y-6">
        <h2 className="font-display text-2xl font-black text-navy">
          Why Spoons Matter for Board Gaming
        </h2>
        <p className="text-sm md:text-base text-text-muted leading-relaxed">
          Tabletop games are highly interactive, multi-system puzzles. For many, they are a source of great joy, but they also demand varying levels of cognitive energy. Choosing the wrong game when you are running low on spoons can turn a fun evening into an overwhelming, stressful chore.
        </p>
        <p className="text-sm md:text-base text-text-muted leading-relaxed">
          Here is how we calculate the <strong>Spoon Rating</strong> for each review:
        </p>

        {/* Cognitive Cost factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="border border-navy/10 p-4 bg-off-white/50 flex gap-3">
            <BookOpen className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <div>
              <h4 className="font-display font-bold text-sm text-navy">Rulebook Complexity</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                The sheer volume of rules, exceptions, and conditions you must understand and retain before starting.
              </p>
            </div>
          </div>

          <div className="border border-navy/10 p-4 bg-off-white/50 flex gap-3">
            <Layers className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <div>
              <h4 className="font-display font-bold text-sm text-navy">Fiddliness &amp; Setup</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Energy spent sorting cards, building modular boards, and shuffling counters before you've even taken turn one.
              </p>
            </div>
          </div>

          <div className="border border-navy/10 p-4 bg-off-white/50 flex gap-3">
            <Brain className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <div>
              <h4 className="font-display font-bold text-sm text-navy">Memory &amp; Tracking Load</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Having to track hidden cards, opponent tableaus, active player triggers, and cascading combos.
              </p>
            </div>
          </div>

          <div className="border border-navy/10 p-4 bg-off-white/50 flex gap-3">
            <Users className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <div>
              <h4 className="font-display font-bold text-sm text-navy">Player Aids &amp; Icons</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Excellent icons and reference cards reduce memory load, letting you rest your mind instead of memorizing rule details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Owner Card */}
      <section className="bg-navy p-6 md:p-8 text-white grid grid-cols-1 md:grid-cols-4 gap-6 items-center border-l-4 border-amber shadow-md">
        <div className="md:col-span-1 flex justify-center">
          <div className="w-20 h-20 bg-navy-mid border-2 border-amber rounded-full flex items-center justify-center text-3xl select-none animate-bounce-slow">
            🎲
          </div>
        </div>
        <div className="md:col-span-3 space-y-3">
          <div className="font-mono text-[9px] uppercase tracking-wider text-amber font-bold">
            THE HOST
          </div>
          <h3 className="font-display text-lg font-bold">Who's Rolling?</h3>
          <p className="text-white/60 text-xs md:text-sm leading-relaxed">
            Welcome to <strong>ItsYourTurn.bg</strong>—a dedicated space for honest board game overviews. We focus on bringing you quick information on boardgames, based on their spoon ratings. We're passionate collectors based in the UK, designing lists that respect both your intellect and your physical or mental capacity. ItsYourTurn was born outt of ADHD impatience, I would constantly be saying to Liam "Hey! Its your turn" - and thus, the channel was born.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="https://www.instagram.com/itsyourturn.bg"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber text-navy px-4 py-1.5 text-xs font-mono font-bold uppercase hover:bg-amber-light transition-colors flex items-center gap-1 cursor-pointer"
            >
              Instagram
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="border border-white/20 text-white/80 px-3 py-1.5 text-xs font-mono">
              miss.amybaldwin@gmail.com
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
