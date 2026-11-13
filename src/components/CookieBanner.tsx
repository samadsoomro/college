import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { useCollege } from '@/contexts/CollegeContext';

const STORAGE_KEY = 'cookie-consent-v1';
const EXPIRY_DAYS = 180;

type Consent = { choice: 'accepted' | 'rejected'; savedAt: number };

const readConsent = (): Consent | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: Consent = JSON.parse(raw);
    const ageDays = (Date.now() - parsed.savedAt) / 86400000;
    return ageDays > EXPIRY_DAYS ? null : parsed;
  } catch {
    return null;
  }
};

export const CookieBanner = () => {
  const { settings } = useCollege();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (readConsent()) return;
    // Show 1.2s after load so it never blocks first paint
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Allow reopening from footer link
  useEffect(() => {
    const open = () => { setShowDetails(false); setVisible(true); };
    window.addEventListener('open-cookie-settings', open);
    return () => window.removeEventListener('open-cookie-settings', open);
  }, []);

  const save = (choice: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, savedAt: Date.now() }));
    } catch { /* storage blocked, just close */ }
    setVisible(false);
  };

  if (!visible) return null;

  const name = settings?.instituteShortName || settings?.instituteFullName || 'this website';

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="print-hide fixed bottom-0 left-0 right-0 z-[110] p-3 md:p-4 pointer-events-none"
    >
      <div
        className="pointer-events-auto mx-auto max-w-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-4 md:p-5"
        style={{ animation: 'fadeInUp 0.5s ease forwards' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Cookie size={18} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-neutral-800 dark:text-neutral-100">
              We value your privacy
            </p>
            <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
              {name} uses essential browser storage to keep you signed in and remember
              your theme. We do not use advertising or tracking cookies.
              {' '}
              <button
                onClick={() => setShowDetails(v => !v)}
                className="text-primary font-semibold hover:underline"
              >
                {showDetails ? 'Hide details' : 'Learn more'}
              </button>
            </p>

            {showDetails && (
              <ul className="mt-3 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                <li><strong>Essential:</strong> login session and card-holder sign-in (required for the site to work)</li>
                <li><strong>Preferences:</strong> dark/light mode and your cookie choice</li>
                <li><strong>Analytics / Advertising:</strong> not used</li>
              </ul>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => save('accepted')}
                className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => save('rejected')}
                className="px-5 py-2 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                Reject non-essential
              </button>
            </div>
          </div>

          <button
            onClick={() => save('rejected')}
            aria-label="Close cookie notice"
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
