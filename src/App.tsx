import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Auth Pages
import SignUp from "@/pages/auth/SignUp";
import SignIn from "@/pages/auth/SignIn";

// Applicant Pages - Simplified (3 core features only)
import ApplicantDashboard from "@/pages/applicant/ApplicantDashboard";
import JobListings from "@/pages/applicant/JobListings";
import MyApplications from "@/pages/applicant/MyApplications";
import ApplicantProfile from "@/pages/applicant/ApplicantProfile";
import ApplicationCompanyProfile from "@/pages/applicant/ApplicationCompanyProfile";
import InterviewInvitations from "@/pages/applicant/InterviewInvitations";

// Recruiter Pages - Simplified (3 core features only)
import RecruiterDashboard from "@/pages/recruiter/RecruiterDashboard";
import JobManagement from "@/pages/recruiter/JobManagement";
import CandidateEvaluation from "@/pages/recruiter/CandidateEvaluation";
import JobApplicants from "@/pages/recruiter/JobApplicants";
import ApplicantDetail from "@/pages/recruiter/ApplicantDetail";
import CompanyProfile from "@/pages/recruiter/CompanyProfile";
import CandidateDiscovery from "@/pages/recruiter/CandidateDiscovery";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />

              {/* Recruiter Routes - 3 Core Features */}
              <Route path="/recruiter" element={<ProtectedRoute allowedRole="recruiter"><DashboardLayout><RecruiterDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRole="recruiter"><DashboardLayout><JobManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/recruiter/jobs/:jobId/applicants" element={<ProtectedRoute allowedRole="recruiter"><DashboardLayout><JobApplicants /></DashboardLayout></ProtectedRoute>} />
              <Route path="/recruiter/applicants/:applicantId" element={<ProtectedRoute allowedRole="recruiter"><DashboardLayout><ApplicantDetail /></DashboardLayout></ProtectedRoute>} />
              <Route path="/recruiter/candidates" element={<ProtectedRoute allowedRole="recruiter"><DashboardLayout><CandidateEvaluation /></DashboardLayout></ProtectedRoute>} />
              <Route path="/recruiter/discovery" element={<ProtectedRoute allowedRole="recruiter"><DashboardLayout><CandidateDiscovery /></DashboardLayout></ProtectedRoute>} />
              <Route path="/recruiter/profile" element={<ProtectedRoute allowedRole="recruiter"><DashboardLayout><CompanyProfile /></DashboardLayout></ProtectedRoute>} />

              {/* Applicant Routes - 3 Core Features */}
              <Route path="/applicant" element={<ProtectedRoute allowedRole="applicant"><DashboardLayout><ApplicantDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/applicant/jobs" element={<ProtectedRoute allowedRole="applicant"><DashboardLayout><JobListings /></DashboardLayout></ProtectedRoute>} />
              <Route path="/applicant/my-applications" element={<ProtectedRoute allowedRole="applicant"><DashboardLayout><MyApplications /></DashboardLayout></ProtectedRoute>} />
              <Route path="/applicant/my-applications/:applicationId/company" element={<ProtectedRoute allowedRole="applicant"><DashboardLayout><ApplicationCompanyProfile /></DashboardLayout></ProtectedRoute>} />
              <Route path="/applicant/invitations" element={<ProtectedRoute allowedRole="applicant"><DashboardLayout><InterviewInvitations /></DashboardLayout></ProtectedRoute>} />
              <Route path="/applicant/profile" element={<ProtectedRoute allowedRole="applicant"><DashboardLayout><ApplicantProfile /></DashboardLayout></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
