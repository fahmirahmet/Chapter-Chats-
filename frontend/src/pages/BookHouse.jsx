import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  PlusCircle, 
  ArrowRight, 
  BookMarked, 
  X, 
  Shield,
  FileText,
  Calendar,
  Flame,
  MessageSquare,
  Layers,
  HelpCircle,
  ExternalLink,
  Upload,
  Plus,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import ReadingGuideModal from '../components/ReadingGuideModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const isPdf = (file) => {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return name.endsWith('.pdf') || type === 'application/pdf' || type === 'application/x-pdf' || type === 'application/octet-stream';
};

export default function BookHouse() {
  const { user } = useAuth();

  const isExecutive = Boolean(
    user && (
      user.is_staff || 
      user.is_superuser || 
      ['OWNER', 'ADMIN', 'OFFICER'].includes(user.role) || 
      (user.officer_title && user.officer_title !== 'NONE')
    )
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCycle, setActiveCycle] = useState(null);
  const [isLoadingCycle, setIsLoadingCycle] = useState(true);
  const [selectedBookForGuide, setSelectedBookForGuide] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Executive Upload Modal State & Direct DOM Refs
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    genre: 'Ethiopian Literature',
    total_pages: 300,
    synopsis: ''
  });

  const [selectedPdfName, setSelectedPdfName] = useState('');
  const [selectedGuideName, setSelectedGuideName] = useState('');
  const [selectedCoverName, setSelectedCoverName] = useState('');

  const pdfInputRef = useRef(null);
  const guideInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Executive Delete Book Confirmation Modal State
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const genres = [
    'All', 
    'Ethiopian Literature', 
    'Philosophy & Ethics', 
    'Ethics & Politics', 
    'World Classics',
    'African Literature',
    'Fiction & Satire'
  ];

  // 1. Fetch Active Reading Cycle
  useEffect(() => {
    let isMounted = true;
    const fetchActiveCycle = async () => {
      setIsLoadingCycle(true);
      try {
        let res;
        try {
          res = await apiClient.get('/cycles/active/');
        } catch {
          res = await apiClient.get('/cycles/cycles/active/');
        }

        const data = res.data?.activeCycle || res.data;
        if (data && data.book && isMounted) {
          const b = data.book;
          const formattedActiveBook = {
            id: b.id,
            title: b.title,
            author: b.author,
            totalPages: b.total_pages || b.totalPages || 320,
            genre: b.genre || 'Ethiopian Literature',
            synopsis: b.synopsis || '',
            fileSize: b.file_size || '4.5 MB',
            downloadCount: b.download_count || 0,
            coverUrl: b.cover_url || b.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
            pdfUrl: b.pdf_url || b.pdf_file || null,
            guideUrl: b.guide_url || b.guide_file || null,
            discussionQuestions: [
              `How does the protagonist's core conflict reflect the broader theme of ${b.genre || 'the narrative'}?`,
              `Analyze the narrative choices made by ${b.author} in the opening chapters.`,
              `What ethical questions does "${b.title}" pose for modern readers?`
            ],
            isReadByMember: false
          };

          setActiveCycle({
            id: data.id,
            book: formattedActiveBook,
            meetingDate: data.meeting_date || res.data?.activeMeeting?.meeting_datetime || null,
            milestones: data.milestones || {
              week1: { label: 'Week 1 Milestone', pages: `1 to ${Math.round((b.total_pages || 300) * 0.33)} (33%)` },
              week2: { label: 'Week 2 Target', pages: `${Math.round((b.total_pages || 300) * 0.33) + 1} to ${Math.round((b.total_pages || 300) * 0.66)} (66%)` },
              week3: { label: 'Week 3 Sprint', pages: `${Math.round((b.total_pages || 300) * 0.66) + 1} to ${b.total_pages || 300} (100%)` }
            }
          });
        }
      } catch (err) {
        console.warn('No active cycle retrieved for Book House hero pinning:', err);
      } finally {
        if (isMounted) setIsLoadingCycle(false);
      }
    };

    fetchActiveCycle();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Books Function
  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedGenre !== 'All') params.genre = selectedGenre;

      const res = await apiClient.get('/books/', { params });
      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          totalPages: b.total_pages || b.totalPages || 300,
          genre: b.genre,
          synopsis: b.synopsis,
          fileSize: b.file_size || '4.2 MB',
          downloadCount: b.download_count || 0,
          coverUrl: b.cover_url || b.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
          pdfUrl: b.pdf_url || b.pdf_file || null,
          guideUrl: b.guide_url || b.guide_file || null,
          discussionQuestions: [
            `How does the protagonist's core conflict reflect the broader theme of ${b.genre}?`,
            `Analyze the narrative choices made by ${b.author} in the opening chapters.`,
            `What ethical questions does "${b.title}" pose for modern readers?`
          ],
          isReadByMember: false
        }));
        setBooks(formatted);
      } else {
        setBooks([]);
      }
    } catch (err) {
      console.warn('API error fetching books:', err);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedGenre]);

  // Debounced Search & Filter
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchBooks]);

  // 3. Handle Download Function
  const handleDownload = async (book, fileType = 'pdf') => {
    const isGuide = fileType === 'guide';
    const fileLabel = isGuide ? 'Discussion Guide' : 'Book PDF';
    const safeTitle = (book.title || 'Book').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}_${isGuide ? 'Discussion_Guide' : 'Reading'}.pdf`;

    setToastMessage({
      type: 'info',
      text: `Downloading "${book.title}" ${fileLabel}...`
    });

    try {
      const response = await apiClient.get(`/books/${book.id}/download/${fileType}/`, {
        responseType: 'blob'
      });

      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setToastMessage({
        type: 'success',
        text: `"${book.title}" ${fileLabel} downloaded successfully!`
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Download error:', err);
      const status = err.response?.status;
      setToastMessage({
        type: 'error',
        text: status === 401 
          ? 'Authentication required. Please log in to download reading materials.' 
          : `Failed to download ${fileLabel}. Reading material file not yet uploaded.`
      });
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleDownloadPdf = (book) => handleDownload(book, 'pdf');
  const handleDownloadGuide = (book) => handleDownload(book, 'guide');

  const handleOpenUploadModal = () => {
    setUploadForm({
      title: '',
      author: '',
      genre: 'Ethiopian Literature',
      total_pages: 300,
      synopsis: ''
    });
    setSelectedPdfName('');
    setSelectedGuideName('');
    setSelectedCoverName('');
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (guideInputRef.current) guideInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
    setUploadError(null);
    setShowUploadModal(true);
  };

  // 4. Handle Executive Direct Book PDF Upload (Reading Directly from Refs)
  const handleUploadBookSubmit = async (e) => {
    e.preventDefault();
    setUploadError(null);

    const title = uploadForm.title.trim();
    const author = uploadForm.author.trim();
    if (!title || !author) {
      setUploadError('Please specify both book title and author.');
      return;
    }

    const pdfFile = pdfInputRef.current?.files?.[0];
    if (!pdfFile) {
      setUploadError('Please attach a PDF copy of the book.');
      return;
    }

    const guideFile = guideInputRef.current?.files?.[0] || null;
    const coverImage = coverInputRef.current?.files?.[0] || null;

    if (!isPdf(pdfFile)) {
      setUploadError('Only PDF files (.pdf) are permitted for book reading copies.');
      return;
    }

    if (guideFile && !isPdf(guideFile)) {
      setUploadError('Only PDF files (.pdf) are permitted for discussion guides.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('genre', uploadForm.genre || 'Ethiopian Literature');
      formData.append('total_pages', uploadForm.total_pages || 300);
      if (uploadForm.synopsis.trim()) {
        formData.append('synopsis', uploadForm.synopsis.trim());
      }
      formData.append('pdf_file', pdfFile);
      if (guideFile) {
        formData.append('guide_file', guideFile);
      }
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      let res;
      try {
        res = await apiClient.post('/books/', formData);
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          res = await apiClient.post('/cycles/books/', formData);
        } else {
          throw postErr;
        }
      }

      if (res.data) {
        setShowUploadModal(false);
        if (pdfInputRef.current) pdfInputRef.current.value = '';
        if (guideInputRef.current) guideInputRef.current.value = '';
        if (coverInputRef.current) coverInputRef.current.value = '';
        setSelectedPdfName('');
        setSelectedGuideName('');
        setSelectedCoverName('');
        setUploadForm({
          title: '',
          author: '',
          genre: 'Ethiopian Literature',
          total_pages: 300,
          synopsis: ''
        });
        setToastMessage({
          type: 'success',
          text: `"${res.data.title || title}" uploaded successfully to Book House!`
        });
        setTimeout(() => setToastMessage(null), 5000);

        // Refresh book library immediately
        fetchBooks();
      }
    } catch (err) {
      console.error('Book upload error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to upload book. Please check the file and try again.';
      setUploadError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // 5. Handle Executive Book Deletion
  const handleDeleteBook = (book) => {
    setDeleteError(null);
    setBookToDelete(book);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      let res;
      try {
        res = await apiClient.delete(`/books/${bookToDelete.id}/`);
      } catch (delErr) {
        if (delErr.response?.status === 404) {
          res = await apiClient.delete(`/cycles/books/${bookToDelete.id}/`);
        } else {
          throw delErr;
        }
      }

      const deletedTitle = bookToDelete.title;
      setBooks((prev) => prev.filter((b) => b.id !== bookToDelete.id));
      setBookToDelete(null);
      setToastMessage({
        type: 'success',
        text: `"${deletedTitle}" removed from Book House.`
      });
      setTimeout(() => setToastMessage(null), 4000);

      // Refresh catalog list
      fetchBooks();
    } catch (err) {
      console.error('Book delete error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to remove book. Please try again.';
      setDeleteError(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in relative max-w-6xl mx-auto pb-12">
      {/* Dynamic Download & Upload Toast Banner */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border-2 flex items-center justify-between gap-3 animate-slide-down ${
          toastMessage.type === 'error'
            ? 'bg-rose-950 text-rose-100 border-rose-500'
            : toastMessage.type === 'success'
            ? 'bg-emerald-950 text-emerald-100 border-emerald-500'
            : 'bg-[#2D1B0F] text-[#F8F4EC] border-[#C48B47]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
              toastMessage.type === 'error'
                ? 'bg-rose-500 text-white'
                : toastMessage.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-[#C48B47] text-[#2D1B0F]'
            }`}>
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </div>
            <p className="text-xs font-semibold">{toastMessage.text || toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#2D1B0F] text-[#F8F4EC] p-6 sm:p-8 md:p-10 border-2 border-[#C48B47]/40 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-[#C48B47]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A35C33] text-white text-xs font-bold uppercase tracking-wider border border-[#C48B47]/40 shadow-xs">
                <BookMarked className="w-3.5 h-3.5" />
                Digital Reading Repository
              </span>
            </div>

            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-white">
              The Book House Repository
            </h1>

            <p className="text-xs sm:text-sm text-[#EFE7DA]/85 leading-relaxed">
              Explore our curated library of downloadable book PDFs, study guides, and discussion worksheets. All materials are complimentary for active club members.
            </p>
          </div>

          {/* Right Action & Stats Badge */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {isExecutive && (
              <button
                type="button"
                onClick={handleOpenUploadModal}
                className="bg-[#8C6D53] hover:bg-[#6F533E] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer border border-[#C48B47]/40"
              >
                <Upload className="w-4 h-4 text-[#FFF8EE]" />
                <span>Upload Book (PDF)</span>
              </button>
            )}

            <div className="bg-[#342013] p-4 rounded-2xl border border-[#D8C8B0]/30 text-center shrink-0 space-y-1 shadow-inner w-full sm:w-auto">
              <span className="font-serif text-3xl font-bold text-[#C48B47] block">
                {books.length} Volumes
              </span>
              <span className="text-[11px] font-semibold text-[#EFE7DA]/80">
                Live Digital Catalog
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 PINNED HERO CARD: Currently Reading Active Cycle Selection */}
      {activeCycle && activeCycle.book && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D1B0F] via-[#3A2214] to-[#24150C] text-[#F8F4EC] border-2 border-[#C48B47] shadow-2xl p-6 sm:p-8 md:p-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C48B47]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-stretch justify-between">
            {/* Left Cover Preview Column */}
            <div className="w-full lg:w-72 shrink-0 flex flex-col items-center">
              <div className="relative group w-48 sm:w-56 lg:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#C48B47]/60">
                <img
                  src={activeCycle.book.coverUrl}
                  alt={activeCycle.book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E06]/90 via-transparent to-transparent flex items-end p-4">
                  <span className="text-[11px] font-bold text-[#F8F4EC] bg-[#A35C33] px-2.5 py-1 rounded-md shadow-xs">
                    {activeCycle.book.genre}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-[#EFE7DA]/75 font-medium">
                <Layers className="w-3.5 h-3.5 text-[#C48B47]" />
                <span>{activeCycle.book.totalPages} Pages Total</span>
                <span>•</span>
                <span>{activeCycle.book.fileSize}</span>
              </div>
            </div>

            {/* Right Details & Action Controls */}
            <div className="flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C48B47] text-[#2D1B0F] text-xs font-bold uppercase tracking-wider shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-[#2D1B0F]" />
                    Active Cycle Selection
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A0E06]/80 text-[#EFE7DA] text-xs font-semibold border border-[#D8C8B0]/20">
                    <Calendar className="w-3.5 h-3.5 text-[#C48B47]" />
                    Tuesday Review Meetup
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-[#FFF8EE] leading-tight">
                    {activeCycle.book.title}
                  </h2>
                  <p className="text-sm sm:text-base text-[#C48B47] font-medium">
                    by <strong className="text-[#FFF8EE]">{activeCycle.book.author}</strong>
                  </p>
                </div>

                {activeCycle.book.synopsis && (
                  <p className="text-xs sm:text-sm text-[#EFE7DA]/85 leading-relaxed line-clamp-3 md:line-clamp-4">
                    {activeCycle.book.synopsis}
                  </p>
                )}

                {/* Milestone Targets Strip */}
                {activeCycle.milestones && (
                  <div className="p-4 rounded-2xl bg-[#1A0E06]/60 border border-[#C48B47]/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#EFE7DA] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#C48B47]" />
                        Reading Sprint Targets:
                      </span>
                      <span className="text-[11px] text-[#C48B47] font-semibold">
                        3-Week Cycle
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-[#2D1B0F]/80 border border-[#D8C8B0]/20">
                        <span className="font-bold text-[#C48B47] block">Week 1</span>
                        <span className="text-[#EFE7DA]/80">{activeCycle.milestones.week1?.pages || 'Pages 1 - 100'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#2D1B0F]/80 border border-[#D8C8B0]/20">
                        <span className="font-bold text-[#C48B47] block">Week 2</span>
                        <span className="text-[#EFE7DA]/80">{activeCycle.milestones.week2?.pages || 'Pages 101 - 210'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#2D1B0F]/80 border border-[#D8C8B0]/20">
                        <span className="font-bold text-[#C48B47] block">Week 3</span>
                        <span className="text-[#EFE7DA]/80">{activeCycle.milestones.week3?.pages || 'Pages 211 - End'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(activeCycle.book)}
                  className="px-5 py-3 rounded-xl bg-[#A35C33] hover:bg-[#8B4C28] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Book PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadGuide(activeCycle.book)}
                  className="px-5 py-3 rounded-xl bg-[#2D1B0F] hover:bg-[#1A0E06] text-[#EFE7DA] border border-[#C48B47] font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#C48B47]" />
                  <span>Discussion Guide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBookForGuide(activeCycle.book)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFF8EE] font-bold text-xs backdrop-blur-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#C48B47]" />
                  <span>Worksheet Questions</span>
                </button>

                <NavLink
                  to="/discussions"
                  className="px-4 py-3 rounded-xl bg-[#C48B47] hover:bg-[#B37936] text-[#2D1B0F] font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Join Cycle Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section Divider & Catalog Title */}
      <div className="space-y-2 pt-2 border-t-2 border-[#D8C8B0]/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#2D1B0F]">
              Club Library &amp; Past Selections
            </h2>
            <p className="text-xs sm:text-sm text-[#2D1B0F]/70">
              Browse archived cycle volumes, philosophical treatises, and member favorites.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Genre Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#D8C8B0] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#2D1B0F]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8F4EC] border border-[#D8C8B0] rounded-xl text-xs sm:text-sm text-[#2D1B0F] focus:outline-none focus:ring-2 focus:ring-[#A35C33] shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2D1B0F]/50 hover:text-[#2D1B0F] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Result Count Indicator */}
          <div className="text-xs font-semibold text-[#2D1B0F]/70 self-start md:self-auto">
            Showing <strong className="text-[#A35C33]">{books.length}</strong> library books
          </div>
        </div>

        {/* Genre Pill Filters */}
        <div className="pt-3 border-t border-[#D8C8B0]/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-[#A35C33] shrink-0" />
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedGenre === genre
                  ? 'bg-[#2D1B0F] text-[#FFF8EE] shadow-xs'
                  : 'bg-[#F8F4EC] text-[#2D1B0F] border border-[#D8C8B0] hover:bg-[#EFE7DA]'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Responsive Book Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white p-5 rounded-3xl border border-[#D8C8B0] animate-pulse space-y-4">
              <div className="aspect-[3/4] bg-[#D8C8B0]/40 rounded-2xl" />
              <div className="h-4 bg-[#D8C8B0]/60 rounded w-2/3" />
              <div className="h-3 bg-[#D8C8B0]/40 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              isExecutive={isExecutive}
              onDeleteBook={handleDeleteBook}
              onOpenGuide={(b) => setSelectedBookForGuide(b)}
              onDownloadPdf={handleDownloadPdf}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#F8F4EC] p-12 rounded-3xl border-2 border-dashed border-[#D8C8B0] text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-[#EFE7DA] text-[#A35C33] rounded-full flex items-center justify-center mx-auto border border-[#D8C8B0]">
            <BookOpen className="w-8 h-8 text-[#A35C33]" />
          </div>
          <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
            {searchQuery ? `No books found matching "${searchQuery}"` : 'No books in the catalog yet'}
          </h3>
          <p className="text-xs text-[#2D1B0F]/70 max-w-md mx-auto leading-relaxed">
            {searchQuery 
              ? 'Try adjusting your search keywords or switching genre filters.' 
              : 'No books in the catalog yet. Executive admins can add reading copies via the button above.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
              className="px-5 py-2.5 rounded-xl bg-[#2D1B0F] text-[#F8F4EC] font-bold text-xs hover:bg-[#1A0E06] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          ) : isExecutive ? (
            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A35C33] text-white font-bold text-xs hover:bg-[#8B4C28] transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Upload First Book (PDF)</span>
            </button>
          ) : (
            <NavLink
              to="/admin-portal?tab=cycle-launcher"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A35C33] text-white font-bold text-xs hover:bg-[#8B4C28] transition-colors shadow-sm cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Go to Executive Portal</span>
            </NavLink>
          )}
        </div>
      )}

      {/* Suggest a Book CTA Banner */}
      <section className="bg-gradient-to-r from-[#EFE7DA] via-[#F8F4EC] to-[#EFE7DA] p-6 sm:p-8 rounded-3xl border-2 border-[#D8C8B0] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">
            Don't see the book you're looking for?
          </h3>
          <p className="text-xs text-[#2D1B0F]/75">
            Submit a book suggestion on our Discussion Hub to include it in our upcoming cycle polls.
          </p>
        </div>

        <NavLink
          to="/discussions?tab=proposals&openForm=true"
          className="px-6 py-3 rounded-xl bg-[#A35C33] text-white font-bold text-xs hover:bg-[#8B4C28] transition-colors shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Propose Book Suggestion</span>
          <ArrowRight className="w-4 h-4" />
        </NavLink>
      </section>

      {/* Executive Direct PDF Book Upload Modal */}
      {showUploadModal && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setShowUploadModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#F8F4EC] rounded-2xl max-w-2xl w-full my-auto p-6 sm:p-8 shadow-2xl border-2 border-[#D8C8B0] space-y-5 animate-slide-down max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D8C8B0] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#8C6D53] flex items-center justify-center text-white shadow-sm">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#2D1B0F]">Upload Book (PDF)</h3>
                  <p className="text-[11px] text-[#2D1B0F]/70">Add a reading copy or discussion guide to the digital repository</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-[#2D1B0F]/50 hover:text-[#2D1B0F] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Form */}
            <form onSubmit={handleUploadBookSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Book Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="e.g. Oromay"
                    className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Author Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.author}
                    onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                    placeholder="e.g. Baalu Girma"
                    className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Genre Category *
                  </label>
                  <select
                    value={uploadForm.genre}
                    onChange={(e) => setUploadForm({ ...uploadForm, genre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none cursor-pointer"
                  >
                    <option value="Ethiopian Literature">Ethiopian Literature</option>
                    <option value="Philosophy & Ethics">Philosophy &amp; Ethics</option>
                    <option value="Ethics & Politics">Ethics &amp; Politics</option>
                    <option value="World Classics">World Classics</option>
                    <option value="African Literature">African Literature</option>
                    <option value="Fiction & Satire">Fiction &amp; Satire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                    Total Page Count *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={uploadForm.total_pages}
                    onChange={(e) => setUploadForm({ ...uploadForm, total_pages: parseInt(e.target.value, 10) || 300 })}
                    placeholder="300"
                    className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1B0F] mb-1">
                  Synopsis / Blurb (Optional)
                </label>
                <textarea
                  rows={3}
                  value={uploadForm.synopsis}
                  onChange={(e) => setUploadForm({ ...uploadForm, synopsis: e.target.value })}
                  placeholder="Provide a brief thematic summary of the book..."
                  className="w-full px-4 py-2.5 bg-white border border-[#D8C8B0] rounded-xl text-xs text-[#2D1B0F] focus:ring-2 focus:ring-[#A35C33] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Direct Ref File Attachment Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Book PDF File (Required) */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8C8B0] space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#A35C33]" />
                    <span className="text-xs font-bold text-[#2D1B0F]">Book PDF *</span>
                  </div>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    required
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelectedPdfName(file ? file.name : '');
                      if (file) setUploadError(null);
                    }}
                    className="text-[11px] text-[#2D1B0F]/70 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#EFE7DA] file:text-[#A35C33] hover:file:bg-[#E5D6BF] cursor-pointer w-full"
                  />
                  {selectedPdfName && (
                    <p className="text-[10px] text-emerald-700 font-medium truncate">
                      ✓ {selectedPdfName}
                    </p>
                  )}
                </div>

                {/* Discussion Guide File (Optional) */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8C8B0] space-y-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#8C6D53]" />
                    <span className="text-xs font-bold text-[#2D1B0F]">Study Guide</span>
                  </div>
                  <input
                    ref={guideInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelectedGuideName(file ? file.name : '');
                    }}
                    className="text-[11px] text-[#2D1B0F]/70 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#EFE7DA] file:text-[#8C6D53] hover:file:bg-[#E5D6BF] cursor-pointer w-full"
                  />
                  {selectedGuideName && (
                    <p className="text-[10px] text-emerald-700 font-medium truncate">
                      ✓ {selectedGuideName}
                    </p>
                  )}
                </div>

                {/* Cover Image (Optional) */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D8C8B0] space-y-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#C48B47]" />
                    <span className="text-xs font-bold text-[#2D1B0F]">Cover Image</span>
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelectedCoverName(file ? file.name : '');
                    }}
                    className="text-[11px] text-[#2D1B0F]/70 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#EFE7DA] file:text-[#C48B47] hover:file:bg-[#E5D6BF] cursor-pointer w-full"
                  />
                  {selectedCoverName && (
                    <p className="text-[10px] text-emerald-700 font-medium truncate">
                      ✓ {selectedCoverName}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit / Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#D8C8B0]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D8C8B0] text-[#2D1B0F] font-bold text-xs hover:bg-[#EFE7DA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl bg-[#8C6D53] hover:bg-[#6F533E] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading PDF...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-white" />
                      <span>Upload to Repository</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Reading Guide Worksheet Modal */}
      <ReadingGuideModal
        book={selectedBookForGuide}
        isOpen={Boolean(selectedBookForGuide)}
        onClose={() => setSelectedBookForGuide(null)}
        onDownloadGuide={handleDownloadGuide}
      />

      {/* Executive Book Deletion Safety Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="Remove Book from Repository?"
        message="Are you sure you want to delete this book? This will permanently remove the reading copy and study guides from the club library."
        itemTitle={bookToDelete ? `${bookToDelete.title} — by ${bookToDelete.author}` : null}
        confirmLabel="Delete Book"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setBookToDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
