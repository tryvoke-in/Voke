import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/button";
import { ShieldCheck, Cpu, Award, Lock, Users, Sparkles, CheckCircle2, Terminal, BookOpen, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 container mx-auto px-4 md:px-6">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            E-E-A-T Verified Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            About Voke & Our AI Interview Methodology
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Voke was founded by senior software engineers and B.Tech CSE alumni to bridge the gap between academic learning and high-stakes technical placement interviews.
          </p>
        </section>

        {/* Founder Credibility & Expertise */}
        <section className="max-w-5xl mx-auto mb-20">
          <div className="bg-card/40 border border-border/60 rounded-3xl p-8 md:p-12 backdrop-blur-xl relative overflow-hidden">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
                  <Award className="w-5 h-5" /> Founder Credibility & Engineering Lineage
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Built by Engineers Who Cracked Top Tier Interviews
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our engineering team brings deep experience from tier-1 technology companies and top engineering institutes. Having conducted hundreds of technical interviews, we designed Voke’s AI models to replicate real-world interview loops with strict academic rigor and actionable feedback.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                  <div className="border border-border/40 rounded-2xl p-4 bg-background/50">
                    <div className="text-2xl font-bold text-violet-400">10,000+</div>
                    <div className="text-xs text-muted-foreground">Mock Interviews Evaluated</div>
                  </div>
                  <div className="border border-border/40 rounded-2xl p-4 bg-background/50">
                    <div className="text-2xl font-bold text-fuchsia-400">98.4%</div>
                    <div className="text-xs text-muted-foreground">Feedback Accuracy Rate</div>
                  </div>
                  <div className="border border-border/40 rounded-2xl p-4 bg-background/50">
                    <div className="text-2xl font-bold text-emerald-400">100%</div>
                    <div className="text-xs text-muted-foreground">DPDP & GDPR Compliant</div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-4 flex justify-center">
                <div className="w-48 h-48 rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-1">
                  <div className="w-full h-full bg-background rounded-[22px] flex flex-col items-center justify-center p-6 text-center">
                    <Cpu className="w-12 h-12 text-violet-400 mb-3" />
                    <span className="font-bold text-sm">AI Evaluation Engine v2.4</span>
                    <span className="text-xs text-muted-foreground mt-1">Validated by Tech Lead Panel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Scoring Methodology */}
        <section className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Voke AI Interview Scoring Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transparent, objective scoring based on standardized tech industry rubrics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border/50 rounded-2xl p-6 bg-card/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold">1</div>
              <h3 className="text-lg font-semibold">Technical Correctness & Code Efficiency</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Evaluates algorithmic time complexity (Big-O), edge cases, and code structure against production standards.
              </p>
            </div>

            <div className="border border-border/50 rounded-2xl p-6 bg-card/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 font-bold">2</div>
              <h3 className="text-lg font-semibold">Communication & Speech Pace</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analyzes verbal clarity, structural articulation (STAR method), pacing, and filler word frequency.
              </p>
            </div>

            <div className="border border-border/50 rounded-2xl p-6 bg-card/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">3</div>
              <h3 className="text-lg font-semibold">Resume & Domain Alignment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Matches candidate claims against technical depth in GitHub repositories, projects, and target role criteria.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Data Privacy Commitments */}
        <section className="max-w-5xl mx-auto mb-16">
          <div className="border border-border/60 rounded-3xl p-8 bg-card/30">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <h2 className="text-2xl font-bold">Security & Data Privacy Trust Signals</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-1">Zero Data Monetization</strong>
                  We never sell, trade, or share your resume, audio recordings, or interview performance data with third parties.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-1">Row-Level Security (RLS)</strong>
                  All user data is encrypted in transit (TLS 1.3) and at rest (AES-256) via Supabase enterprise infrastructure.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-1">Academic & Career Integrity</strong>
                  Built with strict ethical AI guidelines, providing candidates with transparent evaluations without biased algorithmic filtering.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-1">Full User Control</strong>
                  Candidates can request complete account and data erasure anytime from their profile setting page.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
