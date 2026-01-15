import React, { useState, useEffect } from 'react';
import { ArtPiece } from '../types';
import { X, Copy, Download, Check, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toggleLikeArt, recordDownload, recordView, getUserActivity } from '../lib/firebase/firestore';
import Navbar from './Navbar';

interface DetailModalProps {
  art: ArtPiece;
  onClose: () => void;
  relatedArt: ArtPiece[];
  onSelectRelated: (art: ArtPiece) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ art, onClose, relatedArt, onSelectRelated }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.max(0, art.likes || 0));

  const hasMultipleImages = art.imageUrls.length > 1;

  // Track view on mount
  useEffect(() => {
    if (user) {
      recordView(user.uid, art.id).catch(console.error);
    }
  }, [user, art.id]);

  // Check if user has liked this art
  useEffect(() => {
    const checkLiked = async () => {
      if (user) {
        const activity = await getUserActivity(user.uid);
        setIsLiked(activity.likedArts.includes(art.id));
      }
    };
    checkLiked();
  }, [user, art.id]);

  const handleLike = async () => {
    if (!user) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    // Optimistic UI update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      await toggleLikeArt(user.uid, art.id, wasLiked);
    } catch (error) {
      // Rollback on error
      console.error('Error toggling like:', error);
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDownload = async () => {
    // Use originalUrl for download, fallback to imageUrl for old data
    const originalUrl = art.originalUrls?.[currentImageIndex] || art.imageUrls[currentImageIndex];

    // Record download if user is logged in
    if (user) {
      try {
        await recordDownload(user.uid, art.id);
      } catch (error) {
        console.error('Error recording download:', error);
      }
    }

    // Try fetch-based download (works for same-origin or CORS-enabled URLs)
    try {
      const response = await fetch(originalUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${art.title}-${currentImageIndex + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // CORS error - try alternative methods
    }

    // Fallback: open in new tab for external URLs
    window.open(originalUrl, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(art.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <Navbar />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="relative w-full max-w-7xl mx-auto min-h-full bg-[#0a0a0a] shadow-2xl flex flex-col lg:flex-row">

          {/* Close Button */}
          <button
              onClick={onClose}
              className="absolute top-3 right-3 md:top-4 md:right-4 z-50 p-2 bg-black/70 hover:bg-white/10 rounded-full text-white transition-colors"
          >
              <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Left: Image with Thumbnails */}
          <div className="lg:w-[60%] bg-[#050505] flex flex-col items-center p-3 md:p-4 lg:p-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
            {/* Main Image */}
            <div className="relative w-full flex justify-center shadow-2xl shadow-indigo-500/10 rounded-lg overflow-hidden">
              <img
                  src={art.imageUrls[currentImageIndex]}
                  alt={art.title}
                  className="max-w-full max-h-[45vh] md:max-h-[60vh] lg:max-h-[70vh] object-contain transition-opacity duration-300"
              />
            </div>

            {/* Thumbnail Grid - 3 per row */}
            {hasMultipleImages && (
              <div className="w-full mt-3 grid grid-cols-4 md:grid-cols-3 gap-2 max-w-md">
                {art.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                        : 'border-transparent hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${art.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="lg:w-[40%] p-4 md:p-6 lg:p-12 flex flex-col gap-5 md:gap-8 lg:pb-12">

            {/* Header */}
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white mb-2">{art.title}</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-400">
                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded">{art.author}</span>
                  <span>{art.date}</span>
                  {hasMultipleImages && (
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                      {currentImageIndex + 1} / {art.imageUrls.length}
                    </span>
                  )}
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex gap-3">
              <button
                onClick={handleLike}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isLiked
                    ? 'bg-pink-600 hover:bg-pink-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount}
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                다운로드
              </button>
            </div>

            {/* Prompt Section */}
            <div className="bg-[#151515] border border-gray-800 rounded-xl p-4 md:p-5">
              <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-300">Prompt</span>
                  <button
                      onClick={handleCopy}
                      className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors bg-gray-800 px-2 py-1 rounded"
                  >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                  </button>
              </div>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-light font-mono">
                  {art.prompt}
              </p>

              <div className="mt-3 md:mt-4 flex flex-wrap gap-1.5 md:gap-2">
                  {art.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full border border-gray-700">
                          #{tag}
                      </span>
                  ))}
              </div>
            </div>

            {/* Related Prompts - Hidden on small mobile to save space */}
            <div className="hidden md:block">
              <h3 className="text-lg font-semibold text-white mb-4">Related Prompts</h3>
              <div className="grid grid-cols-3 gap-3">
                  {relatedArt.slice(0, 3).map(related => (
                      <div
                          key={related.id}
                          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-900"
                          onClick={() => onSelectRelated(related)}
                      >
                          <img
                              src={related.imageUrls[0]}
                              alt={related.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons - Mobile (Outside scrollable area) */}
      <div className="lg:hidden bg-[#0a0a0a] border-t border-gray-700 p-4 flex gap-3 shrink-0">
        <button
          onClick={handleLike}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isLiked
              ? 'bg-pink-600 text-white'
              : 'bg-gray-700 text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          {likeCount}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          다운로드
        </button>
      </div>
    </div>
  );
};

export default DetailModal;
