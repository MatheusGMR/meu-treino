import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Exercises from "./pages/personal/Exercises";
import Sessions from "./pages/personal/Sessions";
import Workouts from "./pages/personal/Workouts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/personal/exercises"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <Exercises />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/sessions"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <Sessions />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/workouts"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <Workouts />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
