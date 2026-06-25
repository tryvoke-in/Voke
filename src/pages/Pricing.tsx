import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, Zap, Star, Shield, HelpCircle, ArrowRight, Building, GraduationCap, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactConfetti from "react-confetti";

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(true);
    const navigate = useNavigate();
    const [isPaying, setIsPaying] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        const checkPremiumStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsPremium(!!user.user_metadata?.is_premium);
            }
        };
        checkPremiumStatus();
    }, []);

    const ensureRazorpay = (): Promise<boolean> => {
        return new Promise((resolve) => {
            // Already loaded
            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }
            // Check if script tag already exists but hasn't loaded yet
            const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
            if (existing) {
                existing.addEventListener('load', () => resolve(true));
                existing.addEventListener('error', () => resolve(false));
                // In case it already loaded between our check
                setTimeout(() => {
                    if ((window as any).Razorpay) resolve(true);
                }, 500);
                return;
            }
            // Dynamically inject
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    };

    const handleUpgrade = async () => {
        setIsPaying(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to upgrade your plan.");
                navigate("/auth");
                setIsPaying(false);
                return;
            }

            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY;
            if (!razorpayKey) {
                toast.error("Payment gateway is not configured. Please contact support.");
                setIsPaying(false);
                return;
            }

            const loaded = await ensureRazorpay();
            if (!loaded || !(window as any).Razorpay) {
                toast.error("Payment gateway could not be loaded. Please disable adblocker and try again.");
                setIsPaying(false);
                return;
            }

            // Create a Razorpay order on the server to get a valid order_id
            const { data: orderData, error: orderError } = await supabase.functions.invoke("create-razorpay-order", {
                body: {
                    amount: 9900, // ₹99 in paise
                    currency: "INR",
                    receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`, // max 40 chars
                },
            });

            if (orderError || !orderData?.id) {
                // Try to extract the real error from the FunctionsHttpError context
                let errMsg = "Unknown error";
                if (orderError) {
                    const ctx = (orderError as any).context;
                    if (ctx && typeof ctx.text === "function") {
                        try { errMsg = await ctx.text(); } catch { errMsg = orderError.message; }
                    } else {
                        errMsg = orderError.message;
                    }
                } else if (orderData) {
                    errMsg = orderData?.error || JSON.stringify(orderData);
                }
                console.error("Order creation error detail:", errMsg, orderError, orderData);
                toast.error(`Payment failed: ${errMsg}`);
                setIsPaying(false);
                return;
            }

            const options = {
                key: razorpayKey,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.id,
                name: "Voke Elite",
                description: "Upgrade to Voke Elite Pro Plan",
                image: "/images/voke_logo.png",
                handler: async function (response: any) {
                    console.log("Payment response:", response);
                    toast.success("Payment successful! Upgrading to Voke Elite Pro...");

                    const { error } = await supabase.auth.updateUser({
                        data: { is_premium: true }
                    });

                    if (error) {
                        console.error("Error updating user premium status:", error);
                        toast.error("Payment recorded, but profile update failed. Please refresh.");
                    } else {
                        // Refresh the session immediately so the new user metadata is available in the local session
                        await supabase.auth.refreshSession();
                        setShowConfetti(true);
                        toast.success("Welcome to Voke Elite Pro! Payment successful.");
                        setTimeout(() => {
                            setShowConfetti(false);
                            navigate("/dashboard");
                        }, 3000);
                    }
                    setIsPaying(false);
                },
                prefill: {
                    name: user.user_metadata?.full_name || "",
                    email: user.email || "",
                },
                theme: {
                    color: "#7c3aed",
                },
                modal: {
                    ondismiss: function() {
                        setIsPaying(false);
                        toast.info("Payment cancelled.");
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function (response: any) {
                console.error("Payment failed:", response.error);
                toast.error(`Payment failed: ${response.error.description}`);
                setIsPaying(false);
            });
            rzp.open();
        } catch (e: any) {
            console.error("Razorpay payment initialization error:", e);
            toast.error("Payment initialization failed: " + e.message);
            setIsPaying(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    const plans = [
        {
            name: "Basic",
            description: "Essential practice for casual learners.",
            price: "Free",
            priceLabel: "",
            features: [
                "Access to Basic Question Bank",
                "Community Discussion Access",
                "Daily Coding Challenges",
                "Basic Progress Tracking",
                "1 AI Mock Interview / Month"
            ],
            cta: "Get Started Free",
            variant: "outline" as const,
            popular: false,
            icon: GraduationCap,
            highlight: false
        },
        {
            name: "Voke Elite",
            description: "Complete power for serious job hunters.",
            price: "₹99",
            priceLabel: "one-time (testing)",
            originalPrice: "₹199",
            features: [
                "Everything in Basic",
                "Unlimited AI Mock Interviews",
                "Elite Mock with Code IDE",
                "Resume Analysis & Optimization",
                "Priority Community Support",
                "Verified Skills Certificate",
                "Ad-free Experience"
            ],
            cta: "Upgrade to Elite",
            variant: "default" as const,
            popular: true,
            icon: Sparkles,
            highlight: true
        },
        {
            name: "Enterprise",
            description: "For universities and coding bootcamps.",
            price: "Custom",
            priceLabel: "",
            features: [
                "Everything in Elite",
                "Bulk Seat Management",
                "Custom Interview Flows",
                "Admin Analytics Dashboard",
                "SSO & Custom Integrations",
                "Dedicated Success Manager",
                "SLA Support"
            ],
            cta: "Contact Sales",
            variant: "outline" as const,
            popular: false,
            icon: Building,
            highlight: false
        }
    ];

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-violet-500/30 flex flex-col overflow-x-hidden">
            {showConfetti && <ReactConfetti width={window.innerWidth} height={window.innerHeight} style={{ zIndex: 100 }} />}
            <Navbar />
            
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute top-[40%] left-[-20%] w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.04]" />
            </div>

            <main className="flex-1 pt-32 pb-20 relative z-10">
                {/* Hero Section */}
                <section className="container mx-auto px-4 text-center max-w-4xl space-y-8 mb-24">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                         <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex"
                         >
                             <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-violet-600 bg-violet-500/10 border border-violet-500/20 backdrop-blur-md">
                                <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                                Launch your career
                            </Badge>
                         </motion.div>
                        
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                            Plans that scale with your <br/>
                            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent animate-gradient-x">
                                ambition
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            From first interview to offer letter, we have the tools you need. Choose the plan that fits your goals.
                        </p>
                    </motion.div>
                </section>

                {/* 3-Tier Pricing Cards */}
                <section className="container mx-auto px-4 max-w-7xl mb-32">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8 items-start relative"
                    >
                        {plans.map((plan, idx) => {
                             const Icon = plan.icon;
                             return (
                                <motion.div 
                                    key={plan.name}
                                    variants={itemVariants}
                                    className={`relative group rounded-[2rem] transition-all duration-300 ${plan.popular ? 'md:-mt-8 md:mb-8 z-10' : 'z-0'}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -inset-[2px] bg-gradient-to-b from-violet-500 via-fuchsia-500 to-violet-500 rounded-[2rem] opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                                    )}
                                    
                                    <div className={`
                                        relative h-full rounded-[1.9rem] p-8 flex flex-col
                                        ${plan.popular ? 'bg-background shadow-2xl shadow-violet-500/20' : 'bg-card/40 backdrop-blur-md border border-border/50 hover:border-violet-500/30'}
                                    `}>
                                        {plan.popular && (
                                            <div className="absolute top-0 inset-x-0 -translate-y-1/2 flex justify-center">
                                                 <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wide">
                                                    <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                                                    Most Popular
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-8">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.popular ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300' : 'bg-secondary text-muted-foreground'}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                            <p className="text-muted-foreground text-sm leading-relaxed min-h-[40px]">{plan.description}</p>
                                        </div>

                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-2">
                                                {plan.price === "Custom" ? (
                                                     <span className="text-4xl font-bold tracking-tight">Custom</span>
                                                ) : plan.price === "Free" ? (
                                                     <span className="text-5xl font-bold tracking-tight">Free</span>
                                                ) : (
                                                    <>
                                                        <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                                                        {(plan as any).originalPrice && (
                                                            <span className="text-lg text-muted-foreground line-through">{(plan as any).originalPrice}</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            {(plan as any).priceLabel && (
                                                 <p className="text-xs text-muted-foreground mt-2 font-medium">
                                                    {(plan as any).priceLabel}
                                                </p>
                                            )}
                                        </div>

                                         {isPremium && plan.name === "Voke Elite" ? (
                                             <div className="space-y-2 mb-8">
                                                 <Button 
                                                     onClick={() => navigate("/dashboard")}
                                                     className="w-full h-12 rounded-xl text-sm font-bold bg-muted hover:bg-muted/80 text-foreground"
                                                 >
                                                     Already Premium
                                                 </Button>
                                                 <Button 
                                                     variant="outline"
                                                     onClick={async () => {
                                                         setIsPaying(true);
                                                         const { error } = await supabase.auth.updateUser({
                                                             data: { is_premium: false }
                                                         });
                                                         if (error) {
                                                             console.error("Error updating user premium status:", error);
                                                             toast.error("Failed to downgrade: " + error.message);
                                                         } else {
                                                             await supabase.auth.refreshSession();
                                                             setIsPremium(false);
                                                             toast.success("Downgraded to Free tier for testing!");
                                                         }
                                                         setIsPaying(false);
                                                     }}
                                                     disabled={isPaying}
                                                     className="w-full h-10 rounded-xl text-xs font-semibold border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all duration-300"
                                                 >
                                                     Revert to Free (Testing Only)
                                                 </Button>
                                             </div>
                                         ) : (
                                             <Button 
                                                 onClick={() => {
                                                     if (plan.name === "Basic") {
                                                         navigate("/dashboard");
                                                     } else if (plan.name === "Voke Elite") {
                                                         if (isPremium) {
                                                             navigate("/dashboard");
                                                             return;
                                                         }
                                                         handleUpgrade();
                                                     } else {
                                                         toast.info("For Enterprise custom plans, contact: sales@voke.ai");
                                                     }
                                                 }}
                                                 disabled={isPaying}
                                                 className={`w-full h-12 rounded-xl text-sm font-bold transition-all duration-300 mb-8
                                                 ${plan.popular 
                                                     ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02]' 
                                                     : 'hover:bg-secondary/80'}`}
                                                 variant={plan.variant}
                                             >
                                                 {isPremium && plan.name === "Voke Elite" ? "Already Premium" : isPaying && plan.name === "Voke Elite" ? "Opening checkout..." : plan.cta}
                                                 {plan.popular && !isPaying && !isPremium && <ArrowRight className="w-4 h-4 ml-2" />}
                                             </Button>
                                         )}

                                        <div className="space-y-4 mt-auto">
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                                Includes
                                            </div>
                                            <ul className="space-y-3">
                                                {plan.features.map(feature => (
                                                    <li key={feature} className="flex items-start gap-3 text-sm group/feature">
                                                        <Check className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${plan.popular ? 'text-violet-500' : 'text-muted-foreground group-hover/feature:text-violet-500'}`} />
                                                        <span className="text-muted-foreground group-hover/feature:text-foreground transition-colors">
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </section>

                {/* FAQ Section */}
                <section className="container mx-auto px-4 max-w-4xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">Everything you need to know about the product and billing.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                         {[
                            { q: "Can I upgrade later?", a: "Yes, you can upgrade from Basic to Pro at any time. We'll prorate the difference for the remainder of your cycle." },
                            { q: "Is there a student discount?", a: "Absolutely! Verify your student status with a .edu email to receive 50% off the Pro plan for up to 4 years." },
                            { q: "What's the Enterprise limit?", a: "Enterprise plans support unlimited seats and come with volume discounts starting at 10 seats." },
                            { q: "Do you offer refunds?", a: "We offer a 7-day money-back guarantee on the Pro plan if you're not completely satisfied." },
                            { q: "Can I pause my subscription?", a: "Yes, you can pause your Pro subscription for up to 3 months if you're taking a break from interviewing." },
                            { q: "Is the certificate official?", a: "Our Verified Skills Certificates are industry-recognized and can be added directly to your LinkedIn profile." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/50 transition-colors">
                                <h3 className="font-bold text-foreground mb-2 flex items-start gap-2">
                                    <HelpCircle className="w-4 h-4 mt-1 text-violet-500 shrink-0" />
                                    {faq.q}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </section>

                 {/* Social Proof */}
                 <section className="container mx-auto px-4 py-16 text-center border-t border-border/40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-violet-500/5 pointer-events-none" />
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center gap-6 relative z-10"
                    >
                         <div className="flex -space-x-4">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="relative group">
                                    <div className="absolute inset-0 bg-violet-500 blur-md opacity-0 group-hover:opacity-50 transition-opacity rounded-full" />
                                    <img 
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+100}`} 
                                        className="w-12 h-12 rounded-full border-2 border-background relative z-10 transition-transform hover:scale-110 hover:z-20 shadow-lg" 
                                        alt="User"
                                    />
                                </div>
                            ))}
                         </div>
                         <div>
                             <h3 className="text-3xl font-bold mb-2">Join 10,000+ Developers</h3>
                             <p className="text-muted-foreground max-w-md mx-auto">
                                 Start your journey today and get the career you deserve.
                             </p>
                         </div>
                    </motion.div>
                 </section>

            </main>
            <Footer />
        </div>
    );
};

export default Pricing;
