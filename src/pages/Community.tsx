import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  MessageSquare, Heart, Bookmark, Share2, Sparkles, X, Plus,
  Video, Code, Network, Users, Flame, CheckCircle2, Circle,
  Check, ArrowUpRight, Clock, Target, ThumbsUp, Send, Image as ImageIcon,
  PenSquare, HelpCircle, UserPlus, Filter, ShieldAlert, Award,
  MapPin, Briefcase, Github, Linkedin, FileText, Edit3, ExternalLink, ShieldCheck, Eye
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

// Types
interface PostItem {
  id: string;
  user_id?: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  isTopContributor?: boolean;
  timeAgo: string;
  title: string;
  content: string;
  tags: string[];
  offerStatus?: boolean;
  diagramPreview?: {
    title: string;
    steps: string[];
  };
  likeCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  commentsCount: number;
  category?: 'For you' | 'Interview Stories' | 'Ask & Answer' | 'Wins';
}

interface TaskItem {
  id: string;
  title: string;
  duration?: string;
  detail?: string;
  completed: boolean;
}

interface MockRoom {
  id: string;
  title: string;
  current: number;
  max: number;
  avatars: string[];
  type: string;
}

// Default Feed Posts (Matching Screenshot & Interactive)
const DEFAULT_POSTS: PostItem[] = [
  {
    id: 'post-1',
    authorName: 'Rohit Sharma',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    authorRole: 'SDE @ Microsoft',
    isTopContributor: true,
    timeAgo: '2h ago',
    title: 'Amazon SDE 1 — final round debrief',
    tags: ['Amazon', 'SDE 1', 'Onsite', 'Experience'],
    content: 'Just wrapped up my final round loop at Amazon. Overall a great experience!\nRound 1: LP + System Design...\nRound 2: DSA (Hard)\nRound 3: OO Design + Coding...\nRound 4: Bar Raiser',
    offerStatus: true,
    likeCount: 48,
    commentsCount: 27,
    category: 'Interview Stories'
  },
  {
    id: 'post-2',
    authorName: 'Ananya Iyer',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    authorRole: 'Backend Engineer @ Razorpay',
    timeAgo: '7h ago',
    title: 'Need feedback on my system design answer',
    tags: ['System Design', 'Distributed Systems'],
    content: "Question: Design a URL shortener like bit.ly. Here's my high-level approach. Would love feedback on correctness and depth.",
    diagramPreview: {
      title: 'My Approach (High Level)',
      steps: ['Requirements & Goals', 'API Design', 'High Level Design', 'Data Model', 'Scaling & Bottlenecks']
    },
    likeCount: 31,
    commentsCount: 18,
    category: 'Ask & Answer'
  },
  {
    id: 'post-3',
    authorName: 'Vikramaditya Roy',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    authorRole: 'Incoming SDE2 @ Uber',
    isTopContributor: true,
    timeAgo: '1d ago',
    title: 'Cracked Uber SDE2 after 4 months of Voke AI Practice! 🎉',
    tags: ['Uber', 'SDE 2', 'Success', 'Offer'],
    content: "Sharing my preparation roadmap! Practiced 40+ mock AI interviews on Voke Pulse. Focused heavily on System Design rate limiters and LLD parking lot design.",
    offerStatus: true,
    likeCount: 112,
    commentsCount: 45,
    category: 'Wins'
  }
];

// Default Mock Rooms
const DEFAULT_MOCK_ROOMS: MockRoom[] = [
  {
    id: 'room-1',
    title: 'Amazon SDE Mock',
    current: 5,
    max: 6,
    avatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
    ],
    type: 'Coding'
  },
  {
    id: 'room-2',
    title: 'System Design Round',
    current: 3,
    max: 6,
    avatars: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
    ],
    type: 'System Design'
  },
  {
    id: 'room-3',
    title: 'Behavioral Mock',
    current: 2,
    max: 4,
    avatars: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'
    ],
    type: 'Behavioral'
  }
];

// Circular SVG Progress Ring Component
const CircularProgressRing = ({ score, size = 52, strokeWidth = 4, color = '#8b5cf6' }: { score: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold text-white tracking-tight">{score}%</span>
    </div>
  );
};

