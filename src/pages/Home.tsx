import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from 'react-intersection-observer';
import { useCountUp } from '@/hooks/useCountUp';
import { AnimatedSection } from '@/components/AnimatedSection';
import { useParams } from "react-router-dom";
import Hero from "@/components/layout/Hero";
import HomeSlider from "@/components/home/HomeSlider";
import {
  Heart,
  Clock,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Search,
  Star,
  Cog, 
  Microscope, 
  Laptop, 
  FlaskConical, 
  Calculator, 
  Palette, 
  Music,
  ArrowRight,
  XCircle,
  RefreshCw
} from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeContent {
  heroHeading?: string;
  heroSubheading?: string;
  heroOverlayText?: string;
  featuresHeading?: string;
  featuresSubheading?: string;
  affiliationsHeading?: string;
  ctaHeading?: string;
  ctaSubheading?: string;
  heroTagline?: string;
  heroTaglineEnabled?: boolean;
  academicSectionEnabled: boolean;
  academicSectionHeading: string;
  academicSectionSubheading: string;
  examSectionEnabled: boolean;
  examSectionHeading: string;
}

interface AcademicProgram {
  id: string;
  title: string;
  subjects: string;
  icon: string;
  display_order: number;
}

interface ExamPaper {
  id: string;
  title: string;
  button_text: string;
  pdf_url: string;
  is_enabled: boolean;
}

interface ExamLink {
  id: string;
  title: string;
  buttonText: string;
  url: string;
  is_enabled: boolean;
}

interface SliderImage {
  id: string;
  imageUrl: string;
  isActive: boolean;
  order: number;
}

interface HomeStat {
  id: string;
  number: string;
  label: string;
  iconUrl?: string;
  icon?: string;
  color?: string;
  order?: number;
}

interface Affiliation {
  id: string;
  name: string;
  logoUrl: string;
  link: string;
  order: number;
  isActive?: boolean;
}

interface AffiliationBlock {
  type: "long" | "small";
  items: Affiliation[];
}

