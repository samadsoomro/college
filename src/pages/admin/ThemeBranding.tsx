import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useCollege } from "@/contexts/CollegeContext";
import { adminHeaders, uploadToSupabase } from "@/contexts/AuthContext";
import { Palette, Layout, Globe, Save, Upload, RefreshCcw, Settings, Info, FileText, Smartphone, Banknote, Building, Hash, User } from "lucide-react";

const ThemeBranding: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings, refreshSettings } = useCollege();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...settings });
  
  const [navbarLogo, setNavbarLogo] = useState<File | null>(null);
  const [loadingLogo, setLoadingLogo] = useState<File | null>(null);
  const [cardLogo, setCardLogo] = useState<File | null>(null);

  useEffect(() => { setFormData({ ...settings }); }, [settings]);

  const handleInputChange = (e: any) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isProd = window.location.hostname !== 'localhost';
      const updates = { ...formData };

      if (isProd) {
        if (navbarLogo) (updates as any).navbarLogo = await uploadToSupabase(navbarLogo, settings.storageBucket || 'colleges');
        if (loadingLogo) (updates as any).loadingLogo = await uploadToSupabase(loadingLogo, settings.storageBucket || 'colleges');
        if (cardLogo) (updates as any).cardLogoUrl = await uploadToSupabase(cardLogo, settings.storageBucket || 'colleges');
        
        const res = await fetch(`/api/${collegeSlug}/admin/settings`, {
          method: "PATCH",
          headers: adminHeaders,
          body: JSON.stringify(updates),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to update settings");
      } else {
        // Local: Original logic with multer (simplified here for brevity)
        const d = new FormData();
        Object.entries(updates).forEach(([k, v]) => { if (v !== null) d.append(k, String(v)); });
        if (navbarLogo) d.append("navbarLogo", navbarLogo);
        await fetch(`/api/${collegeSlug}/admin/settings`, { method: "PATCH", body: d, credentials: "include" });
      }

      toast({ title: "Success", description: "Settings updated successfully." });
      refreshSettings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="text-primary" /> Branding & Identity</h1>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
          {loading ? <RefreshCcw className="animate-spin" size={16}/> : <Save size={16}/>} Save All Changes
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Palette size={20}/> Visuals</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Short Name</label>
              <Input name="instituteShortName" value={formData.instituteShortName || ''} onChange={handleInputChange} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
              <Input name="instituteFullName" value={formData.instituteFullName || ''} onChange={handleInputChange} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground">Primary Color</label>
              <div className="flex gap-2">
                <Input type="color" name="primaryColor" value={formData.primaryColor || '#006600'} onChange={handleInputChange} className="w-12 h-10 p-1" />
                <Input name="primaryColor" value={formData.primaryColor || '#006600'} onChange={handleInputChange} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Upload size={20}/> Logos & Assets</h2>
          {window.location.hostname !== 'localhost' && (
            <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              🚀 Running on Vercel: Images will be uploaded directly to Supabase Storage.
            </p>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Navbar Logo</label>
                <Input type="file" accept="image/*" onChange={(e) => setNavbarLogo(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Loading Logo</label>
                <Input type="file" accept="image/*" onChange={(e) => setLoadingLogo(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ThemeBranding;
