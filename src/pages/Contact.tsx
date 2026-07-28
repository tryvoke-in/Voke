import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, MapPin, MessageSquare, Headphones, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Headphones className="w-3.5 h-3.5" />
            Support & Founder Contact
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Get in Touch with Voke</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Have questions about AI mock interviews, institutional partnerships, or data privacy? Our support team and engineering founders respond within 24 hours.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="border border-border/50 rounded-3xl p-8 bg-card/30 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email Support</h3>
                <p className="text-xs text-muted-foreground">support@tryvoke.in</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Founder & Engineering Queries</h3>
                <p className="text-xs text-muted-foreground">founders@tryvoke.in</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Data Privacy Office</h3>
                <p className="text-xs text-muted-foreground">privacy@tryvoke.in</p>
              </div>
            </div>
          </div>

          <div className="border border-border/50 rounded-3xl p-8 bg-card/30 space-y-4">
            <h3 className="font-bold text-lg">Send Us a Direct Message</h3>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Your Name</label>
              <input type="text" placeholder="John Doe" className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email Address</label>
              <input type="email" placeholder="john@example.com" className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Message</label>
              <textarea rows={3} placeholder="How can we help your interview preparation?" className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl">
              Send Message
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
