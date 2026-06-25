import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle, ArrowRight, Sparkles, Users, Award, 
  Zap, Shield, Globe, Play, Star, Menu, X, ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { WAITLIST_CONFIG } from "@/config/waitlist";

const Index = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuthNavigation = () => {
    const isBypassed = localStorage.getItem("voke_waitlist_bypass") === "true";
    if (WAITLIST_CONFIG.enabled && !isBypassed) {
      navigate("/waitlist");
    } else {
      navigate("/auth");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      {/* Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer group" 
              onClick={() => navigate("/")}
            >
              <img 
                src="/images/voke_logo.png" 
                alt="Voke Logo" 
                className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Voke
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {["Features", "How it Works", "Testimonials", "Pricing"].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={handleAuthNavigation}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                Sign In
              </Button>
              <Button
                onClick={handleAuthNavigation}
                className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-medium transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black pt-24 px-4 md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              {["Features", "How it Works", "Testimonials", "Pricing"].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-2xl font-medium text-gray-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="flex flex-col gap-4 mt-8">
                <Button 
                  size="lg"
                  variant="outline" 
                  onClick={handleAuthNavigation}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
                <Button
                  size="lg"
                  onClick={handleAuthNavigation}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[120px] -z-10" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-violet-300 text-sm font-medium mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>The Future of Interview Prep is Here</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
            >
              Master Your Interview <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white bg-clip-text text-transparent">
                With AI Precision
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Practice with realistic AI interviewers, get instant personalized feedback, 
              and land your dream job faster than ever before.
            </motion.p>



            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={handleAuthNavigation}
                className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 rounded-full font-semibold shadow-xl shadow-white/10 hover:scale-105 transition-all duration-300"
              >
                Start Practicing Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/20 text-black hover:bg-white/10 text-lg px-8 py-6 rounded-full backdrop-blur-sm"
                  >
                    <Play className="mr-2 w-5 h-5 fill-current" />
                    Watch Demo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-black/90 border-white/10 backdrop-blur-xl">
                  <div className="aspect-video w-full">
                    <iframe 
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/LXb3EKWsInQ?si=KvH-2j1k2j1k2j1k&autoplay=1&mute=0" 
                      title="Voke AI Demo" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                    ></iframe>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Hero Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-20 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-2 shadow-2xl">
                <div className="rounded-lg overflow-hidden bg-gray-900 aspect-[16/9] relative">
                  {/* Abstract UI Representation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-8 w-3/4 opacity-50">
                      <div className="space-y-4">
                        <div className="h-32 rounded-lg bg-white/10 animate-pulse" />
                        <div className="h-12 rounded-lg bg-white/10 w-3/4" />
                        <div className="h-12 rounded-lg bg-white/10" />
                      </div>
                      <div className="space-y-4 pt-12">
                        <div className="h-12 rounded-lg bg-violet-500/20 w-full" />
                        <div className="h-32 rounded-lg bg-white/10" />
                        <div className="h-12 rounded-lg bg-white/10 w-1/2" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/10" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-8 font-medium tracking-wider uppercase">
            Trusted by candidates from top companies
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {["Google", "Microsoft", "Amazon", "Meta", "Netflix"].map((company) => (
              <span key={company} className="text-xl md:text-2xl font-bold text-white/40 hover:text-white transition-colors cursor-default">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Everything you need to <span className="text-violet-400">excel</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Comprehensive tools designed to simulate real interview environments and boost your confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: "Real-time AI Feedback",
                desc: "Get instant analysis on your tone, pace, and answer quality immediately after speaking.",
                color: "from-yellow-500/20 to-orange-500/20"
              },
              {
                icon: <Users className="w-6 h-6 text-blue-400" />,
                title: "Mock Peer Interviews",
                desc: "Practice with other candidates in a collaborative environment to share knowledge.",
                color: "from-blue-500/20 to-cyan-500/20"
              },
              {
                icon: <Award className="w-6 h-6 text-purple-400" />,
                title: "Role-Specific Paths",
                desc: "Curated question banks for Software Engineering, PM, Data Science, and more.",
                color: "from-purple-500/20 to-pink-500/20"
              },
              {
                icon: <Globe className="w-6 h-6 text-green-400" />,
                title: "Global Standards",
                desc: "Questions and evaluation criteria aligned with top tech companies worldwide.",
                color: "from-green-500/20 to-emerald-500/20"
              },
              {
                icon: <Shield className="w-6 h-6 text-red-400" />,
                title: "Private & Secure",
                desc: "Your practice sessions are private. We prioritize your data security and privacy.",
                color: "from-red-500/20 to-rose-500/20"
              },
              {
                icon: <Sparkles className="w-6 h-6 text-violet-400" />,
                title: "Smart Progress Tracking",
                desc: "Visualize your improvement over time with detailed analytics and insights.",
                color: "from-violet-500/20 to-indigo-500/20"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 transition-colors"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              How Voke <span className="text-fuchsia-400">Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Three simple steps to transform your interview preparation journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0 -translate-y-1/2 z-0" />

            {[
              {
                step: "01",
                title: "Choose Your Path",
                desc: "Select your target role and experience level. We customize the questions to match your goals."
              },
              {
                step: "02",
                title: "Practice with AI",
                desc: "Engage in realistic voice or text conversations. Our AI adapts to your responses in real-time."
              },
              {
                step: "03",
                title: "Get Insights",
                desc: "Receive instant, detailed feedback on your answers, body language, and speaking pace."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 bg-black/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center group hover:border-violet-500/50 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-violet-400 group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white/[0.02] relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Loved by <span className="text-violet-400">Candidates</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Don't just take our word for it. See what our users have to say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Voke helped me land my L4 offer at Google. The system design practice was incredibly realistic.",
                author: "Sarah Chen",
                role: "Software Engineer at Google",
                rating: 5
              },
              {
                quote: "The behavioral interview feedback was a game changer. I finally understood what I was doing wrong.",
                author: "Michael Ross",
                role: "Product Manager at Meta",
                rating: 5
              },
              {
                quote: "I used to get so nervous during interviews. Voke built my confidence and helped me articulate my thoughts clearly.",
                author: "Priya Patel",
                role: "Data Scientist at Amazon",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.author}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Simple, Transparent <span className="text-fuchsia-400">Pricing</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start for free, upgrade when you're ready to take your prep to the next level.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                desc: "Perfect for getting started",
                features: ["3 AI Interviews / month", "Basic Feedback", "Community Access", "1 Learning Path"],
                cta: "Get Started",
                popular: false
              },
              {
                name: "Pro",
                price: "$29",
                desc: "For serious job seekers",
                features: ["Unlimited AI Interviews", "Advanced Analytics", "Priority Support", "All Learning Paths", "Video Analysis"],
                cta: "Start Free Trial",
                popular: true
              },
              {
                name: "Team",
                price: "$99",
                desc: "For universities & bootcamps",
                features: ["Everything in Pro", "Team Dashboard", "Custom Question Bank", "Bulk User Management", "API Access"],
                cta: "Contact Sales",
                popular: false
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className={`relative p-8 rounded-3xl border ${
                  plan.popular 
                    ? "bg-violet-900/20 border-violet-500/50 shadow-2xl shadow-violet-500/10" 
                    : "bg-white/5 border-white/10"
                } flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-400 mt-2 text-sm">{plan.desc}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full py-6 rounded-xl font-bold ${
                    plan.popular 
                      ? "bg-white text-black hover:bg-gray-200" 
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  onClick={handleAuthNavigation}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo / CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-violet-900/20" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
              Ready to land your dream job?
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              Join thousands of candidates who are already using Voke to master their interview skills.
            </p>
            <Button
              size="lg"
              onClick={handleAuthNavigation}
              className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-10 py-8 rounded-full font-bold shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 pt-20 pb-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Voke</span>
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                The most advanced AI interview preparation platform. 
                Practice smarter, not harder, and achieve your career goals.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-violet-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-violet-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 Voke AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;