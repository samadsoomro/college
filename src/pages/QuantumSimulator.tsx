import { useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCollege } from '@/contexts/CollegeContext';
import { InlineMath, BlockMath } from 'react-katex';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ErrorBar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  ArrowLeft, Play, RotateCcw, FlaskConical, BarChart3,
  Calendar, Users, BookOpen, Shield, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, Download,
  Microscope, Calculator, FileText, Info
} from 'lucide-react';
import { runBB84, runMultipleSimulations } from '@/lib/bb84/simulator';
import { randomSeed } from '@/lib/bb84/random-generator';
import type { SimulationResult, ExperimentLog } from '@/lib/bb84/types';
import { PrintButton } from '@/components/PrintButton';

// ── Constants ─────────────────────────────────────────────
const QUBIT_PRESETS = [10, 100, 1000, 10000, 100000];
const SECURITY_THRESHOLD = 11;

// ── Sub-components ────────────────────────────────────────

const StatCard = ({ label, value, sub, icon: Icon, color = 'primary' }: any) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-center shadow-sm">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${
      color === 'primary' ? 'bg-primary/10 text-primary' :
      color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
      color === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
      color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    }`}>
      <Icon size={18} />
    </div>
    <p className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{value}</p>
    <p className="text-xs font-semibold text-neutral-500 mt-0.5">{label}</p>
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
    <div className="p-6 space-y-4">{children}</div>
  </section>
);

// ── Main Component ────────────────────────────────────────
const QuantumSimulator = () => {
  const { collegeSlug } = useParams();

  // Simulator state
  const [numQubits, setNumQubits] = useState(1000);
  const [customQubits, setCustomQubits] = useState('');
  const [evePct, setEvePct] = useState(30);
  const [noisePct, setNoisePct] = useState(2);
  const [seed, setSeed] = useState(randomSeed());
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [tablePage, setTablePage] = useState(0);
  const [activeTab, setActiveTab] = useState<'simulator'|'math'|'lab'|'report'|'log'|'glossary'|'about'>('simulator');
  const [logs, setLogs] = useState<ExperimentLog[]>([]);
  const [labData, setLabData] = useState<{evePct: number; meanQber: number; std: number}[]>([]);
  const [labRunning, setLabRunning] = useState(false);

  const TABLE_PAGE_SIZE = 50;

  const runSimulation = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const qubits = parseInt(customQubits) || numQubits;
      const res = runBB84(qubits, evePct / 100, noisePct / 100, seed);
      setResult(res);
      setTablePage(0);
      setRunning(false);

      // Log experiment
      const log: ExperimentLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        qubits,
        eveProbability: evePct,
        noise: noisePct,
        seed,
        qber: res.qber,
        siftedKeyLength: res.siftedKeyLength,
        detectionResult: res.securityStatus,
      };
      setLogs(prev => [log, ...prev].slice(0, 50));
    }, 50);
  }, [numQubits, customQubits, evePct, noisePct, seed]);

  const runLab = useCallback(async () => {
    setLabRunning(true);
    const qubits = parseInt(customQubits) || numQubits;
    const points: {evePct: number; meanQber: number; std: number}[] = [];

    for (let p = 0; p <= 100; p += 5) {
      const results = runMultipleSimulations(qubits, p / 100, noisePct / 100, 20, seed + p);
      const qbers = results.map(r => r.qber);
      const mean = qbers.reduce((a, b) => a + b, 0) / qbers.length;
      const variance = qbers.reduce((a, b) => a + (b - mean) ** 2, 0) / qbers.length;
      points.push({ evePct: p, meanQber: parseFloat(mean.toFixed(2)), std: parseFloat(Math.sqrt(variance).toFixed(2)) });
    }

    setLabData(points);
    setLabRunning(false);
  }, [numQubits, customQubits, noisePct, seed]);

  const exportCSV = () => {
    const header = 'timestamp,qubits,eve%,noise%,seed,qber,siftedKey,status';
    const rows = logs.map(l =>
      `${l.timestamp},${l.qubits},${l.eveProbability},${l.noise},${l.seed},${l.qber.toFixed(2)},${l.siftedKeyLength},${l.detectionResult}`
    ).join('\n');
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'bb84-experiments.csv'; a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'bb84-experiments.json'; a.click();
  };

  const securityColor = result
    ? result.securityStatus === 'SECURE' ? 'text-green-600 dark:text-green-400'
    : result.securityStatus === 'WARNING' ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'
    : '';

  const securityBg = result
    ? result.securityStatus === 'SECURE' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
    : result.securityStatus === 'WARNING' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    : '';

  const tabs = [
    { id: 'simulator', label: '⚛️ Simulator' },
    { id: 'math', label: '📐 Mathematics' },
    { id: 'lab', label: '🔬 Research Lab' },
    { id: 'report', label: '📋 Report' },
    { id: 'log', label: '📊 Experiment Log' },
    { id: 'glossary', label: '📖 Glossary' },
    { id: 'about', label: 'ℹ️ About' },
  ] as const;

  return (
    <div className="research-print-content min-h-screen bg-neutral-50 dark:bg-neutral-950 text-foreground pt-20 md:pt-24">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Back + Print */}
        <div className="flex items-center justify-between print-hide">
          <Link to={`/${collegeSlug}/projects`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl hover:shadow-sm transition-all">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <PrintButton label="Print Research (A4)" documentTitle="Quantum_Simulator_BB84" />
        </div>

        {/* Print-only header (shows only when printing) */}
        <div className="print-only hidden">
          <div className="research-hero-print">
            <h1 style={{ color: 'white', fontSize: '16pt', fontWeight: 'bold', marginBottom: '6px' }}>
              BB84 Quantum Cryptography Simulator
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11pt', marginBottom: '4px' }}>
              A classical computational simulation of the BB84 quantum key distribution (QKD) protocol.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '9pt', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
              <span>Researcher: Muhammad Salman Bhatti</span>
              <span>•</span>
              <span>Class 12 (CS), Batch 2024–2026</span>
              <span>•</span>
              <span>Supervised by: Muhammad Javed Akhtar</span>
              <span>•</span>
              <span>September 2026</span>
            </div>
          </div>
        </div>

        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-primary/80 to-slate-800 rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-48 h-48 border-2 border-white rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-56 h-56 border-2 border-white rounded-full" />
            <div className="absolute top-1/2 right-1/4 w-20 h-20 border border-white rounded-full" />
          </div>
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                <FlaskConical size={12} /> Live Research
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white/90 text-xs px-3 py-1.5 rounded-full">
                <Microscope size={12} /> Physics & CS Dept. — GCFMN
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white/90 text-xs px-3 py-1.5 rounded-full">
                <Calendar size={12} /> 2026
              </span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                BB84 Quantum Cryptography Simulator
              </h1>
              <p className="text-white/70 mt-2 text-base">
                Explore the mathematics, physics and security of quantum key distribution
              </p>
            </div>

            {/* Alice → Eve → Bob flow */}
            <div className="flex items-center gap-2 flex-wrap bg-white/10 rounded-2xl px-5 py-3">
              {['Alice', '──⟶', 'Quantum Channel', '──⟶', '👁 Eve (optional)', '──⟶', 'Bob'].map((item, i) => (
                <span key={i} className={`text-sm font-mono ${item.includes('Eve') ? 'text-amber-300' : item === '──⟶' ? 'text-white/40' : 'text-white font-bold'}`}>
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-3 border-t border-white/20 text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} />
                <strong>Muhammad Salman Bhatti</strong> - Class 12 (CS), Batch 2024–2026
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={14} /> Supervised by: Muhammad Javed Akhtar, Physics Dept., GCFMN
              </span>
            </div>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Protocol" value="BB84" sub="Bennett & Brassard 1984" icon={Shield} color="primary" />
          <StatCard label="States Used" value="4" sub="|0⟩ |1⟩ |+⟩ |-⟩" icon={Calculator} color="purple" />
          <StatCard label="Security Threshold" value="11%" sub="QBER limit" icon={AlertTriangle} color="amber" />
          <StatCard label="Simulation Type" value="Classical" sub="Not a quantum computer" icon={Info} color="green" />
        </div>

        {/* Scientific disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Scientific Note:</strong> This is a classical computational simulation of BB84 quantum measurement rules. It is not a real quantum computer and does not use actual qubits, superposition or entanglement. It models the statistical behaviour of the BB84 protocol.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2 print-hide">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary hover:text-primary'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: SIMULATOR ─────────────────────────────── */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <Section icon={Play} title="Simulation Controls">
              <div className="space-y-5">

                {/* Qubit count */}
                <div>
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
                    Number of Qubits
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {QUBIT_PRESETS.map(n => (
                      <button key={n} onClick={() => { setNumQubits(n); setCustomQubits(''); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all ${
                          numQubits === n && !customQubits
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-primary/10'
                        }`}>
                        {n.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input type="number" placeholder="Custom: e.g. 5000"
                    value={customQubits}
                    onChange={e => setCustomQubits(e.target.value)}
                    className="border rounded-xl px-4 py-2 text-sm w-48 focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:border-neutral-700" />
                </div>

                {/* Eve probability */}
                <div>
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Eve Interception Probability: <span className="text-primary font-mono">{evePct}%</span>
                  </label>
                  <input type="range" min={0} max={100} value={evePct}
                    onChange={e => setEvePct(Number(e.target.value))}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-xs text-neutral-400 mt-1">
                    <span>0% (No Eve)</span><span>50%</span><span>100% (Eve always intercepts)</span>
                  </div>
                </div>

                {/* Channel noise */}
                <div>
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Channel Noise: <span className="text-primary font-mono">{noisePct}%</span>
                  </label>
                  <input type="range" min={0} max={20} value={noisePct}
                    onChange={e => setNoisePct(Number(e.target.value))}
                    className="w-full accent-primary" />
                </div>

                {/* Seed */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Random Seed (for reproducibility)
                    </label>
                    <input type="number" value={seed}
                      onChange={e => setSeed(Number(e.target.value))}
                      className="border rounded-xl px-4 py-2 text-sm w-40 font-mono focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:border-neutral-700" />
                  </div>
                  <button onClick={() => setSeed(randomSeed())}
                    className="mt-5 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-sm hover:bg-neutral-200 transition-colors">
                    🎲 Random
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={runSimulation} disabled={running}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-60">
                    <Play size={16} /> {running ? 'Running...' : 'Run Simulation'}
                  </button>
                  <button onClick={() => { setResult(null); setEvePct(30); setNoisePct(2); setNumQubits(1000); setCustomQubits(''); setSeed(randomSeed()); }}
                    className="inline-flex items-center gap-2 px-5 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl font-semibold text-sm hover:border-primary transition-all">
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>
              </div>
            </Section>

            {/* Results */}
            {result && (
              <>
                {/* Security status banner */}
                <div className={`border-2 rounded-2xl p-5 flex items-center gap-4 ${securityBg}`}>
                  {result.securityStatus === 'SECURE'
                    ? <CheckCircle2 size={32} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                    : result.securityStatus === 'WARNING'
                    ? <AlertTriangle size={32} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    : <Shield size={32} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                  }
                  <div>
                    <p className={`font-black text-xl ${securityColor}`}>
                      {result.securityStatus === 'SECURE' ? '✅ Channel Secure'
                        : result.securityStatus === 'WARNING' ? '⚠️ Possible Interference Detected'
                        : '🚨 Channel Compromised'}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                      QBER = <strong>{result.qber.toFixed(2)}%</strong>
                      {result.securityStatus !== 'SECURE' && ` (above ${SECURITY_THRESHOLD}% threshold)`}
                      {' '}— Seed: <span className="font-mono">{result.seed}</span>
                    </p>
                  </div>
                </div>

                {/* Result stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Qubits" value={result.totalQubits.toLocaleString()} icon={BarChart3} color="primary" />
                  <StatCard label="Sifted Key Length" value={result.siftedKeyLength.toLocaleString()} sub="matching bases" icon={Shield} color="green" />
                  <StatCard label="Eve Intercepts" value={`${result.eveCount.toLocaleString()} (${result.evePercentage.toFixed(1)}%)`} icon={AlertTriangle} color="amber" />
                  <StatCard label="Bit Errors" value={result.bitErrors.toLocaleString()} sub={`QBER: ${result.qber.toFixed(2)}%`} icon={result.bitErrors > 0 ? AlertTriangle : CheckCircle2} color={result.bitErrors > 0 ? 'red' : 'green'} />
                </div>

                {/* QBER chart for this run */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-1">Simulation Parameters vs Outcomes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Eve Probability Set', value: `${evePct}%` },
                      { label: 'Channel Noise Set', value: `${noisePct}%` },
                      { label: 'QBER Result', value: `${result.qber.toFixed(2)}%` },
                      { label: 'Theoretical QBER', value: `≈ ${(0.25 * evePct).toFixed(1)}%`, note: 'ideal intercept-resend' },
                      { label: 'Basis Match Rate', value: `${((result.siftedKeyLength / result.totalQubits) * 100).toFixed(1)}%` },
                      { label: 'Key Efficiency', value: `${((result.siftedKeyLength / result.totalQubits) * 100).toFixed(1)}%` },
                    ].map((item, i) => (
                      <div key={i} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500">{item.label}</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-100 mt-1">{item.value}</p>
                        {item.note && <p className="text-xs text-neutral-400 mt-0.5">{item.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transmission Table */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setShowTable(!showTable)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="font-bold text-neutral-800 dark:text-neutral-100">
                      📊 Transmission Table ({result.events.length.toLocaleString()} events)
                    </span>
                    {showTable ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {showTable && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-neutral-50 dark:bg-neutral-800">
                          <tr>
                            {['#', 'Alice Bit', 'Alice Basis', 'State', 'Eve?', 'Eve Basis', 'Eve Bit', 'Bob Basis', 'Bob Bit', 'Sifted?', 'Error?'].map(h => (
                              <th key={h} className="px-3 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.events
                            .slice(tablePage * TABLE_PAGE_SIZE, (tablePage + 1) * TABLE_PAGE_SIZE)
                            .map((evt, i) => (
                              <tr key={i} className={`border-t border-neutral-100 dark:border-neutral-800 ${evt.error ? 'bg-red-50 dark:bg-red-900/20' : evt.sifted ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}>
                                <td className="px-3 py-1.5 font-mono text-neutral-400">{evt.index}</td>
                                <td className="px-3 py-1.5 font-mono font-bold">{evt.aliceBit}</td>
                                <td className="px-3 py-1.5 font-mono">{evt.aliceBasis}</td>
                                <td className="px-3 py-1.5 font-mono">{evt.state}</td>
                                <td className="px-3 py-1.5">{evt.eveIntercepted ? '👁 Yes' : '—'}</td>
                                <td className="px-3 py-1.5 font-mono">{evt.eveBasis || '—'}</td>
                                <td className="px-3 py-1.5 font-mono">{evt.eveBit ?? '—'}</td>
                                <td className="px-3 py-1.5 font-mono">{evt.bobBasis}</td>
                                <td className="px-3 py-1.5 font-mono font-bold">{evt.bobBit}</td>
                                <td className="px-3 py-1.5">{evt.sifted ? '✅' : '—'}</td>
                                <td className="px-3 py-1.5">{evt.error ? '❌' : '—'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs text-neutral-400">
                          Showing {tablePage * TABLE_PAGE_SIZE + 1}–{Math.min((tablePage + 1) * TABLE_PAGE_SIZE, result.events.length)} of {result.events.length}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => setTablePage(p => Math.max(0, p - 1))} disabled={tablePage === 0}
                            className="px-3 py-1 rounded-lg text-xs border disabled:opacity-40 hover:bg-neutral-50">← Prev</button>
                          <button onClick={() => setTablePage(p => Math.min(Math.ceil(result.events.length / TABLE_PAGE_SIZE) - 1, p + 1))}
                            disabled={(tablePage + 1) * TABLE_PAGE_SIZE >= result.events.length}
                            className="px-3 py-1 rounded-lg text-xs border disabled:opacity-40 hover:bg-neutral-50">Next →</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: MATHEMATICS ───────────────────────────── */}
        {activeTab === 'math' && (
          <div className="space-y-6">
            <Section icon={Calculator} title="Quantum States and Measurement">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                A qubit is the quantum equivalent of a classical bit. Unlike a classical bit (0 or 1), a qubit can exist in a superposition of both states simultaneously.
              </p>

              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-700 dark:text-neutral-300">General Qubit State:</h3>
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-5 text-center">
                  <BlockMath math={String.raw`|\psi\rangle = \alpha|0\rangle + \beta|1\rangle`} />
                  <p className="text-sm text-neutral-500 mt-2">where <InlineMath math={String.raw`|\alpha|^2 + |\beta|^2 = 1`} /></p>
                </div>

                <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mt-4">BB84 States — Two Bases:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="font-bold text-primary text-sm mb-2">Z-Basis (Rectilinear)</p>
                    <div className="text-center space-y-1">
                      <BlockMath math={String.raw`|0\rangle = \begin{pmatrix} 1 \\ 0 \end{pmatrix}`} />
                      <BlockMath math={String.raw`|1\rangle = \begin{pmatrix} 0 \\ 1 \end{pmatrix}`} />
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <p className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-2">X-Basis (Diagonal)</p>
                    <div className="text-center space-y-1">
                      <BlockMath math={String.raw`|+\rangle = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 \\ 1 \end{pmatrix}`} />
                      <BlockMath math={String.raw`|-\rangle = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 \\ -1 \end{pmatrix}`} />
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mt-4">Hadamard Transform:</h3>
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-5">
                  <BlockMath math={String.raw`H = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}`} />
                  <p className="text-sm text-neutral-500 text-center mt-2">
                    Applying H converts between Z and X basis: <InlineMath math={String.raw`H|0\rangle = |+\rangle`} />, <InlineMath math={String.raw`H|1\rangle = |-\rangle`} />
                  </p>
                </div>

                <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mt-4">Wrong Basis Measurement (50/50 rule):</h3>
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-5">
                  <BlockMath math={String.raw`P(\text{error} | \text{wrong basis}) = \frac{1}{2}`} />
                  <p className="text-sm text-neutral-500 text-center mt-2">
                    When Eve measures in the wrong basis, she gets a random result and introduces errors.
                  </p>
                </div>

                <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mt-4">Expected QBER from Eve:</h3>
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-5">
                  <BlockMath math={String.raw`QBER \approx \frac{p_e}{4}`} />
                  <p className="text-sm text-neutral-500 text-center mt-2">
                    where <InlineMath math="p_e" /> is Eve's interception probability. At 100% interception, expected QBER ≈ 25%.
                  </p>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ── TAB: RESEARCH LAB ──────────────────────────── */}
        {activeTab === 'lab' && (
          <div className="space-y-6">
            <Section icon={FlaskConical} title="Research Lab — Eve Probability vs QBER">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Runs 20 simulations for each Eve probability from 0% to 100% in steps of 5%. Plots mean QBER with standard deviation and compares to theoretical prediction.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 block mb-1">Qubits per run:</label>
                  <select value={numQubits} onChange={e => setNumQubits(Number(e.target.value))}
                    className="border rounded-xl px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700">
                    {QUBIT_PRESETS.map(n => <option key={n} value={n}>{n.toLocaleString()}</option>)}
                  </select>
                </div>
                <button onClick={runLab} disabled={labRunning}
                  className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-60">
                  <FlaskConical size={16} /> {labRunning ? 'Running Lab...' : 'Run Research Lab'}
                </button>
              </div>

              {labData.length > 0 && (
                <>
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-4">
                      Eve Interception Probability vs Mean QBER
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={labData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="evePct" label={{ value: 'Eve Probability (%)', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                        <YAxis label={{ value: 'Mean QBER (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                        <Tooltip formatter={(v: any, name: string) => [`${Number(v).toFixed(2)}%`, name]} />
                        <Legend verticalAlign="top" />
                        <Line type="monotone" dataKey="meanQber" name="Simulated QBER" stroke="#7c7fff" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="evePct" name="Theoretical (p/4)"
                          stroke="#fa8c00" strokeWidth={2} strokeDasharray="5 3"
                          data={labData.map(d => ({ evePct: d.evePct, evePct_line: d.evePct * 0.25 }))}
                          dataKey="evePct_line" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                          {['Eve %', 'Mean QBER %', 'Std Dev', 'Theoretical QBER', 'Security'].map(h => (
                            <th key={h} className="px-4 py-2 text-left font-semibold text-neutral-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {labData.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50/50 dark:bg-neutral-800/50'}>
                            <td className="px-4 py-2 font-mono font-bold text-primary">{row.evePct}%</td>
                            <td className="px-4 py-2 font-mono">{row.meanQber.toFixed(2)}%</td>
                            <td className="px-4 py-2 font-mono">±{row.std.toFixed(2)}%</td>
                            <td className="px-4 py-2 font-mono text-amber-600">{(row.evePct * 0.25).toFixed(2)}%</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                row.meanQber > 20 ? 'bg-red-100 text-red-700' :
                                row.meanQber > 11 ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {row.meanQber > 20 ? 'COMPROMISED' : row.meanQber > 11 ? 'WARNING' : 'SECURE'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Section>
          </div>
        )}

        {/* ── TAB: REPORT ────────────────────────────────── */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            {[
              {
                title: 'Abstract',
                content: 'This paper presents a classical computational simulation of the BB84 quantum key distribution (QKD) protocol. The simulation models Alice, Eve and Bob interactions, sifting, and QBER calculation to investigate how eavesdropping probability affects channel security. Results confirm the theoretical prediction that QBER ≈ 0.25 × p for intercept-resend attacks, with values above 11% indicating possible compromise.'
              },
              {
                title: 'Research Question',
                content: 'How does the probability of eavesdropping affect the Quantum Bit Error Rate (QBER) and the security of the BB84 quantum key distribution protocol?'
              },
              {
                title: 'Hypothesis',
                content: 'We hypothesise that QBER increases proportionally with Eve\'s interception probability, following the theoretical relation QBER ≈ p/4 for an ideal intercept-resend attack, where p is the probability that Eve intercepts each qubit.'
              },
              {
                title: 'Methodology',
                content: 'A classical simulation engine was developed in TypeScript implementing the BB84 protocol. For each qubit: Alice generates a random bit and basis; Eve intercepts with configurable probability and measures in a random basis; channel noise is applied; Bob measures in a random basis. Sifting retains only qubits where Alice and Bob used the same basis. QBER is computed as the fraction of sifted bits in error. 20 simulations per Eve probability were run for statistical analysis.'
              },
              {
                title: 'Key Results',
                content: 'At 0% Eve interception (no noise): QBER ≈ 0%. At 100% Eve interception (no noise): QBER ≈ 25%, consistent with theory. QBER increases approximately linearly with Eve probability. The 11% threshold provides reasonable detection sensitivity. Channel noise independently contributes to QBER additively.'
              },
              {
                title: 'Discussion',
                content: 'The simulation confirms that the BB84 protocol provides information-theoretic security through the no-cloning theorem and measurement disturbance. An eavesdropper cannot measure qubits without introducing detectable errors. The 11% QBER threshold is a practical limit — real systems must also account for hardware noise. The classical simulation correctly models the statistical rules of quantum measurement without requiring actual quantum hardware.'
              },
              {
                title: 'Conclusion',
                content: 'The BB84 protocol provides a mathematically provable method for detecting eavesdropping. Our simulation confirms the theoretical QBER ≈ p/4 relationship. For practical QKD systems, any QBER above the agreed threshold should trigger key rejection and protocol restart.'
              },
              {
                title: 'Limitations',
                content: 'This is a classical computational simulation only — it does not use real qubits, superposition or entanglement. Actual quantum implementations involve photon polarisation, detector efficiency limits, and hardware noise profiles not modelled here. The 11% threshold shown is educational and not a universal standard. The simulation assumes a simple intercept-resend attack; more sophisticated quantum attacks are not modelled.'
              },
              {
                title: 'Future Work',
                content: 'Extend simulation to model Ekert91 and E91 protocols. Implement privacy amplification and error correction steps. Model photon loss and detector dark counts. Compare with IBM Quantum real device results. Investigate continuous-variable QKD protocols.'
              },
            ].map((section, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                <h3 className="font-bold text-primary mb-3">{section.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{section.content}</p>
              </div>
            ))}

            {/* References */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
              <h3 className="font-bold text-primary mb-3">References</h3>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li>Bennett, C.H. and Brassard, G. (1984) 'Quantum cryptography: Public key distribution and coin tossing', <em>Proceedings of IEEE International Conference on Computers, Systems and Signal Processing</em>, pp. 175–179.</li>
                <li>IBM Quantum Learning. (2024) <em>Introduction to Quantum Computing</em>. Available at: https://learning.quantum.ibm.com</li>
                <li>NIST. (2024) <em>Quantum Information Science Resources</em>. Available at: https://www.nist.gov/quantum-information-science</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── TAB: EXPERIMENT LOG ────────────────────────── */}
        {activeTab === 'log' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100">
                Experiment Log ({logs.length} entries)
              </h3>
              {logs.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={exportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm hover:bg-neutral-200 transition-colors">
                    <Download size={14} /> CSV
                  </button>
                  <button onClick={exportJSON}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm hover:bg-neutral-200 transition-colors">
                    <Download size={14} /> JSON
                  </button>
                </div>
              )}
            </div>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl">
                No experiments yet. Run a simulation to populate the log.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      {['Time', 'Qubits', 'Eve%', 'Noise%', 'Seed', 'QBER', 'Sifted Key', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id} className={i % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50/50 dark:bg-neutral-800/50'}>
                        <td className="px-4 py-2 text-xs text-neutral-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="px-4 py-2 font-mono">{log.qubits.toLocaleString()}</td>
                        <td className="px-4 py-2 font-mono">{log.eveProbability}%</td>
                        <td className="px-4 py-2 font-mono">{log.noise}%</td>
                        <td className="px-4 py-2 font-mono text-xs">{log.seed}</td>
                        <td className="px-4 py-2 font-mono font-bold text-primary">{log.qber.toFixed(2)}%</td>
                        <td className="px-4 py-2 font-mono">{log.siftedKeyLength.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            log.detectionResult === 'SECURE' ? 'bg-green-100 text-green-700' :
                            log.detectionResult === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{log.detectionResult}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: GLOSSARY ──────────────────────────────── */}
        {activeTab === 'glossary' && (
          <Section icon={BookOpen} title="Glossary of Terms">
            <div className="space-y-3">
              {[
                { term: 'Qubit', def: 'Quantum bit — the basic unit of quantum information. Unlike a classical bit, a qubit can exist in a superposition of 0 and 1 simultaneously until measured.' },
                { term: 'Superposition', def: 'A qubit property allowing it to be in a combination of |0⟩ and |1⟩ states at the same time, described by |ψ⟩ = α|0⟩ + β|1⟩.' },
                { term: 'Basis', def: 'The framework in which a qubit is measured. BB84 uses the Z-basis (rectilinear: |0⟩, |1⟩) and X-basis (diagonal: |+⟩, |-⟩).' },
                { term: 'Measurement', def: 'Observing a qubit collapses its superposition to a definite value (0 or 1). Measuring in the wrong basis gives a random result 50% of the time.' },
                { term: 'BB84', def: 'The first quantum key distribution protocol, proposed by Bennett and Brassard in 1984. It uses four quantum states in two bases to distribute cryptographic keys securely.' },
                { term: 'QKD', def: 'Quantum Key Distribution — a method of securely distributing cryptographic keys using the principles of quantum mechanics.' },
                { term: 'QBER', def: 'Quantum Bit Error Rate — the fraction of sifted key bits that differ between Alice and Bob. High QBER indicates eavesdropping or noise.' },
                { term: 'Sifting', def: 'The process after transmission where Alice and Bob publicly compare which basis they used for each qubit and keep only the bits where they matched.' },
                { term: 'Eavesdropping', def: 'An attempt by a third party (Eve) to intercept and read the quantum key. In BB84, eavesdropping introduces detectable errors due to quantum mechanics.' },
                { term: 'No-Cloning Theorem', def: 'A fundamental quantum principle stating that it is impossible to create an identical copy of an unknown quantum state. This prevents Eve from copying qubits undetected.' },
                { term: 'Hadamard Gate', def: 'A quantum operation that converts between Z and X basis states: H|0⟩ = |+⟩, H|1⟩ = |-⟩. Described by the Hadamard matrix.' },
                { term: 'Classical Simulation', def: 'Modelling quantum behaviour using classical computing by applying the probabilistic rules of quantum measurement. Not a real quantum computer.' },
              ].map(({ term, def }) => (
                <div key={term} className="flex gap-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <span className="font-bold text-primary text-sm min-w-[140px] flex-shrink-0">{term}</span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{def}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── TAB: ABOUT ─────────────────────────────────── */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <Section icon={Info} title="About This Research">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg border-b border-neutral-100 dark:border-neutral-800 pb-2">Conclusion & Recommendations</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    This classical simulation of the BB84 Quantum Key Distribution protocol demonstrates that quantum cryptography provides unconditional security guaranteed by the laws of quantum mechanics. As eavesdropping directly increases the Quantum Bit Error Rate (QBER), Alice and Bob can definitively detect interception when QBER exceeds the security threshold (typically 11%). 
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    <strong>Recommendations:</strong> Future iterations of this project can explore simulating photon loss, dark counts in avalanche photodiodes, and implementing error correction (Cascade protocol) and privacy amplification to distill the final secret key.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Type', value: 'Computational Investigation' },
                    { label: 'Protocol', value: 'BB84 (Bennett-Brassard 1984)' },
                    { label: 'Department', value: 'Physics & CS, GCFMN' },
                    { label: 'Simulation', value: 'Classical (not quantum hardware)' },
                    { label: 'Published', value: '2026' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-400">{label}</p>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <PrintButton label="Download Research Report (A4)" />
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* Print Footer */}
        <div className="print-footer hidden">
          Govt. College for Men Nazimabad (GCFMN), Karachi • Physics & CS Department • 2026 •
          Live at: govt-college-formen.vercel.app/projects/quantum-simulator
        </div>

      </div>
    </div>
  );
};

export default QuantumSimulator;
