import React, { createContext, useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CollegeNotFound from "@/components/CollegeNotFound";

interface SiteSettings {
  id: string;
  primaryColor: string;
  navbarLogo: string | null;
  loadingLogo: string | null;
  instituteShortName: string;
  instituteFullName: string;
  footerTitle: string;
  footerDescription: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  creditsText: string;
  contributorsText: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  mapEmbedUrl: string;
  googleMapLink: string;
  footerTagline: string;
  // Hero Background
  heroBackgroundLogo: string | null;
  heroBackgroundOpacity: number;
  // College Card Layout
  cardHeaderText: string;
  cardSubheaderText: string;
  cardLogoUrl: string | null;
  cardQrEnabled: boolean;
  cardQrUrl: string;
  cardTermsText: string;
  cardContactAddress: string;
  cardContactEmail: string;
  cardContactPhone: string;
  // Rare Book Preview
  rbWatermarkText: string;
  rbWatermarkOpacity: number;
  rbDisclaimerText: string;
  rbWatermarkEnabled: boolean;
  // Donation Details
  easypaisaNumber: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string;
  accountTitle: string;
  updatedAt: string;
  storageBucket?: string;
}

interface College {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  themeColor: string;
  isActive: boolean;
}

interface CollegeContextType {
  college: College | null;
  collegeId: string | null;
  collegeSlug: string | null;
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  id: "00000000-0000-0000-0000-000000000000",
  primaryColor: "#006600",
  navbarLogo: null,
  loadingLogo: null,
  instituteShortName: "COL",
  instituteFullName: "College",
  footerTitle: "",
  footerDescription: "",
  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  creditsText: "",
  contributorsText: "",
  contactAddress: "",
  contactPhone: "",
  contactEmail: "",
  mapEmbedUrl: "",
  googleMapLink: "",
  footerTagline: "",
  heroBackgroundLogo: null,
  heroBackgroundOpacity: 0.35,
  cardHeaderText: "",
  cardSubheaderText: "",
  cardLogoUrl: null,
  cardQrEnabled: true,
  cardQrUrl: "",
  cardTermsText: "",
  cardContactAddress: "",
  cardContactEmail: "",
  cardContactPhone: "",
  rbWatermarkText: "",
  rbWatermarkOpacity: 0.1,
  rbDisclaimerText: "",
  rbWatermarkEnabled: true,
  easypaisaNumber: "",
  bankAccountNumber: "",
  bankName: "",
  bankBranch: "",
  accountTitle: "",
  updatedAt: new Date().toISOString(),
  storageBucket: "colleges",
};

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export const useCollege = () => {
  const context = useContext(CollegeContext);
  if (!context) {
    throw new Error("useCollege must be used within a CollegeProvider");
  }
  return context;
};

// Re-export useBranding for compatibility during migration if needed
export const useBranding = useCollege;

const hexToHslComponents = (hex: string) => {
  const cleanHex = hex.replace(/^#/, "");
  const rHex = cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2);
  const gHex = cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4);
  const bHex = cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6);

  let r = parseInt(rHex, 16) / 255;
  let g = parseInt(gHex, 16) / 255;
  let b = parseInt(bHex, 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { 
    h: Math.round(h * 360), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  };
};

function applyCacheBuster(settings: SiteSettings): SiteSettings {
  const ts = Date.now();
  const bustered = { ...settings };
  const keys: (keyof SiteSettings)[] = ["navbarLogo", "loadingLogo", "heroBackgroundLogo", "cardLogoUrl"];
  keys.forEach(key => {
    if (bustered[key] && typeof bustered[key] === "string") {
      const url = bustered[key] as string;
      (bustered as any)[key] = (url.split("?")[0] + `?t=${ts}`);
    }
  });
  return bustered;
}

const snakeToCamel = (str: string) => str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));

const mapSettingsData = (raw: any): SiteSettings => {
  const mapped: any = { ...defaultSettings };
  Object.keys(raw).forEach(key => {
    const camelKey = snakeToCamel(key);
    // Only overwrite if API provides a non-null value to avoid resetting to defaults unintentionally
    if (raw[key] !== null && raw[key] !== undefined && raw[key] !== "") {
      mapped[camelKey] = raw[key];
    }
  });
  // Ensure Booleans are correctly cast
  if (raw.card_qr_enabled !== undefined) mapped.cardQrEnabled = !!raw.card_qr_enabled;
  if (raw.rb_watermark_enabled !== undefined) mapped.rbWatermarkEnabled = !!raw.rb_watermark_enabled;
  
  return mapped as SiteSettings;
};

