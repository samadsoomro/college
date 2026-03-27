import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Trash2,
  Plus,
  GripVertical,
  Save,
  Upload,
  Image as ImageIcon,
  LayoutGrid,
  LayoutList,
  History,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, adminHeaders } from "@/contexts/AuthContext";
import { uploadToSupabase } from "@/utils/upload";
import { useCollege } from "@/contexts/CollegeContext";

const AdminHistory: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { toast } = useToast();
  const { settings } = useCollege();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const { isAdmin } = useAuth();

  // Page Header State
  const [header, setHeader] = useState({ title: "", subtitle: "" });

  // Sections State
  const [sections, setSections] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<any | null>(null);

  // Gallery State
  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryCaption, setGalleryCaption] = useState("");

  const ICON_OPTIONS = [
    "Calendar",
    "Award",
    "BookOpen",
    "Users",
    "Clock",
    "Library",
    "Book",
    "GraduationCap",
    "Building",
    "History",
    "Landmark",
  ];

  const fetchData = async () => {
    try {
      const ts = Date.now();
      const [pageRes, sectionsRes, galleryRes] = await Promise.all([
        fetch(`/api/${collegeSlug}/history/page?t=${ts}`, { headers: adminHeaders() }),
        fetch(`/api/${collegeSlug}/history/sections?t=${ts}`, { headers: adminHeaders() }),
        fetch(`/api/${collegeSlug}/history/gallery?t=${ts}`, { headers: adminHeaders() }),
      ]);

      if (pageRes.ok) setHeader(await pageRes.json());
      if (sectionsRes.ok) setSections(await sectionsRes.json());
      if (galleryRes.ok) setGallery(await galleryRes.json());
    } catch (error) {
      console.error("Failed to fetch history data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/history/page`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(header),
      });
      if (res.ok) {
        toast({ title: "Success", description: "History header updated" });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update header",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpsertSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = editingSection.imageUrl;
      if (editingSection.imageFile) {
        imageUrl = await uploadToSupabase(editingSection.imageFile, 'history', collegeSlug!);
      }

      const payload = { ...editingSection, imageUrl };
      delete payload.imageFile;

      const res = await fetch(`/api/${collegeSlug}/admin/history/sections`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Section saved successfully" });
        setEditingSection(null);
        fetchData();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save section",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/history/sections/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN || 'gcfm-admin-token-2026'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Delete failed', variant: 'destructive' });
        return;
      }
      toast({ title: 'Deleted successfully' });
      await fetchData();
    } catch (err) {
      toast({ title: 'Network Error', description: 'Could not connect to server', variant: 'destructive' });
    }
  };

  const handleUploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryFile) return;

    setLoading(true);
    try {
      const imageUrl = await uploadToSupabase(galleryFile, 'history-gallery', collegeSlug!);
      if (!imageUrl) throw new Error("Upload failed");

      const res = await fetch(`/api/${collegeSlug}/admin/history/gallery`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageUrl, 
          caption: galleryCaption,
          displayOrder: gallery.length
        }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Gallery image uploaded" });
        setGalleryFile(null);
        setGalleryCaption("");
        const fileInput = document.getElementById(
          "gallery-upload",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        fetchData();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/history/gallery/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN || 'gcfm-admin-token-2026'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Delete failed', variant: 'destructive' });
        return;
      }
      toast({ title: 'Deleted successfully' });
      await fetchData();
    } catch (err) {
      toast({ title: 'Network Error', description: 'Could not connect to server', variant: 'destructive' });
    }
  };

  const IconComponent = ({
    name,
    size = 24,
  }: {
    name: string;
    size?: number;
  }) => {
    const Icon = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <Icon size={size} />;
  };

  if (!isAdmin) return <div className="p-8 text-center text-rose-500 font-bold">Unauthorized</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {settings?.termInstitution || 'College'} History
          </h2>
          <p className="text-muted-foreground">
            Manage the content and media for the institution's history page.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
          <History size={16} />
          <span>CMS Module</span>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        {/* Header Tab */}
        <TabsContent value="header">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Page Header</CardTitle>
              <CardDescription>
                Edit the main title and introductory text.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleHeaderSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Main Title</Label>
                  <Input
                    id="title"
                    value={header.title}
                    onChange={(e) =>
                      setHeader({ ...header, title: e.target.value })
                    }
                    placeholder={`e.g. History of ${settings?.instituteShortName || 'Institution'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle / Intro Text</Label>
                  <Textarea
                    id="subtitle"
                    value={header.subtitle}
                    onChange={(e) =>
                      setHeader({ ...header, subtitle: e.target.value })
                    }
                    placeholder="Enter a brief introduction..."
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() =>
                setEditingSection({
                  title: "",
                  description: "",
                  iconName: "BookOpen",
                  layoutType: "grid",
                  displayOrder: sections.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Section
            </Button>
          </div>

          {editingSection && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>
                  {editingSection.id ? "Edit Section" : "New Section"}
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleUpsertSection}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Section Title</Label>
                      <Input
                        value={editingSection.title}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select
                        value={editingSection.iconName}
                        onValueChange={(val) =>
                          setEditingSection({
                            ...editingSection,
                            iconName: val,
                          })
                        }
                      >
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <IconComponent
                              name={editingSection.iconName}
                              size={16}
                            />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                <IconComponent name={icon} size={16} />
                                {icon}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editingSection.description}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Layout Type</Label>
                      <Select
                        value={editingSection.layoutType}
                        onValueChange={(val) =>
                          setEditingSection({
                            ...editingSection,
                            layoutType: val,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">
                            <div className="flex items-center gap-2">
                              <LayoutGrid size={16} /> Grid (Half Width)
                            </div>
                          </SelectItem>
                          <SelectItem value="full">
                            <div className="flex items-center gap-2">
                              <LayoutList size={16} /> Full Width
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Section Image (Optional)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              imageFile: e.target.files?.[0],
                            })
                          }
                        />
                        {editingSection.imageUrl && (
                          <img
                            src={editingSection.imageUrl}
                            className="h-10 w-10 rounded object-cover shadow border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingSection(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Section"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          <div className="grid gap-4">
            {sections.map((section, index) => (
              <Card
                key={section.id}
                className="border-primary/10 hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    {section.imageUrl ? (
                      <img
                        src={section.imageUrl}
                        alt={section.title}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    ) : (
                      <IconComponent name={section.iconName} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{section.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 text-wrap break-words">
                      {section.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-secondary rounded uppercase font-medium">
                      {section.layoutType}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingSection(section)}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Add Gallery Image</CardTitle>
              <CardDescription>
                Upload historic photos for the history page slider.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUploadGallery}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Image File</Label>
                    <Input
                      id="gallery-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setGalleryFile(e.target.files?.[0] || null)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Caption (Optional)</Label>
                    <Input
                      value={galleryCaption}
                      onChange={(e) => setGalleryCaption(e.target.value)}
                      placeholder="Enter photo caption..."
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading || !galleryFile}>
                  {loading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Upload Photo
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-video rounded-lg overflow-hidden border border-primary/10 shadow-sm"
              >
                <img
                  src={item.imageUrl}
                  className="w-full h-full object-cover"
                  alt={item.caption || "Gallery image"}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteGallery(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {item.caption && (
                    <p className="text-white text-xs truncate">
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHistory;
