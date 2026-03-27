import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useCollege } from "@/contexts/CollegeContext";
import { Download, CreditCard, Eye, EyeOff, RefreshCcw, Check, ArrowRight, ArrowLeft, BookOpen, Wifi, Users, Computer, Library, Percent, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import { generateLibraryCardPDF } from "@/utils/pdfGenerator";
import collegeLogo from "@/assets/images/college-logo.png";

const getQRCodeUrl = (text: string, size: number = 100) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

const benefits = [
  { icon: BookOpen, title: "Borrow books, DVDs, and audiobooks" },
  { icon: Wifi, title: "Access digital resources from anywhere" },
  { icon: Users, title: "Reserve meeting rooms" },
  { icon: Computer, title: "Free computer and WiFi access" },
  { icon: Library, title: "Interlibrary loan services" },
  { icon: Percent, title: "Discounts at local partners" },
];

const getFieldCode = (field: string): string => {
  const fieldCodeMap: Record<string, string> = {
    "Computer Science": "CS",
    Commerce: "COM",
    Humanities: "HM",
    "Pre-Engineering": "PE",
    "Pre-Medical": "PM",
  };
  return (
    fieldCodeMap[field] || (field ? field.substring(0, 3).toUpperCase() : "XX")
  );
};

interface CustomField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  showOnForm: boolean;
  showOnCard: boolean;
  showInAdmin: boolean;
  displayOrder: number;
  options?: string[]; // Added options property
}
interface FormData {
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: string;
  studentClass: string;
  field: string;
  rollNo: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  password?: string;
  dynamicFields?: Record<string, string>;
}

interface SubmissionResult {
  cardNumber: string;
  studentId: string;
  issueDate: string;
  validThrough: string;
  formData: FormData;
}

