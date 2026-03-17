import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Menu,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface College {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

const SuperAdminDashboard: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    slug: "",
    adminEmail: "",
    adminPassword: "",
  });

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const res = await fetch("/api/super-admin/colleges", {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setColleges(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        navigate("/super-admin/login");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch colleges",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check for duplicate slug BEFORE submitting
      const slugCheck = await fetch(`/api/colleges/${formData.slug}`);
      if (slugCheck.ok) {
        toast({
          title: "Error",
          description: "This slug already exists. Choose a different one.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/super-admin/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ 
          title: "Success", 
          description: `College created! Visit at /${formData.slug}` 
        });
        setIsAddModalOpen(false);
        setFormData({ name: "", shortName: "", slug: "", adminEmail: "", adminPassword: "" });
        fetchColleges();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create college", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCollege = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? All data will be permanently removed.`)) return;

    try {
      const res = await fetch(`/api/super-admin/colleges/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "College removed from system" });
        fetchColleges();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete college", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/super-admin/logout", { method: "POST" });
    navigate("/super-admin/login");
  };

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 ${isNavOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-slate-800`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          {isNavOpen && <span className="font-bold text-lg tracking-tight">Super Control</span>}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === "overview" ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            {isNavOpen && <span>Overview</span>}
          </button>
          <button
            onClick={() => setActiveTab("colleges")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === "colleges" ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Building2 size={20} />
            {isNavOpen && <span>Colleges</span>}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === "settings" ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={20} />
            {isNavOpen && <span>System Settings</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            {isNavOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
               onClick={() => setIsNavOpen(!isNavOpen)}
               className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors md:block hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-slate-500 border-slate-200 px-3 py-1 bg-slate-50">
              v2.4.0 Production
            </Badge>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Colleges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{colleges.length}</div>
                    <p className="text-xs mt-1 opacity-70">Active SaaS tenants</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2 text-slate-500">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider">System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="w-8 h-8" />
                      Healthy
                    </div>
                    <p className="text-xs mt-1 text-slate-400">All services operational</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2 text-slate-500">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider">Storage Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800">1.2 GB</div>
                    <p className="text-xs mt-1 text-slate-400">Total assets across buckets</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-bold">Recent Registrations</CardTitle>
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {colleges.slice(0, 5).map(college => (
                        <div key={college.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                              {college.shortName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{college.name}</p>
                              <p className="text-xs text-slate-500">Slug: {college.slug}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      ))}
                      {colleges.length === 0 && <p className="text-sm text-center py-4 text-slate-400">No colleges registered yet.</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <Button onClick={() => setIsAddModalOpen(true)} className="h-24 flex flex-col gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border-dashed border-2 border-slate-200 shadow-none">
                      <Plus className="w-6 h-6 text-primary" />
                      Add New College
                    </Button>
                    <Button onClick={() => setActiveTab("colleges")} variant="outline" className="h-24 flex flex-col gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200">
                      <Building2 className="w-6 h-6 text-blue-500" />
                      Manage Tenants
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "colleges" && (
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 py-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold">Manage Colleges</CardTitle>
                  <CardDescription>Directory of all college instances in the system</CardDescription>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/90 hidden sm:flex">
                  <Plus className="mr-2 h-4 w-4" />
                  Register New College
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 w-full max-w-sm">
                  <Search size={18} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or slug..."
                    className="bg-transparent border-none outline-none text-sm flex-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700">College Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Slug</TableHead>
                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                        <TableHead className="font-bold text-slate-700">Short Name</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredColleges.map((college) => (
                        <TableRow key={college.id} className="hover:bg-slate-50/80 transition-colors group">
                          <TableCell className="font-medium text-slate-800">{college.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-primary">{college.slug}</code>
                          </TableCell>
                          <TableCell>
                            <Badge className={college.isActive ? "bg-green-100 text-green-700 border-none" : "bg-red-100 text-red-700 border-none"}>
                              {college.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">{college.shortName}</TableCell>
                          <TableCell className="text-right space-x-2">
                             <a
                                href={`/${college.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all"
                                title="Open Website"
                              >
                                <ExternalLink size={16} />
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCollege(college.id, college.name)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                                title="Delete College"
                              >
                                <Trash2 size={16} />
                              </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredColleges.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center">
                            {isLoading ? (
                              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Building2 size={48} className="opacity-20" />
                                <p>No colleges found matching your search</p>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="border-none shadow-sm max-w-2xl">
              <CardHeader>
                <CardTitle>System Administration</CardTitle>
                <CardDescription>Universal settings for the SaaS platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                   <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Super User Credentials</h3>
                   <div className="grid gap-4">
                      <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-600">Email Address</label>
                         <Input value="super@admin.com" disabled className="bg-slate-50 border-slate-200" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-600">Root Password</label>
                         <Input type="password" value="********" disabled className="bg-slate-50 border-slate-200" />
                         <p className="text-xs text-slate-400 italic">Password changes must be authorized via environment variables.</p>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-200 space-y-4">
                   <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Storage Infrastructure</h3>
                   <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                         <LayoutDashboard className="text-primary" />
                         <div>
                            <p className="text-sm font-bold text-slate-800">Supabase Storage</p>
                            <p className="text-xs text-slate-500">Auto-bucket creation is active</p>
                         </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-none">Connected</Badge>
                   </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add College Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-none shadow-2xl overflow-hidden p-0">
          <form onSubmit={handleCreateCollege}>
            <div className="bg-slate-900 px-6 py-6 text-white border-b border-slate-800">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="text-primary" />
                Register New Instance
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                Configure a new college tenant in the system.
              </DialogDescription>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={14} />
                  Organization Details
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 ml-1">College Name</label>
                      <Input
                        placeholder="Harvard University"
                        className="bg-slate-50 border-slate-200 focus:ring-primary h-10"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 ml-1">Short Name</label>
                      <Input
                        placeholder="HARV"
                        className="bg-slate-50 border-slate-200 focus:ring-primary h-10"
                        value={formData.shortName}
                        onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1">Unique URL Slug</label>
                    <div className="relative">
                      <Input
                        placeholder="harvard"
                        className="bg-slate-50 border-slate-200 focus:ring-primary h-10 pl-16 font-mono text-sm"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium border-r border-slate-200 pr-2">cms.io/</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus size={14} />
                  Default Admin Access
                </h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1">Login Email</label>
                    <Input
                      type="email"
                      placeholder="admin@college.com"
                      className="bg-slate-50 border-slate-200 focus:ring-primary h-10"
                      value={formData.adminEmail}
                      onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1">System Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-slate-50 border-slate-200 focus:ring-primary h-10"
                      value={formData.adminPassword}
                      onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 min-w-[120px]" disabled={isLoading}>
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Deploy Instance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
