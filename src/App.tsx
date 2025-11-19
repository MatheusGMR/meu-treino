import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import ChoosePlan from "./pages/ChoosePlan";
import Exercises from "./pages/personal/Exercises";
import Sessions from "./pages/personal/Sessions";
import Workouts from "./pages/personal/Workouts";
import Volumes from "./pages/personal/Volumes";
import Methods from "./pages/personal/Methods";
import Clients from "./pages/personal/Clients";
import ClientDetails from "./pages/personal/ClientDetails";
import Subscription from "./pages/personal/Subscription";
import ClientDashboard from "./pages/client/ClientDashboard";
import WorkoutSessionExecution from "./pages/client/WorkoutSessionExecution";
import ClientHistory from "./pages/client/ClientHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Professionals from "./pages/admin/Professionals";
import AllClients from "./pages/admin/AllClients";
import Assignments from "./pages/admin/Assignments";
import Users from "./pages/admin/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route
              path="/escolher-plano"
              element={
                <AuthGuard>
                  <ChoosePlan />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/personal/assinatura"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <Subscription />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/exercises"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <SubscriptionGuard>
                      <Exercises />
                    </SubscriptionGuard>
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/sessions"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <SubscriptionGuard>
                      <Sessions />
                    </SubscriptionGuard>
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/workouts"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <SubscriptionGuard>
                      <Workouts />
                    </SubscriptionGuard>
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/volumes"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <SubscriptionGuard>
                      <Volumes />
                    </SubscriptionGuard>
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/methods"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <SubscriptionGuard>
                      <Methods />
                    </SubscriptionGuard>
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/clients"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <SubscriptionGuard>
                      <Clients />
                    </SubscriptionGuard>
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/personal/clients/:clientId"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <SubscriptionGuard>
                      <ClientDetails />
                    </SubscriptionGuard>
                  </RoleGuard>
                </AuthGuard>
              }
            />
            {/* Client routes */}
            <Route
              path="/client/dashboard"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <ClientDashboard />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/client/workout/session/:sessionId"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <WorkoutSessionExecution />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/client/history"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <ClientHistory />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/professionals"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <Professionals />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <AllClients />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/assignments"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <Assignments />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <Users />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
