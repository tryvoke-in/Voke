import React from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import DSASheet from "./pages/DSASheet";
import QuestionPractice from "./pages/QuestionPractice";
import DailyChallengeLanding from "./pages/DailyChallengeLanding";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

/**
 * Synchronous Route Tree for Server-Side Rendering (SSG Prerendering).
 * Ensures zero Suspense fallback spinners in pre-rendered static HTML files.
 */
export const AppRoutesServer: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/companies" element={<Companies />} />
      <Route path="/companies/:slug" element={<CompanyDetail />} />
      <Route path="/dsa-sheet" element={<DSASheet />} />
      <Route path="/question-practice" element={<QuestionPractice />} />
      <Route path="/daily-challenge" element={<DailyChallengeLanding />} />
      <Route path="/help" element={<Help />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutesServer;