export const CollegeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [college, setCollege] = useState<College | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const updateGlobalStyles = (primaryColor: string) => {
    if (!primaryColor) return;
    const { h, s, l } = hexToHslComponents(primaryColor);
    
    const hsl = `${h} ${s}% ${l}%`;
    const lightHsl = `${h} ${s}% ${Math.min(l + 10, 95)}%`;
    const lighterHsl = `${h} ${s}% ${Math.min(l + 20, 98)}%`;
    const darkHsl = `${h} ${s}% ${Math.max(l - 10, 5)}%`;
    const darkestHsl = `${h} ${s}% ${Math.max(l - 20, 2)}%`;

    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    
    // Update Pakistan Green variants which many components use hardcoded
    root.style.setProperty("--pakistan-green", hsl);
    root.style.setProperty("--pakistan-green-light", lightHsl);
    root.style.setProperty("--pakistan-green-lighter", lighterHsl);
    root.style.setProperty("--pakistan-green-dark", darkHsl);
    root.style.setProperty("--pakistan-green-darkest", darkestHsl);

    // Update sidebar variables if they exist
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-ring", hsl);
    
    // Add accent support (usually a slightly different shade)
    root.style.setProperty("--accent", darkHsl);
  };

  const fetchCollegeAndSettings = async () => {
    if (!collegeSlug) return;
    setLoading(true);
    const lowSlug = collegeSlug.toLowerCase();
    try {
    // 1. Fetch College Metadata (Case-insensitive via API)
    const ts = Date.now();
    const collegeRes = await fetch(`/api/colleges/${lowSlug}?t=${ts}`);
      if (!collegeRes.ok) throw new Error("College not found");
      const collegeData = await collegeRes.json();
      setCollege(collegeData);
      
      // Update theme color if defined in college metadata (base theme)
      if (collegeData.themeColor) {
        updateGlobalStyles(collegeData.themeColor);
      }

      // 2. Fetch specific site settings for this college
      const settingsRes = await fetch(`/api/${lowSlug}/settings?t=${ts}`);
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData && settingsData.id) {
          // Map snake_case from DB to camelCase for the frontend
          const mappedSettings = mapSettingsData(settingsData);
          const bustered = applyCacheBuster(mappedSettings);
          setSettings(bustered);
          
          // Sync with index.html hydration script
          try {
            localStorage.setItem('gcfm-full-settings', JSON.stringify(bustered));
          } catch (e) {}

          // Prefer color from settings if it exists
          if (bustered.primaryColor) {
            updateGlobalStyles(bustered.primaryColor);
          }
        }
      }
    } catch (err) {
      console.error("[CollegeContext] Error:", err);
      setCollege(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeAndSettings();
  }, [collegeSlug]);

  useEffect(() => {
    const handler = () => fetchCollegeAndSettings();
    window.addEventListener('college-settings-updated', handler);
    return () => window.removeEventListener('college-settings-updated', handler);
  }, []);

  useEffect(() => {
    if (settings.instituteFullName) {
      document.title = settings.instituteFullName;
    }
    if (settings.navbarLogo) {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = settings.navbarLogo;
      document.getElementsByTagName("head")[0].appendChild(link);
    }
  }, [settings.instituteFullName, settings.navbarLogo]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/settings`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": "gcfm-admin-token-2026"
        },
        body: JSON.stringify(newSettings),
        credentials: "include"
      });

      if (!res.ok) {
        const error = await res.json();
        const message = error.detail ? `${error.error}: ${error.detail}` : (error.error || "Failed to update settings");
        throw new Error(message);
      }

      const updated = await res.json();
      const bustered = applyCacheBuster(updated);
      setSettings(bustered);
      
      // Sync with index.html hydration script
      try {
        localStorage.setItem('gcfm-full-settings', JSON.stringify(bustered));
      } catch (e) {}

      if (bustered.primaryColor) {
        updateGlobalStyles(bustered.primaryColor);
      }
    } catch (error) {
      console.error("[CollegeContext] Update error:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse font-medium">Loading College...</p>
        </div>
      </div>
    );
  }

  if (!college && collegeSlug) {
    return <CollegeNotFound />;
  }

  return (
    <CollegeContext.Provider
      value={{
        college,
        collegeId: college?.id || null,
        collegeSlug: collegeSlug || null,
        settings,
        loading,
        refreshSettings: fetchCollegeAndSettings,
        updateSettings,
      }}
    >
      {children}
    </CollegeContext.Provider>
  );
};
