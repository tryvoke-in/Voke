import React from "react";
import {
  CheckCircle2, XCircle, ArrowUpRight,
  Eye, Award, Video, Code2, FileCheck2, GitBranch, Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CreativeFeaturesShowcase: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const FEATURES = [
    {
      icon: Video,
      tag: "Real-Time Simulation",
      title: "AI Video & Voice Interviews",
      desc: "Face-to-face adaptive simulation with conversational speech, cadence tracking, and dynamic follow-ups.",
      points: ["Adaptive voice conversations", "Live follow-up questioning"],
      link: "/voice-assistant",
      actionText: "Try Voice Interview",
    },
    {
      icon: Eye,
      tag: "Computer Vision",
      title: "Body Language & Biometrics",
      desc: "Real-time computer vision measuring eye contact stability, head posture, and speech cadence.",
      points: ["Eye contact stability radar", "Filler words (Um / Like) tracking"],
      link: "/progress-analytics",
      actionText: "View Biometrics",
    },
    {
      icon: Award,
      tag: "Diagnostic Scorecards",
      title: "Detailed AI Feedback Reports",
      desc: "Performance scorecards with STAR structural analysis and phrase-by-phrase rewrites.",
      points: ["0–100 Performance scorecard", "STAR before vs. after rewrites"],
      link: "/dashboard",
      actionText: "Explore Feedback",
    },
    {
      icon: Code2,
      tag: "Live Execution",
      title: "Monaco Coding Sandbox",
      desc: "In-browser compiler supporting Python, TS, Java, and C++ with hidden test suites.",
      points: ["Multi-language IDE compiler", "Big-O runtime & memory analysis"],
      link: "/dsa-sheet",
      actionText: "Open Code Sandbox",
    },
    {
      icon: FileCheck2,
      tag: "Resume Intelligence",
      title: "ATS Resume & Keyword Matcher",
      desc: "Scans your resume against target JDs to identify keyword gaps and score pass probability.",
      points: ["95%+ ATS keyword coverage", "Metric-driven STAR bullets"],
      link: "/resume-builder",
      actionText: "Scan Resume",
    },
    {
      icon: GitBranch,
      tag: "Codebase Parser",
      title: "GitHub Architecture Grilling",
      desc: "Connect your GitHub repositories to get grilled on your real system architecture decisions.",
      points: ["Real commit & schema analysis", "Engineering trade-off defense"],
      link: "/interview/new",
      actionText: "Connect GitHub",
    },
  ];

  return (
    <section id="features" className="pt-10 sm:pt-14 md:pt-16 pb-20 md:pb-28 relative bg-[#f8faf9] overflow-hidden">
      {/* Subtle Engineering Grid */}
      <div
        className="absolute inset-0 pointer-events-none select-none opacity-60"
        style={{
          backgroundImage: "linear-gradient(rgba(0,59,45,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,59,45,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10 max-w-7xl">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION HEADER (CENTERED)                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#003B2D] leading-[1.08] tracking-[-0.02em]">
            Master Every <span className="italic text-[#0F6B38]">Interview Dimension</span>
          </h2>
          <p className="mt-4 text-[#557564] text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal">
            From adaptive voice simulation and body language tracking to sandboxed compilers and STAR diagnostic scorecards.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CLEAN, ELEGANT 6-CARD GRID (3 x 2)                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-24 sm:mb-32">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(feat.link)}
                className="bg-white rounded-[28px] p-7 sm:p-8 border border-[#DCE7DF] shadow-[0_4px_20px_rgba(0,59,45,0.04)] hover:shadow-[0_16px_36px_rgba(0,59,45,0.08)] hover:border-[#0F6B38]/40 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Top Row: Icon + Tag */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAF3ED] text-[#0F6B38] flex items-center justify-center group-hover:bg-[#0F6B38] group-hover:text-white transition-all duration-300 shadow-xs">
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#F3FAF5] text-[#003B2D] border border-[#CFDDD2]">
                      {feat.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl sm:text-2xl font-bold text-[#003B2D] tracking-tight mb-3 group-hover:text-[#0F6B38] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-[#557564] text-sm sm:text-[15px] leading-relaxed font-normal mb-6">
                    {feat.desc}
                  </p>

                  {/* Bullet Highlights */}
                  <div className="space-y-2 pt-2 border-t border-[#F0F5F2]">
                    {feat.points.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 text-xs sm:text-[13px] text-[#14231B] font-medium">
                        <Check className="w-3.5 h-3.5 text-[#0F6B38] shrink-0 stroke-[2.8]" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-6 mt-6 border-t border-[#E8EFE9] flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-[#003B2D] group-hover:text-[#0F6B38] transition-colors">
                    {feat.actionText}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[#F3FAF5] group-hover:bg-[#0F6B38] group-hover:text-white text-[#003B2D] flex items-center justify-center transition-all duration-300">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* WHY ENGINEERS PREPARE WITH VOKE (WHITE/LIGHT THEME)            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="pt-8 sm:pt-14 pb-4">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#003B2D] tracking-tight">
              Why Engineers Prepare with <span className="italic text-[#0F6B38]">Voke</span>
            </h3>
            <p className="text-sm sm:text-base text-[#557564]">
              Stop preparing in the dark. See how Voke fundamentally transforms your interview readiness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">

            {/* Left Column: Without Voke */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#dce7df] shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#e8efe9]">
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                  ✕
                </div>
                <h4 className="text-lg font-bold text-[#14231B] tracking-tight">Without Voke</h4>
              </div>

              <div className="space-y-3.5">
                {[
                  "Passive YouTube tutorials that don't talk back or test your edge cases",
                  "Freezing up under live coding compiler and high-pressure rounds",
                  "Unexplained ATS resume rejections with zero feedback on missing keywords",
                  "Rambling answers lacking STAR framework structure and quantified metrics",
                  "Unchecked nervous filler words ('um', 'like') and broken eye contact",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-[#557564] leading-relaxed">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: With Voke (Brand Green) */}
            <div className="bg-[#003B2D] rounded-[28px] p-6 sm:p-8 border border-[#003B2D] text-white shadow-xl space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0F6B38] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight">With Voke AI</h4>
                </div>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Recommended
                </span>
              </div>

              <div className="space-y-3.5">
                {[
                  "Adaptive face-to-face AI simulation with real-time speech and cadence tracking",
                  "Live in-browser Monaco compiler testing memory limits & time complexity traps",
                  "Detailed diagnostic feedback reports with phrase-by-phrase STAR rewrites",
                  "Computer-vision body language tracking for eye contact and nervous filler cues",
                  "System design grilling customized to your actual GitHub repositories",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-emerald-100/90 leading-relaxed font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
});

export default CreativeFeaturesShowcase;
