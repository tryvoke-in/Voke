import React, { useState } from "react";
import {
  Building2, ArrowUpRight, Send, Loader2,
  SlidersHorizontal, Terminal, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const HiringTeamsBanner: React.FC = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    candidateVolume: "50-200 candidates/month",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) {
      toast.error("Please fill in your name, work email, and company.");
      return;
    }

    setIsSubmitting(true);

    // Prepare mailto link with details
    const subject = encodeURIComponent(`Enterprise Hiring Inquiry: ${formData.company}`);
    const body = encodeURIComponent(
      `Hi Voke Team,\n\nI would like to get in touch regarding hiring automation.\n\n` +
      `Name: ${formData.name}\n` +
      `Work Email: ${formData.email}\n` +
      `Company: ${formData.company}\n` +
      `Monthly Candidate Volume: ${formData.candidateVolume}\n` +
      `Notes: ${formData.notes || "N/A"}\n\n` +
      `Looking forward to hearing from you!`
    );

    // Simulate async submission and open mailto
    setTimeout(() => {
      window.location.href = `mailto:teamtryvoke@gmail.com?subject=${subject}&body=${body}`;
      setIsSubmitting(false);
      setIsOpen(false);
      toast.success("Inquiry initiated! Our enterprise team will follow up within 2 business hours.");
    }, 600);
  };

  return (
    <div className="relative rounded-[32px] sm:rounded-[36px] bg-gradient-to-br from-[#062c1d] via-[#093824] to-[#041c13] border border-emerald-500/25 p-7 sm:p-10 md:p-12 lg:p-14 shadow-[0_25px_65px_rgba(0,40,25,0.22)] overflow-hidden text-white mt-10 sm:mt-14">
      {/* Precision Engineering Cartesian Grid (matching screenshot) */}
      <div
        className="absolute inset-0 pointer-events-none select-none opacity-40 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_50%,#000_40%,transparent_95%)]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      {/* Atmospheric Ambient Lighting Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
        {/* Left Column: Copy & Pills */}
        <div className="max-w-2xl space-y-5">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-emerald-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>For Hiring Teams &amp; Tech Recruiters</span>
          </div>

          {/* Main Headline */}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-normal tracking-tight text-white leading-[1.12]">
            Accelerate Engineering Hiring With <br className="hidden sm:inline" />
            <span className="italic text-emerald-300">
              Adaptive AI Rounds
            </span>
          </h2>

          {/* Subtitle Description */}
          <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
            Evaluate real-time problem solving, voice reasoning, and code quality before the team round. Custom evaluation rubrics, zero scheduling bottlenecks, and comprehensive candidate dossiers.
          </p>

          {/* 3 Interactive Feature Pills in Same Line with contextual symbols */}
          <div className="flex flex-nowrap items-center gap-2 sm:gap-2.5 pt-1 overflow-x-auto no-scrollbar">
            {[
              { label: "Custom Stack Rubrics", icon: SlidersHorizontal },
              { label: "Live Voice & Code AI", icon: Terminal },
              { label: "Ranked Candidate Dossiers", icon: CheckCheck },
            ].map((chip) => {
              const Icon = chip.icon;
              return (
                <span
                  key={chip.label}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/95 text-xs font-medium backdrop-blur-md flex items-center gap-1.5 transition-all duration-200 shadow-2xs whitespace-nowrap shrink-0"
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{chip.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Right Column: CTA & Subtext */}
        <div className="flex flex-col items-start lg:items-end justify-center gap-3 pt-2 lg:pt-0 shrink-0">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-white hover:bg-zinc-100 text-[#003B2D] hover:text-[#0F6B38] font-bold px-8 py-6 rounded-full text-base shadow-[0_12px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] hover:scale-105 transition-all duration-300 flex items-center gap-2 group cursor-pointer border border-white/20"
              >
                <span>Contact</span>
                <ArrowUpRight className="w-5 h-5 text-[#003B2D] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-[#07130e] border border-emerald-500/30 text-white shadow-2xl backdrop-blur-xl">
              <DialogHeader className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider w-fit">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enterprise Candidate Screening</span>
                </div>
                <DialogTitle className="font-serif text-2xl font-normal text-white">
                  Accelerate Your <span className="italic text-emerald-300">Technical Hiring</span>
                </DialogTitle>
                <DialogDescription className="text-zinc-300 text-xs leading-relaxed">
                  Tell us about your open tech roles and candidate volume. We will tailor candidate screening pipelines, customized rubrics, and automated ATS integrations.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Your Full Name</label>
                  <Input
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-black/40 border-white/15 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-400 h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Work Email</label>
                  <Input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-black/40 border-white/15 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-400 h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Company Name</label>
                  <Input
                    required
                    placeholder="e.g. Acme Corp / Zepto"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="bg-black/40 border-white/15 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-400 h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Monthly Candidate Volume</label>
                  <select
                    value={formData.candidateVolume}
                    onChange={(e) => setFormData({ ...formData, candidateVolume: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="20-50 candidates/month" className="bg-[#07130e] text-white">20–50 candidates/month</option>
                    <option value="50-200 candidates/month" className="bg-[#07130e] text-white">50–200 candidates/month</option>
                    <option value="200-1000 candidates/month" className="bg-[#07130e] text-white">200–1,000 candidates/month</option>
                    <option value="1000+ candidates/month" className="bg-[#07130e] text-white">1,000+ candidates/month (High Concurrency)</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0F6B38] hover:bg-[#0B572D] text-white font-semibold h-11 rounded-full text-xs shadow-md border border-emerald-500/30 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Inquiry</span>
                      </>
                    )}
                  </Button>

                  <a
                    href="mailto:teamtryvoke@gmail.com?subject=Enterprise%20Hiring%20Inquiry"
                    className="text-center text-[11px] text-zinc-400 hover:text-emerald-300 transition-colors pt-1"
                  >
                    Or write to us directly at <span className="underline font-mono">teamtryvoke@gmail.com</span>
                  </a>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Trust Subtext */}
          <p className="text-xs text-emerald-200/70 text-left lg:text-right font-normal">
            Trusted by high-growth startups &amp; engineering teams to hire faster
          </p>
        </div>
      </div>
    </div>
  );
});

HiringTeamsBanner.displayName = "HiringTeamsBanner";
export default HiringTeamsBanner;
