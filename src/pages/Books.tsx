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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBook, setSuccessBook] = useState<any>(null);
  const [confirmBook, setConfirmBook] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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
      const isCardUser = localStorage.getItem('isLibraryCard') === 'true';
      const cardNumber = localStorage.getItem('cardNumber');
      const userName = localStorage.getItem('userName');
      const userId = localStorage.getItem('userId');

      // fetch full details from card application if card user
      let borrowerEmail = localStorage.getItem('userEmail') || '';
      let borrowerPhone = '';

      if (isCardUser && cardNumber) {
        try {
          const cardRes = await fetch(`/api/${collegeSlug}/library-card-applications/by-card/${cardNumber}`);
          if (cardRes.ok) {
            const cardData = await cardRes.json();
            borrowerEmail = cardData.email || '';
            borrowerPhone = cardData.phone || '';
          }
        } catch (e) {
          console.error('Could not fetch card details:', e);
        }
      }

      const body: any = {
        bookId: String(book.id),
        bookTitle: book.bookName,
        borrowerName: userName || 'Student',
        borrowerEmail: borrowerEmail,
        borrowerPhone: borrowerPhone,
        userId: userId || null,
      };

      if (isCardUser && cardNumber) {
        body.libraryCardId = cardNumber;
      }

      const res = await fetch(`/api/${collegeSlug}/books/${book.id}/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccessBook(book);
        setShowSuccessModal(true);
        fetchBooks();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to borrow book");
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
      // Card holder — show confirmation first
      setConfirmBook(book);
      setShowConfirm(true);
      return;
    }

    // Everyone else (email login or not logged in) — show info popup
    setInfoPopupBook(book);
    setShowInfoPopup(true);
  };

  const handleConfirmBorrow = async () => {
    setShowConfirm(false);
    await proceedWithBorrow(confirmBook);
  };

  const handleCancelBorrow = () => {
    setShowConfirm(false);
    setConfirmBook(null);
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
                          Number(book.availableCopies) > 0
                            ? "available"
                            : "unavailable",
                        total_copies: Number(book.totalCopies) || 0,
                        available_copies: Number(book.availableCopies) || 0,
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
        {showConfirm && confirmBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">

              {/* Header */}
              <div className="bg-primary px-6 py-4 text-white text-center">
                <div className="text-2xl mb-1">📚</div>
                <h3 className="font-bold text-base">Confirm Borrow Request</h3>
              </div>

              {/* Content */}
              <div className="p-6 text-center space-y-4">
                {confirmBook.bookImage && (
                  <img
                    src={confirmBook.bookImage}
                    alt={confirmBook.bookName}
                    className="h-24 w-16 object-cover rounded-lg mx-auto shadow-md"
                  />
                )}
                <div>
                  <p className="text-neutral-500 text-sm">Do you want to borrow</p>
                  <p className="text-lg font-bold text-neutral-800 mt-1">
                    "{confirmBook.bookName}"
                  </p>
                  {confirmBook.authorName && (
                    <p className="text-sm text-neutral-400">by {confirmBook.authorName}</p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                  <p className="text-xs text-amber-600">
                    ⚠️ You must collect the book physically from the library within <strong>14 days</strong>.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={handleCancelBorrow}
                  className="flex-1 py-3 border-2 border-neutral-200 text-neutral-600 rounded-xl font-semibold text-sm hover:bg-neutral-50 transition-colors"
                >
                  ✕ No, Cancel
                </button>
                <button
                  onClick={handleConfirmBorrow}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  ✓ Yes, Borrow
                </button>
              </div>
            </div>
          </div>
        )}

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
        {showSuccessModal && successBook && (
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
              <div className="text-5xl mb-4 text-center">✅</div>
              <h3 className="text-2xl font-black text-neutral-900 text-center mb-2">
                Borrow Request Attended!
              </h3>
              <p className="text-neutral-600 text-sm text-center mb-6">
                Your request for <strong>{successBook.bookName}</strong> has been successfully received.
              </p>
              
              <div className="bg-green-50 rounded-xl p-5 mb-6 space-y-4 text-sm border border-green-100">
                <div className="flex gap-3">
                  <span className="text-xl">🏛️</span>
                  <p className="text-green-800">
                    <strong>Physical Collection:</strong> Please visit our library physically to collect your respective book.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">📅</span>
                  <p className="text-green-800">
                    <strong>14-Day Limit:</strong> You must bring back the respective book within <strong>14 days</strong>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="text-green-800">
                    <strong>Fine Policy:</strong> If you exceed the 14-day limit, a fine will be applied to your account.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold text-center hover:bg-green-700 transition-all shadow-lg shadow-green-200"
              >
                Got it, Thank you!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Books;
