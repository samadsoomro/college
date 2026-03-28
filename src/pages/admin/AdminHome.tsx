import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Save, Plus, Trash2, Layout, Image as ImageIcon, 
  BarChart3, Users, ExternalLink, RefreshCw, Upload,
  XCircle, CheckCircle, Info
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { useAuth, adminHeaders } from "@/contexts/AuthContext";
import { uploadToSupabase } from "@/utils/upload";

interface HomeContent {
  heroHeading: string;
  heroSubheading: string;
  heroOverlayText?: string;
  featuresHeading: string;
  featuresSubheading: string;
  affiliationsHeading: string;
  ctaHeading: string;
  ctaSubheading: string;
}

interface SliderImage {
  id: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}

interface HomeStat {
  id: string;
  label: string;
  number: string;
  icon: string;
  iconUrl?: string;
  color: string;
  order: number;
}

interface Affiliation {
  id: string;
  name: string;
  logoUrl: string;
  link: string;
  order: number;
  isActive: boolean;
}

const AdminHome: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useAuth();

  // Queries
  const { data: content, isLoading: contentLoading } = useQuery<HomeContent>({
    queryKey: [`/api/${collegeSlug}/admin/home/content`],
    queryFn: async () => {
      const ts = Date.now();
      const res = await fetch(`/api/${collegeSlug}/admin/home/content?t=${ts}`, { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    }
  });

  const { data: sliderImages = [], isLoading: sliderLoading } = useQuery<SliderImage[]>({
    queryKey: [`/api/${collegeSlug}/admin/home/slider`],
    queryFn: async () => {
      const ts = Date.now();
      const res = await fetch(`/api/${collegeSlug}/admin/home/slider?t=${ts}`, { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed to fetch slider");
      return res.json();
    }
  });

  const { data: stats = [], isLoading: statsLoading } = useQuery<HomeStat[]>({
    queryKey: [`/api/${collegeSlug}/admin/home/stats`],
    queryFn: async () => {
      const ts = Date.now();
      const res = await fetch(`/api/${collegeSlug}/admin/home/stats?t=${ts}`, { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const { data: affiliations = [], isLoading: affiliationsLoading } = useQuery<Affiliation[]>({
    queryKey: [`/api/${collegeSlug}/admin/home/affiliations`],
    queryFn: async () => {
      const ts = Date.now();
      const res = await fetch(`/api/${collegeSlug}/admin/home/affiliations?t=${ts}`, { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed to fetch affiliations");
      return res.json();
    }
  });

  // Local state for editing hero content
  const [editedContent, setEditedContent] = useState<HomeContent | null>(null);

  const [faqs, setFaqs] = useState<any[]>([]);

  // Load FAQs:
  const fetchFaqs = async () => {
    const res = await fetch(`/api/${collegeSlug}/admin/faqs`, {
      headers: adminHeaders()
    });
    if (res.ok) setFaqs(await res.json());
  };

  useEffect(() => {
    if (collegeSlug && isAdmin) {
      fetchFaqs();
    }
  }, [collegeSlug, isAdmin]);

  // Add blank FAQ:
  const addFaq = () => {
    setFaqs(prev => [...prev, {
      id: `new-${Date.now()}`,
      question: '',
      answer: '',
      display_order: prev.length + 1,
      isNew: true
    }]);
  };

  // Update locally:
  const updateFaqLocal = (id: string, field: string, value: string) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  // Save to DB:
  const saveFaq = async (faq: any) => {
    const method = faq.isNew ? 'POST' : 'PATCH';
    const url = faq.isNew
      ? `/api/${collegeSlug}/admin/faqs`
      : `/api/${collegeSlug}/admin/faqs/${faq.id}`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ question: faq.question, answer: faq.answer, displayOrder: faq.display_order })
    });
    if (res.ok) {
      toast({ title: '✅ FAQ saved!' });
      fetchFaqs(); // refresh
    }
  };

  // Delete:
  const deleteFaq = async (id: string) => {
    if (id.startsWith('new-')) {
      setFaqs(prev => prev.filter(f => f.id !== id));
      return;
    }
    await fetch(`/api/${collegeSlug}/admin/faqs/${id}`, {
      method: 'DELETE',
      headers: adminHeaders()
    });
    toast({ title: 'FAQ deleted' });
    fetchFaqs();
  };

  useEffect(() => {
    if (content) {
      setEditedContent(content);
    }
  }, [content]);

  // Form states for new items
  const [sliderFile, setSliderFile] = useState<File | null>(null);
  const [affiliationFile, setAffiliationFile] = useState<File | null>(null);
  const [affiliationName, setAffiliationName] = useState("");
  const [affiliationLink, setAffiliationLink] = useState("");
  
  const [newStatLabel, setNewStatLabel] = useState("");
  const [newStatNumber, setNewStatNumber] = useState("");
  const [newStatIcon, setNewStatIcon] = useState("BookOpen");
  const [newStatColor, setNewStatColor] = useState("text-pakistan-green");
  const [newStatFile, setNewStatFile] = useState<File | null>(null);

  const ICON_OPTIONS = ["BookOpen", "Users", "Award", "TrendingUp", "Search", "Star", "Heart", "Clock"];
  const COLOR_OPTIONS = [
    { label: "Green", value: "text-pakistan-green" },
    { label: "Light Green", value: "text-pakistan-green-light" },
    { label: "Emerald", value: "text-pakistan-emerald" },
    { label: "Accent", value: "text-accent" },
    { label: "Primary", value: "text-primary" },
  ];

  const getPositionLabel = (index: number) => {
    const labels = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
    return labels[index] || `#${index + 1}`;
  };

  // Handlers
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedContent) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/home/content`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(editedContent),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Home content updated" });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/content`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update content", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sliderFile) return;
    setLoading(true);
    try {
      // 1. Upload to Supabase
      const imageUrl = await uploadToSupabase(sliderFile, 'home', collegeSlug!);
      if (!imageUrl) throw new Error("Upload failed");

      // 2. Save to DB via JSON
      const res = await fetch(`/api/${collegeSlug}/admin/home/slider`, { 
        method: "POST", 
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl })
      });
      
      if (res.ok) {
        toast({ title: "Success", description: "Image uploaded" });
        setSliderFile(null);
        const fileInput = document.getElementById("slider-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/slider`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Upload failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlider = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/home/slider/${id}`, { 
        method: "DELETE",
        headers: adminHeaders()
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Image removed" });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/slider`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const toggleSliderStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/home/slider/${id}`, {
        method: "PATCH",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/slider`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {}
  };

  const updateSliderOrder = async (id: string, order: number) => {
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/home/slider/${id}`, {
        method: "PATCH",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/slider`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {}
  };

  const handleUploadAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliationFile || !affiliationName) return;
    setLoading(true);
    try {
      const logoUrl = await uploadToSupabase(affiliationFile, 'home', collegeSlug!);
      if (!logoUrl) throw new Error("Upload failed");

      const res = await fetch(`/api/${collegeSlug}/admin/home/affiliations`, { 
        method: "POST", 
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: affiliationName, link: affiliationLink, logoUrl })
      });

      if (res.ok) {
        toast({ title: "Success", description: "Affiliation added" });
        setAffiliationFile(null);
        setAffiliationName("");
        setAffiliationLink("");
        const fileInput = document.getElementById("affiliation-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/affiliations`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Add failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAffiliation = async (id: string) => {
    if (!confirm("Delete affiliation?")) return;
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/home/affiliations/${id}`, { 
        method: "DELETE",
        headers: adminHeaders()
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Affiliation removed" });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/affiliations`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const toggleAffiliationStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/home/affiliations/${id}`, {
        method: "PATCH",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/affiliations`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {}
  };

  const updateAffiliationOrder = async (id: string, order: number) => {
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/home/affiliations/${id}`, {
        method: "PATCH",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/affiliations`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {}
  };

  const handleAddStat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatLabel || !newStatNumber) return;
    setLoading(true);
    try {
      let iconUrl = "";
      if (newStatFile) {
        iconUrl = await uploadToSupabase(newStatFile, 'home', collegeSlug!) || "";
      }

      const res = await fetch(`/api/${collegeSlug}/admin/home/stats`, { 
        method: "POST", 
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ 
          label: newStatLabel, 
          number: newStatNumber, 
          icon: newStatIcon, 
          color: newStatColor,
          iconUrl
        })
      });

      if (res.ok) {
        toast({ title: "Success", description: "Stat added" });
        setNewStatLabel("");
        setNewStatNumber("");
        setNewStatFile(null);
        const fileInput = document.getElementById("new-stat-icon") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/stats`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Add failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStat = async (id: string) => {
    if (!confirm("Delete statistic?")) return;
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/home/stats/${id}`, { 
        method: "DELETE",
        headers: adminHeaders()
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Stat removed" });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/stats`] });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/home`] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  if (contentLoading || !editedContent) return <div className="p-8 text-center text-muted-foreground">Loading Home Settings...</div>;
  if (!isAdmin) return <div className="p-8 text-center text-rose-500 font-bold">Unauthorized</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Home Page Management</h2>
        <Button variant="outline" size="sm" onClick={() => window.open(`/${collegeSlug}`, "_blank")}>
          <ExternalLink className="w-4 h-4 mr-2" /> View Public Site
        </Button>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content"><Layout className="w-4 h-4 mr-2" /> Content</TabsTrigger>
          <TabsTrigger value="slider"><ImageIcon className="w-4 h-4 mr-2" /> Slider</TabsTrigger>
          <TabsTrigger value="affiliations"><Users className="w-4 h-4 mr-2" /> Affiliations</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 mr-2" /> Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero & Text Content</CardTitle>
              <CardDescription>Update high-level headings and call-to-action text.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContentSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hero Heading</Label>
                    <Input value={editedContent.heroHeading} onChange={e => setEditedContent({...editedContent, heroHeading: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Overlay Text</Label>
                    <Input value={editedContent.heroOverlayText || ""} onChange={e => setEditedContent({...editedContent, heroOverlayText: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Hero Subheading</Label>
                    <Textarea value={editedContent.heroSubheading} onChange={e => setEditedContent({...editedContent, heroSubheading: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Features Heading</Label>
                    <Input value={editedContent.featuresHeading} onChange={e => setEditedContent({...editedContent, featuresHeading: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Affiliations Heading</Label>
                    <Input value={editedContent.affiliationsHeading} onChange={e => setEditedContent({...editedContent, affiliationsHeading: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Features Subheading</Label>
                    <Input value={editedContent.featuresSubheading} onChange={e => setEditedContent({...editedContent, featuresSubheading: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Heading</Label>
                    <Input value={editedContent.ctaHeading} onChange={e => setEditedContent({...editedContent, ctaHeading: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>CTA Subheading</Label>
                    <Textarea value={editedContent.ctaSubheading} onChange={e => setEditedContent({...editedContent, ctaSubheading: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save All Text Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ Management Section */}
          <div className="mt-6 border rounded-xl p-5 space-y-4 bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">❓ FAQ Section</h3>
                <p className="text-sm text-neutral-500">
                  These questions appear on the homepage after Affiliations & Authorities.
                </p>
              </div>
              <button
                type="button"
                onClick={addFaq}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
              >
                ➕ Add Question
              </button>
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="border rounded-lg p-4 space-y-3 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                      Q{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteFaq(faq.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  {/* Question input */}
                  <div>
                    <label className="text-sm font-medium">Question</label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={e => updateFaqLocal(faq.id, 'question', e.target.value)}
                      placeholder="Enter question..."
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>

                  {/* Answer textarea */}
                  <div>
                    <label className="text-sm font-medium">Answer</label>
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={e => updateFaqLocal(faq.id, 'answer', e.target.value)}
                      placeholder="Enter answer..."
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>

                  {/* Save button per FAQ */}
                  <button
                    type="button"
                    onClick={() => saveFaq(faq)}
                    className="px-4 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors rounded-lg text-xs font-medium"
                  >
                    💾 Save
                  </button>
                </div>
              ))}

              {faqs.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-sm border-2 border-dashed rounded-lg">
                  No FAQs yet. Click "➕ Add Question" to create your first FAQ.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="slider" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Slider</CardTitle>
              <CardDescription>Upload images to be displayed in the home page carousel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleUploadSlider} className="flex flex-col md:flex-row gap-4 items-end border p-4 rounded-lg bg-secondary/20">
                <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="slider-upload">Select Image</Label>
                  <Input id="slider-upload" type="file" accept="image/*" onChange={e => setSliderFile(e.target.files?.[0] || null)} />
                </div>
                <Button type="submit" disabled={!sliderFile || loading} className="w-full md:w-auto">
                  <Upload className="w-4 h-4 mr-2" /> Upload Image
                </Button>
              </form>

              <div className="grid gap-4 md:grid-cols-2">
                {sliderImages.map(img => (
                  <div key={img.id} className="flex gap-4 p-4 border rounded-xl bg-card shadow-sm group">
                    <div className="h-24 w-36 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img src={img.imageUrl} alt="Slider" className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Order:</Label>
                          <Input 
                            type="number" 
                            className="w-14 h-8 text-xs" 
                            value={img.order} 
                            onChange={e => updateSliderOrder(img.id, parseInt(e.target.value))} 
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteSlider(img.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={img.isActive} onCheckedChange={() => toggleSliderStatus(img.id, img.isActive)} />
                        <span className="text-xs font-medium">{img.isActive ? "Visible" : "Hidden"}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {sliderImages.length === 0 && <div className="md:col-span-2 py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">No slider images uploaded yet.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Affiliations & Partners</CardTitle>
              <CardDescription>Manage partner logos displayed on the home page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleUploadAffiliation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border p-4 rounded-lg bg-secondary/20">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <Input id="affiliation-upload" type="file" accept="image/*" onChange={e => setAffiliationFile(e.target.files?.[0] || null)} />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={affiliationName} onChange={e => setAffiliationName(e.target.value)} placeholder="e.g. Higher Education Commission" />
                </div>
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input value={affiliationLink} onChange={e => setAffiliationLink(e.target.value)} placeholder="https://..." />
                </div>
                <Button type="submit" disabled={!affiliationFile || !affiliationName || loading}>
                  <Plus className="w-4 h-4 mr-2" /> Add Partner
                </Button>
              </form>

              <div className="grid gap-4">
                {affiliations.map(aff => (
                  <div key={aff.id} className="flex items-center gap-4 p-4 border rounded-xl bg-card shadow-sm">
                    <div className="h-16 w-16 relative rounded-lg overflow-hidden bg-white border p-2 flex-shrink-0">
                      <img src={aff.logoUrl} alt={aff.name} className="object-contain w-full h-full" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{aff.name}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{aff.link}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Order:</Label>
                        <Input type="number" className="w-14 h-8 text-xs" value={aff.order} onChange={e => updateAffiliationOrder(aff.id, parseInt(e.target.value))} />
                      </div>
                      <Switch checked={aff.isActive} onCheckedChange={() => toggleAffiliationStatus(aff.id, aff.isActive)} />
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteAffiliation(aff.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {affiliations.length === 0 && <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">No affiliations added.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics Counters</CardTitle>
              <CardDescription>Numerical callouts for achievements (e.g., "5000+ Books").</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddStat} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end border p-4 rounded-lg bg-secondary/20">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={newStatLabel} onChange={e => setNewStatLabel(e.target.value)} placeholder="e.g. Active Students" />
                </div>
                <div className="space-y-2">
                  <Label>Number</Label>
                  <Input value={newStatNumber} onChange={e => setNewStatNumber(e.target.value)} placeholder="e.g. 5000+" />
                </div>
                <div className="space-y-2">
                  <Label>Icon Type</Label>
                  <select className="w-full h-10 px-3 border rounded-md" value={newStatIcon} onChange={e => setNewStatIcon(e.target.value)}>
                    {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Custom Icon (Optional)</Label>
                  <Input id="new-stat-icon" type="file" accept="image/*" onChange={e => setNewStatFile(e.target.files?.[0] || null)} />
                </div>
                <Button type="submit" disabled={!newStatLabel || !newStatNumber || loading}>
                  <Plus className="w-4 h-4 mr-2" /> Add Stat
                </Button>
              </form>

              <div className="grid gap-4 md:grid-cols-2">
                {stats.map(stat => (
                  <div key={stat.id} className="flex gap-4 p-4 border rounded-xl bg-card shadow-sm">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      {stat.iconUrl ? <img src={stat.iconUrl} className="w-8 h-8 object-contain" /> : <ImageIcon className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{stat.number}</h4>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteStat(stat.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.length === 0 && <div className="md:col-span-2 py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">No statistics defined.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHome;
