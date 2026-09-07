import React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnlinePresenceProvider } from "@/components/OnlinePresenceProvider";
import SEO from "@/components/SEO";
import AppRoutesServer from "@/AppRoutesServer";

export function render(url: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <OnlinePresenceProvider>
            <StaticRouter location={url}>
              <SEO />
              <AppRoutesServer />
            </StaticRouter>
          </OnlinePresenceProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );

  return { html };
}