const CollegeCard = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings, college } = useCollege();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isFieldsLoading, setIsFieldsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    fatherName: "",
    dob: "",
    studentClass: "",
    field: "",
    rollNo: "",
    email: "",
    phone: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    password: "",
    dynamicFields: {},
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailDebounce, setEmailDebounce] = useState<any>(null);

  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@") || email.length < 5) {
      setEmailStatus("idle");
      return;
    }
    setEmailStatus("checking");
    try {
      const res = await fetch(
        `/api/${collegeSlug}/auth/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      );
      const data = await res.json();
      setEmailStatus(data.available ? "available" : "taken");
    } catch {
      setEmailStatus("idle");
    }
  };

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await fetch(`/api/${collegeSlug}/library-card-fields`);
        if (res.ok) {
          const data = await res.json();
          setCustomFields(data);
        }
      } catch (error) {
        console.error("Failed to fetch custom fields:", error);
      } finally {
        setIsFieldsLoading(false);
      }
    };
    fetchFields();
  }, [collegeSlug]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDynamicFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      dynamicFields: {
        ...(prev.dynamicFields || {}),
        [key]: value,
      },
    }));
  };

  const validateStep1 = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.fatherName ||
      !formData.dob ||
      !formData.studentClass ||
      !formData.field ||
      !formData.rollNo
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    // Validate dynamic fields
    const missingRequired = customFields
      .filter((f) => f.isRequired && f.showOnForm && f.fieldKey !== "class" && f.fieldKey !== "field")
      .filter((f) => !formData.dynamicFields?.[f.fieldKey]);

    if (missingRequired.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in required field: ${missingRequired[0].fieldLabel}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.email || !formData.phone || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including password.",
        variant: "destructive",
      });
      return false;
    }
    if (emailStatus === "taken") {
      toast({
        title: "Email Taken",
        description: "This email is already registered. Please use a different one.",
        variant: "destructive",
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (
      !formData.addressStreet ||
      !formData.addressCity ||
      !formData.addressState ||
      !formData.addressZip
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);
    try {
      const res = await apiRequest(
        "POST",
        `/api/${collegeSlug}/library-card-applications`,
        {
          userId: user?.id || null,
          firstName: formData.firstName,
          lastName: formData.lastName,
          fatherName: formData.fatherName,
          dob: formData.dob,
          class: formData.studentClass,
          field: formData.field,
          rollNo: formData.rollNo,
          email: formData.email,
          phone: formData.phone,
          addressStreet: formData.addressStreet,
          addressCity: formData.addressCity,
          addressState: formData.addressState,
          addressZip: formData.addressZip,
          password: formData.password,
          dynamicFields: formData.dynamicFields,
        },
      );

      const data = await res.json();

      setSubmissionResult({
        cardNumber: data.cardNumber,
        studentId: data.studentId,
        issueDate: data.issueDate,
        validThrough: data.validThrough,
        formData,
      });

      toast({
        title: "Application Submitted!",
        description:
          `Your ${settings?.termCardMenu || 'College Card'} application has been submitted successfully.`,
      });
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async () => {
    if (!submissionResult) return;
    generateLibraryCardPDF({
      cardNumber: submissionResult.cardNumber,
      studentId: submissionResult.studentId,
      issueDate: submissionResult.issueDate,
      validThrough: submissionResult.validThrough,
      formData: submissionResult.formData,
      settings,
      collegeSlug: collegeSlug || "gcfm",
      collegeLogo,
      customFields: customFields
    }, toast);
  };

  if (submissionResult) {
    const logoUrl = settings?.navbarLogo || settings?.loadingLogo || collegeLogo;
    const instName = settings?.instituteFullName || college?.name || "College";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden border border-border"
        >
          {/* ✕ Close Button — TOP RIGHT, always visible */}
          <button
            onClick={() => setSubmissionResult(null)}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 shadow-sm transition-colors"
          >
            ✕
          </button>

          {/* College Header */}
          <div className="bg-primary px-6 py-5 text-white text-center sm:text-left sm:flex sm:items-center sm:gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_white,_transparent)]"></div>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="logo"
                className="h-12 w-12 rounded-full mx-auto sm:mx-0 mb-2 sm:mb-0 object-contain bg-white p-1 shadow-md relative z-10"
              />
            ) : (
              <div className="h-12 w-12 rounded-full mx-auto sm:mx-0 mb-2 sm:mb-0 bg-white/20 flex items-center justify-center text-2xl relative z-10">
                🏛️
              </div>
            )}
            <div className="relative z-10">
              <h2 className="text-base font-bold leading-tight uppercase tracking-wide">
                {instName}
              </h2>
              <p className="text-xs opacity-75 mt-0.5">Digital Library Portal</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            {/* Success Icon + Title */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-200 dark:border-green-900/50">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Application Submitted!</h3>
              <p className="text-sm text-neutral-500">
                Your {(settings?.termCardMenu || 'College Card').toLowerCase()} PDF is ready for download.
              </p>
            </div>

            {/* Card ID Box */}
            <div className="bg-neutral-50 dark:bg-neutral-900/50 border-2 border-primary/20 rounded-xl p-4 text-center shadow-inner">
              <p className="text-2xl font-mono font-bold text-primary tracking-wider break-all">
                {submissionResult.cardNumber}
              </p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1 tracking-wide">
                {settings?.termCardMenu || 'College Card'} ID — Use this to login
              </p>
              <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Student ID: <span className="font-bold text-foreground">{submissionResult.studentId}</span>
                </p>
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> IMPORTANT
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed font-medium">
                Your card is <strong>pending approval</strong> by the admin.
                Once approved, login using your <strong>Card ID</strong> and
                the password you created.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1 font-inter">
              <Button
                onClick={generatePDF}
                className="w-full py-6 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/10"
              >
                <Download className="w-5 h-5" />
                Download {settings?.termCardMenu || 'College Card'} PDF
              </Button>
              
              <Link
                to={`/${collegeSlug}/login?tab=card`}
                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-primary/30 text-primary hover:bg-primary/5 rounded-xl font-bold text-sm transition-colors"
                onClick={() => setSubmissionResult(null)}
              >
                🔑 Login with Card ID
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 md:whitespace-nowrap">
            Get Your {settings?.termCardMenu || 'College Card'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A {(settings?.termCardMenu || 'College Card').toLowerCase()} is your key to unlimited learning. Apply online and
            start exploring today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">
            Card Benefits
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Everything included with your free {(settings?.termCardMenu || 'College Card').toLowerCase()}:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">
                      {benefit.title}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    s <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-colors ${
                      s < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Application Form - Step {step} of 3</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            handleInputChange("firstName", e.target.value)
                          }
                          placeholder="Enter first name"
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            handleInputChange("lastName", e.target.value)
                          }
                          placeholder="Enter last name"
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father Name *</Label>
                      <Input
                        id="fatherName"
                        value={formData.fatherName}
                        onChange={(e) =>
                          handleInputChange("fatherName", e.target.value)
                        }
                        placeholder="Enter father's name"
                        data-testid="input-father-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) =>
                          handleInputChange("dob", e.target.value)
                        }
                        data-testid="input-dob"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="class">
                          {customFields.find(f => f.fieldKey === 'class')?.fieldLabel || 'Class'} *
                        </Label>
                        <Select
                          value={formData.studentClass}
                          onValueChange={(value) =>
                            handleInputChange("studentClass", value)
                          }
                        >
                          <SelectTrigger data-testid="select-class">
                            <SelectValue placeholder={`Select ${customFields.find(f => f.fieldKey === 'class')?.fieldLabel || 'Class'}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {customFields
                              .find((f) => f.fieldKey === "class")
                              ?.options?.map((c: string) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field">
                          {customFields.find(f => f.fieldKey === 'field')?.fieldLabel || 'Field / Group'} *
                        </Label>
                        <Select
                          value={formData.field}
                          onValueChange={(value) =>
                            handleInputChange("field", value)
                          }
                        >
                          <SelectTrigger data-testid="select-field">
                            <SelectValue placeholder={`Select ${customFields.find(f => f.fieldKey === 'field')?.fieldLabel || 'Field / Group'}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {customFields
                              .find((f) => f.fieldKey === "field")
                              ?.options?.map((f: string) => (
                                <SelectItem key={f} value={f}>
                                  {f}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll Number *</Label>
                      <Input
                        id="rollNo"
                        value={formData.rollNo}
                        onChange={(e) =>
                          handleInputChange("rollNo", e.target.value)
                        }
                        placeholder="e.g., E-125"
                        data-testid="input-roll-no"
                      />
                    </div>
                    {/* Dynamic Fields from Builder */}
                    {isFieldsLoading ? (
                      <div className="flex items-center gap-2 py-2">
                        <RefreshCcw className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Loading specific fields...
                        </span>
                      </div>
                    ) : (
                      customFields
                        .filter(
                          (f) =>
                            f.showOnForm &&
                            f.fieldKey !== "class" &&
                            f.fieldKey !== "field",
                        )
                        .map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.fieldKey}>
                              {field.fieldLabel} {field.isRequired ? "*" : ""}
                            </Label>
                            {field.fieldType === "date" ? (
                              <Input
                                id={field.fieldKey}
                                type="date"
                                value={
                                  formData.dynamicFields?.[field.fieldKey] || ""
                                }
                                onChange={(e) =>
                                  handleDynamicFieldChange(
                                    field.fieldKey,
                                    e.target.value,
                                  )
                                }
                                placeholder={field.fieldLabel}
                              />
                            ) : field.fieldType === "number" ? (
                              <Input
                                id={field.fieldKey}
                                type="number"
                                value={
                                  formData.dynamicFields?.[field.fieldKey] || ""
                                }
                                onChange={(e) =>
                                  handleDynamicFieldChange(
                                    field.fieldKey,
                                    e.target.value,
                                  )
                                }
                                placeholder={field.fieldLabel}
                              />
                            ) : field.fieldType === "select" ? (
                              <Select
                                value={
                                  formData.dynamicFields?.[field.fieldKey] || ""
                                }
                                onValueChange={(val) =>
                                  handleDynamicFieldChange(field.fieldKey, val)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={`Select ${field.fieldLabel}`}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.isArray(field.options) &&
                                    field.options.map((opt: string) => (
                                      <SelectItem key={opt} value={opt}>
                                        {opt}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={field.fieldKey}
                                value={
                                  formData.dynamicFields?.[field.fieldKey] || ""
                                }
                                onChange={(e) =>
                                  handleDynamicFieldChange(
                                    field.fieldKey,
                                    e.target.value,
                                  )
                                }
                                placeholder={field.fieldLabel}
                              />
                            )}
                          </div>
                        ))
                    )}

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleNext}
                        className="gap-2"
                        data-testid="button-next-step1"
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleInputChange("email", val);
                          if (emailDebounce) clearTimeout(emailDebounce);
                          setEmailDebounce(setTimeout(() => checkEmail(val), 600));
                        }}
                        placeholder="Enter email address"
                        data-testid="input-email"
                        className={
                          emailStatus === "taken"
                            ? "border-red-500 focus-visible:ring-red-500"
                            : emailStatus === "available"
                              ? "border-green-500 focus-visible:ring-green-500"
                              : ""
                        }
                      />
                      {emailStatus === "taken" && (
                        <p className="text-[10px] text-red-500 font-bold">
                          ❌ Email already registered.
                        </p>
                      )}
                      {emailStatus === "available" && (
                        <p className="text-[10px] text-green-600 font-bold">
                          ✅ Email is available.
                        </p>
                      )}
                      {emailStatus === "checking" && (
                        <p className="text-[10px] text-muted-foreground italic">
                          Checking availability...
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder="Enter phone number"
                        data-testid="input-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Login Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            handleInputChange("password", e.target.value)
                          }
                          placeholder="Create a password for your card login"
                          data-testid="input-card-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-md font-medium">
                        You must remember your password. This password will be
                        required when logging in with your Card ID.
                      </p>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        className="gap-2"
                        data-testid="button-back-step2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="gap-2"
                        data-testid="button-next-step2"
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="addressStreet">Street Address *</Label>
                      <Input
                        id="addressStreet"
                        value={formData.addressStreet}
                        onChange={(e) =>
                          handleInputChange("addressStreet", e.target.value)
                        }
                        placeholder="Enter street address"
                        data-testid="input-address-street"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressCity">City *</Label>
                        <Input
                          id="addressCity"
                          value={formData.addressCity}
                          onChange={(e) =>
                            handleInputChange("addressCity", e.target.value)
                          }
                          placeholder="Enter city"
                          data-testid="input-address-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressState">State/Province *</Label>
                        <Input
                          id="addressState"
                          value={formData.addressState}
                          onChange={(e) =>
                            handleInputChange("addressState", e.target.value)
                          }
                          placeholder="Enter state"
                          data-testid="input-address-state"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressZip">ZIP/Postal Code *</Label>
                      <Input
                        id="addressZip"
                        value={formData.addressZip}
                        onChange={(e) =>
                          handleInputChange("addressZip", e.target.value)
                        }
                        placeholder="Enter ZIP code"
                        data-testid="input-address-zip"
                      />
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        className="gap-2"
                        data-testid="button-back-step3"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="gap-2"
                        data-testid="button-submit-application"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CollegeCard;
