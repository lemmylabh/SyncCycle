"use client";

import { useRef, useState } from "react";
import { Star } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

// ─── Data ──────────────────────────────────────────────────────────────────────

interface Testimonial {
  name: string;
  age: number;
  stars: number;
  quote: string;
  img: number;
}

const ROW1: Testimonial[] = [
  { name: "Maya",  age: 24, stars: 5, img: 46, quote: "I finally understand why I feel off every few weeks. SyncCycle mapped it all out for me." },
  { name: "Priya", age: 31, stars: 5, img: 5,  quote: "My workouts are so much better now. I know exactly when to push hard and when to rest." },
  { name: "Sarah", age: 27, stars: 5, img: 9,  quote: "The mood predictions are scary accurate. My partner even notices the difference." },
  { name: "Leila", age: 22, stars: 5, img: 10, quote: "Never thought an app could make me feel this in control of my own body." },
  { name: "Emma",  age: 29, stars: 4, img: 38, quote: "I used to dread my cycle. Now I plan around it and actually feel empowered." },
  { name: "Zoe",   age: 26, stars: 5, img: 45, quote: "The nutrition timing feature alone is worth it. My energy levels are so much more stable." },
  { name: "Hana",  age: 28, stars: 5, img: 16, quote: "The dashboard gives me a full picture every morning. It's the first thing I check." },
  { name: "Tara",  age: 32, stars: 5, img: 20, quote: "I stopped guessing and started knowing. That shift alone changed everything for me." },
  { name: "Isla",  age: 25, stars: 4, img: 21, quote: "The cycle phase card is my favourite. I finally have words for what I'm feeling." },
  { name: "Ria",   age: 30, stars: 5, img: 23, quote: "I recommended SyncCycle to my therapist. She now suggests it to other clients." },
];

const ROW2: Testimonial[] = [
  { name: "Aisha", age: 33, stars: 5, img: 25, quote: "Fiona explained my luteal symptoms better than any doctor ever has." },
  { name: "Chloe", age: 25, stars: 5, img: 26, quote: "I'm sleeping better just from following the sleep phase recommendations." },
  { name: "Nina",  age: 28, stars: 5, img: 27, quote: "The symptom heatmap helped me realize my headaches are hormonal, not random." },
  { name: "Jade",  age: 30, stars: 5, img: 29, quote: "Best health investment I've made. The predictions are genuinely useful every single day." },
  { name: "Mia",   age: 23, stars: 4, img: 32, quote: "I shared this with my whole friend group. We all track together now." },
  { name: "Sana",  age: 35, stars: 5, img: 36, quote: "Finally an app that gives real data and treats me like an adult, not pink fluff." },
  { name: "Lena",  age: 27, stars: 5, img: 44, quote: "I had no idea how much my cycle affected my focus at work. Now I plan my big tasks around it." },
  { name: "Kai",   age: 29, stars: 5, img: 47, quote: "The fitness card predicted my rest day before I even felt tired. Genuinely impressive." },
  { name: "Demi",  age: 24, stars: 5, img: 48, quote: "Tracking my mood used to feel pointless. SyncCycle shows me the why behind everything." },
  { name: "Rosa",  age: 31, stars: 4, img: 49, quote: "The Insights tab is addictive. I keep coming back to see what it predicts next." },
];

// ─── Card ──────────────────────────────────────────────────────────────────────

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="w-[300px] shrink-0 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-5 py-5 flex flex-col gap-3">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} style={{
            color: i < t.stars ? "#a020c8" : "rgba(255,255,255,0.15)",
            fill:  i < t.stars ? "#a020c8" : "transparent",
          }} />
        ))}
      </div>
      <p className="text-white/65 text-[13px] font-light leading-relaxed flex-1 line-clamp-4">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-2.5 pt-1 border-t border-white/[0.06]">
        <img
          src={`https://i.pravatar.cc/40?img=${t.img}`}
          alt={t.name}
          className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
        />
        <div>
          <p className="text-white/70 text-[12px] font-light leading-none">{t.name}</p>
          <p className="text-white/35 text-[10px] mt-0.5">{t.age} years old</p>
        </div>
      </div>
    </div>
  );
}

// ─── Belt ─────────────────────────────────────────────────────────────────────

function Belt({ items, direction, paused }: { items: Testimonial[]; direction: "left" | "right"; paused: boolean }) {
  const doubled = [...items, ...items];
  const animName = direction === "left" ? "marquee-left" : "marquee-right";
  const duration = direction === "left" ? "42s" : "50s";

  return (
    <div className="flex gap-4" style={{
      animation: `${animName} ${duration} linear infinite`,
      animationPlayState: paused ? "paused" : "running",
      width: "max-content",
    }}>
      {doubled.map((t, i) => (
        <TestimonialCard key={`${t.name}-${i}`} t={t} />
      ))}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function TestimonialsSection() {
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["center end", "center center"],
  });
  const previewOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <>
      <style>{`
        @keyframes marquee-left  { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
        @keyframes marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0);    } }
      `}</style>

      <section
        ref={sectionRef}
        className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0d0d18] to-black"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ── Product preview background ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: previewOpacity }}
        >
          <img
            src="/dashboard-preview.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top"
            style={{ filter: "blur(6px)", transform: "scale(1.05)" }}
          />
          {/* Dark scrim so cards stay readable */}
          <div className="absolute inset-0 bg-black/70" />
        </motion.div>

        {/* ── Header ── */}
        <div className="relative z-10 text-center mb-14 px-6">
          <p className="text-white/35 uppercase tracking-[0.3em] text-xs font-light mb-6">Testimonials</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight leading-[1.15] tracking-tight text-white">
            What users{" "}
            <span className="italic text-white/55">are saying.</span>
          </h2>
        </div>

        {/* ── Belts ── */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #07070e 0%, transparent 100%)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, black 0%, transparent 100%)" }} />

          <Belt items={ROW1} direction="left"  paused={paused} />
          <Belt items={ROW2} direction="right" paused={paused} />
        </div>
      </section>
    </>
  );
}
