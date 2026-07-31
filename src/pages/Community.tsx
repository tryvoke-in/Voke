import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare, Heart, Share2, TrendingUp, Users,
  MoreHorizontal, Image as ImageIcon, Send, Search, Sparkles, X,
  Calendar, Award, MessageCircle, Flame, CheckCircle2
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_TRENDING_TOPICS = [
  { tag: "SystemDesign", posts: 24 },
  { tag: "GoogleL4", posts: 19 },
  { tag: "LeetCodeMedium", posts: 16 },
  { tag: "BehavioralPrep", posts: 12 },
  { tag: "ResumeReview", posts: 9 },
];

const DEFAULT_SUGGESTED_EVENTS = [
  {
    title: "Google & Meta Peer Mock Session",
    description: "Live 1-on-1 coding interview practice with peers & AI real-time evaluation.",
    type: "Mock Session"
  },
  {
    title: "System Design Masterclass: Scalable Architecture",
    description: "Interactive session on designing TinyURL, Rate Limiters, and Distributed Cache.",
    type: "Workshop"
  },
  {
    title: "Resume & ATS Optimization Clinic",
    description: "Get instant peer feedback on your resume structure for top tech companies.",
    type: "Peer Review"
  }
];

const Community = () => {
  const { toast } = useToast();
  const [view, setView] = useState<'feed' | 'trending' | 'events'>('feed');
  const [aiInsights, setAiInsights] = useState<{ trending_topics: any[], suggested_events: any[] }>({
    trending_topics: DEFAULT_TRENDING_TOPICS,
    suggested_events: DEFAULT_SUGGESTED_EVENTS,
  });
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
    fetchPosts();
    fetchTopContributors();

    // Listen for auth session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Realtime subscription for posts, likes, and comments
    const channel = supabase
      .channel('public:community')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
        fetchTopContributors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        fetchPosts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchAIInsights = async (postsList: any[]) => {
    // 1. Dynamically compute trending tags from real community posts
    const tagCounts: Record<string, number> = {};
    (postsList || []).forEach((p: any) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag: string) => {
          const cleanTag = tag.trim().replace(/^#/, '');
          if (cleanTag) {
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          }
        });
      }
    });

    const computedTopics = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, posts: count }))
      .sort((a, b) => b.posts - a.posts);

    const mergedTopics = computedTopics.length > 0
      ? [...computedTopics, ...DEFAULT_TRENDING_TOPICS.filter(dt => !computedTopics.some(ct => ct.tag.toLowerCase() === dt.tag.toLowerCase()))].slice(0, 5)
      : DEFAULT_TRENDING_TOPICS;

    setAiInsights({
      trending_topics: mergedTopics,
      suggested_events: DEFAULT_SUGGESTED_EVENTS
    });

    // 2. Try fetching from AI Edge function if deployed
    try {
      const { data, error } = await supabase.functions.invoke('analyze-community-trends');
      if (!error && data && data.trending_topics && data.suggested_events) {
        setAiInsights(data);
      }
    } catch (error) {
      // Graceful fallback already in state
    }
  };

  const fetchTopContributors = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_feed' as any)
        .select('user_id');

      if (postsError) throw postsError;

      const countMap: Record<string, number> = {};
      (postsData || []).forEach((p: any) => {
        if (p.user_id) countMap[p.user_id] = (countMap[p.user_id] || 0) + 1;
      });

      const topUserIds = Object.entries(countMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      if (topUserIds.length === 0) {
        setTopContributors([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('community_profiles' as any)
        .select('id, display_name, avatar_url, target_role')
        .in('id', topUserIds.map(([id]) => id));

      const contributors = topUserIds.map(([userId, count], index) => {
        const profile = (profiles || []).find((p: any) => p.id === userId);
        return {
          id: userId,
          name: profile?.display_name || 'Voke Member',
          avatar_url: profile?.avatar_url || null,
          title: profile?.target_role || 'Community Member',
          postCount: count,
          rank: index === 0 ? 'Top 1%' : index === 1 ? 'Top 3%' : index === 2 ? 'Top 5%' : index === 3 ? 'Top 10%' : 'Top 15%',
        };
      });

      setTopContributors(contributors);
    } catch (error) {
      console.error('Error fetching top contributors:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      // The feed view provides server-side like/comment counts, so we do not
      // download every community interaction just to count it in the browser.
      const { data: postsData, error: postsError } = await supabase
        .from('community_feed' as any)
        .select('*')
        .order('pinned_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const rawPosts = postsData || [];
      if (rawPosts.length === 0) {
        setPosts([]);
        fetchAIInsights([]);
        setLoading(false);
        return;
      }

      // Collect user IDs for profiles
      const userIds = Array.from(new Set(rawPosts.map((p: any) => p.user_id).filter(Boolean)));
      
      const { data: profilesData } = userIds.length > 0
        ? await supabase.from('community_profiles' as any).select('id, display_name, avatar_url, target_role').in('id', userIds)
        : { data: [] };

      const { data: { session } } = await supabase.auth.getSession();
      const { data: myLikes } = session?.user && rawPosts.length > 0
        ? await supabase
            .from('likes' as any)
            .select('post_id')
            .eq('user_id', session.user.id)
            .in('post_id', rawPosts.map((post: any) => post.id))
        : { data: [] };

      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      const likedPostIds = new Set((myLikes || []).map((like: any) => like.post_id));

      const formattedPosts = rawPosts.map((p: any) => {
        return {
          ...p,
          profiles: profilesMap.get(p.user_id) || { display_name: 'Voke Member', avatar_url: null, target_role: 'Community Member' },
          isLiked: likedPostIds.has(p.id),
          likeCount: p.like_count || 0,
          commentsCount: p.comment_count || 0,
        };
      });

      setPosts(formattedPosts);
      fetchAIInsights(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    
    let currentUser = user;
    if (!currentUser) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user;
    }

    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post in the community.",
        variant: "destructive",
      });
      return;
    }

    const extractedTags = newPost.match(/#[\w]+/g)?.map(tag => tag.substring(1)) || ["InterviewPrep"];

    try {
      const { error } = await supabase
        .from('posts' as any)
        .insert({
          user_id: currentUser.id,
          content: newPost.trim(),
          image_url: imageUrl.trim() || null,
          tags: extractedTags
        });

      if (error) throw error;
      setNewPost("");
      setImageUrl("");
      setShowImageInput(false);
      toast({
        title: "Post Published!",
        description: "Your discussion has been shared with the community.",
      });
      fetchPosts();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string) => {
    let currentUser = user;
    if (!currentUser) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user;
    }

    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to like discussions.",
        variant: "destructive",
      });
      return;
    }

    const targetPost = posts.find(p => p.id === postId);
    const isLiked = Boolean(targetPost?.isLiked);

    // Optimistic UI update
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !isLiked,
          likeCount: Math.max(0, (p.likeCount || 0) + (isLiked ? -1 : 1)),
        };
      }
      return p;
    }));

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes' as any)
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes' as any)
          .insert({ post_id: postId, user_id: currentUser.id });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      fetchPosts(); // Revert on failure
    }
  };

  const handleShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/community#post-${postId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Discussion link copied to clipboard.",
    });
  };

  const handleRegisterEvent = (eventTitle: string) => {
    setRegisteredEvents(prev => {
      const isReg = !prev[eventTitle];
      toast({
        title: isReg ? "Registered!" : "Unregistered",
        description: isReg ? `You are registered for "${eventTitle}".` : `Registration cancelled for "${eventTitle}".`,
      });
      return { ...prev, [eventTitle]: isReg };
    });
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      setPostComments([]);
      return;
    }

    setExpandedPost(postId);
    setCommentLoading(true);
    try {
      const { data: rawComments, error } = await supabase
        .from('comments' as any)
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentUserIds = Array.from(new Set((rawComments || []).map((c: any) => c.user_id).filter(Boolean)));
      
      const { data: commentProfiles } = commentUserIds.length > 0
        ? await supabase.from('community_profiles' as any).select('id, display_name, avatar_url').in('id', commentUserIds)
        : { data: [] };

      const profileMap = new Map((commentProfiles || []).map((p: any) => [p.id, p]));

      const commentsWithProfiles = (rawComments || []).map((c: any) => ({
        ...c,
        profiles: profileMap.get(c.user_id) || { display_name: 'Voke Member', avatar_url: null }
      }));

      setPostComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!newComment.trim()) return;

    let currentUser = user;
    if (!currentUser) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user;
    }

    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to reply.",
        variant: "destructive",
      });
      return;
    }

    const commentContent = newComment.trim();
    setNewComment("");

    try {
      const { error } = await supabase
        .from('comments' as any)
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: commentContent
        });

      if (error) throw error;

      toast({
        title: "Comment Added!",
        description: "Your reply has been added to the discussion.",
      });

      // Keep the open thread open after a reply, then refresh its contents.
      setExpandedPost(null);
      await handleToggleComments(postId);
      fetchPosts();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.content?.toLowerCase().includes(query) ||
      post.profiles?.display_name?.toLowerCase().includes(query) ||
      post.tags?.some((t: string) => t.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col text-foreground selection:bg-violet-500/30 pt-16">
      <Navbar />

      {/* Development Preview Modal (Optional) */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border p-6 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden text-card-foreground"
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                onClick={() => setShowDevModal(false)}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-amber-500 animate-pulse" />
                </div>

                <h2 className="text-2xl font-bold">Community Lounge</h2>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect with peers, share mock interview experiences, discuss interview questions, and participate in community events.
                </p>

                <div className="pt-2 w-full">
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold h-11 rounded-xl shadow-lg shadow-violet-600/20"
                    onClick={() => setShowDevModal(false)}
                  >
                    Enter Community Lounge
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex w-full min-w-0 relative">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="container mx-auto px-4 py-8">
            

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Navigation & Leaderboard */}
              <div className="lg:col-span-3 space-y-6">
                {/* Navigation Card */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
                  <CardContent className="p-3 space-y-1">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-sm font-medium rounded-xl h-11 ${view === 'feed' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                      onClick={() => setView('feed')}
                    >
                      <MessageSquare className="mr-3 h-4 w-4 text-violet-500" />
                      Community Feed
                    </Button>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-sm font-medium rounded-xl h-11 ${view === 'trending' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                      onClick={() => setView('trending')}
                    >
                      <TrendingUp className="mr-3 h-4 w-4 text-emerald-500" />
                      Trending Topics
                    </Button>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-sm font-medium rounded-xl h-11 ${view === 'events' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                      onClick={() => setView('events')}
                    >
                      <Users className="mr-3 h-4 w-4 text-blue-500" />
                      Live Events & Mocks
                    </Button>
                  </CardContent>
                </Card>

                {/* Top Contributors Card */}
                <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" /> Top Contributors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topContributors.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">No contributors yet. Be the first to post!</p>
                    ) : (
                      topContributors.map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border/50">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold">
                              {member.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.title} • {member.postCount} posts</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20">
                            {member.rank}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-6 space-y-6">
                
                {view === 'feed' && (
                  <>
                    {/* Create Post Card */}
                    <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex gap-4">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white font-bold">
                              {user?.email?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3">
                            <Textarea
                              placeholder="Share your interview questions, tech insights, or preparation milestones... (Use #hashtags to create topics)"
                              value={newPost}
                              onChange={(e) => setNewPost(e.target.value)}
                              className="bg-muted/40 border-border/60 min-h-[90px] resize-none focus:border-violet-500/50 focus:ring-violet-500/20 text-sm rounded-xl"
                            />
                            {showImageInput && (
                              <Input
                                placeholder="Paste image URL (optional)..."
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="bg-muted/40 border-border/60 h-9 text-xs rounded-xl"
                              />
                            )}
                            <div className="flex justify-between items-center pt-1">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowImageInput(!showImageInput)}
                                  className={`text-xs gap-1.5 rounded-lg ${showImageInput ? 'text-violet-600 bg-violet-500/10 font-bold' : 'text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10'}`}
                                >
                                  <ImageIcon className="h-4 w-4" /> Media
                                </Button>
                              </div>
                              <Button
                                onClick={handlePost}
                                disabled={!newPost.trim()}
                                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 h-9 rounded-xl shadow-md shadow-violet-600/20"
                              >
                                <Send className="mr-1.5 h-3.5 w-3.5" /> Post Discussion
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Posts Stream */}
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-12 bg-card/40 border border-border/50 rounded-2xl">
                          <div className="inline-block w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-2" />
                          <p className="text-sm text-muted-foreground">Loading community discussions...</p>
                        </div>
                      ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-12 bg-card/40 border border-border/50 rounded-2xl">
                          <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                          <h4 className="font-semibold text-base">No discussions found</h4>
                          <p className="text-xs text-muted-foreground mt-1">Be the first software engineer to start a conversation!</p>
                        </div>
                      ) : (
                        filteredPosts.map((post) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
                              <CardHeader className="flex flex-row items-start gap-3 p-4 sm:p-5 pb-2">
                                <Avatar className="h-10 w-10 border border-border/50">
                                  <AvatarImage src={post.profiles?.avatar_url} />
                                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold">
                                    {post.profiles?.display_name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-semibold text-foreground text-sm">{post.profiles?.display_name || 'Voke Member'}</h3>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {post.profiles?.target_role || 'Community Member'} • {new Date(post.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{post.content}</p>
                                {post.image_url && (
                                  <div className="rounded-xl overflow-hidden border border-border">
                                    <img src={post.image_url} alt="Post media" className="w-full h-auto max-h-80 object-cover" />
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1.5">
                                  {post.tags?.map((tag: string) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0 text-[11px] cursor-pointer hover:bg-violet-500/20 transition-colors"
                                      onClick={() => setSearchQuery(tag)}
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>

                              <CardFooter className="p-3 sm:px-5 border-t border-border/40 flex justify-between bg-muted/20">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`text-xs gap-1.5 ${post.isLiked ? 'text-pink-500 bg-pink-500/10 font-bold' : 'text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10'}`}
                                  onClick={() => handleLike(post.id)}
                                >
                                  <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current text-pink-500' : ''}`} />
                                  {post.likeCount || 0} Likes
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`text-xs gap-1.5 ${expandedPost === post.id ? 'text-violet-600 dark:text-violet-400 bg-violet-500/10 font-bold' : 'text-muted-foreground hover:text-violet-600 hover:bg-violet-500/10'}`}
                                  onClick={() => handleToggleComments(post.id)}
                                >
                                  <MessageSquare className="h-4 w-4" /> {post.commentsCount ?? 0} Comments
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                                  onClick={() => handleShare(post.id)}
                                >
                                  <Share2 className="h-4 w-4" /> Share
                                </Button>
                              </CardFooter>

                              {/* Comment Thread Section */}
                              {expandedPost === post.id && (
                                <div className="border-t border-border/40 bg-muted/30 p-4 space-y-3">
                                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                    {commentLoading ? (
                                      <div className="text-center text-xs text-muted-foreground py-2">Loading replies...</div>
                                    ) : postComments.length === 0 ? (
                                      <div className="text-center text-xs text-muted-foreground py-2">No comments yet. Be the first to write a response!</div>
                                    ) : (
                                      postComments.map((comment) => (
                                        <div key={comment.id} className="flex gap-2.5">
                                          <Avatar className="h-7 w-7 border border-border/50">
                                            <AvatarImage src={comment.profiles?.avatar_url} />
                                            <AvatarFallback className="bg-violet-500/20 text-violet-500 text-[10px] font-bold">
                                              {comment.profiles?.display_name?.[0] || 'U'}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 bg-card border border-border/50 rounded-xl p-2.5">
                                            <div className="flex justify-between items-start mb-0.5">
                                              <span className="font-semibold text-xs text-foreground">{comment.profiles?.display_name || 'Voke Member'}</span>
                                              <span className="text-[10px] text-muted-foreground">
                                                {new Date(comment.created_at).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <p className="text-xs text-foreground/90">{comment.content}</p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <Input
                                      placeholder="Write a comment..."
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                      className="bg-card border-border h-9 text-xs focus:border-violet-500/50 rounded-xl"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSubmitComment(post.id);
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleSubmitComment(post.id)}
                                      disabled={!newComment.trim()}
                                      className="bg-violet-600 hover:bg-violet-700 text-white h-9 px-3 rounded-xl"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Card>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {view === 'trending' && (
                  <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Trending Interview & Tech Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {aiInsights.trending_topics.map((topic: any, i: number) => (
                        <motion.div
                          key={topic.tag || i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => {
                            setSearchQuery(topic.tag);
                            setView('feed');
                          }}
                          className="flex justify-between items-center p-3.5 rounded-xl bg-muted/40 border border-border/50 hover:border-emerald-500/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground/60">#{i + 1}</span>
                            <div>
                              <h4 className="font-semibold text-sm text-foreground group-hover:text-emerald-500 transition-colors">#{topic.tag}</h4>
                              <p className="text-xs text-muted-foreground">{topic.posts} active discussions</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500">
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {view === 'events' && (
                  <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5 text-blue-500" />
                        Community Peer Events & Mock Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      {aiInsights.suggested_events.map((event: any, i: number) => (
                        <motion.div
                          key={event.title || i}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-5 rounded-2xl bg-muted/30 border border-border/50 hover:border-blue-500/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">{event.type}</Badge>
                            <Button
                              size="sm"
                              variant={registeredEvents[event.title] ? "default" : "outline"}
                              className={`text-xs rounded-xl ${registeredEvents[event.title] ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-border'}`}
                              onClick={() => handleRegisterEvent(event.title)}
                            >
                              {registeredEvents[event.title] ? "Registered ✓" : "Register Interest"}
                            </Button>
                          </div>
                          <h4 className="text-base font-bold text-foreground mb-1">{event.title}</h4>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                )}

              </div>

              {/* Right Column: Search & Quick Trends */}
              <div className="hidden lg:block lg:col-span-3 space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts & topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-card/60 border-border/60 text-xs rounded-xl focus:bg-card transition-all"
                  />
                </div>

                <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Trending Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiInsights.trending_topics.slice(0, 5).map((topic: any) => (
                      <div
                        key={topic.tag}
                        className="flex justify-between items-center group cursor-pointer p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSearchQuery(topic.tag);
                          setView('feed');
                        }}
                      >
                        <div>
                          <p className="font-medium text-xs text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">#{topic.tag}</p>
                          <p className="text-[10px] text-muted-foreground">{topic.posts} posts</p>
                        </div>
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

            </div>
          </main>
          
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Community;
