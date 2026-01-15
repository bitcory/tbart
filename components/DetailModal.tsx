import React, { useState, useEffect } from 'react';
import { ArtPiece } from '../types';
import { X, Copy, Download, Wand2, Check, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../hooks/useAuth';
import { toggleLikeArt, recordDownload, recordView, getUserActivity } from '../lib/firebase/firestore';

interface DetailModalProps {
  art: ArtPiece;
  onClose: () => void;
  relatedArt: ArtPiece[];
  onSelectRelated: (art: ArtPiece) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ art, onClose, relatedArt, onSelectRelated }) => {
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(art.likes);

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
    try {
      await toggleLikeArt(user.uid, art.id, isLiked);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDownload = async () => {
    try {
      // Record download if user is logged in
      if (user) {
        await recordDownload(user.uid, art.id);
      }

      // Download image
      const response = await fetch(art.imageUrls[currentImageIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${art.title}-${currentImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback: open in new tab
      window.open(art.imageUrls[currentImageIndex], '_blank');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(art.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? art.imageUrls.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === art.imageUrls.length - 1 ? 0 : prev + 1));
  };

  const handleEnhancePrompt = async () => {
    if (!process.env.API_KEY) {
        alert("API Key not found in environment.");
        return;
    }

    setIsEnhancing(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-flash-preview';

        const response = await ai.models.generateContent({
            model: model,
            contents: `Please enhance this image generation prompt to be more detailed, artistic, and descriptive. Keep the same core subject but improve lighting, texture, and style references. \n\nOriginal Prompt: ${art.prompt}`,
            config: {
                maxOutputTokens: 200,
            }
        });

        setEnhancedPrompt(response.text);
    } catch (error) {
        console.error("Error enhancing prompt:", error);
    } finally {
        setIsEnhancing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-sm flex justify-center">
      <div className="relative w-full max-w-7xl min-h-screen bg-[#0a0a0a] shadow-2xl flex flex-col lg:flex-row">

        {/* Close Button */}
        <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white transition-colors"
        >
            <X className="w-6 h-6" />
        </button>

        {/* Left: Image with Carousel */}
        <div className="lg:w-[60%] bg-[#050505] flex items-center justify-center p-4 lg:p-12 lg:sticky lg:top-0 lg:h-screen">
          <div className="relative max-w-full max-h-full shadow-2xl shadow-indigo-500/10 rounded-lg overflow-hidden group">
            <img
                src={art.imageUrls[currentImageIndex]}
                alt={art.title}
                className="max-w-full max-h-[85vh] object-contain transition-opacity duration-300"
            />

            {/* Carousel Navigation */}
            {hasMultipleImages && (
              <>
                {/* Prev Button */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {art.imageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-white w-4'
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:w-[40%] p-6 lg:p-12 flex flex-col gap-8">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{art.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded">{art.author}</span>
                <span>{art.date}</span>
                {hasMultipleImages && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    {currentImageIndex + 1} / {art.imageUrls.length}
                  </span>
                )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleLike}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
          </div>

          {/* Prompt Section */}
          <div className="bg-[#151515] border border-gray-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-300">Prompt</span>
                <div className="flex gap-2">
                     <button
                        onClick={handleEnhancePrompt}
                        disabled={isEnhancing}
                        className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        <Wand2 className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
                        {isEnhancing ? 'Enhancing...' : 'Magic Enhance'}
                    </button>
                    <button
                        onClick={handleCopy}
                        className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors bg-gray-800 px-2 py-1 rounded"
                    >
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed font-light font-mono">
                {art.prompt}
            </p>

            {enhancedPrompt && (
                <div className="mt-4 pt-4 border-t border-gray-800 animate-in fade-in slide-in-from-top-2">
                    <span className="text-xs font-semibold text-purple-400 block mb-2">Gemini Enhanced Version:</span>
                    <p className="text-gray-300 text-sm leading-relaxed font-light font-mono">
                        {enhancedPrompt}
                    </p>
                </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                {art.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full border border-gray-700">
                        #{tag}
                    </span>
                ))}
            </div>
          </div>

          {/* Related Prompts */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Related Prompts</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
  );
};

export default DetailModal;
