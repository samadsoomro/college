import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCollege } from '@/contexts/CollegeContext';
import { FlaskConical } from 'lucide-react';

const Projects = () => {
  const { collegeSlug } = useParams();
  const { settings } = useCollege();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch(`/api/${collegeSlug}/projects`);
        if (!res.ok) { setProjects([]); setLoading(false); return; }
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch { setProjects([]); }
      setLoading(false);
    };
    loadProjects();
  }, [collegeSlug]);

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-24">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Department Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 dark:text-neutral-100">
            {settings?.projectsPageHeading || 'Our College Projects'}
          </h1>
          <p className="text-neutral-500 mt-2">
            {settings?.projectsPageSubheading || 'Student & Faculty Research Projects'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-neutral-400">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* My Research card ONLY shows on gcfm slug: */}
            {collegeSlug === 'gcfm' && settings?.showMyResearch && (
              <div className="col-span-full">
                <div className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-primary/10 dark:via-neutral-900 dark:to-primary/5 border-2 border-primary/30 rounded-2xl p-6 md:p-8 shadow-lg overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                          🔬 Live Research
                        </span>
                        <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
                          📅 June 2026
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-tight">
                        AI Tools & Academic Performance Among All Groups Students
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-2xl">
                        A statistical study examining the relationship between AI tool usage
                        and academic performance among students of all subject groups,
                        using chi-square analysis, correlation methods, and regression modeling.
                      </p>
                      <Link
                        to={`/${collegeSlug}/projects/ai-performance-study`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:translate-y-[-1px]"
                      >
                        🔍 View Live Research <span className="text-lg">→</span>
                      </Link>
                    </div>
                    <div className="flex-shrink-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 space-y-3 min-w-[220px] shadow-sm">
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Researcher</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span>👤</span>
                          <div>
                            <p className="font-bold text-neutral-800 dark:text-neutral-100 text-sm">Abdul Samad</p>
                            <p className="text-xs text-neutral-500">Class 12 (CS), Batch 2024–2026</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>🎓</span>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            {settings?.myResearchSupervisor || 'Prof. Munaf & Prof. M. Waqqar Qadri'}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>🏛️</span>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Statistics Dept. of GCFMN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Population Research Card — GCFM only, shows after AI research card */}
            {collegeSlug === 'gcfm' && settings?.showPopulationResearch && (
              <div className="col-span-full">
                <div className="relative bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-900/10 dark:via-neutral-900 dark:to-emerald-900/10 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 md:p-8 shadow-lg overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-green-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                          <FlaskConical size={12} /> Live Research
                        </span>
                        <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
                          📅 August 2026
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-tight">
                        Modeling and Predicting Population Growth of Karachi Using Differential Equations
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-2xl">
                        Application of the exponential growth model P = P₀·e^(kt) to real Karachi census data (1981–2023), projecting population to 35.4 million by 2040 with 97.6% model accuracy.
                      </p>
                      <Link
                        to={`/${collegeSlug}/projects/karachi-population-model`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-all hover:shadow-lg"
                      >
                        🔍 View Research →
                      </Link>
                    </div>
                    <div className="flex-shrink-0 bg-white dark:bg-neutral-800 border border-green-100 dark:border-neutral-700 rounded-2xl p-5 space-y-3 min-w-[220px] shadow-sm">
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Researchers</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span>👤</span>
                          <div>
                            <p className="font-bold text-neutral-800 dark:text-neutral-100 text-sm">Abdul Samad &</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-100 text-sm">Muhammad Salman Bhatti</p>
                            <p className="text-xs text-neutral-500">Class 12 (CS), Batch 2024–2026</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>🎓</span>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Supervised by: Muhammad Ali, Lecturer Mathematics</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>🏛️</span>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Mathematics Dept. of GCFMN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Project Cards */}
            {projects.map(project => (
              <div key={project.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">

                <div className="flex items-center justify-between">
                  <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full font-medium">
                    📋 Research Project
                  </span>
                  {project.publish_date && (
                    <span className="text-xs text-neutral-400">
                      {new Date(project.publish_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base leading-snug">
                  {project.title}
                </h3>

                <div className="text-xs text-neutral-500 space-y-1">
                  {project.researcher_name && <p>👤 <span className="font-medium">{project.researcher_name}</span>{project.class_batch ? ` — ${project.class_batch}` : ''}</p>}
                  {project.supervisor && <p>🎓 Supervised by: {project.supervisor}</p>}
                  {project.department && <p>🏛️ {project.department}</p>}
                </div>

                {project.description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                )}

                {project.pdf_url && (
                  <a
                    href={project.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 border-2 border-primary text-primary rounded-xl font-semibold text-sm hover:bg-primary/5 transition-colors"
                  >
                    📄 View Report
                  </a>
                )}
              </div>
            ))}

            {/* Empty state */}
            {!settings?.showMyResearch && projects.length === 0 && (
              <div className="col-span-full text-center py-16 text-neutral-400">
                No projects published yet.
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
