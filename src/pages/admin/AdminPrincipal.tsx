import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Save, RefreshCcw } from "lucide-react";
import { adminHeaders, uploadToSupabase } from "@/contexts/AuthContext";
import { useCollege } from "@/contexts/CollegeContext";

const AdminPrincipal: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings } = useCollege();
  const [formData, setFormData] = useState({ name: "", message: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(`/api/${collegeSlug}/principal`);
      if (res.data) {
        setFormData({ name: res.data.name || "", message: res.data.message || "" });
        setCurrentImageUrl(res.data.imageUrl);
      }
    } catch (e) { console.error(e); } finally { setFetching(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isProd = window.location.hostname !== 'localhost';
      let imageUrl = currentImageUrl;

      if (imageFile && isProd) {
        imageUrl = await uploadToSupabase(imageFile, settings.storageBucket || 'colleges');
      }

      const res = await fetch(`/api/${collegeSlug}/admin/principal`, {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ ...formData, imageUrl }),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to update principal");

      toast({ title: "Success", description: "Principal information updated." });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (fetching) return <div className="text-center py-20 animate-pulse">Loading Principal Data...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Principal Management</h1>
      <Card>
        <CardHeader><CardTitle>Update Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="min-h-[200px]" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo {window.location.hostname !== 'localhost' && " (Supabase storage)"}</label>
              <div className="flex items-center gap-4">
                {currentImageUrl && <img src={currentImageUrl} className="w-16 h-16 rounded object-cover border" />}
                <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <RefreshCcw className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>} Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPrincipal;
