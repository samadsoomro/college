import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
// import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { useCollege } from "@/contexts/CollegeContext";
import { adminHeaders, uploadToSupabase } from "@/contexts/AuthContext";
import { 
  Palette, Layout, Globe, Save, Upload, RefreshCcw, Settings, Info, 
  FileText, Smartphone, Banknote, Building, Hash, User, Share2, 
  MapPin, CreditCard, BookOpen, Heart, Github 
} from "lucide-react";

const ThemeBranding: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
   const { settings, refreshSettings } = useCollege();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({ ...settings });
  
  // File states for direct upload
  const [files, setFiles] = useState<Record<string, File | null>>({
    navbarLogo: null,
    loadingLogo: null,
    heroBackgroundLogo: null,
    cardLogo: null
  });

  useEffect(() => { 
    setFormData({ ...settings }); 
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData(prev => ({ ...prev, [name]: value[0] }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [name]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isProd = window.location.hostname !== 'localhost';
      const updates = { ...formData };

      if (isProd) {
        // Direct uploads for prod
        if (files.navbarLogo) updates.navbarLogo = await uploadToSupabase(files.navbarLogo, settings.storageBucket || 'colleges');
        if (files.loadingLogo) updates.loadingLogo = await uploadToSupabase(files.loadingLogo, settings.storageBucket || 'colleges');
        if (files.heroBackgroundLogo) updates.heroBackgroundLogo = await uploadToSupabase(files.heroBackgroundLogo, settings.storageBucket || 'colleges');
        if (files.cardLogo) updates.cardLogoUrl = await uploadToSupabase(files.cardLogo, settings.storageBucket || 'colleges');
        
        const res = await fetch(`/api/${collegeSlug}/admin/settings`, {
          method: "PATCH",
          headers: adminHeaders(),
          body: JSON.stringify(updates),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to update settings");
      } else {
        // Local fallback (Multer logic would be here, but we're focusing on Vercel compatibility)
        const d = new FormData();
        Object.entries(updates).forEach(([k, v]) => { if (v !== null) d.append(k, String(v)); });
        if (files.navbarLogo) d.append("navbarLogo", files.navbarLogo);
        const res = await fetch(`/api/${collegeSlug}/admin/settings`, { method: "PATCH", body: d, credentials: "include" });
        if (!res.ok) throw new Error("Failed local update");
      }

      toast({ title: "Success", description: "Settings saved!" });
      refreshSettings();
      // Force refresh of queries and page to update branding immediately
      queryClient.invalidateQueries({ queryKey: ['college', collegeSlug] });
      queryClient.invalidateQueries({ queryKey: [`/api/colleges/${collegeSlug}`] });
      
      setTimeout(() => window.location.reload(), 1000);
      // Clear file inputs
      setFiles({ navbarLogo: null, loadingLogo: null, heroBackgroundLogo: null, cardLogo: null });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h2 className="text-xl font-bold flex items-center gap-2 mb-6 border-b pb-2">
      <Icon className="text-primary" size={20}/> {title}
    </h2>
  );

  return (
    <div className="p-6 space-y-12 max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-4 border-b">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="text-primary animate-spin-slow" /> Theme & Branding
          </h1>
          <p className="text-muted-foreground text-sm">Configure your institute's visual identity and settings.</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2 shadow-lg">
          {loading ? <RefreshCcw className="animate-spin" size={16}/> : <Save size={16}/>} Save All Changes
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* 1. Branding & Identity */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={Palette} title="Branding & Identity" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Short Name</label>
                <Input name="instituteShortName" value={formData.instituteShortName || ''} onChange={handleInputChange} placeholder="e.g. GCFMN" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                <Input name="instituteFullName" value={formData.instituteFullName || ''} onChange={handleInputChange} placeholder="Full College Name" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Primary Theme Color</label>
                <div className="flex gap-2">
                  <Input type="color" name="primaryColor" value={formData.primaryColor || '#006600'} onChange={handleInputChange} className="w-12 h-10 p-1 cursor-pointer" />
                  <Input name="primaryColor" value={formData.primaryColor || '#006600'} onChange={handleInputChange} placeholder="#006600" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Footer Title</label>
                <Input name="footerTitle" value={formData.footerTitle || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Footer Tagline</label>
                <Input name="footerTagline" value={formData.footerTagline || ''} onChange={handleInputChange} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Footer Description</label>
                <Textarea name="footerDescription" value={formData.footerDescription || ''} onChange={handleInputChange} rows={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Logos & Assets */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={Upload} title="Logos & Assets" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Navbar Logo</label>
                  <Input type="file" accept="image/*" onChange={(e) => handleFileChange("navbarLogo", e.target.files?.[0] || null)} />
                  {settings.navbarLogo && <img src={settings.navbarLogo} alt="Preview" className="h-12 border rounded p-1" />}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Loading Screen Logo</label>
                  <Input type="file" accept="image/*" onChange={(e) => handleFileChange("loadingLogo", e.target.files?.[0] || null)} />
                  {settings.loadingLogo && <img src={settings.loadingLogo} alt="Preview" className="h-12 border rounded p-1" />}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Hero Background Image</label>
                  <Input type="file" accept="image/*" onChange={(e) => handleFileChange("heroBackgroundLogo", e.target.files?.[0] || null)} />
                  {settings.heroBackgroundLogo && <img src={settings.heroBackgroundLogo} alt="Preview" className="h-12 border rounded p-1" />}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Hero Background Opacity</label>
                    <span className="text-xs font-mono">{formData.heroBackgroundOpacity || 0.5}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.heroBackgroundOpacity || 0.5}
                    onChange={(e) => handleSliderChange("heroBackgroundOpacity", [parseFloat(e.target.value)])}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Social Media Links */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={Share2} title="Social Media Links" />
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: "Facebook URL", name: "facebookUrl" },
                { label: "Twitter URL", name: "twitterUrl" },
                { label: "Instagram URL", name: "instagramUrl" },
                { label: "YouTube URL", name: "youtubeUrl" }
              ].map(social => (
                <div key={social.name} className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">{social.label}</label>
                  <Input name={social.name} value={formData[social.name] || ''} onChange={handleInputChange} placeholder="https://..." />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Contact Details */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={MapPin} title="Contact Details" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Contact Address</label>
                <Input name="contactAddress" value={formData.contactAddress || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Contact Phone</label>
                <Input name="contactPhone" value={formData.contactPhone || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Contact Email</label>
                <Input name="contactEmail" value={formData.contactEmail || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Google Map Link</label>
                <Input name="googleMapLink" value={formData.googleMapLink || ''} onChange={handleInputChange} placeholder="Shared URL from Maps" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Google Map Embed URL</label>
                <Input name="mapEmbedUrl" value={formData.mapEmbedUrl || ''} onChange={handleInputChange} placeholder="Iframe src URL" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. College Card Settings */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={CreditCard} title="College Card Settings" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Card Header Text</label>
                <Input name="cardHeaderText" value={formData.cardHeaderText || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Card Sub-header Text</label>
                <Input name="cardSubheaderText" value={formData.cardSubheaderText || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Card Logo</label>
                <Input type="file" accept="image/*" onChange={(e) => handleFileChange("cardLogo", e.target.files?.[0] || null)} />
                {settings.cardLogoUrl && <img src={settings.cardLogoUrl} alt="Preview" className="h-10 border rounded p-1" />}
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <Switch checked={formData.cardQrEnabled} onCheckedChange={(val) => handleSwitchChange("cardQrEnabled", val)} />
                  <label className="text-xs font-bold uppercase text-muted-foreground">Enable Card QR Code</label>
                </div>
                <Input name="cardQrUrl" value={formData.cardQrUrl || ''} onChange={handleInputChange} placeholder="QR Data/URL" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Card Terms & Conditions</label>
                <Textarea name="cardTermsText" value={formData.cardTermsText || ''} onChange={handleInputChange} rows={4} />
              </div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground">CARD ADDRESS</label><Input name="cardContactAddress" value={formData.cardContactAddress || ''} onChange={handleInputChange} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground">CARD EMAIL</label><Input name="cardContactEmail" value={formData.cardContactEmail || ''} onChange={handleInputChange} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground">CARD PHONE</label><Input name="cardContactPhone" value={formData.cardContactPhone || ''} onChange={handleInputChange} /></div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Rare Books Settings */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={BookOpen} title="Rare Books Settings" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Watermark Text</label>
                <Input name="rbWatermarkText" value={formData.rbWatermarkText || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Watermark Opacity</label>
                  <span className="text-xs">{formData.rbWatermarkOpacity || 0.1}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.rbWatermarkOpacity || 0.1}
                  onChange={(e) => handleSliderChange("rbWatermarkOpacity", [parseFloat(e.target.value)])}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-4">
                <Switch checked={formData.rbWatermarkEnabled} onCheckedChange={(val) => handleSwitchChange("rbWatermarkEnabled", val)} />
                <label className="text-xs font-bold uppercase text-muted-foreground">Enable Watermark</label>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Disclaimer Text</label>
                <Textarea name="rbDisclaimerText" value={formData.rbDisclaimerText || ''} onChange={handleInputChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Donation & Payment Settings */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={Banknote} title="💰 Donation & Payment Settings" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">EasyPaisa Number</label>
                <div className="flex items-center gap-2">
                  <Smartphone className="text-muted-foreground" size={16}/>
                  <Input name="easypaisaNumber" value={formData.easypaisaNumber || ''} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Bank Name</label>
                <div className="flex items-center gap-2">
                  <Building className="text-muted-foreground" size={16}/>
                  <Input name="bankName" value={formData.bankName || ''} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Bank Account Number</label>
                <div className="flex items-center gap-2">
                  <Hash className="text-muted-foreground" size={16}/>
                  <Input name="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Branch Details</label>
                <Input name="bankBranch" value={formData.bankBranch || ''} onChange={handleInputChange} placeholder="e.g. Nazimabad Branch" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Account Title</label>
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground" size={16}/>
                  <Input name="accountTitle" value={formData.accountTitle || ''} onChange={handleInputChange} placeholder="Beneficiary Name" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 8. Credits */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={Heart} title="Credits & Acknowledgements" />
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Main Credits</label>
                <Input name="creditsText" value={formData.creditsText || ''} onChange={handleInputChange} placeholder="Developed by..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Contributors (Markdown/Text)</label>
                <Textarea name="contributorsText" value={formData.contributorsText || ''} onChange={handleInputChange} rows={3} placeholder="List of contributors..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-6 right-6">
          <Button type="submit" size="lg" disabled={loading} className="gap-2 shadow-2xl h-14 px-8 text-lg font-bold transition-all hover:scale-105 active:scale-95">
            {loading ? <RefreshCcw className="animate-spin" size={20}/> : <Save size={20}/>} {loading ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ThemeBranding;
