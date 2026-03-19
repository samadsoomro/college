import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  RefreshCw,
  Search,
  FileSpreadsheet,
  MapPin,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { adminHeaders } from "@/contexts/AuthContext";

interface LibraryCardApplication {
  id: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  dob: string | null;
  class: string;
  field: string | null;
  rollNo: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  status: string;
  cardNumber: string;
  studentId: string | null;
  issueDate: string | null;
  validThrough: string | null;
  createdAt: string;
  // Computed full address for display
  fullAddress?: string;
}

const Addresses = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [addresses, setAddresses] = useState<LibraryCardApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      // Reuse existing endpoint but filter for 'approved'
      // Note: We are mocking a specialized endpoint behavior by filtering client-side for now
      // per implementation plan to minimize backend churn unless massive data volume.
      const res = await fetch(`/api/${collegeSlug}/admin/student-addresses`, {
        headers: { ...adminHeaders() },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch addresses");
      const allData: LibraryCardApplication[] = await res.json();

      // De-duplicate by email, prioritizing 'approved' over 'suspended'
      const studentMap = new Map<string, LibraryCardApplication>();
      
      allData.forEach((app) => {
        const email = (app.email || "").toLowerCase();
        const status = (app.status || "").toLowerCase();
        
        if (status === "approved" || status === "suspended") {
          const existing = studentMap.get(email);
          if (!existing || (existing.status === "suspended" && status === "approved")) {
            studentMap.set(email, app);
          }
        }
      });

      const approvedOnly = Array.from(studentMap.values()).map((app) => ({
        ...app,
        fullAddress: [
          app.addressStreet,
          app.addressCity,
          app.addressState,
          app.addressZip,
        ]
          .filter((p) => p && p.trim().length > 0)
          .join(", "),
      }));

      setAddresses(approvedOnly);
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch addresses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const filteredAddresses = addresses.filter((app) => {
    const search = searchQuery.toLowerCase();
    return (
      app.cardNumber.toLowerCase().includes(search) ||
      app.firstName.toLowerCase().includes(search) ||
      app.lastName.toLowerCase().includes(search) ||
      app.email.toLowerCase().includes(search)
    );
  });

  const downloadExcel = () => {
    if (filteredAddresses.length === 0) {
      toast({
        title: "No Data",
        description: "No records to download.",
        variant: "destructive",
      });
      return;
    }

    const excelData = filteredAddresses.map((app, index) => ({
      "S.No": index + 1,
      "Student Name": `${app.firstName} ${app.lastName}`,
      "Father Name": app.fatherName || "-",
      "Card ID": app.cardNumber,
      Email: app.email,
      Phone: app.phone,
      "Full Address": app.fullAddress || "Address not found",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Addresses");
    XLSX.writeFile(workbook, "student_addresses.xlsx");
    toast({ title: "Success", description: "Excel file downloaded." });
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Permanently delete this student address record? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/student-addresses/${id}`, {
        method: "DELETE",
        headers: { ...adminHeaders() },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete record");
      toast({ title: "Deleted", description: "Address record removed permanently." });
      fetchAddresses();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Student Addresses
              </h1>
              <p className="text-muted-foreground">
                Contact & Address details for all application states
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" onClick={downloadExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              onClick={fetchAddresses}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            Student Records ({filteredAddresses.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
            Loading records...
          </div>
        ) : filteredAddresses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border">
            No records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAddresses.map((app) => (
              <div 
                key={app.id}
                className={`rounded-xl p-5 border-2 transition-all shadow-sm relative group ${
                  app.status === 'suspended'
                    ? 'bg-red-50 border-red-400'
                    : app.status === 'pending'
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-white border-neutral-200 hover:border-primary/30'
                }`}
              >
                {/* Status Warning Banner */}
                {app.status === 'suspended' && (
                  <div className="bg-red-500 text-white text-xs font-black px-3 py-2 rounded-lg mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <span>🚫</span>
                    College Card Suspended by Admin — Login Disabled
                  </div>
                )}
                {app.status === 'pending' && (
                  <div className="bg-amber-500 text-white text-xs font-black px-3 py-2 rounded-lg mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <span>⏳</span>
                    Awaiting Admin Approval — Pending Review
                  </div>
                )}

                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-xl font-black ${app.status === 'suspended' ? 'text-red-900' : 'text-foreground'}`}>
                      {app.firstName} {app.lastName}
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      S/O: {app.fatherName || "N/A"}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      app.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : app.status === 'suspended'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-amber-200 text-amber-800'
                    }`}>
                      {app.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddress(app.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100/50 p-2 h-auto"
                      title="Permanently Delete Record"
                    >
                      <RefreshCw className="w-4 h-4 rotate-45" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Library ID</label>
                    <p className={`font-mono font-black ${app.status === 'suspended' ? 'text-red-700' : 'text-primary'}`}>
                      {app.cardNumber}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Contact info</label>
                    <p className="text-xs font-bold text-foreground truncate">{app.email}</p>
                    <p className="text-xs font-medium text-muted-foreground">{app.phone}</p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border text-sm font-medium ${
                  app.status === 'suspended'
                    ? 'bg-white border-red-200 text-red-900'
                    : 'bg-muted/30 border-neutral-100'
                }`}>
                  <label className="text-[9px] font-black text-muted-foreground uppercase block mb-1 opacity-50">Permanent Address</label>
                  {app.fullAddress || "Address not provided"}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Addresses;
