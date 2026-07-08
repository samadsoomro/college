import { useParams, Link } from 'react-router-dom';
import { useCollege } from '@/contexts/CollegeContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter, ZAxis,
  ComposedChart, Line
} from 'recharts';
import {
  ArrowLeft, FlaskConical, BarChart3, Target, Link2,
  Users, Brain, BookOpen, TrendingUp, CheckCircle2,
  Lightbulb, ChevronRight, GraduationCap, Calendar,
  Award, PieChart as PieIcon, Scatter as ScatterIcon, Activity
} from 'lucide-react';

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

// Helper components
const StatCard = ({
  label, value, sub, icon: Icon, color = 'primary'
}: {
  label: string; value: string; sub?: string;
  icon: any; color?: string;
}) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${
      color === 'primary' ? 'bg-primary/10 text-primary' :
      color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
      color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    }`}>
      <Icon size={20} />
    </div>
    <p className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100">
      {value}
    </p>
    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mt-1">{label}</p>
    {sub && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{sub}</p>}
  </div>
);

const Section = ({ icon: Icon, title, children, className = '', iconColor = 'text-primary', bgColor = '' }: any) => (
  <section className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm ${bgColor || 'bg-white dark:bg-neutral-900'} ${className}`}>
    <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 ${iconColor}`}>
        <Icon size={16} />
      </div>
      <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{title}</h2>
    </div>
    <div className="p-6 md:p-8 space-y-4">
      {children}
    </div>
  </section>
);

const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 shadow-xl text-xs">
      {label && <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-medium">
          {p.name}: <strong>{p.value}{unit}</strong>
        </p>
      ))}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }: any) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
    <div className="px-6 pt-5 pb-2">
      <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base">{title}</h3>
      {subtitle && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{subtitle}</p>}
    </div>
    <div className="px-4 pb-5">
      {children}
    </div>
  </div>
);

const AIResearchStudy = () => {
  const { collegeSlug } = useParams();
  const { settings } = useCollege();
  const supervisor = settings?.myResearchSupervisor || 'Prof. Munaf & Prof. M. Waqqar Qadri';

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8 md:space-y-12">

        {/* Back button */}
        <Link to={`/${collegeSlug}/projects`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl hover:shadow-sm transition-all">
          <ArrowLeft size={16} /> Back to Projects
        </Link>

        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-2xl">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-40 h-40 border-2 border-white rounded-full" />
            <div className="absolute top-12 right-20 w-24 h-24 border border-white rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 border-2 border-white rounded-full" />
          </div>

          <div className="relative z-10 space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                <FlaskConical size={12} /> Live Research
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white/90 text-xs px-3 py-1.5 rounded-full">
                <BarChart3 size={12} /> Statistics Dept. — GCFMN
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white/90 text-xs px-3 py-1.5 rounded-full">
                <Calendar size={12} /> June 2026
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
              AI Tools & Academic Performance<br className="hidden md:block" />
              <span className="text-white/90"> Among All Groups Students</span>
            </h1>

            {/* Researcher info */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/20">
              <span className="inline-flex items-center gap-1.5 text-sm text-white/85">
                <Users size={14} />
                <strong>Abdul Samad</strong> — Class 12 (CS), Batch 2024–2026
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-white/85">
                <GraduationCap size={14} /> {supervisor}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Students Surveyed" value="50" sub="All groups"
            icon={Users} color="primary" />
          <StatCard label="Chi-Square (χ²)" value="15.15" sub="Test statistic"
            icon={TrendingUp} color="green" />
          <StatCard label="P-Value" value="0.004" sub="Highly significant"
            icon={Target} color="amber" />
          <StatCard label="Correlation (r)" value="0.50" sub="Moderate positive"
            icon={Activity} color="purple" />
        </div>

        {/* Section 1 — Why */}
        <Section icon={Target} title="Why We Did This Study">
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Artificial intelligence tools like ChatGPT, Gemini, and Copilot are rapidly
            changing how students study and complete academic tasks. We wanted to
            understand whether using these tools actually improves academic performance,
            or whether the relationship is more complex. This study focuses specifically
            on students from all subject groups at GCFM Nazimabad.
          </p>
        </Section>

        {/* Section 2 — Who We Asked */}
        <Section icon={Users} title="Who We Asked" iconColor="text-green-500">
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            We surveyed <strong className="text-neutral-800 dark:text-neutral-200">
            50 students</strong> from all subject groups at Govt. College for Men
            Nazimabad (GCFMN), Karachi. Students were from 11th and 12th class.
            The survey was voluntary and anonymous — no names were recorded.
            14 from Computer Science, 13 from Pre-Engineering, 12 from Pre-Medical,
            and 11 from Commerce.
          </p>
        </Section>

        {/* Section 3 — What We Found */}
        <Section icon={BarChart3} title="What We Found" iconColor="text-blue-500">
          
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="How Often Do Students Use AI Tools?"
              subtitle="Distribution across 50 surveyed students">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    {COLORS.map((color, i) => (
                      <radialGradient key={i} id={`pie-grad-${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie
                    data={AI_USAGE_DATA}
                    cx="50%" cy="50%"
                    outerRadius={100} innerRadius={55}
                    paddingAngle={4} dataKey="value"
                    strokeWidth={0}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {AI_USAGE_DATA.map((_, i) => (
                      <Cell key={i} fill={`url(#pie-grad-${i})`} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip unit=" students" />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Average Exam Score by AI Usage Frequency"
              subtitle="Students who use AI daily scored 22 marks higher than non-users">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PERFORMANCE_DATA} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  barCategoryGap="35%">
                  <defs>
                    <linearGradient id="bar-grad-0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="bar-grad-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fa8c00" stopOpacity={1} />
                      <stop offset="100%" stopColor="#fa8c00" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="bar-grad-2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="group" tick={{ fontSize: 13, fontWeight: 600 }}
                    axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Bar dataKey="avgScore" radius={[10, 10, 0, 0]} maxBarSize={80}>
                    {PERFORMANCE_DATA.map((_, i) => (
                      <Cell key={i} fill={`url(#bar-grad-${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Score labels below chart */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                {PERFORMANCE_DATA.map((d, i) => (
                  <div key={i} className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                    <p className="text-lg font-bold" style={{ color: COLORS[i] }}>{d.avgScore}%</p>
                    <p className="text-xs text-neutral-400">{d.group}</p>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Participants by College Group"
              subtitle="50 students surveyed across all 4 subject groups at GCFMN">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={GROUP_DATA} layout="vertical"
                  margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                  <defs>
                    {COLORS.map((color, i) => (
                      <linearGradient key={i} id={`hbar-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 18]}
                    tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="group"
                    tick={{ fontSize: 12 }} width={130}
                    axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip unit=" students" />} />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]} maxBarSize={32}
                    label={{ position: 'right', fontSize: 12, fontWeight: 700,
                      fill: '#64748b', formatter: (v: any) => `${v}` }}>
                    {GROUP_DATA.map((_, i) => (
                      <Cell key={i} fill={`url(#hbar-${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Chi-Square Result */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border-2 border-primary/20 dark:border-primary/30 rounded-2xl overflow-hidden mt-6">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-primary/15">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-black">
                χ²
              </div>
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Chi-Square Test Result</h3>
              <span className="ml-auto hidden sm:inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full font-semibold">
                <CheckCircle2 size={12} /> Statistically Significant
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 text-center border border-neutral-100 dark:border-neutral-700">
                  <p className="text-2xl font-black text-primary">15.15</p>
                  <p className="text-xs text-neutral-500 mt-1">χ² Value</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 text-center border border-neutral-100 dark:border-neutral-700">
                  <p className="text-2xl font-black text-green-600 dark:text-green-400">0.004</p>
                  <p className="text-xs text-neutral-500 mt-1">p-value</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 text-center border border-neutral-100 dark:border-neutral-700">
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">9.49</p>
                  <p className="text-xs text-neutral-500 mt-1">Critical Value</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                We tested whether AI usage and exam performance are related or just random across all student groups.
                Our chi-square value of <strong className="text-neutral-800 dark:text-neutral-200">15.15</strong> is
                well above the critical value of 9.49 at 5% significance level
                (p = <strong className="text-neutral-800 dark:text-neutral-200">0.004</strong>).
                This means the association is statistically significant. Students who use AI tools daily scored an
                average of <strong className="text-green-600 dark:text-green-400">74%</strong>, compared to just
                <strong className="text-red-500"> 52%</strong> for those who never use them — a difference of
                <strong className="text-primary"> 22 marks</strong>.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ChartCard title="Scatter Diagram — AI Usage vs Exam Score"
              subtitle="Bubble size = number of students at that point • Orange = regression line ŷ = 42.9 + 10.3x">
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
                  <defs>
                    <linearGradient id="scatter-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c7fff" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#7c7fff" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="x" type="number" name="AI Usage"
                    domain={[0.5, 3.5]} ticks={[1, 2, 3]}
                    tickFormatter={(v) => v === 1 ? 'Never' : v === 2 ? 'Sometimes' : v === 3 ? 'Daily' : ''}
                    tick={{ fontSize: 12, fontWeight: 600 }}
                    axisLine={false} tickLine={false}
                    label={{ value: 'AI Usage Frequency', position: 'insideBottom', offset: -25, fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    dataKey="y" type="number" name="Score"
                    domain={[25, 100]}
                    tick={{ fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    label={{ value: 'Exam Score (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
                  />
                  <ZAxis dataKey="z" range={[40, 600]} name="Students" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      if (!d) return null;
                      const label = d.x === 1 ? 'Never' : d.x === 2 ? 'Sometimes' : 'Daily';
                      return (
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 shadow-xl text-xs">
                          <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            AI Usage: {label}
                          </p>
                          <p className="text-neutral-600 dark:text-neutral-400">
                            Score: <strong>{d.y}%</strong>
                          </p>
                          <p className="text-neutral-600 dark:text-neutral-400">
                            Students: <strong>{d.z}</strong>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={SCATTER_DATA} fill="url(#scatter-grad)" stroke="#7c7fff" strokeWidth={1} />
                  <Line
                    data={REGRESSION_LINE}
                    type="monotone"
                    dataKey="y"
                    stroke="#fa8c00"
                    strokeWidth={2.5}
                    dot={false}
                    strokeDasharray="6 3"
                    legendType="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Regression table */}
              <div className="mt-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wide">
                  Regression Line Predictions: ŷ = 42.9 + 10.3x
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Never', x: 1, pred: '53.2%', color: 'text-red-500' },
                    { label: 'Sometimes', x: 2, pred: '63.5%', color: 'text-amber-500' },
                    { label: 'Daily', x: 3, pred: '73.8%', color: 'text-green-500' },
                  ].map(item => (
                    <div key={item.label} className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-100 dark:border-neutral-700">
                      <p className={`text-lg font-black ${item.color}`}>{item.pred}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Predicted ({item.label})</p>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Correlation Card — Enhanced */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-2xl overflow-hidden mt-6">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-100 dark:border-amber-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-black">
                r
              </div>
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Correlation Finding</h3>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-shrink-0 text-center bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-amber-100 dark:border-amber-800 min-w-[120px]">
                <p className="text-4xl font-black text-amber-600 dark:text-amber-400">0.50</p>
                <p className="text-xs text-neutral-500 mt-1">Pearson r</p>
                <div className="mt-3 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                    style={{ width: '50%' }} />
                </div>
                <p className="text-xs text-neutral-400 mt-1">Moderate</p>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                The correlation between AI usage frequency and exam scores is
                <strong className="text-neutral-800 dark:text-neutral-200"> r = 0.50</strong>.
                This is a <strong className="text-amber-600 dark:text-amber-400">moderate positive relationship</strong>.
                The regression equation <strong className="text-neutral-800 dark:text-neutral-200">ŷ = 42.9 + 10.3x</strong>
                tells us that each step up in AI usage frequency is associated with approximately
                <strong className="text-primary"> 10 marks higher score</strong> on average.
                This trend was consistent across CS, Pre-Engineering, Pre-Medical and Commerce groups.
              </p>
            </div>
          </div>
        </Section>

        {/* Section 4 — What This Means */}
        <Section icon={Lightbulb} title="What This Means for Students" iconColor="text-yellow-500">
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            These findings suggest that AI tools, when used appropriately, may support
            academic performance. However, students should focus on understanding
            concepts rather than relying entirely on AI-generated answers. Using AI
            as a learning aid — asking it to explain topics, generate practice problems,
            or check understanding — appears more beneficial than using it to complete
            assignments.
          </p>
        </Section>

        {/* Section 5 — Conclusion */}
        <Section icon={CheckCircle2} title="Conclusion & Recommendations"
          className="border-primary/30"
          bgColor="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            This study shows that AI tool usage and academic performance have a measurable
            relationship among students at GCFMN across all groups. We recommend that:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {[
              'Teachers guide students on how to use AI tools ethically and effectively',
              'Students use AI for understanding concepts, not just for copying answers',
              'The college considers an AI literacy session as part of orientation',
              'Further research with larger samples strengthens these findings',
            ].map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ChevronRight size={14} />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 pb-8">
          <FlaskConical size={12} />
          <span>Research conducted at GCFMN, Karachi • Statistics Department • June 2026</span>
        </div>

      </div>
    </div>
  );
};

export default AIResearchStudy;
