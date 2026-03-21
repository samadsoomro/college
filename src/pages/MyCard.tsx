import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCollege } from "@/contexts/CollegeContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CreditCard, ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { generateLibraryCardPDF } from "@/utils/pdfGenerator";
import collegeLogo from "@/assets/images/college-logo.png";

const MyCard = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings, college } = useCollege();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isCardUser = localStorage.getItem("isLibraryCard") === "true";
    const cardNumber = localStorage.getItem("cardNumber");

    if (!isCardUser || !cardNumber) {
      navigate(`/${collegeSlug}/college-card`);
      return;
    }

    const fetchCardDetails = async () => {
      try {
        const res = await fetch(`/api/${collegeSlug}/library-card-applications/by-card/${cardNumber}`);
        if (!res.ok) throw new Error("Card not found");
        const data = await res.json();
        setCardData(data);
      } catch (error) {
        console.error("Error fetching card:", error);
        toast({
          title: "Error",
          description: "Could not retrieve your card details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [collegeSlug, navigate, toast]);

  const handleDownloadPDF = () => {
    if (!cardData) return;
    
    generateLibraryCardPDF({
      cardNumber: cardData.cardNumber,
      studentId: cardData.studentId,
      issueDate: cardData.issueDate,
      validThrough: cardData.validThrough,
      formData: {
        firstName: cardData.firstName,
        lastName: cardData.lastName,
        fatherName: cardData.fatherName,
        dob: cardData.dob,
        studentClass: cardData.class,
        field: cardData.field,
        rollNo: cardData.rollNo,
        dynamicFields: cardData.dynamicFields
      },
      settings,
      collegeSlug: collegeSlug || "gcfm",
      collegeLogo,
      customFields: [] // We don't necessarily have definitions here, but the data is in dynamicFields
    }, toast);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cardData) return null;

  const logoUrl = settings?.navbarLogo || settings?.loadingLogo || collegeLogo;
  const instName = settings?.instituteFullName || college?.name || "College";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-32 pb-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <Card className="overflow-hidden border-none shadow-2xl">
          {/* College Header */}
          <div className="bg-primary p-6 text-white text-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            </div>
            
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={logoUrl} 
              alt="logo"
              className="h-20 w-20 rounded-full mx-auto mb-3 object-contain bg-white p-1.5 shadow-lg relative z-10" 
            />
            <h1 className="text-xl font-bold relative z-10 drop-shadow-sm">
              {instName}
            </h1>
            <p className="text-sm opacity-90 relative z-10">Digital Library — College Card</p>
          </div>

          <CardContent className="p-6 space-y-6 bg-white dark:bg-card">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Your Card ID</p>
              <p className="text-3xl font-mono font-bold text-primary tracking-tighter sm:tracking-normal">
                {cardData.cardNumber}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3">
                <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1">Full Name</p>
                <p className="font-semibold truncate">{cardData.name}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3">
                <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1">Student ID</p>
                <p className="font-semibold">{cardData.studentId}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3">
                <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1">Class</p>
                <p className="font-semibold">{cardData.class}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3">
                <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1">Field</p>
                <p className="font-semibold">{cardData.field}</p>
              </div>
              
              {/* Dynamic Fields */}
              {cardData.dynamicFields && Object.entries(cardData.dynamicFields).map(([key, value]) => (
                <div key={key} className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3">
                  <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1 truncate">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="font-semibold truncate">{String(value)}</p>
                </div>
              ))}

              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3">
                <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1">Issue Date</p>
                <p className="font-semibold">{new Date(cardData.issueDate).toLocaleDateString("en-GB")}</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3">
                <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1">Valid Through</p>
                <p className="font-semibold">{new Date(cardData.validThrough).toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`rounded-2xl p-4 flex items-center gap-3 border shadow-sm ${
              cardData.status === "approved"
                ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50"
                : cardData.status === "suspended"
                ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
            }`}>
              {cardData.status === "approved" ? <CheckCircle2 className="w-5 h-5" /> : 
               cardData.status === "suspended" ? <AlertCircle className="w-5 h-5" /> : 
               <Clock className="w-5 h-5" />}
              <div className="text-sm font-bold uppercase tracking-wide">
                {cardData.status === "approved" && "Card Approved — Active"}
                {cardData.status === "pending" && "Pending Admin Approval"}
                {cardData.status === "suspended" && "Card Suspended — Visit College"}
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownloadPDF}
              className="w-full py-6 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-2"
            >
              <Download className="w-5 h-5" />
              Download College Card PDF
            </Button>

            <Link
              to={`/${collegeSlug}`}
              className="flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-primary transition-colors font-medium sm:pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MyCard;
