import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Twitter, Linkedin, Mail, Heart, ArrowRight, Layers, Zap, Hexagon, Instagram } from "lucide-react";
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
        <footer className="relative bg-background border-t border-border/40 overflow-hidden font-sans">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
                 <div className="absolute -top-[50%] -left-[10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px]" />
                 <div className="absolute bottom-[0%] -right-[10%] w-[40%] h-[40%] rounded-full bg-fuchsia-500/10 blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                <motion.div
                    variants={containerVariants}
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16"
                >
                    {/* Brand Section - Large Bento Card */}
                    <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col h-full">
                        <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-8 h-full relative overflow-hidden group hover:border-violet-500/30 transition-colors duration-500">
                             <div className="absolute top-0 right-0 p-4 opacity-50">
                                <Hexagon className="w-24 h-24 text-primary/5 stroke-1" />
                             </div>
                             
                            <Link to="/" className="flex items-center gap-3 mb-6 relative z-10 w-fit">
                                <div className="relative group/logo">
                                    <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                                    <img 
                                        src="/images/voke_logo.png" 
                                        alt="Voke Logo" 
                                        className="w-12 h-12 object-contain relative z-10"
                                    />
                                </div>
                                <span className="text-3xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
                                    Voke
                                </span>
                            </Link>

                            <p className="text-muted-foreground leading-relaxed max-w-sm mb-8 text-lg font-light">
                                Mastering technical interviews made <span className="text-foreground font-medium">intelligent</span>. AI-driven practice, real-time feedback, and personalized roadmaps.
                            </p>

                            <div className="flex items-center gap-4 mt-auto">
                                {[
                                    { icon: Twitter, href: "https://twitter.com", color: "hover:bg-sky-500/10 hover:text-sky-400" },
                                    { icon: Github, href: "https://github.com", color: "hover:bg-zinc-500/10 hover:text-foreground" },
                                    { icon: Linkedin, href: "https://www.linkedin.com/company/vokeaii/", color: "hover:bg-blue-600/10 hover:text-blue-500" },
                                    { icon: Instagram, href: "https://www.instagram.com/tryvoke.in", color: "hover:bg-pink-600/10 hover:text-pink-500" }
                                ].map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-12 h-12 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color}`}
                                    >
                                        <social.icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation - Middle Columns */}
                    <div className="lg:col-span-4 grid grid-cols-2 gap-4 h-full">
                        <motion.div variants={itemVariants} className="bg-card/20 backdrop-blur-md border border-border/30 rounded-3xl p-6 hover:bg-card/30 transition-colors">
                            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-violet-500" /> Product
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { label: "Learning Paths", to: "/learning-paths" },
                                    { label: "Video Practice", to: "/video-interview" },
                                    { label: "Leaderboard", to: "/leaderboard" },
                                    { label: "Peer Sessions", to: "/peer-interviews" }
                                ].map((link, index) => (
                                    <li key={index}>
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

                         <motion.div variants={itemVariants} className="bg-card/20 backdrop-blur-md border border-border/30 rounded-3xl p-6 hover:bg-card/30 transition-colors">
                            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-fuchsia-500" /> Support
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { label: "Blog", to: "/blog" },
                                    { label: "Community", to: "/community" },
                                    { label: "Help Center", to: "/help" },
                                    { label: "Privacy Policy", to: "/privacy" }
                                ].map((link, index) => (
                                    <li key={index}>
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

                    {/* Newsletter - Right Column Bento */}
                    <motion.div variants={itemVariants} className="lg:col-span-3">
                         <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full flex flex-col relative overflow-hidden">
                            <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay"></div>
                            
                            <div className="relative z-10">
                                <h3 className="font-bold text-white mb-2 text-xl">Join the Voke Elite</h3>
                                <p className="text-violet-200/80 mb-6 text-sm">
                                    Get the latest interview questions and system design tips delivered.
                                </p>
                                
                                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300 group-focus-within:text-white transition-colors" />
                                        <Input
                                            type="email"
                                            placeholder="developer@example.com"
                                            className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:bg-black/40 transition-all rounded-xl h-12"
                                        />
                                    </div>
                                    <Button className="w-full bg-white text-black hover:bg-zinc-200 transition-colors h-12 rounded-xl font-medium group">
                                        Subscribe
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Bottom Bar */}
                <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm"
                >
                    <p className="text-muted-foreground font-mono">
                        © {currentYear} Voke Inc. <span className="mx-2 text-border">|</span> System Status: <span className="text-green-500">Operational</span>
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full border border-border/20 backdrop-blur-sm">
                        <span>Crafted with</span>
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                        <span>in Future City</span>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};
