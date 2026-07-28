import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShieldCheck, FileText, Scale, Lock } from "lucide-react";

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5" />
            Legal & Terms of Service
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: July 28, 2026</p>
        </div>

        <div className="space-y-8 border border-border/50 rounded-3xl p-8 md:p-12 bg-card/30 backdrop-blur-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" /> 1. Platform Usage & License
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Voke grants users a non-exclusive, non-transferable personal license to access our AI-powered mock interview practice tools, question banks, and learning roadmaps. Users agree not to reverse engineer, copy, or redistribute platform content.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-violet-400" /> 2. User Data & Account Security
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. Voke enforces enterprise Row-Level Security (RLS) to safeguard your interview sessions, resume documents, and audio evaluation transcripts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-400" /> 3. Ethical AI & Service Commitments
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Voke’s AI evaluation models provide educational feedback designed for interview preparation. While our rubrics reflect top tech industry standards, Voke does not guarantee specific employment or job placement outcomes.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
