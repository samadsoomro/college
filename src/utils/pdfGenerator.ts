import { jsPDF } from "jspdf";

interface PDFData {
  cardNumber: string;
  studentId: string;
  issueDate: string;
  validThrough: string;
  formData: any;
  settings: any;
  collegeSlug: string;
  collegeLogo: string;
  customFields: any[];
}

const getQRCodeUrl = (text: string, size: number = 100) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

const getFieldCode = (field: string): string => {
  const fieldCodeMap: Record<string, string> = {
    "Computer Science": "CS",
    "Commerce": "COM",
    "Humanities": "HM",
    "Pre-Engineering": "PE",
    "Pre-Medical": "PM",
  };
  return (
    fieldCodeMap[field] || (field ? field.substring(0, 3).toUpperCase() : "XX")
  );
};

export const generateLibraryCardPDF = async (data: PDFData, toast: any) => {
  const { 
    cardNumber, 
    issueDate, 
    validThrough, 
    formData, 
    settings, 
    collegeSlug, 
    collegeLogo, 
    customFields 
  } = data;

  try {
    const doc = new jsPDF("p", "mm", "a4");

    const qrDestination = settings?.cardQrEnabled
      ? settings?.cardQrUrl
      : `${window.location.origin}/${collegeSlug}/college-card/${cardNumber}`;
    const qrCodeUrl = getQRCodeUrl(qrDestination, 100);

    // Fetch QR Code with safety
    let qrCodeDataUrl: string | null = null;
    try {
      const response = await fetch(qrCodeUrl);
      if (response.ok) {
        const blob = await response.blob();
        qrCodeDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.error("QR Code fetch failed:", e);
    }

    // Load Logo with safety
    let logoDataUrl: string | null = null;
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = settings?.cardLogoUrl || collegeLogo;
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = logoImg.width || 100;
      canvas.height = logoImg.height || 100;
      const ctx = canvas.getContext("2d");
      if (ctx && logoImg.complete && logoImg.naturalWidth !== 0) {
        ctx.drawImage(logoImg, 0, 0);
        logoDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      }
    } catch (e) {
      console.error("Logo processing failed:", e);
    }

    // --- CONSTANTS ---
    const pageW = 210;
    const margin = 15;
    const boxW = 180;
    const boxH = 120;
    const topY = 15;
    const botY = 150;

    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [22, 78, 59];
    };

    const primaryColorRgb = hexToRgb(settings?.primaryColor || "#1b2838");
    const whiteColor: [number, number, number] = [255, 255, 255];

    // FRONT SIDE
    doc.setDrawColor(...primaryColorRgb);
    doc.setLineWidth(0.8);
    doc.rect(margin, topY, boxW, boxH);
    doc.setFillColor(...primaryColorRgb);
    doc.rect(margin, topY, boxW, 28, "F");

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "JPEG", margin + 5, topY + 2, 24, 24);
    }

    doc.setTextColor(...whiteColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(settings?.cardAuthorityLine1 || "Government of Sindh", pageW / 2, topY + 8, { align: "center" });
    doc.text(settings?.cardAuthorityLine2 || "College Education Department", pageW / 2, topY + 12, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(
      settings?.cardHeaderText || (settings?.instituteFullName || "COLLEGE").toUpperCase(),
      pageW / 2,
      topY + 19,
      { align: "center" },
    );

    doc.setFontSize(10);
    doc.text(
      settings?.cardSubheaderText || "COLLEGE CARD",
      pageW / 2,
      topY + 25,
      { align: "center" },
    );

    doc.setTextColor(0, 0, 0);
    const detailsX = margin + 10;
    let currentY = topY + 36;
    const lineHeight = 6;

    const photoW = 30;
    const photoH = 35;
    const photoX = margin + boxW - photoW - 10;
    const photoY = topY + 35;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(photoX, photoY, photoW, photoH);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Paste Photograph Here", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const labelW = 35;

    const addDetail = (label: string, value: string, boldValue = false, highlight = false) => {
      if (currentY > topY + boxH - 20) return;
      doc.setFont("helvetica", "bold");
      doc.text(label, detailsX, currentY);
      if (highlight) {
        doc.setTextColor(...primaryColorRgb);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(value.toString(), detailsX + labelW, currentY);
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
      } else {
        doc.setFont("helvetica", boldValue ? "bold" : "normal");
        doc.text(value.toString(), detailsX + labelW, currentY);
      }
      currentY += lineHeight;
    };

    addDetail("Name:", `${formData.firstName} ${formData.lastName}`, true, true);
    addDetail("Father Name:", formData.fatherName || "-");
    addDetail("Date of Birth:", new Date(formData.dob).toLocaleDateString("en-GB"));
    addDetail("Class:", formData.studentClass || formData.class, true, true);
    addDetail("Field:", `${formData.field} (${getFieldCode(formData.field)})`, true, true);
    addDetail("Roll Number:", formData.rollNo);

    if (customFields) {
      customFields
        .filter((f) => f.showOnCard && f.fieldKey !== "class" && f.fieldKey !== "field")
        .forEach((f) => {
          const val = formData.dynamicFields?.[f.fieldKey] || "-";
          addDetail(`${f.fieldLabel}:`, val);
        });
    }

    currentY += 1;
    addDetail("College Card ID:", cardNumber, true, true);
    currentY += 1;
    addDetail("Issue Date:", new Date(issueDate).toLocaleDateString("en-GB"));
    addDetail("Valid Through:", new Date(validThrough).toLocaleDateString("en-GB"));

    if (settings?.cardQrEnabled && qrCodeDataUrl) {
      const qrSize = 25;
      const qrX = margin + boxW - qrSize - 10;
      const qrY = topY + boxH - qrSize - 10;
      doc.addImage(qrCodeDataUrl, "JPEG", qrX, qrY, qrSize, qrSize);
    }

    const sigLineX = detailsX + 80;
    const sigLineY = topY + boxH - 15;
    const sigLineW = 45;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(sigLineX, sigLineY, sigLineX + sigLineW, sigLineY);
    doc.setFontSize(7);
    doc.text("Principal's Signature", sigLineX + sigLineW / 2, sigLineY + 4, { align: "center" });

    // BACK SIDE
    doc.setDrawColor(...primaryColorRgb);
    doc.setLineWidth(0.8);
    doc.rect(margin, botY, boxW, boxH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TERMS & CONDITIONS", pageW / 2, botY + 15, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let termY = botY + 25;
    const termX = margin + 12;
    const termSpacing = 5;
    (settings?.cardTermsText || "").split("\n").forEach((line) => {
      if (termY > botY + boxH - 25) return;
      doc.text(line, termX, termY);
      termY += termSpacing;
    });

    termY = botY + boxH - 20;
    doc.setFont("helvetica", "bold");
    doc.text("CONTACT DETAILS:", termX, termY);
    termY += termSpacing;
    doc.setFont("helvetica", "normal");
    doc.text(settings?.cardContactAddress || `Library, ${settings?.instituteShortName || 'College'}`, termX, termY);
    termY += termSpacing;
    doc.text(`Email: ${settings?.cardContactEmail || "library@example.edu"} | Phone: ${settings?.cardContactPhone || "+92 21 XXXX XXXX"}`, termX, termY);

    doc.save(`college-card-${cardNumber}.pdf`);
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    if (toast) {
      toast({
        title: "Download Failed",
        description: "An error occurred while generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  }
};
