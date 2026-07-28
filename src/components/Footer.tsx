import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Twitter, Linkedin, Mail, ArrowRight, Layers, Zap, Hexagon, Instagram, Shield, BookOpen } from "lucide-react";
import { motion, Variants } from "framer-motion";

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    return (
        <footer aria-label="Footer Navigation" className="relative bg-background border-t border-border/10 overflow-hidden font-sans">
            {/* Glowing top border separator line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

            {/* Cyber Grid & Glowing Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/15 blur-[130px] animate-pulse" style={{ animationDuration: "12s" }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/15 blur-[130px] animate-pulse" style={{ animationDuration: "16s" }} />
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                <motion.div
                    variants={containerVariants}
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-0"
                >
                    {/* Brand Section */}
                    <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col h-full">
                        <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-8 h-full relative overflow-hidden group hover:border-violet-500/30 transition-colors duration-500">
                             <div className="absolute top-0 right-0 p-4 opacity-50">
                                <Hexagon className="w-24 h-24 text-primary/5 stroke-1" />
                             </div>
                             
                            <Link to="/" className="flex items-center gap-3 mb-6 relative z-10 w-fit">
                                <div className="relative group/logo">
                                    <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                                    <img 
                                        src="/images/voke_logo.png" 
                                        alt="Voke AI Tech Interview Preparation Logo" 
                                        width={48}
                                        height={48}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-12 h-12 object-contain relative z-10"
                                    />
                                </div>
                                <span className="text-3xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
                                    Voke
                                </span>
                            </Link>

                            <p className="text-muted-foreground leading-relaxed max-w-sm mb-8 text-sm font-light">
                                Mastering technical interviews made <span className="text-foreground font-medium">intelligent</span>. AI-driven practice, real-time feedback, and personalized roadmaps.
                            </p>

                             <div className="flex flex-col gap-4 mt-auto">
                                 <div className="flex items-center gap-4">
                                     {[
                                         { icon: Twitter, href: "https://twitter.com", label: "Voke on Twitter", color: "hover:bg-sky-500/10 hover:text-sky-400" },
                                         { icon: Github, href: "https://github.com", label: "Voke on GitHub", color: "hover:bg-zinc-500/10 hover:text-foreground" },
                                         { icon: Linkedin, href: "https://www.linkedin.com/company/vokeaii/", label: "Voke on LinkedIn", color: "hover:bg-blue-600/10 hover:text-blue-500" },
                                         { icon: Instagram, href: "https://www.instagram.com/tryvoke.in", label: "Voke on Instagram", color: "hover:bg-pink-600/10 hover:text-pink-500" }
                                     ].map((social, index) => (
                                         <a
                                             key={index}
                                             href={social.href}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             aria-label={social.label}
                                             className={`w-10 h-10 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground transition-all duration-300 hover:scale-110 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${social.color}`}
                                         >
                                             <social.icon className="w-4 h-4" aria-hidden="true" />
                                             <span className="sr-only">{social.label}</span>
                                         </a>
                                     ))}
                                 </div>
                                 <p className="text-xs text-muted-foreground/60 font-mono mt-1">
                                     © {currentYear} Voke Inc. All rights reserved.
                                 </p>
                             </div>
                        </div>
                    </motion.div>

                    {/* Navigation Columns */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8 py-2 px-2">
                        <motion.div variants={itemVariants} className="flex flex-col">
                            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 text-xs tracking-wider uppercase opacity-90">
                                <Layers className="w-4 h-4 text-violet-500" /> Practice Tools
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    { label: "AI Mock Interview", to: "/voice-assistant" },
                                    { label: "Technical Practice Bank", to: "/question-practice" },
                                    { label: "DSA Master Sheet", to: "/dsa-sheet" },
                                    { label: "Company Question Sets", to: "/companies" },
                                    { label: "Elite Prep Program", to: "/elite-prep" }
                                ].map((link, index) => (
                                    <li key={index} className="list-none">
                                        <Link
                                            to={link.to}
                                            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group text-sm"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex flex-col">
                            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 text-xs tracking-wider uppercase opacity-90">
                                <Zap className="w-4 h-4 text-fuchsia-500" /> Resources
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    { label: "Tech Candidate Forum", to: "/community" },
                                    { label: "Daily Interview Challenge", to: "/daily-challenge" },
                                    { label: "Interview Leaderboard", to: "/leaderboard" },
                                    { label: "Engineering Blog", to: "/blog" },
                                    { label: "Pricing & Subscriptions", to: "/pricing" }
                                ].map((link, index) => (
                                    <li key={index} className="list-none">
                                        <Link
                                            to={link.to}
                                            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group text-sm"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex flex-col">
                            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 text-xs tracking-wider uppercase opacity-90">
                                <Shield className="w-4 h-4 text-emerald-500" /> Company & Legal
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    { label: "About Voke & Methodology", to: "/about" },
                                    { label: "Help Center & FAQs", to: "/help" },
                                    { label: "Contact & Support", to: "/contact" },
                                    { label: "Privacy Policy", to: "/privacy" },
                                    { label: "Terms of Service", to: "/terms" }
                                ].map((link, index) => (
                                    <li key={index} className="list-none">
                                        <Link
                                            to={link.to}
                                            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group text-sm"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};
