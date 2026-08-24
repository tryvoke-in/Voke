import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import { DevResetWidget } from "./components/DevResetWidget";
import { OnlinePresenceProvider } from "./components/OnlinePresenceProvider";
import { SessionRequestNotifier } from "./components/SessionRequestNotifier";
import { ProfileCompletionGuard } from "./components/ProfileCompletionGuard";
import { WaitlistGuard } from "./components/WaitlistGuard";
import AnalyticsTracker from "./components/AnalyticsTracker";
import SEO from "./components/SEO";
import { TokenProvider } from "./contexts/TokenContext";
import { TokenCounterWidget } from "./components/TokenCounterWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TokenProvider>
        <OnlinePresenceProvider>
          <BrowserRouter>
            <SEO />
            <AnalyticsTracker />
            <WaitlistGuard>
              <ProfileCompletionGuard>
                <AppRoutes />
              </ProfileCompletionGuard>
            </WaitlistGuard>
            <DevResetWidget />
            <SessionRequestNotifier />
            <TokenCounterWidget />
          </BrowserRouter>
        </OnlinePresenceProvider>
      </TokenProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
