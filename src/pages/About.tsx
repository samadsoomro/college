import React from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Users, Award, Calendar } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import FAQ from "@/components/FAQ";

const About: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings, loading: settingsLoading } = useCollege();

  const { data: homeData, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/${collegeSlug}/home-about`],
    queryFn: async () => {
      const res = await fetch(`/api/${collegeSlug}/home`);
      if (!res.ok) throw new Error("Failed to fetch home data");
      return res.json();
    },
  });

  const dbStats = homeData?.stats || [];
  const loading = settingsLoading || statsLoading;

  const defaultStats = [
    { icon: <Calendar size={32} />, number: "1953", label: "Established" },
    { icon: <BookOpen size={32} />, number: "25,000+", label: "Books" },
    { icon: <Users size={32} />, number: "2,000+", label: "Students" },
    { icon: <Award size={32} />, number: "70+", label: "Years of Excellence" },
  ];

  const ICON_MAP: Record<string, React.ReactNode> = {
    Calendar: <Calendar size={32} />,
    BookOpen: <BookOpen size={32} />,
    Users: <Users size={32} />,
    Award: <Award size={32} />,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const displayStats =
    dbStats.length > 0
      ? dbStats.slice(0, 4).map((ds: any) => ({
          icon: ICON_MAP[ds.icon] || <BookOpen size={32} />,
          number: ds.number,
          label: ds.label,
        }))
      : defaultStats;

  return (
    <motion.div
      className="min-h-screen pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="py-12 lg:py-16 gradient-dark text-white text-center overflow-hidden">
        <div className="container">
          <motion.h1
            className="text-3xl lg:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            About {settings?.instituteShortName || 'College'}
          </motion.h1>
          <motion.p
            className="text-lg text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {settings?.footerTagline ||
              `${settings?.instituteFullName || 'College'} - Empowering Education Since 1953`}
          </motion.p>
        </div>
      </div>
      <div className="py-12 lg:py-16">
        <div className="container">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {displayStats.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="bg-card p-6 rounded-xl border border-border text-center hover:shadow-lg hover:-translate-y-1 transition-all"
                  variants={itemVariants}
                >
                  <div className="text-primary mb-3">{stat.icon}</div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {loading ? (
            <div className="max-w-3xl mx-auto space-y-4">
              <Skeleton className="h-8 w-48 mb-6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <motion.div
              className="prose max-w-3xl mx-auto text-muted-foreground"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Our History
              </h2>
              <p className="mb-4">
                {settings?.instituteFullName || 'College'} was established in 1953 and has
                been a pillar of higher education in Karachi for over seven
                decades.
              </p>
              <p>
                Our library houses over 25,000 books covering various subjects
                including science, humanities, literature, and Islamic studies,
                serving thousands of students annually.
              </p>
            </motion.div>
          )}
        </div>
      </div>
      <FAQ />
    </motion.div>
  );
};

export default About;
