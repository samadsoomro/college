import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  BookOpen,
  Calendar,
  User,
  Tag,
  Clock,
  ArrowRight,
  Heart,
  Shield,
} from "lucide-react";
import BookCard from "@/components/books/BookCard";
import { BOOK_CATEGORIES } from "@/utils/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCollege } from "@/contexts/CollegeContext";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

const Books = () => {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [borrowingId, setBorrowingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useCollege();
  const navigate = useNavigate();
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [infoPopupBook, setInfoPopupBook] = useState<any>(null);

  useEffect(() => {
    if (collegeSlug) fetchBooks();
  }, [collegeSlug]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/${collegeSlug}/books`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = books;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (book) =>
          (book.bookName && book.bookName.toLowerCase().includes(term)) ||
          (book.authorName && book.authorName.toLowerCase().includes(term)) ||
          (book.shortIntro && book.shortIntro.toLowerCase().includes(term)),
      );
    }

    setFilteredBooks(result);
  }, [books, searchTerm]);

  const proceedWithBorrow = async (book: any) => {
    setBorrowingId(book.id);
    try {
      const res = await apiRequest("POST", `/api/${collegeSlug}/book-borrows`, {
        bookId: String(book.id),
        bookTitle: book.bookName,
        isbn: book.isbn || "",
      });

      if (res.ok) {
        toast({
          title: "Book Borrowed Successfully!",
          description: `You have borrowed the book: "${book.bookName}". Please visit the library and return it within 14 days. We may contact you via phone or email if required.`,
        });
        fetchBooks();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to borrow book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBorrowingId(null);
    }
  };

  const handleBorrow = (book: any) => {
    // Check if user is logged in via Card ID session
    if (user?.isLibraryCard) {
      // Card holder — proceed with borrow normally
      proceedWithBorrow(book);
      return;
    }

    // Everyone else (email login or not logged in) — show info popup
    setInfoPopupBook(book);
    setShowInfoPopup(true);
  };

  const handleViewDetails = (book: any) => {
    toast({
      title: book.bookName,
      description: book.description || "No description available.",
    });
  };

  return (
    <motion.div
      className="min-h-screen pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="py-12 lg:py-16 bg-gradient-to-br from-secondary to-background text-center">
        <div className="container">
          <motion.h1
            className="text-3xl lg:text-4xl font-bold text-foreground mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Book Collection
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Browse our extensive collection of academic books and resources
          </motion.p>
          {!user && (
            <motion.p
              className="text-sm text-primary mt-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Login or register to borrow books
            </motion.p>
          )}
        </div>
      </div>

      <div className="py-12 lg:py-16">
        <div className="container">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                type="text"
                placeholder="Search by title or intro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Showing {filteredBooks.length} of {books.length} books
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book, index) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <BookCard
                      book={{
                        book_id: book.id,
                        title: book.bookName,
                        author: book.authorName || "Library Collection",
                        category: "",
                        description: book.description,
                        cover_image: book.bookImage,
                        isbn: "",
                        status:
                          parseInt(book.availableCopies || "0") > 0
                            ? "available"
                            : "unavailable",
                        total_copies: parseInt(book.totalCopies || "0"),
                        available_copies: parseInt(book.availableCopies || "0"),
                        publication_year: 0,
                      }}
                      onBorrow={() => handleBorrow(book)}
                      onViewDetails={() => handleViewDetails(book)}
                      isBorrowing={borrowingId === book.id}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <BookOpen
                size={64}
                className="mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Books Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showInfoPopup && infoPopupBook && (
          <motion.div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="text-5xl mb-4 text-center">📚</div>
              <h3 className="text-2xl font-black text-neutral-900 text-center mb-2">
                Want to Borrow This Book?
              </h3>
              <p className="text-neutral-600 text-sm text-center mb-6">
                Book borrowing is available for students with a College Card ID.
              </p>
              <div className="bg-neutral-50 rounded-xl p-5 mb-6 space-y-3 text-sm border border-neutral-100">
                <p className="font-bold text-neutral-800">You have two options:</p>
                <div className="flex gap-2">
                   <span>✅</span>
                   <p><strong>Have a Card ID?</strong> Logout and login via the <strong>Card ID tab</strong> on the login page</p>
                </div>
                <div className="flex gap-2">
                   <span>📋</span>
                   <p><strong>No Card ID?</strong> Apply for a College Card first, then login with your Card ID</p>
                </div>
                <div className="flex gap-2">
                   <span>🏛️</span>
                   <p><strong>Visitor/Staff?</strong> Visit the library physically to borrow books</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href={`/${collegeSlug}/college-card`}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold text-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Apply for College Card
                </a>
                <button
                  onClick={() => setShowInfoPopup(false)}
                  className="w-full py-3 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all font-mono"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Books;
