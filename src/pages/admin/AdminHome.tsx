import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Save, Plus, Trash2, Layout, Image as ImageIcon, 
  BarChart3, Users, ExternalLink, RefreshCw, Upload,
  XCircle, CheckCircle, Info, Star, BookOpen, FolderPlus, UploadCloud, ChevronDown
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
  heroTagline: string;
  heroTaglineEnabled: boolean;
  academicSectionEnabled: boolean;
  academicSectionHeading: string;
  academicSectionSubheading: string;
  examSectionEnabled: boolean;
  examSectionHeading: string;
}

interface AcademicProgram {
  id: string;
  title: string;
  subjects: string;
  icon: string;
  display_order: number;
}

interface ExamPaper {
  id: string;
  title: string;
  button_text: string;
  pdf_url: string;
  is_enabled: boolean;
}

interface ExamLink {
  id: string;
  title: string;
  buttonText: string;
  url: string;
  isEnabled: boolean;
  displayOrder: number;
  isNew?: boolean;
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

  const { data: dbPrograms = [], isLoading: programsLoading } = useQuery<AcademicProgram[]>({
    queryKey: [`/api/${collegeSlug}/admin/academic-programs`],
    queryFn: async () => {
      const ts = Date.now();
      const res = await fetch(`/api/${collegeSlug}/admin/academic-programs?t=${ts}`, { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed to fetch academic programs");
      return res.json();
    }
  });


  // Local state for editing hero content
  const [editedContent, setEditedContent] = useState<HomeContent | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  
  // Examination Papers Manager
  const [examGroups, setExamGroups] = useState<any[]>([]);
  const [newClassName, setNewClassName] = useState<Record<string, string>>({});
  const [newSubjectName, setNewSubjectName] = useState<Record<string, string>>({});

  const [programs, setPrograms] = useState<any[]>([]);

  // Sync with Query Data
  useEffect(() => { if (content) setEditedContent(content); }, [content]);

  const fetchExamGroups = async () => {
    const res = await fetch(`/api/${collegeSlug}/admin/exam-papers`, { headers: adminHeaders() });
    if (!res.ok) return;
    const groups = await res.json();
    const withClasses = await Promise.all(groups.map(async (g: any) => {
      const r = await fetch(`/api/${collegeSlug}/admin/exam-papers/${g.id}/classes`, { headers: adminHeaders() });
      const classes = r.ok ? await r.json() : [];
      return { ...g, classes };
    }));
    setExamGroups(withClasses);
  };
  useEffect(() => { if (collegeSlug && isAdmin) fetchExamGroups(); }, [collegeSlug, isAdmin]);

  useEffect(() => { if (dbPrograms) setPrograms(dbPrograms); }, [dbPrograms]);

  // Synchronize FAQs
  const fetchFaqs = async () => {
    const res = await fetch(`/api/${collegeSlug}/admin/faqs`, { headers: adminHeaders() });
    if (res.ok) setFaqs(await res.json());
  };
  useEffect(() => { if (collegeSlug && isAdmin) fetchFaqs(); }, [collegeSlug, isAdmin]);

  // FAQ Handlers
  const addFaq = () => {
    setFaqs(prev => [...prev, { id: `new-${Date.now()}`, question: '', answer: '', display_order: prev.length + 1, isNew: true }]);
  };
  const updateFaqLocal = (id: string, field: string, value: string) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };
  const saveFaq = async (faq: any) => {
    try {
      const method = faq.isNew ? 'POST' : 'PATCH';
      const url = faq.isNew ? `/api/${collegeSlug}/admin/faqs` : `/api/${collegeSlug}/admin/faqs/${faq.id}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ question: faq.question, answer: faq.answer, displayOrder: faq.display_order })
      });
      if (res.ok) {
        toast({ title: '✅ FAQ saved!' });
        fetchFaqs();
      }
    } catch (err) { toast({ title: "Error saving FAQ", variant: "destructive" }); }
  };
  const deleteFaq = async (id: string) => {
    if (id.startsWith('new-')) { setFaqs(prev => prev.filter(f => f.id !== id)); return; }
    if (!confirm("Delete this FAQ?")) return;
    await fetch(`/api/${collegeSlug}/admin/faqs/${id}`, { method: 'DELETE', headers: adminHeaders() });
    toast({ title: 'FAQ deleted' });
    fetchFaqs();
  };

  // Examination Papers Handlers
  const addExamGroup = async () => {
    await fetch(`/api/${collegeSlug}/admin/exam-papers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ title: "New Group", buttonText: "Access Papers" })
    });
    fetchExamGroups();
  };

  const updateGroup = async (id: string, field: string, value: any) => {
    await fetch(`/api/${collegeSlug}/admin/exam-papers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ [field]: value })
    });
    fetchExamGroups();
  };

  const addExamClass = async (groupId: string) => {
    const name = newClassName[groupId] || "New Class";
    await fetch(`/api/${collegeSlug}/admin/exam-papers/${groupId}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ className: name })
    });
    setNewClassName(p => ({...p, [groupId]: ""}));
    fetchExamGroups();
  };

  const handleUploadPDF = async (classId: string) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/pdf";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      toast({ title: "Uploading PDF..." });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "pdf");

      try {
        const uploadRes = await fetch(`/api/${collegeSlug}/admin/upload`, {
          method: "POST",
          headers: adminHeaders(),
          body: formData
        });

        if (!uploadRes.ok) throw new Error("Upload failed");
        const { url, sizeKb } = await uploadRes.json();

        const name = newSubjectName[classId] || file.name.replace(".pdf", "");

        await fetch(`/api/${collegeSlug}/admin/exam-subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...adminHeaders() },
          body: JSON.stringify({ classId, subjectName: name, pdfUrl: url, fileSizeKb: sizeKb })
        });

        toast({ title: "PDF Added Successfully!" });
        setNewSubjectName(p => ({...p, [classId]: ""}));
        fetchExamGroups();
      } catch (err) {
        toast({ title: "Error uploading PDF", variant: "destructive" });
      }
    };
    fileInput.click();
  };

  const deleteSubject = async (subjectId: string) => {
    if(!confirm("Remove this PDF?")) return;
    await fetch(`/api/${collegeSlug}/admin/exam-subjects/${subjectId}`, { method: "DELETE", headers: adminHeaders() });
    fetchExamGroups();
  };

  const deleteClass = async (classId: string) => {
    if(!confirm("Remove this class and ALL its PDFs?")) return;
    await fetch(`/api/${collegeSlug}/admin/exam-classes/${classId}`, { method: "DELETE", headers: adminHeaders() });
    fetchExamGroups();
  };

  const deleteGroup = async (groupId: string) => {
    if(!confirm("Delete this entire group?")) return;
    await fetch(`/api/${collegeSlug}/admin/exam-papers/${groupId}`, { method: "DELETE", headers: adminHeaders() });
    fetchExamGroups();
  };

  // Academic Programs Handlers
  const addProgram = () => {
    setPrograms(prev => [...prev, { id: `new-${Date.now()}`, title: '', subjects: '', icon: 'BookOpen', display_order: prev.length + 1 }]);
  };
  const updateProgram = (id: string, field: string, value: any) => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const saveProgram = async (prog: any) => {
    try {
      const isNew = prog.id.toString().startsWith('new-');
      const url = isNew ? `/api/${collegeSlug}/admin/academic-programs` : `/api/${collegeSlug}/admin/academic-programs/${prog.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ title: prog.title, subjects: prog.subjects, icon: prog.icon, displayOrder: prog.display_order })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Program saved" });
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/academic-programs`] });
        queryClient.invalidateQueries({ queryKey: ["home-content", collegeSlug] });
      }
    } catch (err) { toast({ title: "Error saving program", variant: "destructive" }); }
  };
  const deleteProgram = async (id: string) => {
    if (id.toString().startsWith('new-')) { setPrograms(prev => prev.filter(p => p.id !== id)); return; }
    if (!confirm("Remove this program?")) return;
    const res = await fetch(`/api/${collegeSlug}/admin/academic-programs/${id}`, { method: "DELETE", headers: adminHeaders() });
    if (res.ok) {
      toast({ title: "Deleted", description: "Program removed" });
      queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/academic-programs`] });
      queryClient.invalidateQueries({ queryKey: ["home-content", collegeSlug] });
    }
  };

  // Global State Helpers
  const updateContent = (field: keyof HomeContent, value: any) => {
    if (!editedContent) return;
    setEditedContent({ ...editedContent, [field]: value });
  };

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
  const COLOR_OPTIONS = [ { label: "Green", value: "text-pakistan-green" }, { label: "Light Green", value: "text-pakistan-green-light" }, { label: "Emerald", value: "text-pakistan-emerald" }, { label: "Accent", value: "text-accent" }, { label: "Primary", value: "text-primary" } ];

  const getPositionLabel = (index: number) => {
    const labels = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
    return labels[index] || `#${index + 1}`;
  };

  // Submission Handlers
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
        queryClient.invalidateQueries({ queryKey: ["home-content", collegeSlug] });
      }
    } catch (error) { toast({ title: "Error", description: "Failed to update content", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleUploadSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sliderFile) return;
    setLoading(true);
    try {
      const imageUrl = await uploadToSupabase(sliderFile, 'home', collegeSlug!);
      const res = await fetch(`/api/${collegeSlug}/admin/home/slider`, { 
        method: "POST", 
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Image uploaded" });
        setSliderFile(null);
        if (document.getElementById("slider-upload")) (document.getElementById("slider-upload") as HTMLInputElement).value = "";
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/slider`] });
        queryClient.invalidateQueries({ queryKey: ["home-content", collegeSlug] });
      }
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleDeleteSlider = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/${collegeSlug}/admin/home/slider/${id}`, { method: "DELETE", headers: adminHeaders() });
    if (res.ok) {
      toast({ title: "Deleted", description: "Image removed" });
      queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/slider`] });
      queryClient.invalidateQueries({ queryKey: ["home-content", collegeSlug] });
    }
  };

  const toggleSliderStatus = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/${collegeSlug}/admin/home/slider/${id}`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/slider`] });
  };

  const updateSliderOrder = async (id: string, order: number) => {
    await fetch(`/api/${collegeSlug}/admin/home/slider/${id}`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/slider`] });
  };

  const handleUploadAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliationFile || !affiliationName) return;
    setLoading(true);
    try {
      const logoUrl = await uploadToSupabase(affiliationFile, 'home', collegeSlug!);
      const res = await fetch(`/api/${collegeSlug}/admin/home/affiliations`, { 
        method: "POST", 
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: affiliationName, link: affiliationLink, logoUrl })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Affiliation added" });
        setAffiliationFile(null); setAffiliationName(""); setAffiliationLink("");
        if (document.getElementById("affiliation-upload")) (document.getElementById("affiliation-upload") as HTMLInputElement).value = "";
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/affiliations`] });
        queryClient.invalidateQueries({ queryKey: ["home-content", collegeSlug] });
      }
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleDeleteAffiliation = async (id: string) => {
    if (!confirm("Delete affiliation?")) return;
    const res = await fetch(`/api/${collegeSlug}/admin/home/affiliations/${id}`, { method: "DELETE", headers: adminHeaders() });
    if (res.ok) {
      toast({ title: "Deleted" });
      queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/affiliations`] });
    }
  };

  const toggleAffiliationStatus = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/${collegeSlug}/admin/home/affiliations/${id}`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/affiliations`] });
  };

  const updateAffiliationOrder = async (id: string, order: number) => {
    await fetch(`/api/${collegeSlug}/admin/home/affiliations/${id}`, {
      method: "PATCH",
      headers: { ...adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/affiliations`] });
  };

  const handleAddStat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatLabel || !newStatNumber) return;
    setLoading(true);
    try {
      let iconUrl = "";
      if (newStatFile) iconUrl = await uploadToSupabase(newStatFile, 'home', collegeSlug!) || "";
      const res = await fetch(`/api/${collegeSlug}/admin/home/stats`, { 
        method: "POST", 
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ label: newStatLabel, number: newStatNumber, icon: newStatIcon, color: newStatColor, iconUrl })
      });
      if (res.ok) {
        toast({ title: "Success" });
        setNewStatLabel(""); setNewStatNumber(""); setNewStatFile(null);
        if (document.getElementById("new-stat-icon")) (document.getElementById("new-stat-icon") as HTMLInputElement).value = "";
        queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/stats`] });
      }
    } catch (error) { toast({ title: "Error", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleDeleteStat = async (id: string) => {
    if (!confirm("Delete statistic?")) return;
    await fetch(`/api/${collegeSlug}/admin/home/stats/${id}`, { method: "DELETE", headers: adminHeaders() });
    toast({ title: "Deleted" });
    queryClient.invalidateQueries({ queryKey: [`/api/${collegeSlug}/admin/home/stats`] });
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

                <div className="grid gap-6 md:grid-cols-2 mt-6">
                  {/* Section A — Hero Tagline Toggle */}
                  <div className="border rounded-xl p-4 space-y-3 bg-secondary/10">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2 text-primary">
                        <Star className="w-4 h-4 fill-primary" /> Hero Tagline
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Show on homepage</span>
                        <Switch checked={editedContent.heroTaglineEnabled} 
                          onCheckedChange={checked => updateContent('heroTaglineEnabled', checked)} />
                      </label>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Tagline Text</Label>
                      <Input value={editedContent.heroTagline || ''}
                        onChange={e => updateContent('heroTagline', e.target.value)}
                        placeholder="e.g. Highest Merit Commerce College in Karachi" />
                    </div>
                    <p className="text-[10px] text-neutral-400 italic">
                      Appears at the bottom of the hero section as a highlighted glass badge.
                    </p>
                  </div>

                  {/* Section C — Multi-Link Examination System */}
                  {/* Examination Papers Manager */}
                  <div className="border rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                      <div>
                        <h4 className="font-bold flex items-center gap-2 text-lg text-primary">
                          <FolderPlus className="w-5 h-5" /> Examination Papers Manager
                        </h4>
                        <p className="text-xs text-muted-foreground">Manage groups, classes, and assign PDFs.</p>
                      </div>
                      
                      {/* Global Settings */}
                      <div className="flex items-center gap-4 bg-primary/5 p-2 rounded-lg border border-primary/10">
                        <label className="flex items-center gap-2 cursor-pointer border-r pr-4">
                          <span className="text-[10px] text-neutral-500 uppercase font-black">Visible</span>
                          <Switch 
                            checked={editedContent?.examSectionEnabled ?? true} 
                            onCheckedChange={checked => updateContent('examSectionEnabled', checked)} 
                          />
                        </label>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] text-neutral-500 uppercase font-black">Heading:</span>
                          <Input 
                            value={editedContent?.examSectionHeading || ''}
                            onChange={e => updateContent('examSectionHeading', e.target.value)}
                            placeholder="e.g. Examination Papers"
                            className="h-7 text-[11px] bg-transparent border-none focus-visible:ring-0 p-0 font-bold text-primary"
                          />
                        </div>
                      </div>

                      <Button type="button" onClick={addExamGroup} size="sm" className="font-bold">
                        <Plus className="w-4 h-4 mr-2" /> Add Group
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {examGroups.map((group, gIdx) => (
                        <div key={group.id} className="border-2 border-primary/20 bg-primary/5 p-4 rounded-xl space-y-3">
                          {/* Group Header */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 flex gap-2">
                              <Input 
                                value={group.title} 
                                onChange={e => updateGroup(group.id, 'title', e.target.value)}
                                className="font-bold bg-white text-primary text-sm h-8"
                                placeholder="Group Name (e.g. Preliminary 2026)"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch checked={group.is_enabled} onCheckedChange={c => updateGroup(group.id, 'is_enabled', c)} />
                              <Button type="button" variant="ghost" size="icon" onClick={() => deleteGroup(group.id)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Classes within Group */}
                          <div className="pl-6 border-l-2 border-primary/20 space-y-3 mt-2">
                            {group.classes?.map((cls: any) => (
                              <div key={cls.id} className="bg-white border p-3 rounded-lg space-y-2">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                                  <span>📚 {cls.class_name}</span>
                                  <button type="button" onClick={() => deleteClass(cls.id)} className="text-red-500 hover:underline text-xs">Remove Class</button>
                                </div>
                                
                                {/* Subjects in Class */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                  {cls.subjects?.map((sub: any) => (
                                    <div key={sub.id} className="flex items-center justify-between bg-slate-50 border p-2 rounded text-xs">
                                      <span className="font-semibold line-clamp-1 flex-1">{sub.subject_name}</span>
                                      <button type="button" onClick={() => deleteSubject(sub.id)} className="text-red-500 hover:text-red-700 ml-2">
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Add Subject/Upload PDF */}
                                <div className="flex gap-2 mt-2 pt-2 border-t">
                                  <Input 
                                    value={newSubjectName[cls.id] || ""}
                                    onChange={e => setNewSubjectName(p => ({...p, [cls.id]: e.target.value}))}
                                    placeholder="Subject Name (e.g. Physics)"
                                    className="h-7 text-xs flex-1"
                                  />
                                  <Button type="button" size="sm" variant="secondary" className="h-7 text-xs font-bold" onClick={() => handleUploadPDF(cls.id)}>
                                    <UploadCloud className="w-3 h-3 mr-1" /> Upload PDF
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Add Class */}
                            <div className="flex gap-2 mt-2">
                              <Input 
                                value={newClassName[group.id] || ""}
                                onChange={e => setNewClassName(p => ({...p, [group.id]: e.target.value}))}
                                placeholder="New Class Name (e.g. Class 11)"
                                className="h-8 text-sm max-w-[200px]"
                              />
                              <Button type="button" size="sm" variant="outline" className="h-8 text-xs font-bold bg-white" onClick={() => addExamClass(group.id)}>
                                <Plus className="w-3 h-3 mr-1" /> Add Class
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {examGroups.length === 0 && (
                        <div className="text-center p-6 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                          No exam groups added. Start by creating your first group above.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section B — Academic Programs */}
                  <div className="border rounded-xl p-5 md:col-span-2 space-y-5 bg-card shadow-sm mt-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h4 className="font-bold flex items-center gap-2 text-lg">
                          <Plus className="w-5 h-5 text-primary" /> Academic Programs Section
                        </h4>
                        <p className="text-xs text-muted-foreground">Showcase your departments and subject offerings.</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer bg-secondary/50 px-3 py-1.5 rounded-full">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Show Section</span>
                        <Switch checked={editedContent.academicSectionEnabled ?? true}
                          onCheckedChange={checked => updateContent('academicSectionEnabled', checked)} />
                      </label>
                    </div>

                    {/* Section headings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">Section Heading</Label>
                        <Input value={editedContent.academicSectionHeading || ''}
                          onChange={e => updateContent('academicSectionHeading', e.target.value)}
                          placeholder="Academic Programs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">Section Subheading</Label>
                        <Input value={editedContent.academicSectionSubheading || ''}
                          onChange={e => updateContent('academicSectionSubheading', e.target.value)}
                          placeholder="Excellence in Education" />
                      </div>
                    </div>

                    {/* Programs list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {programs.map((prog, index) => (
                        <div key={prog.id} className="border-2 border-dashed border-neutral-100 rounded-2xl p-4 bg-neutral-50/50 space-y-3 relative group">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Program #{index + 1}</span>
                            <button onClick={() => deleteProgram(prog.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Program Name</Label>
                              <Input value={prog.title}
                                onChange={e => updateProgram(prog.id, 'title', e.target.value)}
                                placeholder="e.g. Pre-Engineering"
                                className="h-9 text-sm" />
                            </div>
                            
                            <div>
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Subjects (Comma Separated)</Label>
                              <Input value={prog.subjects}
                                onChange={e => updateProgram(prog.id, 'subjects', e.target.value)}
                                placeholder="Math, Physics, Chemistry..."
                                className="h-9 text-sm" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Icon</Label>
                                <select value={prog.icon}
                                  onChange={e => updateProgram(prog.id, 'icon', e.target.value)}
                                  className="w-full border rounded-md px-2 h-9 text-sm bg-background">
                                  <option value="Cog">⚙️ Gear</option>
                                  <option value="Microscope">🔬 Microscope</option>
                                  <option value="Laptop">💻 Laptop</option>
                                  <option value="TrendingUp">📈 Graph</option>
                                  <option value="BookOpen">📖 Book</option>
                                  <option value="FlaskConical">🧪 Flask</option>
                                  <option value="Calculator">🧮 Calculator</option>
                                  <option value="Star">⭐ Star</option>
                                  <option value="Palette">🎨 Palette</option>
                                  <option value="Music">🎵 Music</option>
                                </select>
                              </div>
                              <div className="flex items-end">
                                <Button onClick={() => saveProgram(prog)} variant="default" size="sm" className="w-full h-9">
                                  <Save className="w-3.5 h-3.5 mr-2" /> Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button onClick={addProgram}
                        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/20 text-primary rounded-2xl p-6 hover:bg-primary/5 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm tracking-tight text-primary">Add New Program</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" disabled={loading} className="w-full md:w-auto bg-primary text-white shadow-lg hover:shadow-xl transition-all">
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save All Hero & Text Changes
                  </Button>
                </div>
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
