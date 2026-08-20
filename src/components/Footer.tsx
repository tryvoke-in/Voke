import { Link } from "react-router-dom";
import { 
  Github, Twitter, Linkedin, Instagram, ArrowRight, 
  Layers, Zap, Shield, Sparkles, Code2, CheckCircle2, 
  Globe, Mail, ChevronRight, Heart
} from "lucide-react";
import { motion, Variants } from "framer-motion";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  };

  return (
    <footer aria-label="Footer Navigation" className="relative bg-background border-t border-border/50 overflow-hidden font-sans mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12"
        >
          {/* Brand Card Column (5 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div className="p-7 rounded-3xl bg-card/60 dark:bg-card/40 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-500">
              <Link to="/" className="flex items-center gap-3 mb-4 group/logo w-fit">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 p-2 flex items-center justify-center group-hover/logo:scale-105 transition-transform duration-300">
                  <img 
                    src="/images/voke_logo.png" 
                    alt="Voke Logo" 
                    width={36}
                    height={36}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-2xl font-bold tracking-tight text-foreground group-hover/logo:text-blue-500 transition-colors">
                  Voke
                </span>
              </Link>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-normal">
                Mastering technical interviews made <span className="text-foreground font-semibold">intelligent</span>. AI-driven mock interviews, DSA tracking, and tailored career roadmaps.
              </p>

              {/* Status Indicator */}
              {/* <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/50 text-[11px] text-muted-foreground w-fit mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-foreground">All AI Systems Operational</span>
              </div> */}

              {/* Social Media Icons */}
              <div className="flex items-center gap-2.5">
                {[
                  { icon: Twitter, href: "https://twitter.com", label: "Twitter", hoverColor: "hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30" },
                  { icon: Github, href: "https://github.com", label: "GitHub", hoverColor: "hover:bg-foreground/10 hover:text-foreground hover:border-foreground/30" },
                  { icon: Linkedin, href: "https://www.linkedin.com/company/vokeaii/", label: "LinkedIn", hoverColor: "hover:bg-blue-600/10 hover:text-blue-500 hover:border-blue-500/30" },
                  { icon: Instagram, href: "https://www.instagram.com/tryvoke.in", label: "Instagram", hoverColor: "hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30" }
                ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-9 h-9 rounded-xl bg-background/80 border border-border/60 flex items-center justify-center text-muted-foreground transition-all duration-200 hover:scale-105 shadow-2xs ${social.hoverColor}`}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Nav Links (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8 pt-2">
            {/* Practice Tools */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Layers className="w-3 h-3" />
                </div>
                Practice Tools
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Pro Voice & Video AI", to: "/voice-assistant" },
                  { label: "Theory Interview", to: "/interview/new" },
                  { label: "75-Day DSA Master Sheet", to: "/dsa-sheet" },
                  { label: "Company Question Sets", to: "/companies" },
                  { label: "Elite Multi-Round Prep", to: "/elite-prep" },
                  { label: "AI ATS Resume Builder", to: "/resume-builder" }
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to={link.to}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-blue-500 transition-colors flex items-center gap-1.5 group font-normal"
                    >
                      <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Resources */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
                  <Zap className="w-3 h-3" />
                </div>
                Resources
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Daily Interview Challenge", to: "/daily-challenge" },
                  { label: "Tech Candidate Forum", to: "/community" },
                  { label: "Interview Leaderboard", to: "/leaderboard" },
                  { label: "Job Recommendations", to: "/job-recommendations" },
                  { label: "Engineering Blog", to: "/blog" },
                  { label: "Pricing & Plans", to: "/pricing" }
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to={link.to}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-blue-500 transition-colors flex items-center gap-1.5 group font-normal"
                    >
                      <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company & Support */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <Shield className="w-3 h-3" />
                </div>
                Company & Legal
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "About Voke Methodology", to: "/about" },
                  { label: "Help Center & FAQs", to: "/help" },
                  { label: "Contact & Feedback", to: "/contact" },
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" }
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to={link.to}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-blue-500 transition-colors flex items-center gap-1.5 group font-normal"
                    >
                      <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar Separator & Copyright */}
        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="font-mono text-[11px]">
            © {currentYear} Voke Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-[11px]">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
