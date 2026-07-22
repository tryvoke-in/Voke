import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mic, ArrowLeft, Search, Calendar, User, Clock, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";

import { supabase } from "@/integrations/supabase/client";

const Blog = () => {
    const navigate = useNavigate();

    const handleLogoClick = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    const [blogPosts, setBlogPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .eq('status', 'Published')
                .order('published_at', { ascending: false });
            
            if (error) throw error;
            setBlogPosts(data || []);
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
                                <img 
                                    src="/images/voke_logo.png" 
                                    alt="Voke Logo" 
                                    className="w-10 h-10 object-contain" 
                                />
                                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                                    Voke Blog
                                </h1>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Interview Insights & Career Tips
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Expert advice, industry trends, and practical guides to help you succeed in your career journey.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-2xl mx-auto mb-12"
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search articles..."
                                className="pl-12 h-12 bg-card border-border/50"
                            />
                        </div>
                    </motion.div>

                    {/* Blog Posts Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {blogPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                                onClick={() => navigate(`/blog/${post.id}`)}
                                className="cursor-pointer"
                            >
                                <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
                                    <div className="relative overflow-hidden h-48">
                                        <img
                                            src={post.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop"}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-primary/90 backdrop-blur-sm">
                                                {post.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="flex-1">
                                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                                            {post.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 mt-2">
                                            {post.content}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>{post.author}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>5 min read</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Load More Button */}
                    <div className="text-center mt-12">
                        <Button size="lg" variant="outline">
                            Load More Articles
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Blog;
