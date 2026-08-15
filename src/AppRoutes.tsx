import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
        <Route path="/help" element={<Help />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:slug" element={<CompanyDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users/:userId" element={<ProtectedRoute><AdminUserDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        
        <Route path="/interview/new" element={<ProtectedRoute><InterviewNew /></ProtectedRoute>} />
        <Route path="/interview/results/:id" element={<ProtectedRoute><InterviewResults /></ProtectedRoute>} />
        <Route path="/interview/:id" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
        
        <Route path="/video-interview" element={<ProtectedRoute><Navigate to="/voice-assistant" replace /></ProtectedRoute>} />
        <Route path="/video-interview/results/:id" element={<ProtectedRoute><VideoInterviewResults /></ProtectedRoute>} />
        <Route path="/timed-interview/results/:id" element={<ProtectedRoute><TimedVideoInterviewResults /></ProtectedRoute>} />
        <Route path="/voice-interview/results/:id" element={<ProtectedRoute><VoiceInterviewResults /></ProtectedRoute>} />
        <Route path="/multi-question-results/:id" element={<ProtectedRoute><MultiQuestionResults /></ProtectedRoute>} />
        <Route path="/voice-assistant" element={<ProtectedRoute><VoiceAssistant /></ProtectedRoute>} />
        
        <Route path="/video-practice/history" element={<ProtectedRoute><VideoPracticeHistory /></ProtectedRoute>} />
        <Route path="/progress-analytics" element={<ProtectedRoute><ProgressAnalytics /></ProtectedRoute>} />
        <Route path="/adaptive-interview" element={<ProtectedRoute><AdaptiveInterview /></ProtectedRoute>} />
        
        <Route path="/peer-interviews" element={<ProtectedRoute><PeerInterviews /></ProtectedRoute>} />
        <Route path="/peer-interviews/create" element={<ProtectedRoute><CreatePeerSession /></ProtectedRoute>} />
        <Route path="/peer-interviews/room/:sessionId" element={<ProtectedRoute><PeerSessionRoom /></ProtectedRoute>} />
        <Route path="/peer-interviews/rate/:sessionId" element={<ProtectedRoute><RatePeerSession /></ProtectedRoute>} />
        
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        
        <Route path="/daily-challenge" element={<ProtectedRoute><DailyChallengeLanding /></ProtectedRoute>} />
        <Route path="/daily-challenge/solve" element={<ProtectedRoute><DailyChallenge /></ProtectedRoute>} />
        <Route path="/job-recommendations" element={<ProtectedRoute><JobRecommendations /></ProtectedRoute>} />
        
        <Route path="/question-practice" element={<ProtectedRoute><QuestionPractice /></ProtectedRoute>} />
        <Route path="/dsa-sheet" element={<ProtectedRoute><DSASheet /></ProtectedRoute>} />
        <Route path="/playground" element={<ProtectedRoute><Playground /></ProtectedRoute>} />
        <Route path="/elite-prep" element={<ProtectedRoute><ElitePrep /></ProtectedRoute>} />
        <Route path="/career-plan/:planId" element={<ProtectedRoute><CareerPlanView /></ProtectedRoute>} />
        <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
