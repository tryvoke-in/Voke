import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Bookmark, Check, Circle, Clock3, Code2, Flame, Heart, Lightbulb,
  MessageSquare, Network, Plus, Search, Send, Sparkles, Target,
  Trophy, Users, Video, X
} from "lucide-react";

type FeedFilter = "for_you" | "interview_experience" | "question" | "win";
type ComposerMode = "interview_experience" | "question" | "mock_request" | "win";

const SKILLS = [
  { key: "mock_interview", label: "Mock Interview", Icon: Video, color: "text-violet-400", bg: "bg-violet-500/15" },
  { key: "dsa", label: "DSA", Icon: Code2, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { key: "system_design", label: "System Design", Icon: Network, color: "text-sky-400", bg: "bg-sky-500/15" },
  { key: "behavioral", label: "Behavioral", Icon: Users, color: "text-amber-400", bg: "bg-amber-500/15" },
];

const DEFAULT_PLAN = [
  { task_type: "mock_interview", title: "Complete a mock interview", duration_minutes: 45, sort_order: 1, destination: "/voice-assistant" },
  { task_type: "dsa", title: "Solve one DSA challenge", duration_minutes: 30, sort_order: 2, destination: "/daily-challenge" },
  { task_type: "system_design", title: "Review a system design concept", duration_minutes: 30, sort_order: 3, destination: "/learning-paths" },
];

const modeCopy: Record<ComposerMode, { label: string; placeholder: string; action: string }> = {
  interview_experience: { label: "Share an experience", placeholder: "What company, role, rounds, and lessons would help another candidate?", action: "Share experience" },
  question: { label: "Ask a question", placeholder: "Ask the community for focused feedback on your preparation.", action: "Ask community" },
  mock_request: { label: "Find a mock partner", placeholder: "Describe the role, level, and format you want to practice.", action: "Find partner" },
  win: { label: "Share a win", placeholder: "Celebrate a milestone and tell the community what helped you get there.", action: "Share win" },
};

const Community = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [plan, setPlan] = useState<any[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("for_you");
  const [composerMode, setComposerMode] = useState<ComposerMode>("interview_experience");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomSkill, setRoomSkill] = useState("mock_interview");

  useEffect(() => {
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void load(session?.user ?? null);
    });
    const channel = supabase.channel("voke-pulse-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_mock_rooms" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_mock_room_members" }, () => void load())
      .subscribe();
    return () => { subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, []);

  const load = async (knownUser?: any) => {
    setLoading(true);
    const activeUser = knownUser ?? (await supabase.auth.getSession()).data.session?.user ?? null;
    setUser(activeUser);
    const [{ data: rawPosts }, { data: rawRooms }, { data: profiles }, { data: myLikes }, { data: saved }, { data: dailyPlan }] = await Promise.all([
      supabase.from("community_feed" as any).select("*").order("pinned_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(30),
      supabase.from("community_mock_room_feed" as any).select("*").order("scheduled_at", { ascending: true }).limit(6),
      supabase.from("community_profiles" as any).select("id, display_name, avatar_url, target_role"),
      activeUser ? supabase.from("likes" as any).select("post_id").eq("user_id", activeUser.id) : Promise.resolve({ data: [] }),
      activeUser ? supabase.from("community_saved_posts" as any).select("post_id").eq("user_id", activeUser.id) : Promise.resolve({ data: [] }),
      activeUser ? supabase.from("community_daily_plan_items" as any).select("*").eq("user_id", activeUser.id).eq("plan_date", new Date().toISOString().slice(0, 10)).order("sort_order") : Promise.resolve({ data: [] }),
    ]);
    const existingPlan = dailyPlan || [];
    if (activeUser && existingPlan.length === 0) {
      const { data: seeded } = await supabase.from("community_daily_plan_items" as any).insert(DEFAULT_PLAN.map(item => ({ ...item, user_id: activeUser.id }))).select();
      setPlan(seeded || []);
    } else setPlan(existingPlan);
    const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
    const liked = new Set((myLikes || []).map((row: any) => row.post_id));
    const savedIds = new Set((saved || []).map((row: any) => row.post_id));
    setPosts((rawPosts || []).map((post: any) => ({
      ...post,
      author: profileMap.get(post.user_id) || { display_name: "Voke Member", target_role: "Community Member" },
      liked: liked.has(post.id), saved: savedIds.has(post.id), likeCount: post.like_count || 0, commentCount: post.comment_count || 0,
    })));
    setRooms(rawRooms || []);
    setLoading(false);
  };

  const requireUser = async () => {
    const activeUser = user ?? (await supabase.auth.getSession()).data.session?.user;
    if (!activeUser) toast({ title: "Sign in required", description: "Join Voke to participate in Pulse.", variant: "destructive" });
    return activeUser;
  };

  const publish = async () => {
    const activeUser = await requireUser();
    if (!activeUser || !content.trim()) return;
    const tags = content.match(/#[\w]+/g)?.map(tag => tag.slice(1)) || [composerMode === "question" ? "InterviewHelp" : "InterviewPrep"];
    const { error } = await supabase.from("posts" as any).insert({
      user_id: activeUser.id, title: title.trim() || null, content: content.trim(), tags,
      post_type: composerMode, metadata: { source: "voke_pulse", composer: composerMode },
    });
    if (error) return toast({ title: "Could not publish", description: error.message, variant: "destructive" });
    setTitle(""); setContent(""); toast({ title: "Shared with your Prep Circle", description: "Your community post is live." }); void load(activeUser);
  };

  const toggleLike = async (post: any) => {
    const activeUser = await requireUser(); if (!activeUser) return;
    setPosts(current => current.map(item => item.id === post.id ? { ...item, liked: !item.liked, likeCount: item.likeCount + (item.liked ? -1 : 1) } : item));
    const result = post.liked
      ? await supabase.from("likes" as any).delete().eq("post_id", post.id).eq("user_id", activeUser.id)
      : await supabase.from("likes" as any).insert({ post_id: post.id, user_id: activeUser.id });
    if (result.error) { toast({ title: "Could not update reaction", variant: "destructive" }); void load(activeUser); }
  };

  const toggleSave = async (post: any) => {
    const activeUser = await requireUser(); if (!activeUser) return;
    setPosts(current => current.map(item => item.id === post.id ? { ...item, saved: !item.saved } : item));
    const result = post.saved
      ? await supabase.from("community_saved_posts" as any).delete().eq("post_id", post.id).eq("user_id", activeUser.id)
      : await supabase.from("community_saved_posts" as any).insert({ post_id: post.id, user_id: activeUser.id });
    if (result.error) { toast({ title: "Could not update saves", variant: "destructive" }); void load(activeUser); }
  };

  const togglePlanItem = async (item: any) => {
    const { error } = await supabase.from("community_daily_plan_items" as any).update({ completed: !item.completed }).eq("id", item.id);
    if (!error) setPlan(current => current.map(entry => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry));
  };

  const createRoom = async () => {
    const activeUser = await requireUser(); if (!activeUser || !roomTitle.trim()) return;
    const { error } = await supabase.from("community_mock_rooms" as any).insert({ host_id: activeUser.id, title: roomTitle.trim(), skill: roomSkill, description: "Practice together in Voke Pulse." });
    if (error) return toast({ title: "Could not create room", description: error.message, variant: "destructive" });
    setRoomTitle(""); setCreatingRoom(false); toast({ title: "Mock room is open", description: "Other Voke members can join now." }); void load(activeUser);
  };

  const joinRoom = async (room: any) => {
    const activeUser = await requireUser(); if (!activeUser) return;
    const { error } = await supabase.from("community_mock_room_members" as any).insert({ room_id: room.id, user_id: activeUser.id });
    if (error?.code === "23505") return toast({ title: "You already joined this room" });
    if (error) return toast({ title: "Could not join room", description: error.message, variant: "destructive" });
    toast({ title: "You joined the mock room", description: "Open Peer Match when you are ready to practice." }); void load(activeUser);
  };

  const visiblePosts = useMemo(() => posts.filter(post => {
    const typeMatch = filter === "for_you" || post.post_type === filter;
    const needle = search.toLowerCase();
    return typeMatch && (!needle || `${post.title || ""} ${post.content} ${post.author?.display_name || ""} ${(post.tags || []).join(" ")}`.toLowerCase().includes(needle));
  }), [posts, filter, search]);
  const complete = plan.filter(item => item.completed).length;
  const totalMinutes = plan.reduce((sum, item) => sum + item.duration_minutes, 0);
  const skillProgress = (index: number) => Math.min(88, 36 + complete * 12 + index * 7);

  return <div className="min-h-screen bg-[#080d18] text-slate-100 selection:bg-violet-500/30 pt-16">
    <Navbar />
    <main className="mx-auto w-full max-w-[1560px] px-4 py-6 lg:px-8">
      <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)_330px]">
        <aside className="space-y-5">
          <Card className="border-white/10 bg-[#101827] shadow-xl shadow-black/10"><CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Your Prep Circle</h2><span className="text-xs text-slate-500">Today</span></div>
            <div className="space-y-3">{SKILLS.map(({ label, Icon, color, bg }, index) => <div key={label} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/[0.03]">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-slate-500">{skillProgress(index)}% building</p></div>
              <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-700 text-[10px] font-semibold" style={{ borderTopColor: index % 2 ? "#34d399" : "#8b5cf6" }}>{skillProgress(index)}%</div>
            </div>)}</div>
          </CardContent></Card>
          <Card className="border-white/10 bg-[#101827]"><CardContent className="p-5">
            <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-amber-400"/><h2 className="font-semibold">Momentum</h2></div>
            <p className="mt-5 text-3xl font-semibold">{complete}<span className="text-slate-500"> / {plan.length || 3}</span></p><p className="text-xs text-slate-500">sessions completed today</p>
            <div className="mt-5 flex items-center justify-between">{[0,1,2,3,4].map(day => <div key={day} className="text-center"><div className={`mx-auto mb-1.5 grid h-6 w-6 place-items-center rounded-full ${day < complete ? "bg-emerald-500 text-emerald-950" : "border border-slate-600"}`}>{day < complete && <Check className="h-3.5 w-3.5"/>}</div><span className="text-[10px] text-slate-500">{["M","T","W","T","F"][day]}</span></div>)}</div>
            <Button className="mt-5 w-full border border-violet-500/60 bg-transparent text-violet-300 hover:bg-violet-500/10" onClick={() => setCreatingRoom(true)}><Users className="mr-2 h-4 w-4"/>Find a Peer Match</Button>
          </CardContent></Card>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="flex overflow-x-auto rounded-xl border border-white/10 bg-[#101827] p-1.5">{([
            ["for_you", "For you"], ["interview_experience", "Interview Stories"], ["question", "Ask & Answer"], ["win", "Wins"]
          ] as [FeedFilter, string][]).map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`min-w-[120px] rounded-lg px-4 py-2 text-sm transition ${filter === key ? "bg-violet-600 font-medium text-white shadow-lg shadow-violet-900/40" : "text-slate-400 hover:text-white"}`}>{label}</button>)}</div>
          <Card className="border-white/10 bg-[#101827]"><CardContent className="p-5">
            <p className="mb-4 text-sm font-medium text-slate-300">What are you working on?</p>
            <div className="grid gap-2 sm:grid-cols-3">{(["interview_experience", "question", "mock_request"] as ComposerMode[]).map(mode => <button key={mode} onClick={() => setComposerMode(mode)} className={`rounded-xl border p-3 text-left transition ${composerMode === mode ? "border-violet-500/70 bg-violet-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"}`}>
              <span className="text-sm font-medium">{modeCopy[mode].label}</span><span className="mt-1 block text-xs text-slate-500">{mode === "interview_experience" ? "Help candidates prepare" : mode === "question" ? "Get useful feedback" : "Practice together"}</span>
            </button>)}</div>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add a clear title (optional)" className="mt-4 border-white/10 bg-[#0b1220]" />
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder={modeCopy[composerMode].placeholder} className="mt-2 min-h-[100px] resize-none border-white/10 bg-[#0b1220]" />
            <div className="mt-3 flex justify-end"><Button onClick={publish} disabled={!content.trim()} className="bg-violet-600 hover:bg-violet-500"><Send className="mr-2 h-4 w-4"/>{modeCopy[composerMode].action}</Button></div>
          </CardContent></Card>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search interview stories, questions and skills" className="border-white/10 bg-[#101827] pl-9"/></div>
          <div className="space-y-4">{loading ? <PulseLoading/> : visiblePosts.length ? visiblePosts.map((post, index) => <motion.article key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}><PostCard post={post} onLike={() => toggleLike(post)} onSave={() => toggleSave(post)} /></motion.article>) : <EmptyFeed />}</div>
        </section>

        <aside className="space-y-5">
          <Card className="border-white/10 bg-[#101827]"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="font-semibold">Today’s interview plan</p><p className="mt-1 text-xs text-slate-500">{totalMinutes} minutes planned</p></div><div className="grid h-16 w-16 place-items-center rounded-full border-4 border-amber-400/80 text-lg font-semibold">{plan.length ? Math.round((complete / plan.length) * 100) : 0}%</div></div>
            <div className="mt-5 space-y-2">{plan.map(item => <button key={item.id} onClick={() => togglePlanItem(item)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-left hover:bg-white/[0.06]"><span className={`grid h-6 w-6 place-items-center rounded-full ${item.completed ? "bg-emerald-500 text-emerald-950" : "border border-slate-600"}`}>{item.completed ? <Check className="h-4 w-4"/> : <Circle className="h-3 w-3"/>}</span><span className="min-w-0 flex-1 text-sm">{item.title}</span><span className="text-xs text-slate-500">{item.duration_minutes}m</span></button>)}</div>
            <Button className="mt-4 w-full bg-violet-600 hover:bg-violet-500" onClick={() => plan.find(item => !item.completed)?.destination && (window.location.href = plan.find(item => !item.completed).destination)}>Continue plan <span className="ml-2">→</span></Button>
          </CardContent></Card>
          <Card className="border-white/10 bg-[#101827]"><CardContent className="p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Active mock rooms</h2><button className="text-xs text-violet-300" onClick={() => setCreatingRoom(true)}>Create room</button></div><div className="mt-4 space-y-3">{rooms.length ? rooms.map(room => <div key={room.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{room.title}</p><p className="mt-1 text-xs capitalize text-slate-500">{room.skill.replace("_", " ")} · {room.duration_minutes} min</p></div><Button size="sm" className="h-8 bg-violet-600 px-3 text-xs hover:bg-violet-500" disabled={room.member_count >= room.capacity} onClick={() => joinRoom(room)}>{room.member_count >= room.capacity ? "Full" : "Join"}</Button></div><div className="mt-3 flex items-center justify-between"><div className="flex -space-x-1.5"><Avatar className="h-5 w-5 border border-[#101827]"><AvatarFallback className="bg-violet-500 text-[8px]">V</AvatarFallback></Avatar><Avatar className="h-5 w-5 border border-[#101827]"><AvatarFallback className="bg-sky-500 text-[8px]">P</AvatarFallback></Avatar></div><span className="text-[11px] text-slate-500">{room.member_count} / {room.capacity}</span></div></div>) : <p className="py-3 text-sm text-slate-500">No rooms open yet. Start one for your Prep Circle.</p>}</div></CardContent></Card>
          <Card className="border-white/10 bg-[#101827]"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-400"/><h2 className="font-semibold">Trending skills</h2></div><div className="flex flex-wrap gap-2">{["System Design", "Dynamic Programming", "Graphs", "Behavioral", "Low-level Design"].map(skill => <Badge key={skill} className="border-emerald-500/20 bg-emerald-500/10 py-1 text-emerald-300">↗ {skill}</Badge>)}</div></CardContent></Card>
        </aside>
      </div>
    </main>
    {creatingRoom && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><Card className="w-full max-w-md border-white/10 bg-[#101827]"><CardContent className="p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Open a mock room</h2><p className="text-sm text-slate-500">Invite your Prep Circle to practice now.</p></div><Button size="icon" variant="ghost" onClick={() => setCreatingRoom(false)}><X className="h-4 w-4"/></Button></div><Input value={roomTitle} onChange={e => setRoomTitle(e.target.value)} placeholder="e.g. SDE 1 behavioral mock" className="mt-5 border-white/10 bg-[#0b1220]"/><div className="mt-3 grid grid-cols-2 gap-2">{SKILLS.map(skill => <Button key={skill.key} variant="outline" onClick={() => setRoomSkill(skill.key)} className={`${roomSkill === skill.key ? "border-violet-500 bg-violet-500/10 text-violet-200" : "border-white/10"}`}>{skill.label}</Button>)}</div><Button onClick={createRoom} disabled={!roomTitle.trim()} className="mt-5 w-full bg-violet-600 hover:bg-violet-500"><Plus className="mr-2 h-4 w-4"/>Open room</Button></CardContent></Card></div>}
    <Footer />
  </div>;
};

function PostCard({ post, onLike, onSave }: { post: any; onLike: () => void; onSave: () => void }) {
  const typeLabel = post.post_type === "interview_experience" ? "Interview experience" : post.post_type === "mock_request" ? "Mock partner request" : post.post_type === "question" ? "Question" : post.post_type === "win" ? "Win" : "Discussion";
  return <Card className="overflow-hidden border-white/10 bg-[#101827] shadow-xl shadow-black/5"><CardContent className="p-5"><div className="flex gap-3"><Avatar className="h-10 w-10"><AvatarImage src={post.author?.avatar_url}/><AvatarFallback className="bg-violet-600 font-semibold">{post.author?.display_name?.[0] || "V"}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{post.author?.display_name || "Voke Member"}</p><p className="text-xs text-slate-500">{post.author?.target_role || "Community Member"} · {new Date(post.created_at).toLocaleDateString()}</p></div><Badge className="border-violet-500/20 bg-violet-500/10 text-violet-300">{typeLabel}</Badge></div></div></div>{post.title && <h2 className="mt-5 text-lg font-semibold tracking-tight">{post.title}</h2>}<p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{post.content}</p>{post.tags?.length ? <div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag: string) => <Badge key={tag} className="border-sky-500/15 bg-sky-500/10 text-sky-300">#{tag}</Badge>)}</div> : null}<div className="mt-5 flex border-t border-white/10 pt-3"><Button variant="ghost" size="sm" onClick={onLike} className={post.liked ? "text-pink-400" : "text-slate-400"}><Heart className={`mr-1.5 h-4 w-4 ${post.liked ? "fill-current" : ""}`}/>{post.likeCount} Helpful</Button><Button variant="ghost" size="sm" className="ml-2 text-slate-400"><MessageSquare className="mr-1.5 h-4 w-4"/>{post.commentCount} Comments</Button><Button variant="ghost" size="sm" onClick={onSave} className={`ml-auto ${post.saved ? "text-violet-300" : "text-slate-400"}`}><Bookmark className={`mr-1.5 h-4 w-4 ${post.saved ? "fill-current" : ""}`}/>{post.saved ? "Saved" : "Save"}</Button></div></CardContent></Card>;
}

function PulseLoading() { return <div className="grid place-items-center rounded-2xl border border-white/10 bg-[#101827] py-16 text-sm text-slate-500"><Sparkles className="mb-3 h-6 w-6 animate-pulse text-violet-400"/>Loading your Prep Circle…</div>; }
function EmptyFeed() { return <div className="rounded-2xl border border-dashed border-white/15 bg-[#101827] py-14 text-center"><Lightbulb className="mx-auto h-8 w-8 text-amber-300"/><h2 className="mt-3 font-semibold">Start a useful conversation</h2><p className="mt-1 text-sm text-slate-500">Share an interview insight, ask a focused question, or find a mock partner.</p></div>; }

export default Community;
