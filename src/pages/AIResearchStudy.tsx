import { useParams, Link } from 'react-router-dom';
import { useCollege } from '@/contexts/CollegeContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter, LineChart, Line
} from 'recharts';

// ─────────────────────────────────────────────
// FILL IN AFTER SURVEY ANALYSIS
// ─────────────────────────────────────────────

const AI_USAGE_PIE_DATA = [
  { name: 'Daily', value: 40 },
  { name: 'Weekly', value: 30 },
  { name: 'Rarely', value: 20 },
  { name: 'Never', value: 10 },
];

const PERFORMANCE_BAR_DATA = [
  { group: 'Daily', avgGrade: 78 },
  { group: 'Weekly', avgGrade: 72 },
  { group: 'Rarely', avgGrade: 65 },
  { group: 'Never', avgGrade: 60 },
];

const SCATTER_DATA = [
  { aiUsageScore: 1, academicScore: 55 },
  { aiUsageScore: 2, academicScore: 62 },
  { aiUsageScore: 3, academicScore: 70 },
  { aiUsageScore: 4, academicScore: 78 },
  { aiUsageScore: 5, academicScore: 85 },
];

const REGRESSION_LINE_DATA = [
  { aiUsageScore: 1, predicted: 56 },
  { aiUsageScore: 5, predicted: 84 },
];

// Chi-square result — FILL IN AFTER ANALYSIS:
const CHI_SQUARE_VALUE = 0;    // FILL IN e.g. 12.45
const CHI_SQUARE_P_VALUE = 0;  // FILL IN e.g. 0.014
const CORRELATION_R = 0;       // FILL IN e.g. 0.62
const TOTAL_STUDENTS = 0;      // FILL IN e.g. 50

// ─────────────────────────────────────────────

const PIE_COLORS = ['#7c7fff', '#fa8c00', '#22c55e', '#ef4444'];

