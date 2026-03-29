import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useCollege } from "@/contexts/CollegeContext";
import { uploadToSupabase } from "@/utils/upload";
import { 
  Palette, Save, Upload, RefreshCcw, Settings, Share2, 
  MapPin, CreditCard, BookOpen, Heart, Smartphone, Building, Hash, User, Banknote, 
  Plus, Trash2, Type, Tag
} from "lucide-react";

const ThemeBranding: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings, updateSettings } = useCollege();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({ ...settings });
  const [uploading, setUploading] = useState<string | null>(null);
  
  const [systemFields, setSystemFields] = useState([
    { fieldKey: 'class', fieldLabel: 'Class', options: '' },
    { fieldKey: 'field', fieldLabel: 'Field/Group', options: '' }
  ]);
  const [customFields, setCustomFields] = useState<any[]>([]);

  useEffect(() => { 
    setFormData({ ...settings }); 
  }, [settings]);

  useEffect(() => {
    const fetchCardFields = async () => {
      if (!collegeSlug) return;
      const res = await fetch(`/api/${collegeSlug}/library-card-fields`);
      if (!res.ok) return;
      const data = await res.json();
      
      const sys = [
        { fieldKey: 'class', fieldLabel: 'Class', options: '' },
        { fieldKey: 'field', fieldLabel: 'Field/Group', options: '' }
      ];
      const custom: any[] = [];

      data.forEach((f: any) => {
        if (f.fieldKey === 'class' || f.fieldKey === 'field') {
          const match = sys.find(s => s.fieldKey === f.fieldKey);
          if (match) {
            match.fieldLabel = f.fieldLabel;
            match.options = (f.options || []).join('\n');
          }
        } else {
          custom.push({
            id: f.id,
            fieldKey: f.fieldKey,
            fieldLabel: f.fieldLabel,
            options: (f.options || []).join('\n')
          });
        }
      });

      setSystemFields(sys);
      setCustomFields(custom);
    };
    fetchCardFields();
  }, [collegeSlug]);

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

  const handleLogoUpload = async (file: File, field: 'navbarLogo' | 'loadingLogo' | 'heroBackgroundLogo' | 'cardLogoUrl') => {
    if (!collegeSlug) return;
    setUploading(field);
    try {
      const publicUrl = await uploadToSupabase(file, 'branding', collegeSlug!);
      
      // Update local state (Persistence happens on "Save All")
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
      
      toast({ title: "Logo uploaded", description: "Click 'Save All' to apply changes permanentily." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(formData);
      toast({ title: "Success", description: "All settings saved successfully!" });
      
      queryClient.invalidateQueries({ queryKey: ['college', collegeSlug] });
      queryClient.invalidateQueries({ queryKey: ['settings', collegeSlug] });
      window.dispatchEvent(new Event('college-settings-updated'));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const saveCardFields = async () => {
    if (!collegeSlug) return;
    setLoading(true);
    
    const payload = {
      systemFields: systemFields.map(f => ({
        ...f,
        options: f.options.split('\n').map(s => s.trim()).filter(Boolean)
      })),
      customFields: customFields.map(f => ({
        ...f,
        options: f.options.split('\n').map(s => s.trim()).filter(Boolean)
      }))
    };

    const res = await fetch(`/api/${collegeSlug}/admin/library-card-fields`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN || 'gcfm-admin-token-2026'
      },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (res.ok) {
      toast({ title: 'Card Fields Saved!', description: 'Hybrid field configuration updated.' });
    } else {
      toast({ title: 'Error', description: 'Failed to save fields', variant: 'destructive' });
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { 
      fieldKey: `custom_${Date.now()}`, 
      fieldLabel: 'New Custom Field', 
      options: '' 
    }]);
  };

  const removeCustomField = (index: number) => {
    const newFields = [...customFields];
    newFields.splice(index, 1);
    setCustomFields(newFields);
  };

  const updateSystemField = (index: number, updates: any) => {
    const newFields = [...systemFields];
    newFields[index] = { ...newFields[index], ...updates };
    setSystemFields(newFields);
  };

  const updateCustomField = (index: number, updates: any) => {
    const newFields = [...customFields];
    newFields[index] = { ...newFields[index], ...updates };
    setCustomFields(newFields);
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
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 p-1 border rounded-lg bg-muted/30">
                    <Input 
                      type="color" 
                      name="primaryColor" 
                      value={formData.primaryColor || '#006600'} 
                      onChange={handleInputChange} 
                      className="w-10 h-10 p-1 cursor-pointer border-0 bg-transparent" 
                    />
                    <Input 
                      name="primaryColor" 
                      value={formData.primaryColor || '#006600'} 
                      onChange={handleInputChange} 
                      className="border-0 bg-transparent w-24 font-mono text-sm uppercase"
                      placeholder="#006600" 
                    />
                  </div>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, primaryColor: '#006600' }));
                      toast({ title: "Reset to default", description: "Color set to #006600. Remember to save changes." });
                    }}
                    className="h-10 gap-2"
                  >
                    <Palette size={14} /> Default Color
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">This color will be used for buttons, links, and primary UI elements.</p>
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
                  <div className="flex items-center gap-4">
                    {formData.navbarLogo && (
                      <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                        <img src={`${formData.navbarLogo}?t=${Date.now()}`} alt="Navbar" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], "navbarLogo")} 
                        disabled={uploading === "navbarLogo"}
                      />
                      {uploading === "navbarLogo" && <p className="text-[10px] text-primary animate-pulse">Uploading...</p>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Loading Screen Logo</label>
                  <div className="flex items-center gap-4">
                    {formData.loadingLogo && (
                      <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                        <img src={`${formData.loadingLogo}?t=${Date.now()}`} alt="Loading" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], "loadingLogo")} 
                        disabled={uploading === "loadingLogo"}
                      />
                      {uploading === "loadingLogo" && <p className="text-[10px] text-primary animate-pulse">Uploading...</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Hero Background Image</label>
                  <div className="flex items-center gap-4">
                    {formData.heroBackgroundLogo && (
                      <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                        <img src={`${formData.heroBackgroundLogo}?t=${Date.now()}`} alt="Hero" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], "heroBackgroundLogo")} 
                        disabled={uploading === "heroBackgroundLogo"}
                      />
                      {uploading === "heroBackgroundLogo" && <p className="text-[10px] text-primary animate-pulse">Uploading...</p>}
                    </div>
                  </div>
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
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Office Hours (One per line)</label>
                <Textarea 
                  name="officeHours" 
                  value={formData.officeHours || ''} 
                  onChange={handleInputChange} 
                  placeholder="e.g. Mon–Fri: 9:00 AM – 1:00 PM&#10;Sat: 9:00 AM – 12:00 PM&#10;Sun: Closed" 
                  rows={3} 
                />
                <p className="text-[10px] text-muted-foreground italic">Tip: Use "Day: Time" format, one per line.</p>
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
                <label className="text-xs font-bold uppercase text-muted-foreground">Card Authority Line 1</label>
                <Input name="cardAuthorityLine1" value={formData.cardAuthorityLine1 || ''} onChange={handleInputChange} placeholder="e.g. Government of Sindh" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Card Authority Line 2</label>
                <Input name="cardAuthorityLine2" value={formData.cardAuthorityLine2 || ''} onChange={handleInputChange} placeholder="e.g. College Education Department" />
              </div>
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
                <div className="flex items-center gap-4">
                  {formData.cardLogoUrl && (
                    <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                      <img src={`${formData.cardLogoUrl}?t=${Date.now()}`} alt="Card Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], "cardLogoUrl")} 
                      disabled={uploading === "cardLogoUrl"}
                    />
                    {uploading === "cardLogoUrl" && <p className="text-[10px] text-primary animate-pulse">Uploading...</p>}
                  </div>
                </div>
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
        
        {/* 5.5 College Card Fields Section */}
        <Card className="shadow-md border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <SectionHeader icon={CreditCard} title="🎓 College Card — Form Fields" />
                <p className="text-sm text-muted-foreground">
                  Configure the dropdown fields shown on the college card application form.
                </p>
              </div>
              <Button
                type="button"
                onClick={saveCardFields}
                disabled={loading}
                className="gap-2 shadow-sm"
              >
                <Save size={16} /> Save Field Logic
              </Button>
            </div>

            <div className="space-y-8">
              {/* Type 1: Permanent System Fields */}
              <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-neutral-900 rounded-lg text-white">
                    <Settings size={14} />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-widest text-neutral-900">
                    🔒 System Fields (Permanent for ID)
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {systemFields.map((field, idx) => (
                    <div key={field.fieldKey} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Field Name (Label)
                        </label>
                        <span className="text-[9px] bg-neutral-200 px-1.5 py-0.5 rounded font-mono text-neutral-500">
                          ID Key: {field.fieldKey}
                        </span>
                      </div>
                      <Input 
                        value={field.fieldLabel} 
                        onChange={(e) => updateSystemField(idx, { fieldLabel: e.target.value })}
                        className="font-bold border-neutral-200"
                        placeholder={field.fieldKey === 'class' ? 'e.g. Class / Grade' : 'e.g. Field / Group'}
                      />
                      <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
                        Dropdown Options (One per line)
                      </label>
                      <Textarea
                        rows={6}
                        className="w-full font-mono text-sm bg-white border-neutral-200"
                        value={field.options}
                        onChange={(e) => updateSystemField(idx, { options: e.target.value })}
                        placeholder="Option 1\nOption 2\nOption 3"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Type 2: Custom Extra Fields */}
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary rounded-lg text-white shadow-sm shadow-primary/20">
                      <Plus size={14} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-primary">
                      ➕ Custom Extra Fields
                    </h3>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addCustomField}
                    className="h-8 gap-2 font-bold text-xs border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <Plus size={14} /> Add Field
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customFields.map((field, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm space-y-3 relative group">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomField(idx)}
                        className="absolute -top-2 -right-2 h-7 w-7 bg-white shadow-md border text-rose-500 hover:text-rose-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus size={14} className="rotate-45" />
                      </Button>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Custom Label (e.g. Semester)
                        </label>
                        <Input 
                          value={field.fieldLabel} 
                          onChange={(e) => updateCustomField(idx, { fieldLabel: e.target.value })}
                          className="font-bold"
                          placeholder="e.g. Semester"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Options (One per line)
                        </label>
                        <Textarea
                          rows={4}
                          className="w-full font-mono text-xs bg-neutral-50"
                          value={field.options}
                          onChange={(e) => updateCustomField(idx, { options: e.target.value })}
                          placeholder="Fall 2024\nSpring 2025"
                        />
                      </div>
                    </div>
                  ))}
                  {customFields.length === 0 && (
                    <div className="md:col-span-2 py-8 text-center border-2 border-dashed border-primary/10 rounded-xl text-neutral-400 text-sm italic">
                      No custom fields added yet. Click "Add Field" to begin.
                    </div>
                  )}
                </div>
              </div>
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

        {/* 6. Terminology & Labels */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <SectionHeader icon={Type} title="🚩 Terminology & Labels" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Institution Type (e.g. College, School, University)</label>
                <div className="flex items-center gap-2">
                  <Building className="text-muted-foreground" size={16}/>
                  <Input name="termInstitution" value={formData.termInstitution || 'College'} onChange={handleInputChange} placeholder="e.g. College" />
                </div>
                <p className="text-[10px] text-muted-foreground">This label appears in 'History', 'About' sections and page titles.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Principal Title (e.g. Principal, Headmaster, Director)</label>
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground" size={16}/>
                  <Input name="termPrincipal" value={formData.termPrincipal || 'Principal'} onChange={handleInputChange} placeholder="e.g. Principal" />
                </div>
                <p className="text-[10px] text-muted-foreground">This label appears on the menu and the message page.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Card Menu Name (e.g. College Card, Library Card, ID Card)</label>
                <div className="flex items-center gap-2">
                  <CreditCard className="text-muted-foreground" size={16}/>
                  <Input name="termCardMenu" value={formData.termCardMenu || 'College Card'} onChange={handleInputChange} placeholder="e.g. College Card" />
                </div>
                <p className="text-[10px] text-muted-foreground">The text shown for the ID card section across the site.</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-bold uppercase text-primary mb-4 flex items-center gap-2">
                <Type size={16} /> Page Headings & Descriptions
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Blog Page */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="text-xs font-black uppercase text-secondary-foreground flex items-center gap-2">
                    <BookOpen size={14} /> Blog Page
                  </h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Heading</label>
                    <Input name="blogHeading" value={formData.blogHeading || ''} onChange={handleInputChange} placeholder="College News & Updates" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Description Line</label>
                    <Textarea name="blogDescription" value={formData.blogDescription || ''} onChange={handleInputChange} placeholder="Stay informed with the latest academic updates..." rows={2} className="text-sm" />
                  </div>
                </div>

                {/* Notes Page */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="text-xs font-black uppercase text-secondary-foreground flex items-center gap-2">
                    <Tag size={14} /> Notes Page
                  </h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Heading</label>
                    <Input name="notesHeading" value={formData.notesHeading || ''} onChange={handleInputChange} placeholder="Notes & Study Materials" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Description Line</label>
                    <Textarea name="notesDescription" value={formData.notesDescription || ''} onChange={handleInputChange} placeholder="Download course notes, syllabus..." rows={2} className="text-sm" />
                  </div>
                </div>

                {/* Events Page */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="text-xs font-black uppercase text-secondary-foreground flex items-center gap-2">
                    <Palette size={14} /> Events Page
                  </h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Heading</label>
                    <Input name="eventsHeading" value={formData.eventsHeading || ''} onChange={handleInputChange} placeholder="College Events" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Description Line</label>
                    <Textarea name="eventsDescription" value={formData.eventsDescription || ''} onChange={handleInputChange} placeholder="Stay updated with the latest happenings..." rows={2} className="text-sm" />
                  </div>
                </div>

                {/* Notifications Page */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="text-xs font-black uppercase text-secondary-foreground flex items-center gap-2">
                    <Share2 size={14} /> Notifications Page
                  </h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Heading</label>
                    <Input name="notificationsHeading" value={formData.notificationsHeading || ''} onChange={handleInputChange} placeholder="Notifications" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Description Line</label>
                    <Textarea name="notificationsDescription" value={formData.notificationsDescription || ''} onChange={handleInputChange} placeholder="Official announcements, news..." rows={2} className="text-sm" />
                  </div>
                </div>

                {/* Contact Page */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30 md:col-span-2">
                  <h4 className="text-xs font-black uppercase text-secondary-foreground flex items-center gap-2">
                    <MapPin size={14} /> Contact Page
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Heading</label>
                      <Input name="contactHeading" value={formData.contactHeading || ''} onChange={handleInputChange} placeholder="Contact Us" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Description Line</label>
                      <Textarea name="contactDescription" value={formData.contactDescription || ''} onChange={handleInputChange} placeholder="Get in touch with us..." rows={2} className="text-sm" />
                    </div>
                  </div>
                </div>
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
