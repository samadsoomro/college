import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { Calendar, User, ArrowRight, Clock, Pin, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCollege } from "@/contexts/CollegeContext";
import { Skeleton } from "@/components/ui/skeleton";

const Blog: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useCollege();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/${collegeSlug}/blog`);
        if (res.ok) {
          const data = await res.json();
          // Sort: Pinned first, then date desc
          const sorted = data.sort((a: any, b: any) => {
            if (a.isPinned === b.isPinned) {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            }
            return a.isPinned ? -1 : 1;
          });
          setPosts(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch blog posts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [collegeSlug]); // Added collegeSlug to dependency array

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header Section */}
      <div className="bg-primary text-white pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container relative z-10 text-center">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
          >
            {settings?.blogHeading || 'College News & Updates'}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-medium"
          >
            {settings?.blogDescription || 'Stay informed with the latest academic updates'}
          </motion.p>
        </div>
      </div>

      {/* Content Section */}
      <section className="py-16">
        <div className="container">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="space-y-4">
                  <Skeleton className="h-56 rounded-3xl" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={48} className="text-primary/30" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                No News or Updates
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Check back soon for latest announcements and educational insights from the college community.
              </p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {posts.map((post) => (
                <motion.div key={post.id} variants={item}>
                  <Link
                    to={`/${collegeSlug}/blog/${post.slug}`}
                    className="group block h-full"
                  >
                    <Card className="h-full border-none shadow-sm hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden flex flex-col hover:-translate-y-2 bg-card ring-1 ring-border">
                      {/* Image */}
                      <div className="h-56 relative overflow-hidden bg-muted">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground/40">
                            <BookOpen size={48} />
                          </div>
                        )}
                        {post.isPinned && (
                          <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Pin size={12} fill="currentColor" /> Feature
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center text-xs font-bold text-muted-foreground mb-3 gap-2">
                          <Calendar size={14} className="text-primary" />
                          {new Date(post.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {post.title}
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                          {post.shortDescription ||
                            "Click to read more about this topic..."}
                        </p>

                        <div className="mt-auto flex items-center text-primary font-bold text-sm">
                          Read Article{" "}
                          <ArrowRight
                            size={16}
                            className="ml-2 group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default Blog;
