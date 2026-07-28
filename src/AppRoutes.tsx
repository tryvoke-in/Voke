import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";

// Lazy load non-critical marketing & heavy dynamic pages for optimal Core Web Vitals (LCP, INP, CLS)
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminUserDetails = lazy(() => import("./pages/AdminUserDetails"));
const InterviewNew = lazy(() => import("./pages/InterviewNew"));
const InterviewResults = lazy(() => import("./pages/InterviewResults"));
const InterviewSession = lazy(() => import("./pages/InterviewSession"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const VideoInterviewResults = lazy(() => import("./pages/VideoInterviewResults"));
const TimedVideoInterviewResults = lazy(() => import("./pages/TimedVideoInterviewResults"));
const VoiceInterviewResults = lazy(() => import("./pages/VoiceInterviewResults"));
const MultiQuestionResults = lazy(() => import("./pages/MultiQuestionResults"));
const VideoPracticeHistory = lazy(() => import("./pages/VideoPracticeHistory"));
const ProgressAnalytics = lazy(() => import("./pages/ProgressAnalytics"));
const AdaptiveInterview = lazy(() => import("./pages/AdaptiveInterview"));
const PeerInterviews = lazy(() => import("./pages/PeerInterviews"));
const CreatePeerSession = lazy(() => import("./pages/CreatePeerSession"));
const PeerSessionRoom = lazy(() => import("./pages/PeerSessionRoom"));
const RatePeerSession = lazy(() => import("./pages/RatePeerSession"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Community = lazy(() => import("./pages/Community"));
const Help = lazy(() => import("./pages/Help"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const DailyChallenge = lazy(() => import("./pages/DailyChallenge"));
const DailyChallengeLanding = lazy(() => import("./pages/DailyChallengeLanding"));
const JobRecommendations = lazy(() => import("./pages/JobRecommendations"));
const QuestionPractice = lazy(() => import("./pages/QuestionPractice"));
const DSASheet = lazy(() => import("./pages/DSASheet"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const Playground = lazy(() => import("./pages/Playground"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ElitePrep = lazy(() => import("./pages/ElitePrep"));
const CareerPlanView = lazy(() => import("./pages/CareerPlanView"));
const ResumeBuilder = lazy(() => import("./pages/ResumeBuilder"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Waitlist = lazy(() => import("./pages/Waitlist"));

const PageFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/community" element={<Community />} />
        <Route path="/interview/new" element={<InterviewNew />} />
        <Route path="/interview/results/:id" element={<InterviewResults />} />
        <Route path="/interview/:id" element={<InterviewSession />} />
        <Route path="/video-interview" element={<Navigate to="/voice-assistant" replace />} />
        <Route path="/video-interview/results/:id" element={<VideoInterviewResults />} />
        <Route path="/timed-interview/results/:id" element={<TimedVideoInterviewResults />} />
        <Route path="/voice-interview/results/:id" element={<VoiceInterviewResults />} />
        <Route path="/multi-question-results/:id" element={<MultiQuestionResults />} />
        <Route path="/voice-assistant" element={<VoiceAssistant />} />
        <Route path="/video-practice/history" element={<VideoPracticeHistory />} />
        <Route path="/progress-analytics" element={<ProgressAnalytics />} />
        <Route path="/adaptive-interview" element={<AdaptiveInterview />} />
        <Route path="/peer-interviews" element={<PeerInterviews />} />
        <Route path="/peer-interviews/create" element={<CreatePeerSession />} />
        <Route path="/peer-interviews/room/:sessionId" element={<PeerSessionRoom />} />
        <Route path="/peer-interviews/rate/:sessionId" element={<RatePeerSession />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/help" element={<Help />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/daily-challenge" element={<DailyChallengeLanding />} />
        <Route path="/daily-challenge/solve" element={<DailyChallenge />} />
        <Route path="/job-recommendations" element={<JobRecommendations />} />
        <Route path="/question-practice" element={<QuestionPractice />} />
        <Route path="/dsa-sheet" element={<DSASheet />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:slug" element={<CompanyDetail />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/elite-prep" element={<ElitePrep />} />
        <Route path="/career-plan/:planId" element={<CareerPlanView />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
