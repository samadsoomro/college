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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 pt-20">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-black text-neutral-900 mb-1">Create Account</h1>
        <p className="text-neutral-500 text-sm mb-6">Register as Staff or Visitor</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-neutral-700">Full Name *</label>
            <input type="text" required value={form.fullName}
              onChange={e => setForm({...form, fullName: e.target.value})}
              className="w-full mt-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your full name" />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-700">Email Address *</label>
            <input type="email" required value={form.email}
              onChange={e => {
                const val = e.target.value;
                setForm({...form, email: val});
                if (emailDebounce) clearTimeout(emailDebounce);
                setEmailDebounce(setTimeout(() => checkEmail(val), 600));
              }}
              className={`w-full mt-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                emailStatus === 'taken' ? 'border-red-400 focus:ring-red-300' :
                emailStatus === 'available' ? 'border-green-400 focus:ring-green-300' :
                'border-neutral-200 focus:ring-primary'
              }`}
              placeholder="your@email.com" />
            {emailStatus === 'taken' && <p className="text-red-500 text-[10px] mt-1 font-bold">❌ Email already registered. Use a different email.</p>}
            {emailStatus === 'available' && <p className="text-green-600 text-[10px] mt-1 font-bold">✅ Email is available.</p>}
            {emailStatus === 'checking' && <p className="text-neutral-400 text-[10px] mt-1 italic">Checking availability...</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-700">Password *</label>
            <input type="password" required value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full mt-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-700">Confirm Password *</label>
            <input type="password" required value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})}
              className="w-full mt-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Repeat password" />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-700">Phone (optional)</label>
            <input type="tel" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full mt-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+92 300 0000000" />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-700">Role *</label>
            <select value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full mt-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="visitor">Visitor</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
          </div>

          <p className="text-xs text-neutral-400 bg-neutral-50 p-3 rounded-lg">
            📌 Students can also register here for basic access. For College Card access and Card ID login, apply through the <Link to={`/${collegeSlug}/library-card`} className="text-primary font-semibold">College Card menu</Link>.
          </p>

          <button type="submit" disabled={loading || emailStatus === 'taken'}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>


        <p className="text-center text-sm text-neutral-500 mt-4">
          Already have an account?{' '}
          <Link to={`/${collegeSlug}/login`} className="text-primary font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
