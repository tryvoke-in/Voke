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
  MoreHorizontal, Image as ImageIcon, Send, Search, Sparkles, X
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

const Community = () => {
  const [view, setView] = useState<'feed' | 'trending' | 'events'>('feed');
  const [aiInsights, setAiInsights] = useState<{ trending_topics: any[], suggested_events: any[] } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showDevModal, setShowDevModal] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchPosts();
    fetchAIInsights();

    // Realtime subscription
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        fetchPosts(); // Refresh to get full data with relations
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchAIInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-community-trends');
      if (error) throw error;
      setAiInsights(data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      // First try with relations
      const { data, error } = await supabase
        .from('posts' as any)
        .select(`
          *,
          profiles:user_id (full_name, avatar_url, job_title),
          likes (user_id),
          comments (count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts with relations:', error);
        // Fallback to simple fetch if relation fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('posts' as any)
          .select('*')
          .order('created_at', { ascending: false });
          
        if (simpleError) throw simpleError;
        setPosts(simpleData || []);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('posts' as any)
        .insert({
          user_id: user.id,
          content: newPost,
          tags: ["General"] // Simple default for now
        });

      if (error) throw error;
      setNewPost("");
      // Optimistic update or wait for realtime
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    // Check if already liked
    const post = posts.find(p => p.id === postId);
    const isLiked = post?.likes?.some((l: any) => l.user_id === user.id);

    try {
      if (isLiked) {
        await supabase.from('likes' as any).delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('likes' as any).insert({ post_id: postId, user_id: user.id });
      }
      fetchPosts(); // Refresh to update counts
    } catch (error) {
      console.error('Error toggling like:', error);
    }
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
      const { data, error } = await supabase
        .from('comments' as any)
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setPostComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!newComment.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('comments' as any)
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment
        });

      if (error) throw error;
      
      setNewComment("");
      // Refresh comments
      const { data } = await supabase
        .from('comments' as any)
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      setPostComments(data || []);
      
      // Refresh post comment count
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      <Navbar />
      
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
              className="bg-[#1e1e1e] border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-50 hover:opacity-100 cursor-pointer" onClick={() => setShowDevModal(false)}>
                <X className="h-5 w-5 text-white" />
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                  <Sparkles className="h-8 w-8 text-yellow-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-white">Under Development</h2>
                
                <p className="text-gray-400">
                  The Community features are currently in beta. You may encounter bugs or incomplete features as we continue to improve the platform.
                </p>

                <div className="pt-2 w-full">
                  <Button 
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold h-11"
                    onClick={() => setShowDevModal(false)}
                  >
                    I Understand, Proceed
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
            <h1 className="text-3xl font-bold text-white">Community Feed</h1>
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Under Development
            </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar - Navigation */}
          <div className="hidden lg:block space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-24">
              <CardContent className="p-4 space-y-2">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-lg font-medium ${view === 'feed' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => setView('feed')}
                >
                  <MessageSquare className="mr-3 h-5 w-5 text-violet-400" />
                  Feed
                </Button>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-lg font-medium ${view === 'trending' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => setView('trending')}
                >
                  <TrendingUp className="mr-3 h-5 w-5 text-emerald-400" />
                  Trending
                </Button>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-lg font-medium ${view === 'events' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => setView('events')}
                >
                  <Users className="mr-3 h-5 w-5 text-blue-400" />
                  Events
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-64">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top Contributors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={`https://github.com/shadcn.png`} />
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">User {i}</p>
                      <p className="text-xs text-gray-500 truncate">1.2k points</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-400">Top 1%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {view === 'feed' && (
              <>
                {/* Create Post */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-4">
                        <Textarea 
                          placeholder="Share your thoughts, questions, or success stories..." 
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          className="bg-black/20 border-white/10 min-h-[100px] resize-none focus:border-violet-500/50"
                        />
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-violet-400 hover:bg-violet-500/10">
                              <ImageIcon className="h-5 w-5" />
                            </Button>
                          </div>
                          <Button onClick={handlePost} disabled={!newPost.trim()} className="bg-violet-600 hover:bg-violet-700 text-white">
                            <Send className="mr-2 h-4 w-4" /> Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Posts Feed */}
                <div className="space-y-6">
                  {loading ? (
                     <div className="text-center py-10 text-gray-500">Loading community...</div>
                  ) : posts.length === 0 ? (
                     <div className="text-center py-10 text-gray-500">No posts yet. Be the first to share!</div>
                  ) : (
                    posts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden hover:border-white/20 transition-colors">
                          <CardHeader className="flex flex-row items-start gap-4 p-4">
                            <Avatar className="h-10 w-10 border border-white/10">
                              <AvatarImage src={post.profiles?.avatar_url} />
                              <AvatarFallback>{post.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-white">{post.profiles?.full_name || 'Anonymous'}</h3>
                                  <p className="text-xs text-gray-400">
                                    {post.profiles?.job_title || 'Member'} • {new Date(post.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-4">
                            <p className="text-gray-200 leading-relaxed">{post.content}</p>
                            {post.image_url && (
                              <div className="rounded-xl overflow-hidden border border-white/10">
                                <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover" />
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {post.tags?.map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-gray-300 border-0">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 border-t border-white/5 flex justify-between">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`gap-2 ${post.likes?.some((l: any) => l.user_id === user?.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
                              onClick={() => handleLike(post.id)}
                            >
                              <Heart className={`h-4 w-4 ${post.likes?.some((l: any) => l.user_id === user?.id) ? 'fill-current' : ''}`} /> 
                              {post.likes?.length || 0}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 gap-2 ${expandedPost === post.id ? 'text-blue-400 bg-blue-500/10' : ''}`}
                              onClick={() => handleToggleComments(post.id)}
                            >
                              <MessageSquare className="h-4 w-4" /> {post.comments?.[0]?.count || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400 hover:bg-green-500/10 gap-2">
                              <Share2 className="h-4 w-4" /> Share
                            </Button>
                          </CardFooter>

                          {/* Comments Section */}
                          {expandedPost === post.id && (
                            <div className="border-t border-white/5 bg-black/20 p-4 space-y-4">
                              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {commentLoading ? (
                                  <div className="text-center text-sm text-gray-500 py-2">Loading comments...</div>
                                ) : postComments.length === 0 ? (
                                  <div className="text-center text-sm text-gray-500 py-2">No comments yet. Be the first!</div>
                                ) : (
                                  postComments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                      <Avatar className="h-8 w-8 border border-white/10">
                                        <AvatarImage src={comment.profiles?.avatar_url} />
                                        <AvatarFallback>{comment.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 bg-white/5 rounded-lg p-3">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-semibold text-sm text-white">{comment.profiles?.full_name || 'Anonymous'}</span>
                                          <span className="text-xs text-gray-500">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-300">{comment.content}</p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                              
                              <div className="flex gap-3 pt-2">
                                <Avatar className="h-8 w-8 border border-white/10">
                                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                                  <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                  <Input
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="bg-white/5 border-white/10 h-9 text-sm focus:border-violet-500/50"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSubmitComment(post.id);
                                    }}
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSubmitComment(post.id)}
                                    disabled={!newComment.trim()}
                                    className="bg-violet-600 hover:bg-violet-700 h-9"
                                  >
                                    <Send className="h-3 w-3" />
                                  </Button>
                                </div>
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
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                      AI-Analyzed Trending Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!aiInsights ? (
                      <div className="text-center py-8 text-gray-400">Analyzing community conversations...</div>
                    ) : (
                      aiInsights.trending_topics?.map((topic: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-gray-500">#{i + 1}</div>
                            <div>
                              <h3 className="font-semibold text-lg text-white">#{topic.tag}</h3>
                              <p className="text-sm text-gray-400">{topic.posts} posts</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                          </Button>
                        </motion.div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {view === 'events' && (
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="w-6 h-6 text-blue-400" />
                      Suggested Community Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {!aiInsights ? (
                      <div className="text-center py-8 text-gray-400">Generating event suggestions...</div>
                    ) : (
                      aiInsights.suggested_events?.map((event: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">{event.type}</Badge>
                            <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10">Register Interest</Button>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                          <p className="text-gray-300">{event.description}</p>
                        </motion.div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

          </div>

          {/* Right Sidebar - Trending (Visible only on Feed view) */}
          {view === 'feed' && (
            <div className="hidden lg:block space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search community..." 
                  className="pl-10 bg-white/5 border-white/10 text-sm rounded-full focus:bg-white/10 transition-all"
                />
              </div>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiInsights?.trending_topics ? (
                    aiInsights.trending_topics.slice(0, 5).map((topic: any) => (
                      <div key={topic.tag} className="flex justify-between items-center group cursor-pointer" onClick={() => setView('trending')}>
                        <div>
                          <p className="font-medium text-gray-300 group-hover:text-violet-400 transition-colors">#{topic.tag}</p>
                          <p className="text-xs text-gray-500">{topic.posts} posts</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Loading trends...</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Community;
