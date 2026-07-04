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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Back button */}
        <Link to={`/${collegeSlug}/projects`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          ← Back to Projects
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-block bg-primary text-white text-xs px-4 py-1.5 rounded-full font-semibold">
            🔬 Live Research — Statistics & CS Dept.
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 dark:text-neutral-100 leading-tight">
            AI Tools & Academic Performance Among CS Students
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-neutral-500">
            <span>👤 Abdul Samad — Class 12 (CS), Batch 2024–2026</span>
            <span>🎓 {supervisor}</span>
            <span>📅 Published: June 2026</span>
          </div>
        </div>

        {/* Section 1 — Why */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-3">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
            🎯 Why We Did This Study
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Artificial intelligence tools like ChatGPT, Gemini, and Copilot are rapidly
            changing how students study and complete academic tasks. We wanted to
            understand whether using these tools actually improves academic performance,
            or whether the relationship is more complex. This study focuses specifically
            on Computer Science students in Karachi.
          </p>
        </section>

        {/* Section 2 — Who */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-3">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
            👥 Who We Asked
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            We surveyed <strong>{TOTAL_STUDENTS || '__'} students</strong> from the
            Computer Science group at GCFM Nazimabad, Karachi. All students were in
            11th or 12th class. Participation was voluntary and anonymous.
          </p>
        </section>

        {/* Section 3 — What We Found */}
        <section className="space-y-8">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
            📊 What We Found
          </h2>

          {/* Pie Chart — AI Usage Distribution */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              How Often Do Students Use AI Tools?
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={AI_USAGE_PIE_DATA} cx="50%" cy="50%"
                  outerRadius={100} dataKey="value" label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`}>
                  {AI_USAGE_PIE_DATA.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart — Performance by AI Usage Group */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              Average Academic Score by AI Usage Group
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={PERFORMANCE_BAR_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgGrade" fill="#7c7fff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chi-Square Result */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 space-y-2">
            <h3 className="font-semibold text-primary">
              Chi-Square Test Result
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              We ran a chi-square test to check if there is a real connection between
              how often students use AI and their academic grades.
              {CHI_SQUARE_VALUE > 0 ? (
                <> Our result (χ² = <strong>{CHI_SQUARE_VALUE}</strong>, p = <strong>{CHI_SQUARE_P_VALUE}</strong>)
                shows that {CHI_SQUARE_P_VALUE < 0.05
                  ? 'there IS a statistically significant relationship — the connection is real, not just by chance.'
                  : 'there is NO statistically significant relationship at the 5% level.'}</>
              ) : (
                <> [Chi-square result will be filled after analysis] </>
              )}
            </p>
          </div>

          {/* Scatter Chart + Regression */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              Scatter Diagram — AI Usage vs Academic Score
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="aiUsageScore" name="AI Usage Score" label={{ value: 'AI Usage (1=Never, 5=Daily)', position: 'insideBottom', offset: -5 }} />
                <YAxis dataKey="academicScore" name="Academic Score" domain={[0, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Students" data={SCATTER_DATA} fill="#7c7fff" />
                {/* Regression line */}
                <Line
                  data={REGRESSION_LINE_DATA}
                  type="linear"
                  dataKey="predicted"
                  stroke="#fa8c00"
                  strokeWidth={2}
                  dot={false}
                  name="Regression Line"
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-neutral-400 mt-2 text-center">
              Orange line = regression line showing the trend
            </p>
          </div>

          {/* Correlation Result */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl p-6 space-y-2">
            <h3 className="font-semibold text-amber-700 dark:text-amber-400">
              Correlation Finding
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              {CORRELATION_R > 0 ? (
                <>The Pearson correlation coefficient between AI usage and academic
                performance is <strong>r = {CORRELATION_R}</strong>.
                {CORRELATION_R >= 0.5
                  ? ' This indicates a moderate to strong positive relationship — students who use AI tools more frequently tend to score higher.'
                  : ' This indicates a weak positive relationship.'}
                </>
              ) : (
                '[Correlation result will be filled after analysis]'
              )}
            </p>
          </div>
        </section>

        {/* Section 4 — What This Means */}
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-3">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
            💡 What This Means for Students
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
        <section className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-bold text-primary">
            ✅ Conclusion & Recommendations
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Based on our analysis, we recommend that colleges consider integrating
            structured AI literacy into the CS curriculum. Students should be taught
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
