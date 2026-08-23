import { useParams, Link } from 'react-router-dom';
import { PrintButton } from '@/components/PrintButton';
import { useCollege } from '@/contexts/CollegeContext';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  BarChart, Cell, Scatter, ScatterChart
} from 'recharts';
import {
  ArrowLeft, FlaskConical, BarChart3, Target, TrendingUp,
  Calendar, Users, CheckCircle2, Lightbulb, BookOpen,
  Calculator, Clock, ChevronRight, Activity
} from 'lucide-react';

// ── Math block styles ─────────────────────────────
const mathBlockStyle: React.CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: '1.35rem',
  background: `repeating-linear-gradient(
    transparent, transparent 27px,
    #e8e8e8 27px, #e8e8e8 28px
  )`,
  borderLeft: '3px solid #c0392b',
  padding: '16px 20px',
  borderRadius: '8px',
  lineHeight: '1.9',
};

const boxedResultStyle: React.CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: '1.4rem',
  fontWeight: 600,
  border: '2px solid var(--primary, #1a56db)',
  borderRadius: '6px',
  padding: '10px 20px',
  display: 'inline-block',
  margin: '8px 0',
  background: 'rgba(255,255,255,0.9)',
};

// ── Data ─────────────────────────────────────────
const GROWTH_DATA = [
  { year: 1981, actual: 5.21 },
  { year: 1998, actual: 9.27 },
  { year: 2017, actual: 14.92 },
  { year: 2023, actual: 20.38 },
  { year: 2030, predicted: 25.60 },
  { year: 2040, predicted: 35.42 },
];

const COMPARISON_DATA = [
  { year: '1998', actual: 9.27, predicted: 9.05 },
  { year: '2017', actual: 14.92, predicted: 16.78 },
  { year: '2023', actual: 20.38, predicted: 20.38 },
];

const COLORS = ['#7c7fff', '#fa8c00'];

const StatCard = ({ label, value, sub, icon: Icon, color = 'primary' }: any) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${
      color === 'primary' ? 'bg-primary/10 text-primary' :
      color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
      color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    }`}>
      <Icon size={20} />
    </div>
    <p className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100">{value}</p>
    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mt-1">{label}</p>
    {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
  </div>
);

const Section = ({ icon: Icon, title, children, className = '', bgColor = '' }: any) => (
  <section className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm ${bgColor || 'bg-white dark:bg-neutral-900'} ${className}`}>
    <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
        <Icon size={16} />
      </div>
      <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{title}</h2>
    </div>
    <div className="p-6 md:p-8 space-y-4">
      {children}
    </div>
  </section>
);

const ChartCard = ({ title, subtitle, children }: any) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
    <div className="px-6 pt-5 pb-2">
      <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base">{title}</h3>
      {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
    </div>
    <div className="px-4 pb-5">{children}</div>
  </div>
);

const MathStep = ({ children }: { children: React.ReactNode }) => (
  <div style={mathBlockStyle} className="my-4 math-block">
    {children}
  </div>
);

const BoxedResult = ({ children }: { children: React.ReactNode }) => (
  <div style={boxedResultStyle} className="my-3">
    {children}
  </div>
);

