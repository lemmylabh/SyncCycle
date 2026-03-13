"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Instagram, Music2 } from "lucide-react";
import { AnimatePresence, motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { TestimonialsSection } from "@/components/landing/Testimonials";

const useLiquidGlass = () => {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "50%");
      el.style.setProperty("--my", "35%");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return ref;
};

const headlines = [
  { text: "Clarity for your cycle.", dim: false },
  { text: "Comfort in your life.",  dim: true  },
];

export default function LandingPage() {
  const router = useRouter();
  const navBtnRef = useLiquidGlass();
  const heroBtnRef = useLiquidGlass();
  const [activeIndex, setActiveIndex] = useState(0);
  const [emailValue, setEmailValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");

  const missionRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 350], [1, 0]);
  const heroY = useTransform(scrollY, [0, 350], [0, -40]);

  const { scrollYProgress: missionProgress } = useScroll({
    target: missionRef,
    offset: ["start 0.85", "end start"],
  });
  const previewBlurValue = useTransform(missionProgress, [0.05, 0.15, 0.85, 0.97], [0, 14, 14, 0]);
  const previewDim = useTransform(missionProgress, [0.05, 0.15, 0.85, 0.97], [0, 0.65, 0.65, 0]);
  const previewFilter = useMotionTemplate`blur(${previewBlurValue}px)`;

  const { scrollYProgress: howItWorksProgress } = useScroll({
    target: howItWorksRef,
    offset: ["start center", "end center"],
  });
  const previewFinalOpacity = useTransform(howItWorksProgress, [0.65, 1.0], [1, 0]);

  useEffect(() => {
    const t = setInterval(() => setActiveIndex(i => (i + 1) % headlines.length), 3000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue || status === "loading") return;
    setStatus("loading");
    const { error } = await supabase.from("leads").insert({ email: emailValue, source: "landing" });
    if (!error) {
      router.push("/dashboard?demo=true");
    } else if (error.code === "23505") {
      // Already in CRM — still take them to the demo
      setStatus("duplicate");
      setTimeout(() => router.push("/dashboard?demo=true"), 1200);
    } else {
      console.error("[leads insert error]", error.code, error.message, error.details);
      setStatus("error");
    }
  };

  return (
    <div className="bg-black text-white">

      {/* ===== NAVIGATION — outside hero so z-index is in root context ===== */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-8 lg:px-12 py-4 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="https://i.postimg.cc/fW1nkM36/logo-dark.png" alt="Syncycle" className="h-9 object-contain" />
          <span className="text-white font-light tracking-[0.25em] text-lg">Syncycle<span className="text-white/50">®</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#mission" className="text-nav-link">Mission</a>
          <a href="#how-it-works" className="text-nav-link">How it Works</a>
          <a href="#features" className="text-nav-link">Features</a>
          <a href="#team" className="text-nav-link">Team</a>
          <a href="#blog" className="text-nav-link">Blog</a>
        </div>
        <a
          ref={navBtnRef as React.Ref<HTMLAnchorElement>}
          href="#early-access"
          className="liquid-glass-btn rounded-full px-5 py-2.5 text-sm font-light tracking-wide text-white cursor-pointer"
        >
          Get Demo
        </a>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col overflow-hidden pt-20">
        {/* Fallback gradient (behind video) */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-black to-slate-800" />

        {/* Video Background */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-[1]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src="https://emitrr-ai-test.s3.us-east-2.amazonaws.com/mms/f73ce880-8806-4510-9898-a2aa7dee7979-7c443c83-1332-473f-8b13-0255116eb27b.mp4"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 z-10 bg-black/50" />

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-20 flex-1 flex items-center justify-center px-6 lg:px-12 mt-24 pb-32 md:pb-48"
        >
          <div className="max-w-5xl w-full text-center">
            <p className="text-hero-tagline mb-6">Your AI cycle companion</p>
            <div className="mb-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.h1
                  key={activeIndex}
                  className={`text-hero-headline ${headlines[activeIndex].dim ? "text-hero-headline-dim" : ""}`}
                  initial={{ opacity: 0, filter: "blur(12px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(12px)" }}
                  transition={{ duration: 0.65, ease: "easeInOut" }}
                >
                  {headlines[activeIndex].text}
                </motion.h1>
              </AnimatePresence>
            </div>
            <p className="text-hero-body text-sm leading-loose max-w-xl mb-8 mx-auto">
              A modern cycle app for people who menstruate — created to help you understand your hormonal phases and live, train, and plan in sync with your body.
            </p>

            {/* Email Capture */}
            <div id="early-access" className="max-w-lg mx-auto">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
                <input
                  id="early-access-input"
                  type="email"
                  required
                  value={emailValue}
                  onChange={e => setEmailValue(e.target.value)}
                  placeholder="Enter your email for a demo"
                  className="input-hero flex-1"
                />
                <button
                  ref={heroBtnRef as React.Ref<HTMLButtonElement>}
                  type="submit"
                  disabled={status === "loading"}
                  className="liquid-glass-btn rounded-full px-5 py-3 text-sm font-light tracking-wide text-white whitespace-nowrap disabled:opacity-50"
                >
                  {status === "loading" ? "Sending…" : "Get Demo Preview"}
                </button>
              </form>
              {status === "duplicate" && (
                <p className="text-white/40 text-xs mt-2 tracking-wide">Already registered — redirecting you now.</p>
              )}
              {status === "error" && (
                <p className="text-white/40 text-xs mt-2 tracking-wide">Something went wrong. Please try again.</p>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== PRODUCT PREVIEW ===== */}
      <motion.section style={{ opacity: previewFinalOpacity }} className="-mt-24 md:-mt-36 sticky top-20 z-[40] pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            style={{ filter: previewFilter }}
            className="rounded-3xl bg-white/[0.04] border border-white/10 shadow-xl shadow-black/50 overflow-hidden p-1.5"
          >
            <div className="relative">
              <img
                src="/dashboard-preview.png"
                alt="Syncycle Dashboard"
                className="rounded-2xl w-full block"
              />
              <motion.div
                style={{ opacity: previewDim }}
                className="absolute inset-0 rounded-2xl bg-black pointer-events-none"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== MISSION + HOW IT WORKS — shared blur backdrop wrapper ===== */}
      <div ref={missionRef} className="relative z-[50]">

        {/* ===== MISSION SECTION ===== */}
        <section id="mission" className="relative pt-24 pb-24 px-6 md:px-12">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40 pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-light mb-10">Our Mission</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight leading-[1.15] tracking-tight text-white mb-8">
              Most women are taught to push through,{" "}
              <span className="italic text-white/60">ignore their body</span>{" "}
              and perform linearly.
            </h2>
            <div className="w-12 h-px bg-white/20 mx-auto mb-8" />
            <p className="text-white/55 text-base md:text-lg font-light leading-relaxed max-w-xl mx-auto">
              But biology is cyclical. Our mission is to empower women to live, train, and perform in alignment with their cycle — through intelligent, beautifully designed guidance.
            </p>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section ref={howItWorksRef as React.Ref<HTMLElement>} id="how-it-works" className="relative pt-24 pb-24 px-6 md:px-12">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60 pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-light mb-6">How It Works</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight leading-[1.15] tracking-tight text-white">
                Three steps to align{" "}
                <span className="italic text-white/60">ambition with biology.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Phase Clarity",
                  subtitle: "Understand where you are in your cycle — and what that means for your energy, mood, and performance.",
                  image: "https://i.postimg.cc/wjbV2jhG/hiw-1.png",
                },
                {
                  title: "Daily Guidance",
                  subtitle: "Receive tailored suggestions for training, focus, and recovery — aligned with your biology.",
                  image: "https://i.postimg.cc/zGMCWPrs/hiw-2.png",
                },
                {
                  title: "Adaptive Coaching",
                  subtitle: "Check in in seconds — Syncycle adapts your plan when life changes.",
                  image: "https://i.postimg.cc/sx6QzvDz/hiw-3.png",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-xl shadow-black/25 overflow-hidden transition duration-300 hover:border-white/25 flex flex-col"
                >
                  <div className="relative h-44 md:h-48">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="bg-black/35 backdrop-blur-sm p-5 text-left flex flex-col flex-1">
                    <h3 className="text-white text-lg font-light mb-2">{card.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{card.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative z-[60] py-24 px-6 md:px-12 bg-gradient-to-b from-[#07070e] to-[#0d0d18] overflow-hidden">
        {/* Purple radial glow */}
        <div className="absolute inset-x-0 top-0 h-96 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,7,100,0.25), transparent)" }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-white/35 uppercase tracking-[0.3em] text-xs font-light">Features</p>
          </div>
          {/* Cards grid */}
          <FeatureShowcase />
        </div>
      </section>

      <TestimonialsSection />

      {/* ===== MEET THE TEAM ===== */}
      <section id="team" className="pt-24 pb-24 px-6 md:px-12 bg-gradient-to-b from-black via-slate-900/50 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-white/50 uppercase tracking-widest text-sm mb-4">Team</p>
            <h2 className="text-4xl md:text-5xl font-light text-white">Meet the Team</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { name: "Fiona",     role: "Product Owner",  image: "https://i.postimg.cc/Gm75pfrR/Fiona.png" },
              { name: "Sameeksha", role: "Scrum Master",   image: "https://i.postimg.cc/K8qHYWFF/Sameeksha.png" },
              { name: "Alisa",     role: "Brand & Design", image: "https://i.postimg.cc/Gm75pfrC/Alisa.png" },
              { name: "Manish",    role: "Engineering",    image: "https://i.postimg.cc/RZsD0Y9z/Manish.png" },
              { name: "Jane",      role: "Growth",         image: "https://i.postimg.cc/P53Rq7HB/Jane.png" },
              { name: "Eli",       role: "Engineering",    image: "https://i.postimg.cc/3xVKT2j5/Eli.png" },
              { name: "Tari",      role: "Engineering" },
            ].map((member) => (
              <div
                key={member.name}
                className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg shadow-black/20 p-6 text-center transition duration-300 hover:border-white/20"
              >
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-28 h-28 mx-auto mb-6 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/20" />
                )}
                <p className="text-white text-lg font-medium mb-1">{member.name}</p>
                <p className="text-white/60 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BLOG SECTION ===== */}
      <section id="blog" className="relative py-28 px-6 md:px-12 overflow-hidden">
        <img
          src="https://i.postimg.cc/yxkC8fTM/bg-blog-compressed.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 z-[1] bg-black/50" />
        <div className="absolute bottom-0 left-0 right-0 h-56 z-[2] bg-gradient-to-b from-transparent via-black/60 to-black" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="mb-14">
            <p className="text-white/50 uppercase tracking-widest text-sm mb-4">Blog</p>
            <h2 className="text-4xl md:text-5xl font-light text-white">Our Resources &amp; Updates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              {
                title: "Introducing Syncycle: Clarity for Your Cycle",
                date: "Feb 2026",
                author: "Syncycle Team",
                image: "https://i.postimg.cc/qMFMLVFc/blog-3.jpg",
              },
              {
                title: "Training, Mood, and Energy: Working With Your Phases",
                date: "Feb 2026",
                author: "Syncycle Team",
                image: "https://i.postimg.cc/zGW5FLWK/blog-2.jpg",
              },
            ].map((post) => (
              <div
                key={post.title}
                className="rounded-3xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-xl shadow-black/25 overflow-hidden transition duration-300 hover:border-white/25"
              >
                <div className="relative h-56 md:h-64">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="bg-black/35 backdrop-blur-sm p-6 md:p-7 flex justify-between items-end gap-6">
                  <h3 className="text-white text-lg md:text-xl font-light leading-snug text-left">{post.title}</h3>
                  <div className="text-right shrink-0">
                    <p className="text-white/80 text-sm">{post.date}</p>
                    <p className="text-white/50 text-sm">{post.author}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-24 px-6 md:px-12 bg-gradient-to-b from-black to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl bg-white/[0.06] backdrop-blur-sm border border-white/10 shadow-xl shadow-black/20 p-10 md:p-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Left */}
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <img src="https://i.postimg.cc/fW1nkM36/logo-dark.png" alt="Syncycle" className="h-10 object-contain opacity-90" />
                  <span className="text-white text-lg font-light tracking-[0.25em]">Syncycle<span className="text-white/50">®</span></span>
                </div>
                <p className="text-white/50 text-sm mt-2">Your AI cycle companion</p>
              </div>

              {/* Middle */}
              <div>
                <nav className="flex flex-col space-y-4">
                  {[
                    { label: "Why Syncycle",  href: "#" },
                    { label: "Our Mission",   href: "#mission" },
                    { label: "How it Works",  href: "#how-it-works" },
                    { label: "Team",          href: "#team" },
                  ].map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-light"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Right */}
              <div>
                <p className="text-white/70 font-light mb-4">Follow us</p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 transition-colors duration-300 flex items-center justify-center text-white/60 hover:text-white"
                    aria-label="Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full border border-white/20 hover:border-white/40 transition-colors duration-300 flex items-center justify-center text-white/60 hover:text-white"
                    aria-label="TikTok"
                  >
                    <Music2 size={18} />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 my-8" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-white/40 text-sm">© 2026 Syncycle. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="text-white/40 hover:text-white/60 transition-colors duration-300 text-sm">Privacy Policy</a>
                <a href="#" className="text-white/40 hover:text-white/60 transition-colors duration-300 text-sm">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