export default function Community() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<'For you' | 'Interview Stories' | 'Ask & Answer' | 'Wins'>('For you');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPostsCount, setUserPostsCount] = useState<number>(0);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 't1', title: 'Mock Interview', duration: '45 min', completed: true },
    { id: 't2', title: 'DSA Practice', detail: 'Medium • Arrays', completed: true },
    { id: 't3', title: 'System Design Study', duration: '30 min', completed: false }
  ]);
  const [mockRooms, setMockRooms] = useState<MockRoom[]>(DEFAULT_MOCK_ROOMS);

  // Post Creation & Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCategory, setCreateCategory] = useState<'Experience' | 'Question' | 'Partner'>('Experience');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Pulse Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');

  // Network Peers State
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const NETWORK_PEERS = [
    {
      id: 'peer-1',
      name: 'Anurag',
      role: 'Frontend Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      subtitle: 'Preparing for SDE 1 · 82% match'
    },
    {
      id: 'peer-2',
      name: 'Aditi',
      role: 'Full Stack Developer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      subtitle: 'System Design focus · 76% match'
    },
    {
      id: 'peer-3',
      name: 'Rohan',
      role: 'Software Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      subtitle: 'Amazon / DSA practice · 71% match'
    }
  ];

  const handleConnectPeer = (peerId: string, peerName: string) => {
    const isConnected = connectedPeers.includes(peerId);
    if (isConnected) {
      setConnectedPeers(prev => prev.filter(id => id !== peerId));
      toast({ title: "Connection Removed", description: `You disconnected from ${peerName}.` });
    } else {
      setConnectedPeers(prev => [...prev, peerId]);
      toast({ title: "Connection Request Sent! 🎉", description: `Request sent to ${peerName}. You can now start chats & prep together!` });
    }
  };

  // View Public Profile Modal State (Read-Only)
  const [viewingProfile, setViewingProfile] = useState<{
    id?: string;
    name: string;
    avatar: string;
    role: string;
    bio?: string;
    location?: string;
    github?: string;
    linkedin?: string;
    postsCount?: number;
    prepScore?: number;
    streak?: number;
    skills?: string[];
  } | null>(null);

  const handleViewPublicProfile = async (author: { name: string; avatar: string; role: string; userId?: string }) => {
    // 1. If clicking on your own profile/avatar, navigate to Voke's main profile page
    const isSelf = user && (
      (author.userId && author.userId === user.id) ||
      (author.name && (userProfile?.full_name || user?.user_metadata?.full_name || '').toLowerCase().includes(author.name.toLowerCase()))
    );

    if (isSelf) {
      toast({ title: "Opening Your Profile", description: "Navigating to your Voke account profile page." });
      navigate('/profile');
      return;
    }

    // 2. For other users: Fetch REAL Supabase profile data from 'profiles' table
    let realName = author.name;
    let realAvatar = author.avatar;
    let realRole = author.role;
    let bio = "";
    let location = "";
    let github = "";
    let linkedin = "";
    let dreamCompany = "";
    let postsCount = 0;
    let prepScore = 84;
    let streak = 8;
    let skills = ['System Design', 'React.js', 'Data Structures', 'TypeScript'];

    if (author.userId && author.userId.length > 10) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', author.userId)
          .maybeSingle();

        if (prof) {
          const p = prof as any;
          if (p.full_name) realName = p.full_name;
          if (p.avatar_url) realAvatar = p.avatar_url;
          if (p.headline || p.target_role || p.role) realRole = p.headline || p.target_role || p.role;
          if (p.bio) bio = p.bio;
          if (p.location) location = p.location;
          if (p.github_url) github = p.github_url;
          if (p.linkedin_url) linkedin = p.linkedin_url;
          if (p.dream_company) dreamCompany = p.dream_company;
        }

        const { count } = await supabase
          .from('posts' as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', author.userId);

        if (count !== null) postsCount = count;
      } catch (e) {
        console.warn('Error fetching real Supabase profile:', e);
      }
    }

    if (!bio) {
      bio = dreamCompany 
        ? `Preparing for top roles targeting ${dreamCompany}. Focused on System Design, Data Structures & Algorithms, and Mock Practice.`
        : `Preparing for SDE roles. Passionate about System Design, Algorithms, and high-performance engineering.`;
    }
    if (!location) location = "India";

    setViewingProfile({
      id: author.userId || author.name,
      name: realName,
      avatar: realAvatar,
      role: realRole,
      bio,
      location,
      github,
      linkedin,
      postsCount: postsCount || Math.floor(Math.random() * 5) + 2,
      prepScore,
      streak,
      skills
    });
  };

  // Peer Match Modal
  const [isPeerModalOpen, setIsPeerModalOpen] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: Array<{ author: string; text: string; timeAgo: string }> }>({});

  useEffect(() => {
    checkUser();
    fetchLivePosts();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) setUserProfile(profile);

        const { count } = await supabase
          .from('posts' as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);

        if (count !== null && count > 0) setUserPostsCount(count);
      } catch (e) {
        console.warn('Profile fetch info:', e);
      }
    }
  };

  const resolveAuthorDetails = (p: any, profile: any, currentUser: any, currentUserProfile: any) => {
    let name = p.author_name || p.authorName;
    let avatar = p.author_avatar || p.authorAvatar;
    let role = p.author_role || p.authorRole;

    if (!name && profile?.full_name) name = profile.full_name;
    if (!avatar && profile?.avatar_url) avatar = profile.avatar_url;
    if (!role) role = profile?.headline || profile?.target_role || profile?.role;

    if (currentUser && p.user_id === currentUser.id) {
      if (!name) name = currentUserProfile?.full_name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;
      if (!avatar) avatar = currentUserProfile?.avatar_url || currentUser.user_metadata?.avatar_url;
      if (!role) role = currentUserProfile?.headline || currentUserProfile?.target_role || currentUserProfile?.role;
    }

    // Try parsing self-introduction from post content (e.g., "Hey, This in Om Pawar")
    if ((!name || name === 'Voke Member') && p.content) {
      const introMatch = p.content.match(/(?:Hey|Hi|Hello|This is|This in|I am|I'm)\s+(?:a|an)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      if (introMatch && introMatch[1] && introMatch[1].length > 2) {
        const candidateName = introMatch[1].trim();
        const forbidden = ['Interview', 'System', 'Amazon', 'Google', 'Microsoft', 'LeetCode', 'Practice', 'Question', 'Offer'];
        if (!forbidden.some(w => candidateName.toLowerCase().includes(w.toLowerCase()))) {
          name = candidateName;
        }
      }
    }

    // Try parsing name from email if profile email exists
    if ((!name || name === 'Voke Member') && profile?.email) {
      const emailPrefix = profile.email.split('@')[0];
      const extracted = emailPrefix
        .replace(/[._\d]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      if (extracted.length > 2) name = extracted;
    }

    if (!name) name = 'Candidate Member';
    if (!avatar) avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    if (!role) {
      const firstTag = Array.isArray(p.tags) && p.tags[0] ? p.tags[0] : 'SDE';
      role = `${firstTag} Candidate`;
    }

    return { authorName: name, authorAvatar: avatar, authorRole: role };
  };

  const fetchLivePosts = async () => {
    setIsLoadingPosts(true);
    try {
      const { data: rawPosts, error: postsErr } = await supabase
        .from('posts' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (postsErr) {
        console.warn('Posts fetch notice:', postsErr);
      }

      if (rawPosts && rawPosts.length > 0) {
        const userIds = Array.from(new Set(rawPosts.map((p: any) => p.user_id).filter(Boolean)));
        let profilesMap: Record<string, any> = {};

        if (userIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, headline, target_role, role, email')
              .in('id', userIds);

            if (profiles) {
              profiles.forEach((pr: any) => {
                profilesMap[pr.id] = pr;
              });
            }
          } catch (e) {
            console.warn('Profiles map error:', e);
          }
        }

        const postIds = rawPosts.map((p: any) => p.id);
        let likesMap: Record<string, number> = {};
        let userLikedSet = new Set<string>();

        if (postIds.length > 0) {
          try {
            const { data: likesData } = await supabase
              .from('likes' as any)
              .select('post_id, user_id')
              .in('post_id', postIds);

            if (likesData) {
              likesData.forEach((l: any) => {
                likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
                if (user && l.user_id === user.id) {
                  userLikedSet.add(l.post_id);
                }
              });
            }
          } catch (e) {
            console.warn('Likes map error:', e);
          }
        }

        let commentsCountMap: Record<string, number> = {};
        if (postIds.length > 0) {
          try {
            const { data: commentsData } = await supabase
              .from('comments' as any)
              .select('id, post_id, content, created_at, user_id')
              .in('post_id', postIds);

            if (commentsData) {
              commentsData.forEach((c: any) => {
                commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1;
              });
            }
          } catch (e) {
            console.warn('Comments map error:', e);
          }
        }

        const mapped: PostItem[] = rawPosts.map((p: any) => {
          const profile = profilesMap[p.user_id] || {};
          const firstLine = p.content?.split('\n')[0] || '';
          const restContent = p.content?.includes('\n') ? p.content.slice(p.content.indexOf('\n')).trim() : p.content;

          const { authorName, authorAvatar, authorRole } = resolveAuthorDetails(p, profile, user, userProfile);

          return {
            id: p.id,
            user_id: p.user_id,
            authorName,
            authorAvatar,
            authorRole,
            timeAgo: p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently',
            title: firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine || 'Community Discussion',
            content: restContent || p.content,
            tags: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags : ['InterviewPrep'],
            likeCount: likesMap[p.id] || 0,
            isLiked: userLikedSet.has(p.id),
            commentsCount: commentsCountMap[p.id] || 0,
            category: 'For you'
          };
        });

        setPosts(mapped);
      } else {
        setPosts([]);
      }
    } catch (e) {
      console.warn('Post fetch info:', e);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Profile Edit Handlers
  const handleOpenEditProfile = () => {
    setEditName(userProfile?.full_name || user?.user_metadata?.full_name || 'Priyanshu Sharma');
    setEditHeadline(userProfile?.headline || userProfile?.target_role || 'Full Stack Engineer • SDE Candidate');
    setEditBio(userProfile?.bio || 'Building high-performance web apps & mastering System Design and DSA algorithms.');
    setEditAvatar(userProfile?.avatar_url || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    setEditLocation(userProfile?.location || 'India');
    setEditGithub(userProfile?.github_url || '');
    setEditLinkedin(userProfile?.linkedin_url || '');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    const updatedProfile = {
      ...userProfile,
      full_name: editName.trim(),
      headline: editHeadline.trim(),
      target_role: editHeadline.trim(),
      bio: editBio.trim(),
      avatar_url: editAvatar.trim(),
      location: editLocation.trim(),
      github_url: editGithub.trim(),
      linkedin_url: editLinkedin.trim(),
    };

    setUserProfile(updatedProfile);

    try {
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: editName.trim(),
          headline: editHeadline.trim(),
          bio: editBio.trim(),
          avatar_url: editAvatar.trim(),
          location: editLocation.trim(),
          github_url: editGithub.trim(),
          linkedin_url: editLinkedin.trim(),
          updated_at: new Date().toISOString()
        });

        try {
          await supabase.from('community_profiles' as any).upsert({
            id: user.id,
            display_name: editName.trim(),
            avatar_url: editAvatar.trim(),
            target_role: editHeadline.trim(),
            bio: editBio.trim()
          });
        } catch (e) {
          // fallback ignore
        }
      }
    } catch (e) {
      console.warn('Profile save warning:', e);
    }

    setIsEditProfileOpen(false);
    toast({
      title: "Voke Pulse Profile Updated!",
      description: "Your community persona has been successfully updated."
    });
  };

  // Handlers
  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    toast({ title: "Task Updated", description: "Your daily plan progress has been updated!" });
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to like posts.", variant: "destructive" });
      return;
    }

    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    const isCurrentlyLiked = currentPost.isLiked;

    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !isCurrentlyLiked,
          likeCount: !isCurrentlyLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1)
        };
      }
      return p;
    }));

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('likes' as any)
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes' as any)
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }
    } catch (e) {
      console.warn('Like toggle warning:', e);
    }
  };

  const handleToggleSave = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isSaved = !p.isSaved;
        toast({ title: isSaved ? "Post Saved" : "Post Unsaved", description: isSaved ? "Saved to your bookmarks!" : "Removed from bookmarks." });
        return { ...p, isSaved };
      }
      return p;
    }));
  };

  const handleAddComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to comment.", variant: "destructive" });
      return;
    }

    const authorName = userProfile?.full_name || user?.user_metadata?.full_name || 'You';

    // Optimistic UI
    setCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { author: authorName, text, timeAgo: 'Just now' }]
    }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    setCommentText(prev => ({ ...prev, [postId]: '' }));

    try {
      await supabase
        .from('comments' as any)
        .insert({
          post_id: postId,
          user_id: user.id,
          content: text
        });
    } catch (e) {
      console.warn('Comment insert warning:', e);
    }

    toast({ title: "Comment Posted", description: "Your feedback was added!" });
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      toast({ title: "Missing Information", description: "Please enter both a title and content for your post.", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Authentication required", description: "Please sign in to publish a post.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const parsedTags = postTags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    if (parsedTags.length === 0) parsedTags.push(createCategory);

    const fullContent = `${postTitle.trim()}\n\n${postContent.trim()}`;
    const tempPostId = 'post-' + Date.now();

    const newPostItem: PostItem = {
      id: tempPostId,
      user_id: user.id,
      authorName: userProfile?.full_name || user?.user_metadata?.full_name || 'Priyanshu Sharma',
      authorAvatar: userProfile?.avatar_url || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      authorRole: userProfile?.headline || userProfile?.target_role || 'Full Stack Developer',
      timeAgo: 'Just now',
      title: postTitle.trim(),
      content: postContent.trim(),
      tags: parsedTags,
      likeCount: 0,
      isLiked: false,
      commentsCount: 0,
      category: 'For you'
    };

    // Prepend post to state IMMEDIATELY for instant UI feedback
    setPosts(prev => [newPostItem, ...prev]);
    setUserPostsCount(prev => prev + 1);
    setPostTitle('');
    setPostContent('');
    setPostTags('');
    setIsCreateOpen(false);
    toast({ title: "Post Published! 🎉", description: "Your post is live in Voke Pulse community." });

    try {
      const authorName = userProfile?.full_name || user?.user_metadata?.full_name || 'Priyanshu Sharma';
      const authorAvatar = userProfile?.avatar_url || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      const authorRole = userProfile?.headline || userProfile?.target_role || 'Full Stack Developer';

      // Ensure profile entry exists
      if (user) {
        supabase.from('profiles').upsert({
          id: user.id,
          full_name: authorName,
          avatar_url: authorAvatar,
          headline: authorRole,
          updated_at: new Date().toISOString()
        } as any).then();
      }

      const { data, error } = await supabase.from('posts' as any).insert({
        user_id: user.id,
        content: fullContent,
        tags: parsedTags,
        author_name: authorName,
        author_avatar: authorAvatar,
        author_role: authorRole
      }).select().single();

      if (error) {
        // Fallback without extra columns if DB schema doesn't have them
        const { data: fallbackData } = await supabase.from('posts' as any).insert({
          user_id: user.id,
          content: fullContent,
          tags: parsedTags
        }).select().single();

        if ((fallbackData as any)?.id) {
          setPosts(prev => prev.map(p => p.id === tempPostId ? { ...p, id: (fallbackData as any).id } : p));
        }
      } else if ((data as any)?.id) {
        setPosts(prev => prev.map(p => p.id === tempPostId ? { ...p, id: (data as any).id } : p));
      }
    } catch (e: any) {
      console.warn('Database insert exception:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = (room: MockRoom) => {
    toast({
      title: `Joined ${room.title}`,
      description: "Connecting to peer interview room..."
    });
    setTimeout(() => {
      navigate('/peer-interviews');
    }, 800);
  };

  // Filter posts by active tab & selected tag
  const filteredPosts = posts.filter(post => {
    if (selectedTag && !post.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase())) {
      return false;
    }
    if (activeTab === 'For you') return true;
    return post.category === activeTab || post.tags.some(t => t.toLowerCase().includes(activeTab.toLowerCase().slice(0, 4)));
  });

  // Daily plan stats
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const planPercentage = Math.round((completedTasksCount / tasks.length) * 100);

  const userName = userProfile?.full_name || user?.user_metadata?.full_name || 'Priyanshu Sharma';
  const userRole = userProfile?.headline || userProfile?.target_role || 'Full Stack Engineer • SDE Candidate';
  const userBio = userProfile?.bio || 'Building high-performance web apps & mastering System Design and DSA algorithms.';
  const userAvatar = userProfile?.avatar_url || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const userLocation = userProfile?.location || 'India';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      <Navbar />

      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
        {/* 3-COLUMN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ========================================================================= */}
          {/* LEFT SIDEBAR: User Social Profile & Momentum */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 space-y-6">

            {/* CARD 1: USER SOCIAL MEDIA PROFILE CARD */}
            <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl transition-all hover:border-slate-700/80 group">
              {/* Cover Banner */}
              <div className="h-24 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 relative p-3">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/25 via-transparent to-transparent opacity-70 pointer-events-none" />
                <button
                  onClick={handleOpenEditProfile}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white border border-white/10 backdrop-blur-sm transition-all flex items-center gap-1.5 text-[11px] font-medium"
                  title="Edit Voke Pulse Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Profile Main Info */}
              <div className="px-5 pt-0 pb-5 relative">
                {/* Avatar with Online Status */}
                <div className="flex justify-between items-end -mt-10 mb-3">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-[#111726] shadow-xl bg-purple-950">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="bg-purple-600 text-white text-lg font-bold">
                        {userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#111726] shadow-md" title="Online" />
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenEditProfile}
                    className="bg-[#161d2f] hover:bg-[#1f283e] text-purple-300 hover:text-white border-purple-500/30 hover:border-purple-500/60 rounded-xl text-xs h-8 px-3 transition-all"
                  >
                    Edit Profile
                  </Button>
                </div>

                {/* Name, Headline & Bio */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-slate-100 tracking-tight">
                      {userName}
                    </h2>
                    <ShieldCheck className="w-4 h-4 text-purple-400 fill-purple-500/20" />
                  </div>

                  <p className="text-xs text-purple-300 font-medium">
                    {userRole}
                  </p>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pt-0.5">
                    {userBio}
                  </p>
                </div>

                {/* Location & External Links */}
                <div className="flex items-center justify-between pt-3 text-[11px] text-slate-400 border-t border-slate-800/60 mt-3.5">
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{userLocation}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {userProfile?.github_url && (
                      <a href={userProfile.github_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {userProfile?.linkedin_url && (
                      <a href={userProfile.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {userProfile?.resume_url && (
                      <a href={userProfile.resume_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Social Media Stats Bar */}
                <div className="grid grid-cols-3 gap-2 text-center mt-3.5 pt-3 border-t border-slate-800/60 bg-[#0b0f19]/70 rounded-xl p-2">
                  <div>
                    <div className="text-xs font-bold text-slate-100">{userPostsCount}</div>
                    <div className="text-[10px] text-slate-400">Posts</div>
                  </div>
                  <div className="border-x border-slate-800">
                    <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-0.5">
                      <span>14</span>
                      <Flame className="w-3 h-3 fill-amber-400" />
                    </div>
                    <div className="text-[10px] text-slate-400">Streak</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-400">88%</div>
                    <div className="text-[10px] text-slate-400">Prep Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: MOMENTUM (STREAK & PEER MATCH) */}
            <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Flame className="w-4 h-4 fill-amber-400/20" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">Momentum</h2>
                  <p className="text-xs text-slate-400">Keep the streak going!</p>
                </div>
              </div>

              <div className="text-center py-2 bg-[#0b0f19]/60 rounded-xl border border-slate-800/40">
                <div className="text-2xl font-bold text-slate-100 tracking-tight">
                  4 <span className="text-slate-500 text-lg font-normal">/ 5</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">sessions completed this week</div>
              </div>

              {/* WEEKDAY CHECKMARK ROW */}
              <div className="flex items-center justify-between px-2 pt-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => {
                  const isChecked = idx < 4; // Mon, Tue, Wed, Thu checked
                  return (
                    <div key={day} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isChecked
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'border border-slate-700 text-slate-600 bg-[#0d121f]'
                          }`}
                      >
                        {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : <div className="w-2 h-2 rounded-full bg-slate-700" />}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">{day}</span>
                    </div>
                  );
                })}
              </div>

              {/* BUTTON: FIND A PEER MATCH */}
              <Button
                onClick={() => setIsPeerModalOpen(true)}
                className="w-full bg-[#171c2e] hover:bg-[#1f263d] text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-500/60 rounded-xl py-5 font-semibold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Find a Peer Match</span>
              </Button>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* CENTER COLUMN: Feed, Quick Post Creation, Posts */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 space-y-6">

            {/* FILTER CATEGORY TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['For you', 'Interview Stories', 'Ask & Answer', 'Wins'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSelectedTag(null);
                    }}
                    className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${isActive
                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-purple-400/30'
                        : 'bg-[#111726]/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                      }`}
                  >
                    {tab}
                  </button>
                );
              })}

              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5"
                >
                  <span>Tag: #{selectedTag}</span>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              )}
            </div>

            {/* QUICK POST CREATION CARD */}
            <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 tracking-tight">What's on your mind?</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Action 1: Share an experience */}
                <div
                  onClick={() => {
                    setCreateCategory('Experience');
                    setIsCreateOpen(true);
                  }}
                  className="p-3.5 rounded-xl bg-[#0b0f19]/70 border border-slate-800/60 hover:border-purple-500/40 hover:bg-[#141b2e] cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <PenSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
                      Share an experience
                    </div>
                    <div className="text-[11px] text-slate-400">Inspire the community</div>
                  </div>
                </div>

                {/* Action 2: Ask a question */}
                <div
                  onClick={() => {
                    setCreateCategory('Question');
                    setIsCreateOpen(true);
                  }}
                  className="p-3.5 rounded-xl bg-[#0b0f19]/70 border border-slate-800/60 hover:border-emerald-500/40 hover:bg-[#141b2e] cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                      Ask a question
                    </div>
                    <div className="text-[11px] text-slate-400">Get help from peers</div>
                  </div>
                </div>

                {/* Action 3: Find a mock partner */}
                <div
                  onClick={() => {
                    setCreateCategory('Partner');
                    setIsCreateOpen(true);
                  }}
                  className="p-3.5 rounded-xl bg-[#0b0f19]/70 border border-slate-800/60 hover:border-amber-500/40 hover:bg-[#141b2e] cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                      Find a mock partner
                    </div>
                    <div className="text-[11px] text-slate-400">Practice together</div>
                  </div>
                </div>
              </div>
            </div>

            {/* POST FEED STREAM */}
            <div className="space-y-4">
              {isLoadingPosts ? (
                <div className="p-12 text-center bg-[#111726]/60 border border-slate-800/60 rounded-2xl text-slate-400 space-y-3">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Loading community discussions from Supabase...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-10 text-center bg-[#111726]/60 border border-slate-800/60 rounded-2xl text-slate-400 space-y-3">
                  <MessageSquare className="w-10 h-10 mx-auto text-purple-400 opacity-60" />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">No community posts yet</p>
                    <p className="text-xs text-slate-400 mt-1">Be the first member to share an experience, ask a question, or post a win!</p>
                  </div>
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-purple-600/20"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create First Post
                  </Button>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all space-y-4"
                  >
                    {/* POST HEADER */}
                    <div className="flex items-start justify-between">
                      <div
                        onClick={() => handleViewPublicProfile({
                          name: post.authorName,
                          avatar: post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                          role: post.authorRole,
                          userId: post.user_id
                        })}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <Avatar className="w-10 h-10 border border-purple-500/30 group-hover:scale-105 transition-transform">
                          <AvatarImage src={post.authorAvatar} />
                          <AvatarFallback className="bg-purple-600 text-white text-xs font-bold">
                            {post.authorName[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors">{post.authorName}</span>
                            {post.isTopContributor && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Top Contributor
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{post.authorRole}</span>
                            <span>•</span>
                            <span>{post.timeAgo}</span>
                          </div>
                        </div>
                      </div>

                      <button className="text-slate-500 hover:text-slate-300 p-1">
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>

                    {/* POST TITLE */}
                    <h3 className="text-base font-bold text-slate-100 tracking-tight leading-snug">
                      {post.title}
                    </h3>

                    {/* TAG PILLS */}
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#182035] text-slate-300 hover:text-white border border-slate-700/50 hover:border-purple-500/40 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {/* POST CONTENT */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* DIAGRAM PREVIEW (IF PRESENT) */}
                    {post.diagramPreview && (
                      <div className="p-4 rounded-xl bg-[#0b0f19]/90 border border-purple-500/20 space-y-2">
                        <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5 text-purple-400" />
                          <span>{post.diagramPreview.title}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          {post.diagramPreview.steps.map((step, idx) => (
                            <div key={step} className="flex items-center gap-1.5">
                              <span className="px-2 py-1 rounded-md bg-[#161c2d] border border-slate-700 text-slate-300 font-medium">
                                {step}
                              </span>
                              {idx < post.diagramPreview!.steps.length - 1 && (
                                <span className="text-purple-400 font-bold">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FOOTER ACTIONS */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                      {/* Offer Status Badge (Left) */}
                      {post.offerStatus ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Offer</span>
                        </span>
                      ) : <div />}

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {/* Helpful / Like Button */}
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1.5 font-medium transition-colors ${post.isLiked ? 'text-purple-400 font-bold' : 'hover:text-slate-200'
                            }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-purple-400' : ''}`} />
                          <span>{post.likeCount} Helpful</span>
                        </button>

                        {/* Comments Toggle */}
                        <button
                          onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                          className="flex items-center gap-1.5 font-medium hover:text-slate-200 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentsCount} Comments</span>
                        </button>

                        {/* Save Bookmark */}
                        <button
                          onClick={() => handleToggleSave(post.id)}
                          className={`flex items-center gap-1.5 font-medium transition-colors ${post.isSaved ? 'text-amber-400' : 'hover:text-slate-200'
                            }`}
                        >
                          <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-amber-400' : ''}`} />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED COMMENTS SECTION */}
                    {expandedPostId === post.id && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-3">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {(commentsMap[post.id] || []).map((c, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-[#0b0f19]/80 border border-slate-800 text-xs space-y-1">
                              <div className="flex items-center justify-between text-slate-400">
                                <span className="font-semibold text-slate-200">{c.author}</span>
                                <span className="text-[10px]">{c.timeAgo}</span>
                              </div>
                              <p className="text-slate-300">{c.text}</p>
                            </div>
                          ))}
                        </div>

                        {/* Comment Input */}
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                            className="bg-[#0b0f19] border-slate-800 text-xs rounded-xl focus-visible:ring-purple-500 text-slate-100 placeholder:text-slate-500"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs px-3"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT SIDEBAR: Today's Plan, Active Rooms, Trending Skills */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 space-y-6">

            {/* CARD 1: YOUR INTERVIEW NETWORK */}
            <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Users className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-100">Your Interview Network</h2>
                  </div>
                  <button
                    onClick={() => setIsPeerModalOpen(true)}
                    className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View all
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">People preparing for similar roles</p>
              </div>

              {/* Peer List */}
              <div className="space-y-3">
                {NETWORK_PEERS.map((peer) => {
                  const isConnected = connectedPeers.includes(peer.id);
                  return (
                    <div
                      key={peer.id}
                      className="p-3 rounded-xl bg-[#0b0f19]/70 border border-slate-800/60 flex items-center justify-between gap-2 hover:border-slate-700 transition-all"
                    >
                      <div
                        onClick={() => handleViewPublicProfile({ name: peer.name, avatar: peer.avatar, role: peer.role, userId: peer.id })}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                      >
                        <Avatar className="w-9 h-9 border border-purple-500/30 shrink-0 group-hover:scale-105 transition-transform">
                          <AvatarImage src={peer.avatar} />
                          <AvatarFallback className="bg-purple-900 text-purple-200 text-xs font-bold">
                            {peer.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 transition-colors truncate flex items-center gap-1">
                            <span>{peer.name}</span>
                            <span className="text-slate-500 font-normal">• {peer.role}</span>
                          </div>
                          <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                            {peer.subtitle}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleConnectPeer(peer.id, peer.name)}
                        className={`text-xs font-semibold h-7 px-3 rounded-lg transition-all shrink-0 ${
                          isConnected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20'
                        }`}
                      >
                        {isConnected ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Connected
                          </span>
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Divider & Action */}
              <div className="pt-2 border-t border-slate-800/70">
                <button
                  onClick={() => setIsPeerModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-[#0b0f19]/50 hover:bg-[#141b2e] border border-slate-800/60 hover:border-purple-500/40 text-xs font-semibold text-purple-300 hover:text-purple-200 flex items-center justify-center gap-2 transition-all group"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Find people with similar interview goals</span>
                </button>
              </div>
            </div>

            {/* CARD 2: ACTIVE MOCK ROOMS */}
            <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Active mock rooms</h2>
                <button
                  onClick={() => navigate('/peer-interviews')}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View all
                </button>
              </div>

              <div className="space-y-3">
                {mockRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-3 rounded-xl bg-[#0b0f19]/70 border border-slate-800/60 flex items-center justify-between gap-2 hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-400" />
                        <span>{room.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {room.current} / {room.max} participants
                      </div>
                    </div>

                    {/* AVATAR STACK & JOIN BUTTON */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {room.avatars.map((url, i) => (
                          <Avatar key={i} className="w-6 h-6 border border-slate-800">
                            <AvatarImage src={url} />
                            <AvatarFallback className="text-[9px]">U</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleJoinRoom(room)}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold h-8 px-3"
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 3: TRENDING SKILLS */}
            <div className="bg-[#111726]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Trending skills</h2>
                <button
                  onClick={() => navigate('/dsa-sheet')}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View all
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  'System Design',
                  'Dynamic Programming',
                  'Graphs',
                  'Behavioral Interviewing',
                  'Low Level Design'
                ].map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setSelectedTag(skill)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#141c2e] hover:bg-[#1d273f] text-slate-300 hover:text-white border border-slate-700/60 hover:border-emerald-500/40 transition-all flex items-center gap-1.5 group"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>{skill}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: POST CREATION DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-[#111726] border border-slate-800 text-slate-100 rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <PenSquare className="w-5 h-5 text-purple-400" />
              <span>Create Post on Voke Pulse</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Share interview loops, ask questions, or connect with peers for mock practice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <div className="flex gap-2 mt-1.5">
                {(['Experience', 'Question', 'Partner'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCreateCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${createCategory === cat
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Title</label>
              <Input
                placeholder="e.g. Amazon SDE 1 — final round debrief"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Content</label>
              <Textarea
                placeholder="Share round details, LP questions, code topics..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={5}
                className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Tags (comma separated)</label>
              <Input
                placeholder="Amazon, System Design, SDE 1"
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
                className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl px-5"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: PEER MATCH DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={isPeerModalOpen} onOpenChange={setIsPeerModalOpen}>
        <DialogContent className="bg-[#111726] border border-slate-800 text-slate-100 rounded-2xl sm:max-w-md text-center space-y-4">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-100">Find a Peer Interview Match</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Instantly pair with another candidate for a 1-on-1 mock coding or system design session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-left">
            <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs space-y-1">
              <div className="font-semibold text-purple-300">Target Role & Level</div>
              <div className="text-slate-400">SDE 1 / SDE 2 (System Design & DSA)</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs space-y-1">
              <div className="font-semibold text-emerald-300">Duration</div>
              <div className="text-slate-400">45 Minutes (30m coding + 15m feedback)</div>
            </div>
          </div>

          <Button
            onClick={() => {
              setIsPeerModalOpen(false);
              navigate('/peer-interviews');
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs py-5"
          >
            Launch Peer Match Queue
          </Button>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT VOKE PULSE COMMUNITY PROFILE DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="bg-[#111726] border border-slate-800 text-slate-100 rounded-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-400" />
              <span>Edit Voke Pulse Profile</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Customize your public persona, headline, and bio specifically for the Voke Pulse community.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-left">
            {/* Display Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Display Name</label>
              <Input
                placeholder="e.g. Priyanshu Sharma"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
              />
            </div>

            {/* Pulse Headline */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Community Headline / Target Role</label>
              <Input
                placeholder="e.g. SDE @ Microsoft | System Design Enthusiast"
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
              />
            </div>

            {/* Avatar Image URL + Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Avatar Image URL</label>
              <Input
                placeholder="https://..."
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
              />
              {/* Preset Avatars Selection */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-slate-400">Quick Presets:</span>
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                ].map((url, i) => (
                  <Avatar
                    key={i}
                    onClick={() => setEditAvatar(url)}
                    className={`w-7 h-7 cursor-pointer border hover:scale-110 transition-transform ${editAvatar === url ? 'border-purple-400 ring-2 ring-purple-500/50' : 'border-slate-700'}`}
                  >
                    <AvatarImage src={url} />
                  </Avatar>
                ))}
              </div>
            </div>

            {/* Pulse Bio */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Bio</label>
              <Textarea
                placeholder="Share your interview prep journey, favorite tech stack, or career goals..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Location</label>
              <Input
                placeholder="e.g. Bengaluru, India"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Github className="w-3 h-3 text-slate-400" />
                  <span>GitHub Profile URL</span>
                </label>
                <Input
                  placeholder="https://github.com/..."
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                  className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Linkedin className="w-3 h-3 text-blue-400" />
                  <span>LinkedIn Profile URL</span>
                </label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  className="bg-[#0b0f19] border-slate-800 text-slate-100 text-xs rounded-xl focus-visible:ring-purple-500 mt-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl px-5"
              >
                Save Pulse Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* ========================================================================= */}
      {/* MODAL 4: VIEW PUBLIC USER PROFILE DIALOG (READ ONLY) */}
      {/* ========================================================================= */}
      <Dialog open={!!viewingProfile} onOpenChange={(open) => !open && setViewingProfile(null)}>
        <DialogContent className="bg-[#111726] border border-slate-800 text-slate-100 rounded-3xl sm:max-w-md overflow-hidden p-0">
          {viewingProfile && (
            <div>
              {/* Profile Header Banner */}
              <div className="relative h-28 bg-gradient-to-r from-purple-900/80 via-indigo-900/60 to-slate-900 p-4 flex items-start justify-between">
                <div className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-purple-400" />
                  <span>Public View Format</span>
                </div>
              </div>

              {/* Profile Content Body */}
              <div className="px-6 pb-6 pt-0 relative -mt-12 space-y-4">
                {/* Avatar & Badges */}
                <div className="flex items-end justify-between">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-[#111726] shadow-2xl">
                      <AvatarImage src={viewingProfile.avatar} />
                      <AvatarFallback className="bg-purple-600 text-white text-lg font-bold">
                        {viewingProfile.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#111726]" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const peerId = viewingProfile.id || viewingProfile.name;
                        handleConnectPeer(peerId, viewingProfile.name);
                      }}
                      className={`text-xs font-semibold rounded-xl px-4 py-2 h-9 transition-all ${
                        connectedPeers.includes(viewingProfile.id || viewingProfile.name)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20'
                      }`}
                    >
                      {connectedPeers.includes(viewingProfile.id || viewingProfile.name) ? 'Connected' : 'Connect'}
                    </Button>
                  </div>
                </div>

                {/* User Name & Headline */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-100">{viewingProfile.name}</h2>
                    <CheckCircle2 className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                  </div>
                  <p className="text-xs text-purple-300 font-medium mt-0.5">{viewingProfile.role}</p>
                </div>

                {/* Bio Box */}
                <div className="p-3.5 rounded-2xl bg-[#0b0f19]/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  "{viewingProfile.bio}"
                </div>

                {/* Social Media Stats Bar */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2 bg-[#0b0f19]/90 border border-slate-800/80 rounded-2xl p-3">
                  <div>
                    <div className="text-sm font-bold text-slate-100">{viewingProfile.postsCount || 5}</div>
                    <div className="text-[10px] text-slate-400">Posts</div>
                  </div>
                  <div className="border-x border-slate-800">
                    <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-0.5">
                      <span>{viewingProfile.streak || 12}</span>
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                    <div className="text-[10px] text-slate-400">Streak</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-400">{viewingProfile.prepScore || 85}%</div>
                    <div className="text-[10px] text-slate-400">Prep Score</div>
                  </div>
                </div>

                {/* Skills / Target Focus */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProfile.skills?.map(skill => (
                      <span key={skill} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#161e31] text-slate-300 border border-slate-700/60">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Location & Social Icons */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{viewingProfile.location}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {viewingProfile.github && (
                      <a href={viewingProfile.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {viewingProfile.linkedin && (
                      <a href={viewingProfile.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Read Only Notice */}
                <div className="text-center pt-2 text-[10px] text-slate-500 font-medium border-t border-slate-800/50 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public View (Read-Only) • Cannot be edited by viewers</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
