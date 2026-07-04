import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { uploadToSupabase } from "@/utils/upload";

const AdminProjects = () => {
  const { collegeSlug } = useParams();
  const { toast } = useToast();
  const adminToken = import.meta.env.VITE_ADMIN_TOKEN || 'gcfm-admin-token-2026';
  const [projects, setProjects] = useState<any[]>([]);
  const [settings, setSettings] = useState({ projectsDeptHeading: '', showMyResearch: true, showProjectsMenu: true });
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', researcherName: '', classBatch: '',
    supervisor: '', department: '', description: '',
    pdfUrl: '', publishDate: ''
  });

  const fetchAll = async () => {
    const [projRes, settingsRes] = await Promise.all([
      fetch(`/api/${collegeSlug}/admin/projects`, { headers: { 'x-admin-token': adminToken } }),
      fetch(`/api/${collegeSlug}/settings`)
    ]);
    if (projRes.ok) setProjects(await projRes.json());
    if (settingsRes.ok) {
      const s = await settingsRes.json();
      setSettings({ 
        projectsDeptHeading: s.projectsDeptHeading || '', 
        showMyResearch: s.showMyResearch ?? true,
        showProjectsMenu: s.showProjectsMenu ?? true
      });
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const saveSettings = async () => {
    await fetch(`/api/${collegeSlug}/admin/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ 
        projectsDeptHeading: settings.projectsDeptHeading, 
        showMyResearch: settings.showMyResearch,
        showProjectsMenu: settings.showProjectsMenu 
      })
    });
    toast({ title: '✅ Settings saved!' });
  };

  const handleSubmit = async () => {
    const method = editProject ? 'PATCH' : 'POST';
    const url = editProject
      ? `/api/${collegeSlug}/admin/projects/${editProject.id}`
      : `/api/${collegeSlug}/admin/projects`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast({ title: editProject ? '✅ Project updated!' : '✅ Project added!' });
      setShowForm(false);
      setEditProject(null);
      setForm({ title: '', researcherName: '', classBatch: '', supervisor: '', department: '', description: '', pdfUrl: '', publishDate: '' });
      fetchAll();
    }
  };

  const toggleVisibility = async (project: any) => {
    await fetch(`/api/${collegeSlug}/admin/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ isVisible: !project.is_visible })
    });
    fetchAll();
  };

  const deleteProject = async (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    await fetch(`/api/${collegeSlug}/admin/projects/${id}`, {
      method: 'DELETE', headers: { 'x-admin-token': adminToken }
    });
    toast({ title: 'Project deleted' });
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📋 Projects Manager</h2>

      {/* Settings Card */}
      <div className="border rounded-xl p-5 space-y-4 bg-white dark:bg-neutral-900">
        <h3 className="font-semibold text-lg">⚙️ Projects Settings</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">Department Heading</label>
          <input type="text"
            value={settings.projectsDeptHeading}
            onChange={e => setSettings(prev => ({ ...prev, projectsDeptHeading: e.target.value }))}
            placeholder="e.g. Statistics & Computer Science Dept."
            className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center justify-between border rounded-lg px-4 py-3">
            <div>
              <p className="font-medium text-sm">🔬 My Research (AI Study)</p>
              <p className="text-xs text-neutral-400">Show Abdul Samad's live research as first card</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={settings.showMyResearch}
                onChange={e => setSettings(prev => ({ ...prev, showMyResearch: e.target.checked }))}
                className="w-4 h-4" />
              <span className="text-sm">{settings.showMyResearch ? 'ON' : 'OFF'}</span>
            </label>
          </div>

          <div className="flex-1 flex items-center justify-between border rounded-lg px-4 py-3">
            <div>
              <p className="font-medium text-sm">🔗 Show in Navbar</p>
              <p className="text-xs text-neutral-400">Display "Projects" link in public header</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={settings.showProjectsMenu}
                onChange={e => setSettings(prev => ({ ...prev, showProjectsMenu: e.target.checked }))}
                className="w-4 h-4" />
              <span className="text-sm">{settings.showProjectsMenu ? 'ON' : 'OFF'}</span>
            </label>
          </div>
        </div>

        <button onClick={saveSettings}
          className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
          💾 Save Settings
        </button>
      </div>

      {/* Add Project Button */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">📁 Uploaded Projects ({projects.length})</h3>
        <button onClick={() => { setShowForm(true); setEditProject(null); }}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
          ➕ Add Project
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="border-2 border-primary/20 rounded-xl p-5 space-y-4 bg-white dark:bg-neutral-900">
          <h4 className="font-semibold">{editProject ? '✏️ Edit Project' : '➕ New Project'}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Project Title *</label>
              <input type="text" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium">Researcher Name *</label>
              <input type="text" value={form.researcherName}
                onChange={e => setForm(p => ({ ...p, researcherName: e.target.value }))}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium">Class & Batch</label>
              <input type="text" value={form.classBatch}
                onChange={e => setForm(p => ({ ...p, classBatch: e.target.value }))}
                placeholder="e.g. Class 12 (CS), Batch 2024–2026"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium">Supervised By</label>
              <input type="text" value={form.supervisor}
                onChange={e => setForm(p => ({ ...p, supervisor: e.target.value }))}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <input type="text" value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium">Publish Date</label>
              <input type="date" value={form.publishDate}
                onChange={e => setForm(p => ({ ...p, publishDate: e.target.value }))}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-transparent" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Short Description</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="2-3 lines describing the project..."
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-transparent" />
          </div>

          <div>
            <label className="text-sm font-medium">Upload Project PDF (via Cloudinary)</label>
            <input type="file" accept=".pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const url = await uploadToSupabase(file, 'projects', collegeSlug || '');
                  setForm(p => ({ ...p, pdfUrl: url }));
                  toast({ title: '✅ PDF uploaded!' });
                } catch (err: any) {
                  toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
                } finally { setUploading(false); }
              }}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-transparent" />
            {uploading && <p className="text-xs text-primary mt-1">⏳ Uploading to Cloudinary...</p>}
            {form.pdfUrl && (
              <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 block">
                ✅ PDF uploaded — click to preview
              </a>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
              {editProject ? '✅ Update Project' : '✅ Add Project'}
            </button>
            <button onClick={() => { setShowForm(false); setEditProject(null); }}
              className="px-5 py-2 border rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-3">
        {projects.map(proj => (
          <div key={proj.id}
            className="border rounded-xl p-4 flex items-start justify-between gap-4 bg-white dark:bg-neutral-900">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{proj.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${proj.is_visible ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400'}`}>
                  {proj.is_visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                👤 {proj.researcher_name} {proj.class_batch ? `— ${proj.class_batch}` : ''}
              </p>
              {proj.supervisor && <p className="text-xs text-neutral-400">🎓 {proj.supervisor}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleVisibility(proj)}
                className={`px-2 py-1 rounded text-xs font-medium ${proj.is_visible ? 'bg-neutral-100 text-neutral-600' : 'bg-green-100 text-green-700'}`}>
                {proj.is_visible ? '👁️ Hide' : '👁️ Show'}
              </button>
              <button onClick={() => { setEditProject(proj); setForm({ title: proj.title, researcherName: proj.researcher_name, classBatch: proj.class_batch, supervisor: proj.supervisor, department: proj.department, description: proj.description, pdfUrl: proj.pdf_url || '', publishDate: proj.publish_date || '' }); setShowForm(true); }}
                className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                ✏️ Edit
              </button>
              <button onClick={() => deleteProject(proj.id)}
                className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8 text-neutral-400 border-2 border-dashed rounded-xl text-sm">
            No projects yet. Click "➕ Add Project" to add your first one.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProjects;
