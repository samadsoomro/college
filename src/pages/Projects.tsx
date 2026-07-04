import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCollege } from '@/contexts/CollegeContext';

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Department Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 dark:text-neutral-100">
            {settings?.projectsDeptHeading || 'Statistics & Computer Science Dept.'}
          </h1>
          <p className="text-neutral-500 mt-2">
            Student & Faculty Research Projects
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-neutral-400">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* My Research Card — always first when enabled */}
            {settings?.showMyResearch && (
              <div className="bg-white dark:bg-neutral-900 border-2 border-primary/30 rounded-2xl p-6 shadow-md flex flex-col gap-3 hover:shadow-lg transition-shadow">
                {/* Special badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-semibold">
                    🔬 Live Research
                  </span>
                  <span className="text-xs text-neutral-400">June 2026</span>
                </div>

                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg leading-snug">
                  AI Tools & Academic Performance Among CS Students
                </h3>

                <div className="text-xs text-neutral-500 space-y-1">
                  <p>👤 <span className="font-medium">Abdul Samad</span> — Class 12 (CS), Batch 2024–2026</p>
                  <p>🎓 Supervised by: {settings?.myResearchSupervisor || 'Prof. Munaf & Prof. M. Waqqar Qadri'}</p>
                  <p>🏛️ {settings?.projectsDeptHeading || 'Statistics & Computer Science Dept.'}</p>
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  A statistical study examining the relationship between AI tool usage
                  and academic performance among Computer Science students,
                  using chi-square analysis and correlation methods.
                </p>

                <Link
                  to={`/${collegeSlug}/projects/ai-performance-study`}
                  className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  🔍 View Live Research
                </Link>
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
