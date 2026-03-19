import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, Save, Loader2, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminHeaders, uploadToSupabase } from "@/contexts/AuthContext";
import { useCollege } from "@/contexts/CollegeContext";

interface FacultyMember { id: string; name: string; designation: string; description?: string; imageUrl?: string; }

const AdminFaculty: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings } = useCollege();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", designation: "", description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchFaculty(); }, []);

  const fetchFaculty = async () => {
    try { const res = await api.get(`/api/${collegeSlug}/faculty`); setFaculty(res.data); } 
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isProd = window.location.hostname !== 'localhost';
      let imageUrl = faculty.find(f => f.id === editingId)?.imageUrl || null;

      if (imageFile && isProd) {
        imageUrl = await uploadToSupabase(imageFile, settings.storageBucket || 'colleges');
      }

      const body = { ...formData, imageUrl };
      const endpoint = `/api/${collegeSlug}/admin/faculty${editingId ? `/${editingId}` : ''}`;
      
      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: adminHeaders(),
        body: JSON.stringify(body),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to save faculty member");

      toast({ title: "Success", description: "Faculty member saved." });
      setIsDialogOpen(false);
      fetchFaculty();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/faculty/${id}`, {
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
      await fetchFaculty();
    } catch (err) {
      toast({ title: 'Network Error', description: 'Could not connect to server', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Faculty Management</h1>
        <Button onClick={() => { setEditingId(null); setFormData({name:"", designation:"", description:""}); setImageFile(null); setIsDialogOpen(true); }} className="gap-2"><Plus size={16}/> Add Member</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Faculty Member</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input placeholder="Designation" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} required />
            <Textarea placeholder="Bio" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Photo {window.location.hostname !== 'localhost' && " (Supabase storage)"}</label>
              <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <RefreshCcw className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>} Save Member
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? <div className="text-center py-20 font-bold text-muted-foreground animate-pulse">Loading Faculty...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculty.map(member => (
            <Card key={member.id} className="overflow-hidden group">
              <div className="aspect-[4/3] bg-muted relative">
                {member.imageUrl ? <img src={member.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Photo</div>}
              </div>
              <CardContent className="p-4 flex justify-between items-start">
                <div><h3 className="font-bold">{member.name}</h3><p className="text-xs text-primary">{member.designation}</p></div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingId(member.id); setFormData({name:member.name, designation:member.designation, description:member.description||""}); setIsDialogOpen(true); }}><Edit size={14}/></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(member.id)}><Trash2 size={14}/></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFaculty;
