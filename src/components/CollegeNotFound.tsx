import React from "react";
import { Link } from "react-router-dom";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const CollegeNotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center pakistan-bg p-4 bg-slate-50">
      <motion.div 
        className="max-w-md w-full text-center bg-card p-8 rounded-2xl shadow-xl border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">College Not Found</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          We couldn't find the college you're looking for. Please check the URL or return to the main portal.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/gcfm">
            <Button className="w-full gap-2 text-lg py-6 shadow-md hover:shadow-lg transition-all" size="lg">
              <Home size={20} />
              Return to GCFM Home
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CollegeNotFound;
