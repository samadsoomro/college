import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Shield,
  Mail,
  Lock,
  Key,
  Save,
  RefreshCcw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useBranding } from "@/contexts/BrandingContext";

const AdminCredentials: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [credentials, setCredentials] = useState({
    adminEmail: "",
    secretKey: "",
    isFixed: false,
    updatedAt: "",
  });
  const [formData, setFormData] = useState({
    adminEmail: "",
    password: "",
    confirmPassword: "",
    currentPassword: "",
  });

  const { settings } = useBranding();

  const generateAdminPDF = (newEmail: string, newPass?: string) => {
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      // Header Background (matching the blue design)
      doc.setFillColor(31, 107, 229); // #1f6be5
      doc.rect(0, 0, 210, 40, "F");

      // Institute Name & Logo Placeholder
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(settings.instituteFullName || "GCMN COLLEGE", 15, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Admin Credentials Backup • CONFIDENTIAL", 15, 30);

      doc.setFontSize(9);
      doc.text(`Generated: ${timestamp}`, 15, 37);

      // Main Card (Login Details)
      doc.setTextColor(31, 107, 229);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("LOGIN DETAILS", 20, 60);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 63, 190, 63);

      autoTable(doc, {
        startY: 70,
        theme: "plain",
        styles: { fontSize: 11, cellPadding: 8 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold", textColor: [100, 100, 100] },
          1: { textColor: [31, 107, 229], fontStyle: "bold" },
        },
        body: [
          ["Admin Email", newEmail],
          ["Password", newPass || "(No change)"],
          ["Secret Key", "CMS-CORE-SECURE-2026"],
          ["Last Updated", timestamp],
        ],
      });

      // Security Notice
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFillColor(255, 251, 235); // amber-50
      doc.setDrawColor(252, 211, 77); // amber-200
      doc.roundedRect(15, finalY, 180, 25, 3, 3, "FD");

      doc.setTextColor(146, 64, 14); // amber-800
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("!    Security Notice", 25, finalY + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        "Keep this document in a safe place. Do not share it with anyone. Destroy after memorising.",
        25,
        finalY + 18,
      );

      doc.save(`Admin_Credentials_${settings.instituteShortName}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    }
  };

  const fetchCredentials = async () => {
    try {
      const res = await fetch("/api/admin/credentials", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
        setFormData((prev) => ({
          ...prev,
          adminEmail: data.adminEmail,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.currentPassword) {
      toast({
        title: "Required",
        description: "Please enter your current password to save changes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: formData.adminEmail,
          password: formData.password || undefined,
          currentPassword: formData.currentPassword,
        }),
        credentials: "include",
      });

      if (res.ok) {
        toast({
          title: "Success",
          description:
            "Credentials updated successfully. If you changed your password, please use the new one for next login.",
        });
        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
          currentPassword: "",
        }));
        fetchCredentials();
        generateAdminPDF(formData.adminEmail, formData.password || undefined);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to update credentials");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    formData.adminEmail !== credentials.adminEmail || formData.password !== "";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-neutral-900 tracking-tight">
            Admin Credentials
          </h2>
          <p className="text-neutral-500 mt-2 font-medium">
            Manage your secure login details and system access points.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 max-w-md">
            <CheckCircle2 className="text-blue-600 shrink-0" size={20} />
            <p className="text-xs text-blue-800 font-medium">
              Secret Key is fixed to{" "}
              <span className="font-black">CMS-CORE-SECURE-2026</span> and
              cannot be changed.
            </p>
          </div>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
            <AlertCircle size={14} />
            <span className="text-xs font-bold">
              Changing admin credentials affects future logins.
            </span>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border-none bg-white shadow-xl shadow-neutral-200/40 overflow-hidden ring-1 ring-neutral-200/60 p-8">
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
          {/* Login Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                Primary Access
              </span>
              <span className="h-[1px] flex-1 bg-neutral-100"></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-neutral-700 flex items-center gap-2">
                  <Mail size={14} className="text-primary" /> Admin Email
                </label>
                <Input
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="h-12 rounded-xl"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-neutral-700 flex items-center gap-2">
                  <Key size={14} className="text-blue-600" /> Secret Key (Fixed)
                </label>
                <div className="relative">
                  <Input
                    type={showSecretKey ? "text" : "password"}
                    name="secretKey"
                    value={credentials.secretKey}
                    readOnly
                    className="h-12 rounded-xl pr-12 bg-blue-50 text-blue-900 cursor-not-allowed font-mono font-bold border-blue-200"
                  />
                  <div className="absolute right-2 top-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> This value is system-protected and
                  cannot be modified
                </p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                Security Update
              </span>
              <span className="h-[1px] flex-1 bg-neutral-100"></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-neutral-700 flex items-center gap-2">
                  <Lock size={14} className="text-emerald-600" /> New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 rounded-xl pr-12"
                    placeholder="Leave blank to keep same"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1.5 h-9 w-9 rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-neutral-700 flex items-center gap-2">
                  <Lock size={14} className="text-emerald-600" /> Confirm New
                  Password
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-12 rounded-xl"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>

          {/* Verification & Submit */}
          <div className="pt-8 border-t border-neutral-100 space-y-6">
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="space-y-2 flex-1 w-full">
                  <label className="text-sm font-black text-primary flex items-center gap-2">
                    <Shield size={16} /> Confirm Current Password
                  </label>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="h-12 rounded-xl bg-white border-primary/20 focus:border-primary"
                    placeholder="Enter your current password to authorize"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !hasChanges}
                  className="h-14 px-8 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all gap-2 min-w-[200px]"
                >
                  {loading ? (
                    <RefreshCcw size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            {credentials.updatedAt && (
              <p className="text-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Last updated: {new Date(credentials.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminCredentials;
