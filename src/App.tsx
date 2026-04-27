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
import ProtocoloDestravamento from "./pages/ProtocoloDestravamento";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
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
import AIAgentSettings from "./pages/personal/AIAgentSettings";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientAnamnesis from "./pages/client/ClientAnamnesis";
import CheckoutSuccess from "./pages/client/CheckoutSuccess";
import ClientProgress from "./pages/client/ClientProgress";
import ClientProfile from "./pages/client/ClientProfile";
import WorkoutDetails from "./pages/client/WorkoutDetails";
import WorkoutSessionExecution from "./pages/client/WorkoutSessionExecution";
import ClientHistory from "./pages/client/ClientHistory";
import WorkoutComplete from "./pages/client/WorkoutComplete";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Professionals from "./pages/admin/Professionals";
import AllClients from "./pages/admin/AllClients";
import Assignments from "./pages/admin/Assignments";
import Users from "./pages/admin/Users";
import UploadBodyTypeImages from "./pages/admin/UploadBodyTypeImages";
import PendingUpdates from "./pages/admin/PendingUpdates";
import ExerciseImport from "./pages/admin/ExerciseImport";
import SupportVideos from "./pages/admin/SupportVideos";
import AgentVideos from "./pages/admin/AgentVideos";
import ProtocolBank from "./pages/admin/ProtocolBank";

import Marketing from "./pages/admin/Marketing";
import JmpAlerts from "./pages/admin/JmpAlerts";
import EligibilityForm from "./pages/client/EligibilityForm";
import ProtocoloCheckout from "./pages/client/ProtocoloCheckout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/protocolo-destravamento" element={<ProtocoloDestravamento />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
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
              path="/client/eligibility"
              element={<EligibilityForm />}
            />
            <Route
              path="/client/checkout"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <ProtocoloCheckout />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/client/checkout-success"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <CheckoutSuccess />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/client/anamnesis"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <ClientAnamnesis />
                  </RoleGuard>
                </AuthGuard>
              }
            />
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
              path="/client/progress"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <ClientProgress />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/client/profile"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <ClientProfile />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/client/workout/details/:workoutId"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <WorkoutDetails />
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
            <Route
              path="/client/workout/complete/:scheduleId"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["client"]}>
                    <WorkoutComplete />
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
            <Route
              path="/admin/upload-body-type-images"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <UploadBodyTypeImages />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/pending-updates"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <PendingUpdates />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/exercise-import"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <ExerciseImport />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/marketing"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <Marketing />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/jmp-alerts"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <JmpAlerts />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/support-videos"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <SupportVideos />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/agent-videos"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <AgentVideos />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/protocol-bank"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["admin"]}>
                    <ProtocolBank />
                  </RoleGuard>
                </AuthGuard>
              }
            />
            <Route
              path="/settings/ai-agent"
              element={
                <AuthGuard>
                  <RoleGuard allowedRoles={["personal", "admin"]}>
                    <AIAgentSettings />
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
