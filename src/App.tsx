import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AgentDemo from "./pages/AgentDemo";
import NotFound from "./pages/NotFound";
import { SupabaseTest } from "./components/SupabaseTest";
import { AgentProvider } from "./components/AgentProvider";
import { DemoNavigation } from "./components/DemoNavigation";
import { Suspense, lazy } from "react";

const queryClient = new QueryClient();

// Lazy load the agent initialization to improve initial load time
const AgentInitializer = lazy(() => import('./components/AgentInitializer'));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AgentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/setlists" element={<Index />} />
            <Route path="/setlists/:setlistId" element={<Index />} />
            <Route path="/agent-demo" element={<AgentDemo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DemoNavigation />
        </BrowserRouter>
        <SupabaseTest />
        {/* Initialize agents in the background */}
        <Suspense fallback={null}>
          <AgentInitializer />
        </Suspense>
      </TooltipProvider>
    </AgentProvider>
  </QueryClientProvider>
);

export default App;
