import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";

const Footer: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const currentYear = new Date().getFullYear();
  const { settings } = useCollege();
  const [govtCollegeLinks, setGovtCollegeLinks] = useState<any[]>([]);

  useEffect(() => {
    if (settings?.showGovtCollegesStrip) {
      fetch(`/api/${collegeSlug}/govt-college-links`)
        .then(r => r.json())
        .then(data => setGovtCollegeLinks(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [collegeSlug, settings?.showGovtCollegesStrip]);

  return (
    <footer className="bg-gradient-to-b from-slate-800 to-slate-900 text-white mt-auto">
      <div className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* About Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                {settings.instituteShortName}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {settings.footerDescription}
              </p>
              <div className="flex gap-3 pt-2">
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-accent hover:-translate-y-1 transition-all"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-accent hover:-translate-y-1 transition-all"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-accent hover:-translate-y-1 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-accent hover:-translate-y-1 transition-all"
                  aria-label="Youtube"
                >
                  <Youtube size={20} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  { to: `/${collegeSlug}`, label: "Home" },
                  { to: `/${collegeSlug}/books`, label: "Browse Books" },
                  { to: `/${collegeSlug}/notes`, label: "Study Materials" },
                  { to: `/${collegeSlug}/rare-books`, label: "Rare Books" },
                  { to: `/${collegeSlug}/about`, label: "About Us" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-white/80 hover:text-accent hover:translate-x-1 inline-block transition-all text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Office Hours & Resources */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Office Hours</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                {(settings?.officeHours || "Mon–Fri: 9:00 AM – 1:00 PM\nSat: 9:00 AM – 12:00 PM\nSun: Closed")
                  .split('\n')
                  .map(l => l.replace(/^\*\s*/, '').trim())
                  .filter(Boolean)
                  .map((line, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Clock size={14} className={line.toLowerCase().includes('closed') ? "text-muted-foreground" : "text-accent"} />
                      <span>{line.trim()}</span>
                    </li>
                  ))}
              </ul>

              <h4 className="text-lg font-semibold pt-4">Resources</h4>
              <ul className="space-y-2">
                {[
                  { to: `/${collegeSlug}/login`, label: "Student Login" },
                  { to: `/${collegeSlug}/register`, label: "Register" },
                  { to: `/${collegeSlug}/contact`, label: "Contact Us" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-white/80 hover:text-accent hover:translate-x-1 inline-block transition-all text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-white/80 text-sm">
                  <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{settings.contactAddress}</span>
                </li>
                <li className="flex items-center gap-3 text-white/80 text-sm">
                  <Phone size={18} className="flex-shrink-0" />
                  <span>{settings.contactPhone}</span>
                </li>
                <li className="flex items-center gap-3 text-white/80 text-sm">
                  <Mail size={18} className="flex-shrink-0" />
                  <span>{settings.contactEmail}</span>
                </li>
              </ul>

              <Link
                to={`/${collegeSlug}/contact`}
                className="inline-flex items-center gap-2 text-primary hover:text-white text-sm mt-2 transition-colors"
              >
                <ExternalLink size={14} />
                View on Google Maps
              </Link>
            </div>
          </div>

          {/* Maker Profile — GCFM only */}
          {collegeSlug === 'gcfm' && settings?.showMakerProfile && (
            <div className="border-t border-white/10 pt-8 mt-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-5">

                {/* Left — Project Badge */}
                <div className="flex-shrink-0 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">💻</span>
                </div>

                {/* Middle — Info */}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">
                    Student Development Project
                  </p>
                  <h4 className="text-white font-bold text-base leading-snug">
                    Built by the Computer Science Department
                  </h4>
                  <p className="text-white/70 text-sm mt-1">
                    Govt. College For Men Nazimabad (GCFMN), Karachi
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full">
                      👨💼 Prof. Ubedullah Anwar — Head of CS Dept.
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-primary/30 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                      👨💻 Abdul Samad — Class 12 (CS)
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-primary/30 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                      👨💻 Muhammad Salman Bhatti — Class 12 (CS)
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-2">Batch 2024–2026</p>
                </div>

                {/* Right — Links */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <a
                    href="https://govt-college-formen.vercel.app/projects"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors text-center"
                  >
                    🔬 View Research Projects
                  </a>
                  <a
                    href="https://github.com/samadsoomro/college"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors text-center"
                  >
                    💻 GitHub Repository
                  </a>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Credits Section — permanent gold color */}
      <div className="border-t border-white/10 py-6">
        <div className="container">
          <div className="text-center">
            {(settings?.creditsText || settings?.contributorsText) && (
              <div className="space-y-3">
                {settings?.creditsText && (
                  <div className="inline-block mb-1">
                    <p
                      style={{
                        color: '#FFD700',
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        padding: '2px 10px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}
                    >
                      {settings.creditsText}
                    </p>
                  </div>
                )}

                {settings?.contributorsText && (
                  <div className="block">
                    <p
                      style={{
                        color: '#FFD700',
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        padding: '2px 10px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}
                    >
                      Contributors: {settings.contributorsText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/70 text-sm text-center md:text-left">
              © {currentYear} {settings.instituteShortName}. All rights
              reserved.
            </p>
            <p className="text-white/70 text-sm text-center md:text-right">
              {settings.footerTagline}
            </p>
          </div>
        </div>
      </div>

      {/* Govt Colleges Scrolling Strip — all colleges with ON/OFF */}
      {settings?.showGovtCollegesStrip && govtCollegeLinks.length > 0 && (
        <div className="border-t border-white/10 pt-5 mt-2 pb-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest text-center mb-4">
            {settings?.govtCollegesStripHeading || 'Govt Colleges'}
          </p>
      
          {/* Scrolling strip */}
          <div className="overflow-hidden relative">
            <div
              className="flex gap-6 items-center"
              style={{
                animation: 'scrollStrip 20s linear infinite',
                width: 'max-content',
              }}
            >
              {/* Duplicate for seamless loop */}
              {[...govtCollegeLinks, ...govtCollegeLinks].map((college, i) => (
                <a
                  key={i}
                  href={college.website_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 transition-colors flex-shrink-0"
                >
                  {college.logo_url ? (
                    <img src={college.logo_url} alt={college.name}
                      className="h-7 w-7 rounded-full object-contain bg-white p-0.5" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                      {college.name?.charAt(0)}
                    </div>
                  )}
                  <span className="text-white/80 text-xs font-medium whitespace-nowrap">
                    {college.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
