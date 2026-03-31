import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function Register() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    phone: '', role: 'visitor'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailDebounce, setEmailDebounce] = useState<any>(null);

  const checkEmail = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    try {
      const res = await fetch(`/api/${collegeSlug}/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setEmailStatus(data.available ? 'available' : 'taken');
    } catch {
      setEmailStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailStatus === 'taken') {
      setError('This email is already registered. Please use a different one.');
      return;
    }
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/${collegeSlug}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          classification: form.role
        })
      });
      const data = await res.json();
      if (res.ok) {
        // PERSTIST SESSION LOCALLY
        localStorage.setItem('userRole', data.role || 'user');
        localStorage.setItem('userEmail', data.email || form.email);
        localStorage.setItem('userName', data.name || form.fullName);
        localStorage.setItem('userId', data.userId || '');
        localStorage.setItem('collegeSlug', collegeSlug || '');
        localStorage.setItem('isAdmin', 'false');
        
        window.location.href = `/${collegeSlug}`;
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-24 pb-12 transition-colors duration-300">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
        <h1 className="text-2xl font-black text-foreground mb-1">Create Account</h1>
        <p className="text-muted-foreground text-sm mb-6">Register as Staff or Visitor</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground">Full Name *</label>
            <input type="text" required value={form.fullName}
              onChange={e => setForm({...form, fullName: e.target.value})}
              className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Your full name" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Email Address *</label>
            <input type="email" required value={form.email}
              onChange={e => {
                const val = e.target.value;
                setForm({...form, email: val});
                if (emailDebounce) clearTimeout(emailDebounce);
                setEmailDebounce(setTimeout(() => checkEmail(val), 600));
              }}
              className={`w-full mt-1 px-4 py-2 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                emailStatus === 'taken' ? 'border-red-400 focus:ring-red-300' :
                emailStatus === 'available' ? 'border-green-400 focus:ring-green-300' :
                'border-border focus:ring-primary'
              }`}
              placeholder="your@email.com" />
            {emailStatus === 'taken' && <p className="text-red-500 text-[10px] mt-1 font-bold">❌ Email already registered. Use a different email.</p>}
            {emailStatus === 'available' && <p className="text-green-600 text-[10px] mt-1 font-bold">✅ Email is available.</p>}
            {emailStatus === 'checking' && <p className="text-neutral-400 text-[10px] mt-1 italic">Checking availability...</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Password *</label>
            <input type="password" required value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Confirm Password *</label>
            <input type="password" required value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Repeat password" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Phone (optional)</label>
            <input type="tel" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="+92 300 0000000" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Role *</label>
            <select value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full mt-1 px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all">
              <option value="visitor">Visitor</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-900/50 space-y-2 shadow-sm animate-pulse-soft">
            <p className="font-bold flex items-center gap-2">
              <span className="text-lg">⚠️</span> ATTENTION STUDENTS
            </p>
            <p className="text-[13px] leading-relaxed italic opacity-90">
              Basic registration here provides generic access only. To get your <strong>Official College Card</strong> and <strong>ID-based Login</strong>, you MUST apply through the <Link to={`/${collegeSlug}/college-card`} className="underline decoration-2 underline-offset-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">College Card Application System</Link>.
            </p>
          </div>

          <button type="submit" disabled={loading || emailStatus === 'taken'}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>


        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to={`/${collegeSlug}/login`} className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
