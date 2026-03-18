import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Book,
  Plus,
  Pencil,
  Trash2,
  Search,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth, adminHeaders, uploadToSupabase } from "@/contexts/AuthContext";

const Books: React.FC = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { settings } = useCollege();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [formData, setFormData] = useState({
    bookName: "",
    authorName: "",
    shortIntro: "",
    description: "",
    totalCopies: "1",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [issuingBookId, setIssuingBookId] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchBooks();
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/borrowed-books`, {
        headers: adminHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBorrows(data);
      }
    } catch (error) {
      console.error("Error fetching borrows:", error);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/${collegeSlug}/admin/books`, {
        headers: adminHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (books.length === 0) {
      toast({
        title: "No Data",
        description: "No books to download.",
        variant: "destructive",
      });
      return;
    }
    const excelData = books.map((book) => ({
      "Book Name": book.bookName,
      Author: book.authorName || "-",
      "Short Intro": book.shortIntro || "-",
      Description: book.description || "-",
      "Created At": new Date(book.createdAt).toLocaleDateString(),
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Books");
    XLSX.writeFile(workbook, "books-report.xlsx");
    toast({ title: "Success", description: "Excel report downloaded." });
  };

  const downloadPDF = () => {
    if (books.length === 0) {
      toast({
        title: "No Data",
        description: "No books to download.",
        variant: "destructive",
      });
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("GCMN Library - Books Report", 10, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, 30);

    let y = 40;
    books.forEach((book, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${book.bookName}`, 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Author: ${book.authorName || "N/A"}`, 15, y + 5);
      doc.text(`Intro: ${book.shortIntro || "N/A"}`, 15, y + 10);
      y += 20;
    });
    doc.save("books-report.pdf");
    toast({ title: "Success", description: "PDF report downloaded." });
  };

  const handleEdit = (book: any) => {
    setSelectedBook(book);
    setFormData({
      bookName: book.bookName,
      authorName: book.authorName || "",
      shortIntro: book.shortIntro || "",
      description: book.description || "",
      totalCopies: String(book.totalCopies || 1),
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/books/${id}`, {
        method: "DELETE",
        headers: adminHeaders()
      });
      if (res.ok) {
        toast({ title: "Success", description: "Book deleted successfully" });
        fetchBooks();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };
  
  const handleIssueBook = async (bookId: string) => {
    if (!cardNumber.trim()) {
      toast({ title: "Error", description: "Please enter a College Card Number", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/${collegeSlug}/admin/issue-book`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, cardNumber }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Book issued successfully" });
        setIssuingBookId(null);
        setCardNumber("");
        fetchBorrows();
        fetchBooks();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to issue book", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to issue book", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let bookImage = isEditing ? selectedBook?.bookImage : "";
      if (selectedFile) {
        const url = await uploadToSupabase(selectedFile, 'books');
        if (url) bookImage = url;
      }

      const payload = {
        ...formData,
        bookImage,
        totalCopies: parseInt(formData.totalCopies)
      };

      const url = isEditing
        ? `/api/${collegeSlug}/admin/books/${selectedBook.id}`
        : `/api/${collegeSlug}/admin/books`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: `Book ${isEditing ? "updated" : "added"} successfully`,
        });
        setIsEditing(false);
        setSelectedBook(null);
        setFormData({
          bookName: "",
          authorName: "",
          shortIntro: "",
          description: "",
          totalCopies: "1",
        });
        setSelectedFile(null);
        fetchBooks();
      } else {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error || "Failed to save book",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save book",
        variant: "destructive",
      });
    }
  };

  const handleReturn = async (borrowId: string) => {
    try {
      const res = await fetch(`/api/${collegeSlug}/book-borrows/${borrowId}/return`, {
        method: "PATCH",
        headers: adminHeaders()
      });
      if (res.ok) {
        toast({ title: "Success", description: "Book marked as returned" });
        fetchBorrows();
        fetchBooks();
      } else {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error || "Failed to return book",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to return book",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) return <div className="p-8 text-center text-rose-500 font-bold">Unauthorized</div>;

  const filteredBooks = books.filter((book) =>
    book.bookName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Books</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel} className="gap-2">
            <FileSpreadsheet size={16} /> Excel
          </Button>
          <Button variant="outline" onClick={downloadPDF} className="gap-2">
            <Download size={16} /> PDF
          </Button>
          <Button variant="outline" onClick={fetchBooks} className="gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button
            onClick={() => {
              setIsEditing(false);
              setSelectedBook(null);
              setFormData({
                bookName: "",
                authorName: "",
                shortIntro: "",
                description: "",
                totalCopies: "1",
              });
            }}
            className="gap-2"
          >
            <Plus size={16} /> Add New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Book" : "Add New Book"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Book Name *</label>
                <Input
                  required
                  value={formData.bookName}
                  onChange={(e) =>
                    setFormData({ ...formData, bookName: e.target.value })
                  }
                  placeholder="Enter book title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Author Name *</label>
                <Input
                  required
                  value={formData.authorName}
                  onChange={(e) =>
                    setFormData({ ...formData, authorName: e.target.value })
                  }
                  placeholder="Enter author name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Intro *</label>
                <Input
                  required
                  value={formData.shortIntro}
                  onChange={(e) =>
                    setFormData({ ...formData, shortIntro: e.target.value })
                  }
                  placeholder="Brief overview"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed book information"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Copies *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={formData.totalCopies}
                  onChange={(e) =>
                    setFormData({ ...formData, totalCopies: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Book Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {isEditing && selectedBook?.bookImage && !selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current image: {selectedBook.bookImage.split("/").pop()}
                  </p>
                )}
              </div>
              <div className="pt-2 flex gap-2">
                <Button type="submit" className="flex-1">
                  {isEditing ? "Update Book" : "Add Book"}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Book Catalog</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search books..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                <Book className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No books found in the catalog.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-neutral-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                    {/* Cover image — fixed height */}
                    <div className="h-48 bg-neutral-100 overflow-hidden relative">
                      {book.bookImage ? (
                        <img 
                          src={book.bookImage} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          alt={book.bookName}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <div className={`text-[10px] px-2 py-1 rounded-full font-bold shadow-sm backdrop-blur-md ${parseInt(book.availableCopies || "0") > 0 ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"}`}>
                          {book.availableCopies || 0} / {book.totalCopies || 0}
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <h3 className="font-bold text-neutral-900 text-sm line-clamp-2 min-h-[40px]">{book.bookName}</h3>
                      <p className="text-xs text-neutral-500 font-medium">{book.authorName}</p>
                      <p className="text-xs text-neutral-400 line-clamp-2 h-8">{book.shortIntro}</p>
                      
                      {/* Active Borrowers Summary */}
                      {borrows.filter(b => b.bookId === book.id && b.status === "borrowed").length > 0 && (
                        <div className="mt-2 text-[10px] bg-primary/5 text-primary px-2 py-1 rounded flex items-center gap-1 font-bold">
                          <RefreshCw size={10} className="animate-spin-slow" />
                          {borrows.filter(b => b.bookId === book.id && b.status === "borrowed").length} Active Borrowed
                        </div>
                      )}

                      {/* Actions — bottom aligned */}
                      <div className="flex gap-2 mt-auto pt-3 border-t border-neutral-50">
                        <button 
                          title="Edit Book" 
                          onClick={() => handleEdit(book)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          title="Issue Book to Student" 
                          onClick={() => setIssuingBookId(issuingBookId === book.id ? null : book.id)}
                          className={`p-2 rounded-lg transition-colors ${issuingBookId === book.id ? "bg-primary text-white" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                        >
                          <BookOpen size={16} />
                        </button>
                        <button 
                          title="Delete Book" 
                          onClick={() => handleDelete(book.id)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors ml-auto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Modal-like Issue Input */}
                      {issuingBookId === book.id && (
                        <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
                          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Issue to Member</p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Card ID..."
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="h-8 text-xs bg-white"
                            />
                            <Button
                              size="sm"
                              className="h-8 px-3 text-[10px] font-bold"
                              onClick={() => handleIssueBook(book.id)}
                              disabled={parseInt(book.availableCopies || "0") <= 0}
                            >
                              Issue
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Return Assets Area */}
                      {borrows.filter(b => b.bookId === book.id && b.status === "borrowed").length > 0 && (
                        <div className="mt-2 space-y-1">
                          {borrows.filter(b => b.bookId === book.id && b.status === "borrowed").slice(0, 2).map(b => (
                            <div key={b.id} className="flex items-center justify-between text-[10px] bg-neutral-50 p-1.5 rounded border border-neutral-100">
                              <span className="truncate font-medium text-neutral-600">{b.borrowerName}</span>
                              <button onClick={() => handleReturn(b.id)} className="text-primary hover:underline font-bold">Return</button>
                            </div>
                          ))}
                          {borrows.filter(b => b.bookId === book.id && b.status === "borrowed").length > 2 && (
                            <p className="text-[9px] text-center text-neutral-400 mt-1">and {borrows.filter(b => b.bookId === book.id && b.status === "borrowed").length - 2} more...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Books;
