import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { MainLayout } from "@/layouts/MainLayout";
import Onboarding from "./pages/Onboarding";
import Browse from "./pages/Browse";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Reminders from "./pages/Reminders";
import Timeline from "./pages/Timeline";
import Planner from "./pages/Planner";
import FilePreview from "./pages/FilePreview";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

function AppRoutes() {
  const { settings } = useApp();

  if (!settings.isOnboarded) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/browse" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route element={<MainLayout />}>
        <Route path="/browse" element={<Browse />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/preview/:id" element={<FilePreview />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