const AIResearchStudy = () => {
  const { collegeSlug } = useParams();
  const { settings } = useCollege();
  const supervisor = settings?.myResearchSupervisor || 'Prof. Munaf & Prof. M. Waqqar Qadri';

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

        {/* Back button */}
        <Link to={`/${collegeSlug}/projects`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          ← Back to Projects
        </Link>

        {/* Hero Gradient Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 md:p-12 border border-primary/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 text-center space-y-6">
            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-block bg-primary text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-sm">
                🔬 Live Research
              </span>
              <span className="inline-block bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs px-4 py-1.5 rounded-full font-semibold border border-neutral-200 dark:border-neutral-700">
                📊 Statistics & CS Dept.
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-neutral-800 dark:text-neutral-100 leading-tight">
              AI Tools & Academic Performance Among All Groups Students
            </h1>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              <span className="flex items-center gap-1.5">👤 Abdul Samad — Class 12 (CS), Batch 2024–2026</span>
              <span className="flex items-center gap-1.5">🎓 {supervisor}</span>
              <span className="flex items-center gap-1.5">📅 Published: June 2026</span>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-1">👥</div>
            <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{TOTAL_STUDENTS || '--'}</div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Students</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-1">📈</div>
            <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{CHI_SQUARE_VALUE || '--'}</div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Chi-Square (χ²)</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-1">🎯</div>
            <div className="text-2xl font-black text-primary">{CHI_SQUARE_P_VALUE || '--'}</div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">P-Value</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-1">🔗</div>
            <div className="text-2xl font-black text-amber-500">{CORRELATION_R || '--'}</div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Correlation (r)</div>
          </div>
        </div>

        {/* Section 1 — Why */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-3 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <span className="text-primary">🎯</span> Why We Did This Study
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Artificial intelligence tools like ChatGPT, Gemini, and Copilot are rapidly
            changing how students study and complete academic tasks. We wanted to
            understand whether using these tools actually improves academic performance,
            or whether the relationship is more complex. This study focuses specifically
            on students from all subject groups at GCFM Nazimabad.
          </p>
        </section>

        {/* Section 3 — What We Found */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 border-b pb-4">
            📊 What We Found
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart — AI Usage Distribution */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
              <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-4 text-center">
                How Often Do Students Use AI Tools?
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={AI_USAGE_PIE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {AI_USAGE_PIE_DATA.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart — Performance by AI Usage Group */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
              <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-4 text-center">
                Average Score by AI Usage
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={PERFORMANCE_BAR_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="avgGrade" fill="#7c7fff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chi-Square Result */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-black">
                χ²
              </div>
              <h3 className="text-lg font-bold text-primary">
                Chi-Square Test Result
              </h3>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              A chi-square test of independence was conducted to determine whether the frequency of AI tool usage is significantly associated with student's academic performance.
            </p>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-primary/20">
              {CHI_SQUARE_VALUE > 0 ? (
                <p className="font-medium">
                  Our result (χ² = <strong className="text-primary">{CHI_SQUARE_VALUE}</strong>, p = <strong className="text-primary">{CHI_SQUARE_P_VALUE}</strong>)
                  shows that {CHI_SQUARE_P_VALUE < 0.05
                    ? <span className="text-green-600 dark:text-green-400 font-bold">there IS a statistically significant relationship — the connection is real, not just by chance.</span>
                    : <span className="text-neutral-500 font-bold">there is NO statistically significant relationship at the 5% level.</span>}
                </p>
              ) : (
                <p className="text-neutral-400 italic">[Chi-square result will be filled after analysis]</p>
              )}
            </div>
          </div>

          {/* Scatter Chart + Regression */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
            <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-6 text-center">
              Scatter Diagram — AI Usage vs Academic Score
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="aiUsageScore" name="AI Usage Score" type="number" domain={[0, 6]} ticks={[1,2,3,4,5]} label={{ value: 'AI Usage (1=Never, 5=Daily)', position: 'bottom', offset: 0 }} />
                <YAxis dataKey="academicScore" name="Academic Score" domain={[0, 100]} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Students" data={SCATTER_DATA} fill="#7c7fff" />
                {/* Regression line */}
                <Line
                  data={REGRESSION_LINE_DATA}
                  type="linear"
                  dataKey="predicted"
                  stroke="#fa8c00"
                  strokeWidth={3}
                  dot={false}
                  name="Regression Line"
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-sm text-neutral-500 mt-6 text-center font-medium">
              <span className="inline-block w-4 h-1 bg-[#fa8c00] mr-2 align-middle"></span>
              Regression line showing the general trend
            </p>
          </div>

          {/* Correlation Result */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 text-xl font-black">
                r
              </div>
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">
                Correlation Finding
              </h3>
            </div>
            
            <div className="bg-white/60 dark:bg-neutral-900/60 rounded-xl p-4 border border-amber-200/50">
              {CORRELATION_R > 0 ? (
                <p className="font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  The Pearson correlation coefficient between AI usage and academic
                  performance is <strong className="text-amber-600 dark:text-amber-400 text-lg">r = {CORRELATION_R}</strong>.
                  <br/><br/>
                  {CORRELATION_R >= 0.5
                    ? <span className="text-amber-700 dark:text-amber-300 font-bold">This indicates a moderate to strong positive relationship — students who use AI tools more frequently tend to score higher.</span>
                    : <span className="text-neutral-600 dark:text-neutral-400">This indicates a weak positive relationship.</span>}
                </p>
              ) : (
                <p className="text-neutral-400 italic">[Correlation result will be filled after analysis]</p>
              )}
            </div>
          </div>
        </section>

        {/* Section 4 — What This Means */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-3 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <span className="text-blue-500">💡</span> What This Means for Students
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            These findings suggest that AI tools, when used appropriately, may support
            academic performance. However, students should focus on understanding
            concepts rather than relying entirely on AI-generated answers. Using AI
            as a learning aid — asking it to explain topics, generate practice problems,
            or check understanding — appears more beneficial than using it to complete
            assignments.
          </p>
        </section>

        {/* Section 5 — Conclusion */}
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span>✅</span> Conclusion & Recommendations
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
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
