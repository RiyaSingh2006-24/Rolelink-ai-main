import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JobListings from "./pages/JobListings";
import SeekerDashboard from "./pages/SeekerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerJobs from "./pages/EmployerJobs";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeGenerator from "./pages/ResumeGenerator";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute allowedRoles={["jobseeker"]} fallbackPath="/employer/jobs">
                    <JobListings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["jobseeker"]}>
                    <SeekerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/jobs"
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <EmployerJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-analyzer"
                element={
                  <ProtectedRoute allowedRoles={["jobseeker"]} fallbackPath="/employer-dashboard">
                    <ResumeAnalyzer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-generator"
                element={
                  <ProtectedRoute allowedRoles={["jobseeker"]} fallbackPath="/employer-dashboard">
                    <ResumeGenerator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
