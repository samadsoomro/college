import { useParams, Link } from 'react-router-dom';
import { useCollege } from '@/contexts/CollegeContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter, ZAxis,
  ComposedChart, Line
} from 'recharts';

// ══════════════════════════════════════════════════
// FINAL SURVEY DATA — 50 Students — GCFMN July 2026
// ══════════════════════════════════════════════════

const TOTAL_STUDENTS = 50;
const CHI_SQUARE_VALUE = 15.15;
const CHI_SQUARE_P_VALUE = 0.004;
const CORRELATION_R = 0.50;

// Pie Chart — AI Usage Distribution
const AI_USAGE_DATA = [
  { name: 'Daily',     value: 25 },
  { name: 'Sometimes', value: 18 },
  { name: 'Never',     value: 7  },
];

// Bar Chart 1 — Average Score by AI Usage Group
const PERFORMANCE_DATA = [
  { group: 'Never',     avgScore: 52 },
  { group: 'Sometimes', avgScore: 65 },
  { group: 'Daily',     avgScore: 74 },
];

// Bar Chart 2 — Participants by College Group (NEW)
const GROUP_DATA = [
  { group: 'Computer Science', count: 14 },
  { group: 'Pre-Engineering',  count: 13 },
  { group: 'Pre-Medical',      count: 12 },
  { group: 'Commerce',         count: 11 },
];

// Scatter Diagram — AI Usage vs Score
// x: 1=Never, 2=Sometimes, 3=Daily | y: Score % | size: number of students
const SCATTER_DATA = [
  { x: 1, y: 40,  z: 3  },
  { x: 1, y: 57,  z: 3  },
  { x: 1, y: 72,  z: 1  },
  { x: 2, y: 40,  z: 3  },
  { x: 2, y: 57,  z: 3  },
  { x: 2, y: 72,  z: 8  },
  { x: 2, y: 85,  z: 4  },
  { x: 3, y: 40,  z: 1  },
  { x: 3, y: 57,  z: 2  },
  { x: 3, y: 72,  z: 13 },
  { x: 3, y: 85,  z: 9  },
];

// Regression line — ŷ = 42.9 + 10.3x — plot at x=1 and x=3
const REGRESSION_LINE = [
  { x: 1, y: 53.2  }, // 42.9 + 10.3*1
  { x: 2, y: 63.5  }, // 42.9 + 10.3*2
  { x: 3, y: 73.8  }, // 42.9 + 10.3*3
];

const COLORS = ['#7c7fff', '#fa8c00', '#22c55e', '#ef4444'];

