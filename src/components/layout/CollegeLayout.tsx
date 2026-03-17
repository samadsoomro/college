import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CollegeProvider } from "@/contexts/CollegeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "./Header";
import Footer from "./Footer";
import ScrollToTop from "../common/ScrollToTop";
import BackToTop from "../common/BackToTop";
import SplashScreen from "../common/SplashScreen";

const CollegeLayoutContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.includes("/admin");
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <BackToTop />}
    </div>
  );
};

const CollegeLayout: React.FC = () => {
  return (
    <CollegeProvider>
      <AuthProvider>
        <CollegeLayoutContent />
      </AuthProvider>
    </CollegeProvider>
  );
};

export default CollegeLayout;