const AffiliationsLayout: React.FC<{ affiliations: Affiliation[] }> = ({
  affiliations,
}) => {
  const [logoTypes, setLogoTypes] = useState<Record<string, "long" | "small">>(
    {},
  );

  useEffect(() => {
    affiliations.forEach((aff) => {
      const img = new Image();
      img.src = aff.logoUrl;
      img.onload = () => {
        // Long logos have aspect ratio > 1.8
        const isLong = img.naturalWidth / img.naturalHeight > 1.8;
        setLogoTypes((prev) => ({
          ...prev,
          [aff.id]: isLong ? "long" : "small",
        }));
      };
    });
  }, [affiliations]);

  const blocks: AffiliationBlock[] = [];
  let currentSmallBlock: Affiliation[] = [];

  affiliations.forEach((aff) => {
    const type = logoTypes[aff.id] || "small";

    if (type === "long") {
      if (currentSmallBlock.length > 0) {
        blocks.push({ type: "small", items: currentSmallBlock });
        currentSmallBlock = [];
      }
      blocks.push({ type: "long", items: [aff] });
    } else {
      currentSmallBlock.push(aff);
    }
  });

  if (currentSmallBlock.length > 0) {
    blocks.push({ type: "small", items: currentSmallBlock });
  }

  return (
    <div className="flex flex-col gap-16 md:gap-24 w-full max-w-6xl mx-auto px-4">
      {blocks.map((block, blockIdx) => (
        <div key={blockIdx} className="w-full">
          {block.type === "long" ? (
            <div className="flex justify-center">
              {block.items.map((aff, index) => (
                <AnimatedSection key={aff.id} delay={index * 80}>
                <a
                  href={aff.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block w-full max-w-4xl hover:opacity-95 transition-opacity"
                >
                  <div className="bg-card p-4 rounded-xl shadow-sm border border-border/50 group-hover:shadow-md transition-shadow">
                    <img
                      src={aff.logoUrl}
                      alt={aff.name}
                      loading="lazy"
                      className="w-full h-auto object-contain transition-transform group-hover:scale-[1.01]"
                    />
                  </div>
                </a>
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-12 md:gap-16 lg:gap-24 items-center">
              {block.items.map((aff, itemIdx) => (
                <AnimatedSection key={aff.id} delay={itemIdx * 80}>
                <a
                  href={aff.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center hover:opacity-90 transition-opacity w-32 md:w-40 lg:w-48"
                >
                  <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-card rounded-full shadow-sm border border-border/50 group-hover:shadow-md transition-all p-4">
                    <img
                      src={aff.logoUrl}
                      alt={aff.name}
                      loading="lazy"
                      className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
                    />
                  </div>
                  <span className="mt-4 text-sm font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity text-center line-clamp-1">
                    {aff.name}
                  </span>
                </a>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const AnimatedStat = ({ value, suffix, isVisible }: { value: number; suffix: string; isVisible: boolean }) => {
  const count = useCountUp(value, 2000, isVisible);
  return (
    <span className="text-3xl lg:text-4xl font-bold text-primary mb-1">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const iconMap: Record<string, any> = {
  Cog, Microscope, Laptop, TrendingUp, BookOpen, Star,
  FlaskConical, Calculator, Palette, Music,
};

const ProgramIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = iconMap[name] || BookOpen;
  return <Icon className={className} />;
};

const Home: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings } = useCollege();
  
  const { data: homeData, isLoading } = useQuery<{
    content: HomeContent;
    slider: SliderImage[];
    stats: HomeStat[];
    affiliations: Affiliation[];
    programs: AcademicProgram[];
    examPaper: ExamPaper;
    examLinks: ExamLink[];
  }>({
    queryKey: [`/api/${collegeSlug}/home`],
    queryFn: async () => {
      const res = await fetch(`/api/${collegeSlug}/home`);
      if (!res.ok) throw new Error("Failed to fetch home data");
      return res.json();
    }
  });

  const content: HomeContent = (homeData?.content as HomeContent) || {
    heroHeading: "",
    heroSubheading: "",
    heroOverlayText: "",
    featuresHeading: "",
    featuresSubheading: "",
    affiliationsHeading: "",
    ctaHeading: "",
    ctaSubheading: "",
    heroTagline: "",
    heroTaglineEnabled: false,
    academicSectionEnabled: true,
    academicSectionHeading: "Academic Programs",
    academicSectionSubheading: "Excellence in Education",
    examSectionEnabled: true,
    examSectionHeading: "Examination Papers"
  };
  const slider = homeData?.slider || [];
  const stats = homeData?.stats || [];
  const affiliations = homeData?.affiliations || [];
  const programs = homeData?.programs || [];
  const examPaper = homeData?.examPaper || null;
  const examLinks = homeData?.examLinks || [];
  const loading = isLoading;

  const [faqs, setFaqs] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const [examGroups, setExamGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [examClasses, setExamClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showExamPopup, setShowExamPopup] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);

  useEffect(() => {
    if (!collegeSlug) return;
    fetch(`/api/${collegeSlug}/exam-papers`)
      .then(r => r.json())
      .then(data => setExamGroups(Array.isArray(data) ? data : []))
      .catch(() => setExamGroups([]));
  }, [collegeSlug]);

  const handleExamButtonClick = async (group: any) => {
    setSelectedGroup(group);
    setSelectedClass(null);
    setShowExamPopup(true);
    setLoadingExam(true);
    try {
      const res = await fetch(`/api/${collegeSlug}/exam-papers/${group.id}/classes`);
      const data = await res.json();
      setExamClasses(Array.isArray(data) ? data : []);
    } catch {
      setExamClasses([]);
    } finally {
      setLoadingExam(false);
    }
  };

  const { ref: statsRef, inView: statsVisible } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  useEffect(() => {
    if (!collegeSlug) return;
    fetch(`/api/${collegeSlug}/home/faqs`)
      .then(r => r.json())
      .then(data => setFaqs(Array.isArray(data) ? data : []))
      .catch(() => setFaqs([]));
  }, [collegeSlug]);

  // Default Stats configuration to map with DB data or use as fallback
  const defaultStats = [
    {
      icon: <BookOpen size={40} />,
      defaultNumber: "5000+",
      defaultLabel: "Books Available",
      color: "text-pakistan-green",
    },
    {
      icon: <Users size={40} />,
      defaultNumber: "1000+",
      defaultLabel: "Active Students",
      color: "text-pakistan-green-light",
    },
    {
      icon: <Award size={40} />,
      defaultNumber: "500+",
      defaultLabel: "Study Materials",
      color: "text-accent",
    },
    {
      icon: <TrendingUp size={40} />,
      defaultNumber: "95%",
      defaultLabel: "Satisfaction Rate",
      color: "text-pakistan-emerald",
    },
  ];

  // Merge DB stats with default configuration (icons/colors)
  const ICON_MAP: Record<string, React.ReactNode> = {
    BookOpen: <BookOpen size={40} />,
    Users: <Users size={40} />,
    Award: <Award size={40} />,
    TrendingUp: <TrendingUp size={40} />,
    Search: <Search size={40} />,
    Star: <Star size={40} />,
    Heart: <Heart size={40} />,
    Clock: <Clock size={40} />,
  };

  const displayStats =
    stats && stats.length > 0
      ? stats.map((ds, idx) => ({
        number: ds.number,
        label: ds.label,
        iconUrl: ds.iconUrl,
        color:
          (ds as any).color ||
          (idx % 2 === 0
            ? "text-pakistan-green"
            : "text-pakistan-green-light"),
        icon: ICON_MAP[(ds as any).icon || "BookOpen"] || <BookOpen size={40} />,
      }))
      : defaultStats.map((s) => ({
        number: s.defaultNumber,
        label: s.defaultLabel,
        icon: s.icon,
        color: s.color,
      }));

  const features = [
    {
      title: "Easy Book Borrowing",
      description:
        "Browse our extensive collection and borrow books with just a few clicks. Track your borrowings and due dates easily.",
      emoji: "📚",
    },
    {
      title: "Digital Study Materials",
      description:
        "Access course notes, syllabus, and study guides organized by subjects and semesters.",
      emoji: "📖",
    },
    {
      title: "Rare Books Archive",
      description:
        "Explore our digital archive of rare and historical books with secure viewing technology.",
      emoji: "🏛️",
    },
    {
      title: "Admin Dashboard",
      description:
        "Efficient management system for librarians to handle requests, inventory, and user accounts.",
      emoji: "⚙️",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        {/* Skeleton Hero */}
        <section className="relative h-[80vh] flex items-center bg-neutral-100 overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-xl space-y-6">
              <Skeleton className="h-10 w-48 rounded-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-36" />
                <Skeleton className="h-12 w-36" />
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Stats */}
        <div className="container py-24">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Features */}
        <div className="bg-neutral-50 py-24">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-8 bg-white rounded-2xl border border-neutral-100 space-y-4">
                  <Skeleton className="h-12 w-12" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Hero
        heading={content.heroHeading}
        subheading={content.heroSubheading}
        overlayText={content.heroOverlayText}
        tagline={content.heroTagline}
        taglineEnabled={content.heroTaglineEnabled}
      />

      {/* Image Slider Section */}
      {slider.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container px-4 md:px-6">
            <HomeSlider images={slider} />
          </div>
        </section>
      )}

      <section className="py-16 lg:py-24 bg-background">
        <div className="container px-4" ref={statsRef}>
          <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
            {displayStats.map((stat, index) => {
              const numMatch = stat.number.match(/(\d+)(.*)/);
              const value = numMatch ? parseInt(numMatch[1], 10) : parseInt(stat.number, 10) || 0;
              const suffix = numMatch ? numMatch[2] : '';
              return (
                <motion.div
                  key={index}
                  className="flex flex-col items-center text-center p-6 lg:p-8 bg-secondary rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all w-[calc(50%-1.5rem)] lg:w-[calc(25%-2rem)] min-w-[160px] max-w-[280px]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div
                    className={`mb-4 ${stat.color} flex items-center justify-center h-12 w-12`}
                  >
                    {stat.iconUrl ? (
                      <img
                        src={stat.iconUrl}
                        alt={stat.label || "stat icon"}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      stat.icon
                    )}
                  </div>
                  <AnimatedStat value={value} suffix={suffix} isVisible={statsVisible} />
                  <span className="text-sm lg:text-base text-muted-foreground">
                    {stat.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Academic Programs Section */}
      {content?.academicSectionEnabled && programs.length > 0 && (
        <section className="py-16 lg:py-24 px-4 bg-background border-y border-border/50">
          <div className="max-w-6xl mx-auto">
            {/* Heading */}
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {content?.academicSectionHeading || 'Academic Programs'}
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                {content?.academicSectionSubheading || 'Excellence in Education'}
              </p>
            </AnimatedSection>

            {/* Program Cards */}
            <div className="flex flex-wrap justify-center gap-6">
              {programs.map((program, index) => (
                <AnimatedSection 
                  key={program.id} 
                  delay={index * 120}
                  className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.2rem)] min-w-[240px]"
                >
                  <div
                    className="group bg-card border-2 border-border/50 rounded-2xl p-6 text-center hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-default h-full flex flex-col items-center"
                    style={{ transform: 'translateY(0)', transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                  >
                    {/* Icon */}
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <ProgramIcon name={program.icon} className="w-8 h-8 text-primary" />
                    </div>
                    {/* Title */}
                    <h3 className="font-bold text-foreground text-lg mb-3">
                      {program.title}
                    </h3>
                    {/* Subjects */}
                    <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                      {program.subjects.split(',').map((subject: string, i: number) => (
                        <span key={i} className="text-[10px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                          {subject.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Multi-Link Exam Paper Section */}
      {content?.examSectionEnabled && examGroups.length > 0 && (
        <section className="py-16 lg:py-24 bg-background relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />

          <div className="container px-4 relative z-10">
            <AnimatedSection className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                {content?.examSectionHeading || 'Examination Papers'}
              </h2>
              <div className="w-20 h-1.5 bg-primary/20 mx-auto mt-6 rounded-full" />
            </AnimatedSection>

            <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
              {examGroups.map((group, idx) => (
                <motion.div 
                  key={group.id} 
                  className="w-full md:w-auto min-w-[320px] max-w-sm"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                >
                  <button
                    onClick={() => handleExamButtonClick(group)}
                    className="w-full text-left group flex items-center gap-5 p-7 rounded-[2.5rem] bg-primary/5 text-foreground border-2 border-primary/10 shadow-sm transition-all duration-300 hover:border-primary/30 hover:bg-primary/10 relative overflow-hidden"
                  >
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-500 relative z-10">
                      📄
                    </div>
                    <div className="text-left flex-1 relative z-10">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 mb-1.5 font-black">Examinations</p>
                      <p className="text-xl font-black leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">{group.title}</p>
                    </div>
                    <div className="w-11 h-11 flex items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 relative z-10 group-hover:translate-x-2">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-secondary">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
            <AnimatedSection>
            <h2
              className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
            >
              {content.featuresHeading ||
                `Why Choose ${settings?.instituteShortName || 'College'}?`}
            </h2>
            </AnimatedSection>
            <AnimatedSection delay={100}>
            <p
              className="text-lg text-muted-foreground"
            >
              {content.featuresSubheading ||
                "Discover the features that make our library the perfect learning companion"}
            </p>
            </AnimatedSection>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <AnimatedSection key={feature.title} delay={index * 100}>
                <div
                  className="bg-card p-6 lg:p-8 rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 transition-all h-full"
                >
                  <div className="text-4xl mb-4">{feature.emoji}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliations Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <AnimatedSection delay={100}>
              <h2
                className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
              >
                {content.affiliationsHeading || "Affiliations & Authorities"}
              </h2>
            </AnimatedSection>
          </div>

          {affiliations.length > 0 && (
            <div className="flex flex-col gap-12 max-w-5xl mx-auto">
              <AffiliationsLayout affiliations={affiliations} />
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-16 px-4 bg-secondary/30 mb-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <AnimatedSection delay={100}>
                <h2 
                  className="text-3xl font-bold text-foreground"
                >
                  Frequently Asked Questions
                </h2>
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <p 
                  className="text-muted-foreground mt-2"
                >
                  Find answers to common questions about our college services.
                </p>
              </AnimatedSection>
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <AnimatedSection key={faq.id} delay={idx * 80}>
                  <div
                    className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Question */}
                    <button
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
                    >
                      <span className="font-semibold text-foreground text-sm md:text-base">
                        {faq.question}
                      </span>
                      <span className={`text-primary text-xl font-bold transition-transform ${
                        openFaq === faq.id ? 'rotate-45' : ''
                      }`}>
                        +
                      </span>
                    </button>

                    {/* Answer */}
                    {openFaq === faq.id && (
                      <div className="px-5 pb-4 border-t border-border">
                        <p className="text-muted-foreground text-sm leading-relaxed pt-3">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 lg:py-24 gradient-primary text-white">
        <div className="container">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {content.ctaHeading || "Ready to Start Learning?"}
            </h2>
            <p className="text-lg text-white/90 mb-8">
              {content.ctaSubheading ||
                `Join thousands of students who are already using ${settings?.instituteShortName || 'College'} for their academic success.`}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={`/${collegeSlug}/register`}
                className="px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
              >
                Create Free Account
              </a>
              <a
                href={`/${collegeSlug}/books`}
                className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Browse Library
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
      {/* Exam Popup Modal */}
      <AnimatePresence>
        {showExamPopup && selectedGroup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-background border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="bg-primary/5 border-b border-primary/10 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-primary flex items-center gap-2">📄 {selectedGroup.title}</h3>
                  <p className="text-sm text-muted-foreground">Select your class to download papers</p>
                </div>
                <button 
                  onClick={() => { setShowExamPopup(false); setSelectedClass(null); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-4">
                {loadingExam ? (
                  <div className="text-center py-12 flex flex-col items-center flex-1 justify-center opacity-50">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p>Loading papers...</p>
                  </div>
                ) : examClasses.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center text-muted-foreground">
                    <p>No papers available yet.</p>
                  </div>
                ) : (
                  <>
                    {!selectedClass && (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                          Step 1: Select your class
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {examClasses.map((cls, i) => (
                            <motion.button
                              key={cls.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => setSelectedClass(cls)}
                              className="border-2 border-border/50 hover:border-primary hover:bg-primary/5 rounded-xl p-4 text-center font-bold text-foreground transition-all group"
                            >
                              <div className="w-10 h-10 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                📚
                              </div>
                              {cls.class_name}
                              <p className="text-xs text-muted-foreground font-medium mt-1">
                                {cls.subjects?.length || 0} papers
                              </p>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {selectedClass && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-2 mb-6 bg-secondary/50 p-2 rounded-lg inline-flex">
                          <button onClick={() => setSelectedClass(null)} className="text-sm font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                            ← Back
                          </button>
                          <span className="text-border">|</span>
                          <p className="text-sm font-bold text-foreground px-2">
                            {selectedClass.class_name}
                          </p>
                        </div>

                        {selectedClass.subjects?.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground font-medium">
                            No papers uploaded for this class yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedClass.subjects.map((subject: any, i: number) => (
                              <motion.a
                                key={subject.id}
                                href={subject.pdf_url}
                                download={`${subject.subject_name.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center justify-between bg-card border-2 border-border/50 hover:border-primary hover:shadow-md hover:bg-primary/5 rounded-xl p-4 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl group-hover:scale-110 transition-transform">📝</div>
                                  <div>
                                    <p className="font-bold text-foreground text-sm line-clamp-1">
                                      {subject.subject_name}
                                    </p>
                                    {subject.file_size_kb > 0 && (
                                      <p className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                                        {subject.file_size_kb < 1024
                                          ? `${subject.file_size_kb} KB`
                                          : `${(subject.file_size_kb / 1024).toFixed(1)} MB`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                  ↓
                                </div>
                              </motion.a>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Home;
