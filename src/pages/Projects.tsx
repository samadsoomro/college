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
    if (!collegeSlug) return;
    fetch(`/api/${collegeSlug}/projects`)
      .then(async res => {
        const text = await res.text();
        console.log('[PROJECTS FETCH]', res.status, text.substring(0, 200));
        try {
          const data = JSON.parse(text);
          setProjects(Array.isArray(data) ? data : []);
        } catch {
          setProjects([]);
        }
      })
      .catch(err => {
        console.error('[PROJECTS ERROR]', err);
        setProjects([]);
      })
      .finally(() => setLoading(false));
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
                <div className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-primary/10 dark:via-neutral-900 dark:to-primary/5 border-2 border-primary/20 dark:border-primary/30 rounded-2xl p-6 md:p-8 shadow-lg overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                          <FlaskConical size={12} /> Live Research
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
                        to={`/${collegeSlug}/projects/ai-study`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
                      >
                        🔍 View Live Research →
                      </Link>
                    </div>
                    <div className="flex-shrink-0 bg-white dark:bg-neutral-800 border border-primary/10 dark:border-neutral-700 rounded-2xl p-5 space-y-3 min-w-[220px] shadow-sm">
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
                <div className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-primary/10 dark:via-neutral-900 dark:to-primary/5 border-2 border-primary/20 dark:border-primary/30 rounded-2xl p-6 md:p-8 shadow-lg overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-semibold">
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
                        to={`/${collegeSlug}/projects/population-model`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
                      >
                        🔍 View Live Research →
                      </Link>
                    </div>
                    <div className="flex-shrink-0 bg-white dark:bg-neutral-800 border border-primary/10 dark:border-neutral-700 rounded-2xl p-5 space-y-3 min-w-[220px] shadow-sm">
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
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Supervised by: Prof. Nazeer Ahmed, Head of Maths Dept.</p>
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

            {/* Quantum Simulator Research Card — GCFM only */}
            {collegeSlug === 'gcfm' && settings?.showQuantumResearch && (
              <div className="col-span-full">
                <div className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-primary/10 dark:via-neutral-900 dark:to-primary/5 border-2 border-primary/20 dark:border-primary/30 rounded-2xl p-6 md:p-8 shadow-lg overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                          <FlaskConical size={12} /> Live Research
                        </span>
                        <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
                          📅 September 2026
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-tight">
                        BB84 Quantum Cryptography Simulator
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-2xl">
                        A classical computational simulation of the BB84 quantum key distribution (QKD) protocol. Models Alice, Eve, Bob interactions and analyzes Quantum Bit Error Rate (QBER).
                      </p>
                      <Link
                        to={`/${collegeSlug}/projects/quantum-simulator`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
                      >
                        ⚛️ View Simulator →
                      </Link>
                    </div>
                    <div className="flex-shrink-0 bg-white dark:bg-neutral-800 border border-primary/10 dark:border-neutral-700 rounded-2xl p-5 space-y-3 min-w-[220px] shadow-sm">
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Researcher</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span>👤</span>
                          <div>
                            <p className="font-bold text-neutral-800 dark:text-neutral-100 text-sm">Muhammad Salman Bhatti</p>
                            <p className="text-xs text-neutral-500">Class 12 (CS), Batch 2024–2026</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>🎓</span>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Supervised by: Muhammad Javed Akhtar</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span>🏛️</span>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Physics Dept. of GCFMN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Project Cards */}
            {projects.map(project => {
              const pdfUrl = project.pdfUrl || project.pdf_url || null;
              const title = project.title || '';
              const researcher = project.researcherName || project.researcher_name || '';
              const classBatch = project.classBatch || project.class_batch || '';
              const supervisor = project.supervisor || '';
              const department = project.department || '';
              const description = project.description || '';
              const publishDate = project.publishDate || project.publish_date || null;

              return (
                <div key={project.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full font-medium">
                      📋 Research Project
                    </span>
                    {publishDate && (
                      <span className="text-xs text-neutral-400">
                        {new Date(publishDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                
                  {/* Title */}
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base leading-snug">
                    {title}
                  </h3>
                
                  {/* Details */}
                  <div className="text-xs text-neutral-500 space-y-1">
                    {researcher && (
                      <p>👤 <span className="font-medium">{researcher}</span>
                        {classBatch ? ` — ${classBatch}` : ''}
                      </p>
                    )}
                    {supervisor && <p>🎓 Supervised by: {supervisor}</p>}
                    {department && <p>🏛️ {department}</p>}
                  </div>
                
                  {/* Description */}
                  {description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                      {description}
                    </p>
                  )}
                
                  {/* PDF Button */}
                  {pdfUrl ? (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                      📄 View Research Report
                    </a>
                  ) : (
                    <div className="mt-auto py-2.5 text-center text-xs text-neutral-300 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                      PDF not uploaded yet
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Empty state — only when no PDF projects AND no hardcoded research */}
            {projects.length === 0 && !settings?.showMyResearch && !settings?.showPopulationResearch && !settings?.showQuantumResearch && (
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
