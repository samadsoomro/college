import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { FileText, Download, BookOpen, ChevronDown } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { CLASSES, SUBJECTS_BY_CLASS } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Note {
  id: string;
  title: string;
  description: string;
  pdfPath: string; // Mapped from pdf_path
  subject: string;
  class: string;
}

const Notes: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useCollege();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);

  useEffect(() => {
    fetchAllNotes();
  }, [collegeSlug]);

  const fetchAllNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/${collegeSlug}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        setFilteredNotes(data);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({ title: "Error", description: "Failed to load notes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classValue = e.target.value;
    setSelectedClass(classValue);
    setSelectedSubject("");
    if (classValue) {
      setAvailableSubjects(SUBJECTS_BY_CLASS[classValue] || []);
    } else {
      setAvailableSubjects([]);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
  };

  const handleGetNotes = () => {
    if (!selectedClass || !selectedSubject) {
      toast({ title: "Selection Required", description: "Please select both class and subject", variant: "destructive" });
      return;
    }
    const filtered = notes.filter((note) => note.class === selectedClass && note.subject === selectedSubject);
    setFilteredNotes(filtered);
    if (filtered.length === 0) {
      toast({ title: "No Notes Found", description: `No notes available for ${selectedClass} - ${selectedSubject}` });
    }
  };

  const handleDownload = async (pdfUrl: string, title: string) => {
    if (!pdfUrl) return;
    try {
      toast({ title: "Connecting", description: "Preparing secure download..." });
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: `${title} has been downloaded.` });
    } catch (error) {
      console.error("Download failed", error);
      // Fallback to opening in new tab if blob fetch fails
      window.open(pdfUrl, "_blank");
      toast({ title: "Opening Document", description: `${title} is opening in a new tab` });
    }
  };

  return (
    <motion.div className="min-h-screen pt-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="py-12 lg:py-16 bg-gradient-to-br from-secondary to-background text-center">
        <div className="container">
          <motion.h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {settings.notesHeading || "Notes & Study Materials"}
          </motion.h1>
          <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            {settings.notesDescription || "Download course notes, syllabus, and study guides organized by class and subject"}
          </motion.p>
        </div>
      </div>

      <div className="py-12 lg:py-16">
        <div className="container">
          <motion.div className="bg-card p-6 lg:p-8 rounded-2xl shadow-lg border border-border mb-12" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
              <FileText size={32} className="text-primary" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">Select Your Class & Subject</h2>
                <p className="text-sm text-muted-foreground">Choose your class and subject to find relevant notes</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Class</label>
                <div className="relative">
                  <select value={selectedClass} onChange={handleClassChange} className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                    <option value="">Select Class</option>
                    {CLASSES.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Subject</label>
                <div className="relative">
                  <select value={selectedSubject} onChange={handleSubjectChange} disabled={!selectedClass} className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none disabled:opacity-50">
                    <option value="">Select Subject</option>
                    {availableSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <Button onClick={handleGetNotes} className="gap-2">
                <Download size={18} />
                Get Notes
              </Button>
            </div>
          </motion.div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground">{selectedClass || selectedSubject ? "Filtered Notes" : "All Available Notes"}</h3>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-sm space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full" /><Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            ) : filteredNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredNotes.map((note, index) => (
                  <motion.div key={note.id} className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0"><FileText size={24} /></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1 truncate">{note.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{note.class} • {note.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{note.description}</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground">PDF</span>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDownload(note.pdfPath, note.title)}>
                            <Download size={14} />Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-semibold text-foreground mb-2">No Notes Found</h4>
                <p className="text-muted-foreground">Try selecting a different class or subject</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Notes;
