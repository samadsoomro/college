import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/Home";
import Books from "@/pages/Books";
import Notes from "@/pages/Notes";
import RareBooks from "@/pages/RareBooks";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import CollegeCard from "@/pages/CollegeCard";
import Donate from "@/pages/Donate";
import Events from "@/pages/Events";
import NotificationsPage from "@/pages/Notifications";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import MyCard from "@/pages/MyCard";
import AdminDashboard from "@/pages/AdminDashboard";
import BooksDetails from "@/pages/admin/BooksDetails";
import History from "@/pages/History";
import PrincipalMessage from "@/pages/PrincipalMessage";
import Faculty from "@/pages/Faculty";
import NotFound from "@/pages/NotFound";

import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import CollegeLayout from "@/components/layout/CollegeLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SuperAdminProtectedRoute from "@/components/auth/SuperAdminProtectedRoute";
import PageTransition from "@/components/common/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";


const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="gcfm-theme"
    >
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <Routes>

            <Route path="/" element={<Navigate to="/gcfm" replace />} />
            <Route path="/super-admin/dashboard/*" element={
              <SuperAdminProtectedRoute><SuperAdminDashboard /></SuperAdminProtectedRoute>
            } />
            <Route path="/:collegeSlug/*" element={<CollegeLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="books" element={<Books />} />
              <Route path="notes" element={<Notes />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<BlogPost />} />
              <Route path="events" element={<Events />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="rare-books" element={<RareBooks />} />
              <Route path="college-card" element={<CollegeCard />} />
              <Route path="my-card" element={<MyCard />} />
              <Route path="library-card" element={<Navigate to="../college-card" replace />} />
              <Route path="library-dashboard" element={<Navigate to=".." replace />} />
              <Route path="faculty" element={<Faculty />} />
              <Route path="history" element={<History />} />
              <Route path="principal-message" element={<PrincipalMessage />} />
              <Route path="about" element={<About />} />
              <Route path="donate" element={<Donate />} />
              <Route path="contact" element={<Contact />} />
              <Route path="admin-dashboard/*" element={
                <ProtectedRoute><AdminDashboard /></ProtectedRoute>
              } />
            </Route>

            {/* Global 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ErrorBoundary>
      </TooltipProvider>

      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