const AIResearchStudy = () => {
  const { collegeSlug } = useParams();
  const { settings } = useCollege();
  const supervisor = settings?.myResearchSupervisor || 'Prof. Munaf & Prof. M. Waqqar Qadri';

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8 md:space-y-12">

        {/* Back button */}
        <Link to={`/${collegeSlug}/projects`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
          ← Back to Projects
        </Link>

        {/* Hero Gradient Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/5 dark:to-transparent rounded-3xl p-6 sm:p-8 md:p-12 border border-primary/20 dark:border-primary/30 overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 text-center space-y-4 sm:space-y-6">
            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-block bg-primary text-primary-foreground text-xs px-4 py-1.5 rounded-full font-bold shadow-sm">
                🔬 Live Research
              </span>
              <span className="inline-block bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs px-4 py-1.5 rounded-full font-semibold border border-neutral-200 dark:border-neutral-700 shadow-sm">
                📊 Statistics & CS Dept.
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-neutral-800 dark:text-neutral-100 leading-tight">
              AI Tools & Academic Performance Among All Groups Students
            </h1>
            
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              <span className="flex items-center justify-center gap-1.5">👤 Abdul Samad — Class 12 (CS), Batch 2024–2026</span>
              <span className="hidden sm:inline text-neutral-300 dark:text-neutral-600">•</span>
              <span className="flex items-center justify-center gap-1.5">🎓 {supervisor}</span>
              <span className="hidden sm:inline text-neutral-300 dark:text-neutral-600">•</span>
              <span className="flex items-center justify-center gap-1.5">📅 Published: June 2026</span>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl text-center shadow-sm hover:shadow-md transition-all">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">👥</div>
            <div className="text-xl sm:text-2xl font-black text-neutral-800 dark:text-neutral-100">{TOTAL_STUDENTS || '--'}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">Students</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl text-center shadow-sm hover:shadow-md transition-all">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📈</div>
            <div className="text-xl sm:text-2xl font-black text-neutral-800 dark:text-neutral-100">{CHI_SQUARE_VALUE || '--'}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">Chi-Square (χ²)</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl text-center shadow-sm hover:shadow-md transition-all">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎯</div>
            <div className="text-xl sm:text-2xl font-black text-primary">{CHI_SQUARE_P_VALUE || '--'}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">P-Value</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl text-center shadow-sm hover:shadow-md transition-all">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🔗</div>
            <div className="text-xl sm:text-2xl font-black text-amber-500">{CORRELATION_R || '--'}</div>
            <div className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">Correlation (r)</div>
          </div>
        </div>

        {/* Section 1 — Why */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 space-y-3 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <span className="text-primary">🎯</span> Why We Did This Study
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Artificial intelligence tools like ChatGPT, Gemini, and Copilot are rapidly
            changing how students study and complete academic tasks. We wanted to
            understand whether using these tools actually improves academic performance,
            or whether the relationship is more complex. This study focuses specifically
            on students from all subject groups at GCFM Nazimabad.
          </p>
        </section>

        {/* Section 2 — Who We Asked */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 space-y-3 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <span className="text-green-500">👥</span> Who We Asked
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            We surveyed <strong className="text-neutral-800 dark:text-neutral-200">
            50 students</strong> from all subject groups at Govt. College for Men
            Nazimabad (GCFMN), Karachi. Students were from 11th and 12th class.
            The survey was voluntary and anonymous — no names were recorded.
            14 from Computer Science, 13 from Pre-Engineering, 12 from Pre-Medical,
            and 11 from Commerce.
          </p>
        </section>

        {/* Section 3 — What We Found */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 border-b pb-4">
            📊 What We Found
          </h2>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Pie Chart — AI Usage Distribution */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 shadow-sm">
              <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-4 text-center">
                How Often Do Students Use AI Tools?
              </h3>
              <div className="text-neutral-600 dark:text-neutral-400">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={AI_USAGE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {AI_USAGE_DATA.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2 rounded-lg shadow-lg text-xs">
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">
                                {payload[0].name}: <span className="font-medium" style={{ color: payload[0].payload.fill }}>{payload[0].value}%</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart 1 — Avg Score by AI Usage Group */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Average Exam Score by AI Usage Frequency
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Students who use AI daily scored 22 marks higher than non-users on average
              </p>
              <div className="text-neutral-600 dark:text-neutral-400">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={PERFORMANCE_DATA} margin={{ bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                    <XAxis dataKey="group" stroke="currentColor" opacity={0.5} tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="currentColor" opacity={0.5} tick={{ fill: 'currentColor', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2 rounded-lg shadow-lg text-xs">
                              <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">{label}</p>
                              <p className="font-medium" style={{ color: payload[0].payload.fill }}>Score: {payload[0].value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }} 
                    />
                    <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                      {PERFORMANCE_DATA.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart 2 — Participants by College Group */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Participants by College Group
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                50 students surveyed across all 4 subject groups at GCFMN
              </p>
              <div className="text-neutral-600 dark:text-neutral-400">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={GROUP_DATA} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} horizontal={false} />
                    <XAxis type="number" domain={[0, 20]} stroke="currentColor" opacity={0.5} tick={{ fill: 'currentColor', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="group" stroke="currentColor" opacity={0.5} tick={{ fill: 'currentColor', fontSize: 10 }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2 rounded-lg shadow-lg text-xs">
                              <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">{label}</p>
                              <p className="font-medium" style={{ color: payload[0].payload.fill }}>Count: {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {GROUP_DATA.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chi-Square Result */}
          <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 dark:border-primary/30 rounded-2xl p-5 sm:p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-primary text-xl font-black shrink-0">
                χ²
              </div>
              <h3 className="text-lg font-bold text-primary dark:text-primary/90">
                Chi-Square Test Result
              </h3>
            </div>
            <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We tested whether AI usage and exam performance are related or just random
              across all student groups. Our chi-square value of <strong>15.15</strong> is
              well above the critical value of 9.49 at 5% significance level
              (p = <strong>0.004</strong>). This means the association is statistically
              significant. Students who use AI tools daily scored an average of
              <strong className="text-primary dark:text-primary/90"> 74%</strong>, compared to just <strong className="text-neutral-500 dark:text-neutral-400">52%</strong> for those who
              never use them — a difference of <strong className="text-primary dark:text-primary/90">22 marks</strong>.
            </p>
          </div>

          {/* Scatter Diagram */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Scatter Diagram — AI Usage vs Exam Score
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Bubble size = number of students at that point. Orange line = regression ŷ = 42.9 + 10.3x
            </p>
            <div className="text-neutral-600 dark:text-neutral-400">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name="AI Usage"
                    domain={[0, 4]}
                    ticks={[1, 2, 3]}
                    stroke="currentColor" opacity={0.5} tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickFormatter={(v) => v === 1 ? 'Never' : v === 2 ? 'Sometimes' : v === 3 ? 'Daily' : ''}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    name="Score"
                    domain={[30, 100]}
                    stroke="currentColor" opacity={0.5} tick={{ fill: 'currentColor', fontSize: 11 }}
                  />
                  <ZAxis dataKey="z" range={[40, 400]} name="Students" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: 'currentColor', opacity: 0.2 }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0]?.payload;
                      const label = d?.x === 1 ? 'Never' : d?.x === 2 ? 'Sometimes' : 'Daily';
                      return (
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-xs shadow-lg">
                          <p className="text-neutral-500 dark:text-neutral-400 mb-1">AI Usage: <strong className="text-neutral-800 dark:text-neutral-200">{label}</strong></p>
                          <p className="text-neutral-500 dark:text-neutral-400 mb-1">Score: <strong className="text-neutral-800 dark:text-neutral-200">{d?.y}%</strong></p>
                          <p className="text-neutral-500 dark:text-neutral-400">Students: <strong className="text-primary">{d?.z}</strong></p>
                        </div>
                      );
                    }}
                  />
                  <Scatter name="Students" data={SCATTER_DATA} fill="#7c7fff" fillOpacity={0.7} />

                  <Line
                    data={REGRESSION_LINE}
                    type="linear"
                    dataKey="y"
                    stroke="#fa8c00"
                    strokeWidth={3}
                    dot={false}
                    name="Regression Line"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Regression line note + table */}
            <div className="mt-4 sm:mt-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-800">
              <p className="text-xs font-semibold text-neutral-500 mb-3 text-center sm:text-left">Regression Line: ŷ = 42.9 + 10.3x</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-center text-xs sm:text-sm">
                <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-lg p-2 sm:p-3 shadow-sm">
                  <p className="font-bold text-primary text-base sm:text-lg">53.2%</p>
                  <p className="text-neutral-400 dark:text-neutral-500 mt-0.5">Predicted (Never)</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-lg p-2 sm:p-3 shadow-sm">
                  <p className="font-bold text-primary text-base sm:text-lg">63.5%</p>
                  <p className="text-neutral-400 dark:text-neutral-500 mt-0.5">Predicted (Sometimes)</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-lg p-2 sm:p-3 shadow-sm">
                  <p className="font-bold text-primary text-base sm:text-lg">73.8%</p>
                  <p className="text-neutral-400 dark:text-neutral-500 mt-0.5">Predicted (Daily)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Correlation Result */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-200 dark:border-amber-700/30 rounded-2xl p-5 sm:p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center text-amber-700 dark:text-amber-400 text-xl font-black shrink-0">
                r
              </div>
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">
                Correlation Finding
              </h3>
            </div>
            
            <div className="bg-white/60 dark:bg-neutral-900/60 rounded-xl p-4 sm:p-5 border border-amber-200/50 dark:border-amber-700/30 shadow-sm">
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                The correlation between AI usage frequency and exam scores is
                <strong className="text-amber-600 dark:text-amber-400"> r = 0.50</strong>. This is a <strong className="text-amber-600 dark:text-amber-400">moderate positive
                relationship</strong>. The regression equation
                <strong className="text-neutral-800 dark:text-neutral-200"> ŷ = 42.9 + 10.3x</strong> tells us that each step up in AI
                usage frequency is associated with approximately <strong className="text-amber-600 dark:text-amber-400">10 marks
                higher score</strong> on average. This trend was consistent across
                CS, Pre-Engineering, Pre-Medical and Commerce groups.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 — What This Means */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 space-y-3 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <span className="text-blue-500">💡</span> What This Means for Students
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            These findings suggest that AI tools, when used appropriately, may support
            academic performance. However, students should focus on understanding
            concepts rather than relying entirely on AI-generated answers. Using AI
            as a learning aid — asking it to explain topics, generate practice problems,
            or check understanding — appears more beneficial than using it to complete
            assignments.
          </p>
        </section>

        {/* Section 5 — Conclusion */}
        <section className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
          <h2 className="text-xl font-bold text-primary dark:text-primary/90 flex items-center gap-2">
            <span>✅</span> Conclusion & Recommendations
          </h2>
          <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Based on our analysis, we recommend that colleges consider integrating
            structured AI literacy into the curriculum. Students should be taught
            how to use AI tools effectively and ethically. Further research with
            larger sample sizes across multiple institutions would strengthen these
            findings.
          </p>
        </section>

      </div>
    </div>
  );
};

export default AIResearchStudy;