const KarachiPopulationModel = () => {
  const { collegeSlug } = useParams();
  const { settings } = useCollege();

  return (
    <div className="research-print-content min-h-screen bg-neutral-50 dark:bg-neutral-950 text-foreground pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Back button — hidden on print */}
        <div className="flex items-center justify-between print-hide">
          <Link to={`/${collegeSlug}/projects`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl hover:shadow-sm transition-all">
            <ArrowLeft size={16} /> Back to Projects
          </Link>

          {/* Print Button */}
          <PrintButton label="Print Research (A4)" documentTitle="Karachi_Population_Model" />
        </div>

        {/* Print-only header (shows only when printing) */}
        <div className="print-only hidden">
          <div className="research-hero-print">
            <h1 style={{ color: 'white', fontSize: '16pt', fontWeight: 'bold', marginBottom: '6px' }}>
              Modeling and Predicting Population Growth of Karachi Using Differential Equations
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '10pt' }}>
              Abdul Samad & Muhammad Salman Bhatti — Class 12 (Mathematics), Batch 2024–2026
            </p>
            <p style={{ color: '#94a3b8', fontSize: '9pt', marginTop: '4px' }}>
              Supervised by: Prof. Nazeer Ahmed, Head of Mathematics Dept., GCFMN • Published: August 2026
            </p>
            <p style={{ color: '#94a3b8', fontSize: '9pt' }}>
              Mathematics Department — Govt. College for Men Nazimabad, Karachi
            </p>
          </div>
        </div>

        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-40 h-40 border-2 border-white rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 border-2 border-white rounded-full" />
          </div>
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                <FlaskConical size={12} /> Live Research
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white/90 text-xs px-3 py-1.5 rounded-full">
                <BarChart3 size={12} /> Mathematics Dept. — GCFMN
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white/90 text-xs px-3 py-1.5 rounded-full">
                <Calendar size={12} /> August 2026
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              Modeling and Predicting Population Growth of Karachi<br className="hidden md:block" />
              <span className="text-white/90"> Using Differential Equations</span>
            </h1>
            <div className="flex flex-wrap gap-4 pt-3 border-t border-white/20 text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} />
                <strong>Abdul Samad & Muhammad Salman Bhatti</strong> — Class 12 (Mathematics), Batch 2024–2026
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={14} /> Supervised by: Prof. Nazeer Ahmed, Head of Mathematics Dept., GCFMN
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Census Years Used" value="4" sub="1981–2023" icon={BookOpen} color="primary" />
          <StatCard label="Growth Rate (k)" value="0.0325/yr" sub="3.25% annual" icon={TrendingUp} color="green" />
          <StatCard label="Model Accuracy" value="97.6%" sub="1998 prediction" icon={Target} color="amber" />
          <StatCard label="Projected 2040" value="35.4M" sub="Population" icon={Activity} color="purple" />
        </div>

        {/* Section 1 — Why */}
        <Section icon={Target} title="Why We Did This Study" className="print-no-break">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Differential equations are one of the most powerful tools in mathematics. Rather than studying them only for examinations, this project applies the exponential growth model to real census data from Karachi — one of the world's largest cities — to understand how its population has grown and where it is heading. The same mathematical principles that model population growth are used in modern AI and machine learning prediction systems.
          </p>
        </Section>

        {/* Section 2 — Data */}
        <Section icon={BookOpen} title="Census Data Used" className="print-no-break">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Let <strong>t = 0</strong> correspond to year 1981. So <strong>P<sub>0</sub> = 5,208,132</strong> (base population).
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  {['Year', 'Population', 'Source'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-neutral-700 dark:text-neutral-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['1981', '5,208,132', 'Pakistan Census 1981'],
                  ['1998', '9,269,265', 'Pakistan Census 1998'],
                  ['2017', '14,916,456', 'Pakistan Census 2017'],
                  ['2023', '20,382,881', 'Pakistan Census 2023'],
                ].map(([year, pop, src], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50/50 dark:bg-neutral-800/50'}>
                    <td className="px-4 py-3 font-mono font-bold text-primary">{year}</td>
                    <td className="px-4 py-3 font-mono">{pop}</td>
                    <td className="px-4 py-3 text-neutral-500">{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Section 3 — Mathematical Model */}
        <Section icon={Calculator} title="The Mathematical Model" className="print-page-break print-no-break">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
            Since the rate of increase in population is proportional to the number of inhabitants:
          </p>
          <MathStep>
            <div>dP/dt = kP</div>
            <div className="mt-2">dP / <span style={{ textDecoration: 'line-through' }}>P</span>  =  k dt</div>
            <div className="mt-2">∫ dP/P  =  ∫ k dt</div>
            <div className="mt-2">ln|P|  =  kt + c</div>
            <div className="mt-2">e<sup>ln|P|</sup>  =  e<sup>kt + c</sup></div>
            <div className="mt-2">P  =  e<sup>kt</sup> · e<sup>c</sup></div>
          </MathStep>
          <BoxedResult>
            P  =  P<sub>0</sub> · e<sup>kt</sup>
          </BoxedResult>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            Where P<sub>0</sub> = e<sup>c</sup> = initial population
          </p>
        </Section>

        {/* Section 4 — Finding k */}
        <Section icon={Calculator} title="Finding the Growth Rate k" className="print-no-break">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Using 1981 as our base year (t = 0) and the 2023 census as our second point (t = 42):
          </p>
          <MathStep>
            <div>20,382,881  =  5,208,132 × e<sup>42k</sup></div>
            <div className="mt-2">e<sup>42k</sup>  =  20,382,881 ÷ 5,208,132</div>
            <div className="mt-2">e<sup>42k</sup>  =  3.9137</div>
            <div className="mt-2">42k  =  ln(3.9137)</div>
            <div className="mt-2">42k  =  1.3651</div>
            <div className="mt-2">k  =  1.3651 ÷ 42</div>
          </MathStep>
          <BoxedResult>
            k  =  0.0325  per year  (3.25% annual growth rate)
          </BoxedResult>
        </Section>

        {/* Section 5 — Doubling & Tripling */}
        <Section icon={Clock} title="Doubling and Tripling Time" className="print-no-break">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            A classic application of this model is finding how long it takes for the population to double or triple.
          </p>

          <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Doubling Time:</h3>
          <MathStep>
            <div>2<span style={{ textDecoration: 'line-through' }}>P<sub>0</sub></span>  =  <span style={{ textDecoration: 'line-through' }}>P<sub>0</sub></span> × e<sup>0.0325 × t</sup></div>
            <div className="mt-2">2  =  e<sup>0.0325 × t</sup></div>
            <div className="mt-2">ln(2)  =  0.0325t</div>
            <div className="mt-2">0.6931  =  0.0325t</div>
          </MathStep>
          <BoxedResult>
            t  =  21.3 years  —  Karachi doubles every ~21 years
          </BoxedResult>

          <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2 mt-6">Tripling Time:</h3>
          <MathStep>
            <div>3<span style={{ textDecoration: 'line-through' }}>P<sub>0</sub></span>  =  <span style={{ textDecoration: 'line-through' }}>P<sub>0</sub></span> × e<sup>0.0325 × t</sup></div>
            <div className="mt-2">3  =  e<sup>0.0325 × t</sup></div>
            <div className="mt-2">ln(3)  =  0.0325t</div>
            <div className="mt-2">1.0986  =  0.0325t</div>
          </MathStep>
          <BoxedResult>
            t  =  33.8 years  —  Population tripled by ~year 2015
          </BoxedResult>

          {/* Stat boxes */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-primary">21.3 yrs</p>
              <p className="text-sm text-neutral-500 mt-1">Doubles every</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">Year 2015</p>
              <p className="text-sm text-neutral-500 mt-1">Tripled by</p>
            </div>
          </div>
        </Section>

        {/* Section 6 — Verification */}
        <Section icon={CheckCircle2} title="Model Verification" className="print-no-break">
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  {['Year', 'Actual', 'Predicted', 'Accuracy'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-neutral-700 dark:text-neutral-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['1981', '5,208,132', '5,208,132', '100%', 'base', true],
                  ['1998', '9,269,265', '9,047,000', '97.6%', '', true],
                  ['2017', '14,916,456', '16,779,000', '88.9%*', '', false],
                  ['2023', '20,382,881', '20,382,881', '100%', 'used', true],
                ].map(([year, actual, pred, acc, note, good], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50/50 dark:bg-neutral-800/50'}>
                    <td className="px-4 py-3 font-mono font-bold text-primary">{year}</td>
                    <td className="px-4 py-3 font-mono">{actual}</td>
                    <td className="px-4 py-3 font-mono">{pred}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${good ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700'}`}>
                        {acc}
                      </span>
                      {note && <span className="ml-2 text-xs text-neutral-400">({note})</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-3 italic">
            *The 2017 deviation reflects a real slowdown in Karachi's growth rate between 2010–2017 due to urban migration changes — a single constant k cannot capture this variation.
          </p>
        </Section>

        {/* Section 7 — Predictions */}
        <Section icon={TrendingUp} title="Population Predictions" className="print-no-break">
          <MathStep>
            <div className="font-semibold text-neutral-600 dark:text-neutral-400 text-base mb-2" style={{ fontFamily: 'inherit' }}>2030 (t = 49):</div>
            <div>P(49)  =  5,208,132 × e<sup>0.0325 × 49</sup></div>
            <div className="mt-1">P(49)  =  5,208,132 × e<sup>1.5925</sup></div>
            <div className="mt-1">P(49)  =  5,208,132 × 4.9156</div>
          </MathStep>
          <BoxedResult>2030 → 25,597,000</BoxedResult>

          <MathStep>
            <div className="font-semibold text-neutral-600 dark:text-neutral-400 text-base mb-2" style={{ fontFamily: 'inherit' }}>2040 (t = 59):</div>
            <div>P(59)  =  5,208,132 × e<sup>0.0325 × 59</sup></div>
            <div className="mt-1">P(59)  =  5,208,132 × e<sup>1.9175</sup></div>
            <div className="mt-1">P(59)  =  5,208,132 × 6.8008</div>
          </MathStep>
          <BoxedResult>2040 → 35,424,000</BoxedResult>
        </Section>

        {/* Section 8 — Charts */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" /> Data Visualizations
          </h2>

          {/* Chart 1 — Main Growth Line */}
          <ChartCard title="Karachi Population Growth 1981–2040"
            subtitle="Solid blue = actual census data • Dashed orange = model prediction">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={GROWTH_DATA} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }}
                  label={{ value: 'Year', position: 'insideBottom', offset: -15, fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}M`}
                  label={{ value: 'Population (M)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}M`, '']} />
                <Legend verticalAlign="top" />
                <ReferenceLine x={2023} stroke="#94a3b8" strokeDasharray="4 4"
                  label={{ value: 'Last Census', position: 'top', fontSize: 10, fill: '#64748b' }} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#7c7fff"
                  strokeWidth={2.5} dot={{ r: 5, fill: '#7c7fff' }} connectNulls={false} />
                <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#fa8c00"
                  strokeWidth={2.5} strokeDasharray="6 3"
                  dot={{ r: 5, fill: '#fa8c00' }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 2 — Actual vs Predicted Bar */}
          <ChartCard title="Actual vs Model Prediction"
            subtitle="Side-by-side comparison at each census year (millions)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={COMPARISON_DATA} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v}M`} />
                <Tooltip formatter={(v: any) => [`${v}M`, '']} />
                <Legend />
                <Bar dataKey="actual" name="Actual" fill="#7c7fff" radius={[6, 6, 0, 0]} maxBarSize={50} />
                <Bar dataKey="predicted" name="Predicted" fill="#fa8c00" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Section 9 — Discussion */}
        <Section icon={Lightbulb} title="What This Means" className="print-no-break">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            The exponential model predicts 1998 population with 97.6% accuracy. The larger deviation in 2017 reflects a real-world slowdown in growth during 2010–2017. A more advanced logistic growth model would account for these changes by introducing a carrying capacity.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mt-3">
            The connection between this model and modern AI is direct. Machine learning algorithms used for population and economic forecasting are built on the same mathematical foundation explored here — understanding how and why a value changes over time.
          </p>
        </Section>

        {/* Section 10 — Conclusion */}
        <Section icon={CheckCircle2} title="Conclusion & Recommendations"
          bgColor="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5"
          className="border-primary/30 print-no-break">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            This study shows that the exponential differential equation model <strong className="text-neutral-800 dark:text-neutral-200">P = P<sub>0</sub>·e<sup>kt</sup></strong>, derived from the intermediate Mathematics syllabus, produces meaningful real-world predictions. Based on this model, Karachi is projected to reach <strong className="text-primary">25.6 million by 2030</strong> and <strong className="text-primary">35.4 million by 2040</strong>, assuming the current growth rate of 3.25% per year continues.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {[
              'City planners can use this model to anticipate infrastructure and housing needs',
              'Students should apply classroom mathematics to real-world data problems',
              'More advanced logistic models should be explored as a next step',
              'Similar models can be applied to other Pakistani cities for comparison',
            ].map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ChevronRight size={14} />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{rec}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Print Footer — shows only when printing */}
        <div className="print-footer hidden">
          <div style={{ marginBottom: '8px', fontWeight: 'bold', color: 'black' }}>
            Researcher Details: Abdul Samad & Muhammad Salman Bhatti — Class 12 (Mathematics), Batch 2024–2026
          </div>
          Govt. College for Men Nazimabad (GCFMN), Karachi • Mathematics Department • August 2026 •
          Live at: college-managment-system-coral.vercel.app/gcfm/projects/population-model
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 pb-8">
          <FlaskConical size={12} />
          <span>Research conducted at GCFMN, Karachi • Mathematics Department • August 2026</span>
        </div>

      </div>
    </div>
  );
};

export default KarachiPopulationModel;
