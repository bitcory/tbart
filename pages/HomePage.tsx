import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import ArtCard from '../components/ArtCard';
import DetailModal from '../components/DetailModal';
import SplineIntro from '../components/SplineIntro';
import { ArtPiece, ViewMode } from '../types';
import { useArtPieces } from '../hooks/useArtPieces';
import { MOCK_ART_PIECES } from '../constants';

const HomePage: React.FC = () => {
  // localStorage에서 viewMode 복원 (기본값: INTRO)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('viewMode');
    return saved === 'GALLERY' ? ViewMode.GALLERY : ViewMode.INTRO;
  });
  const [selectedArt, setSelectedArt] = useState<ArtPiece | null>(null);

  // Firebase에서 데이터 가져오기 시도, 실패 시 MOCK 데이터 사용
  const { artPieces: firebaseArt, isLoading, isLoadingMore, loadMore, hasMore, error } = useArtPieces();

  // Firebase 연결 실패 시 MOCK 데이터 사용
  const artPieces = error || firebaseArt.length === 0 ? MOCK_ART_PIECES : firebaseArt;
  const showMockData = error || firebaseArt.length === 0;

  const handleEnterGallery = () => {
    setViewMode(ViewMode.GALLERY);
    localStorage.setItem('viewMode', 'GALLERY');
  };

  const handleArtClick = (art: ArtPiece) => {
    setSelectedArt(art);
    window.location.hash = `art-${art.id}`;
  };

  const handleCloseModal = () => {
    setSelectedArt(null);
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* 3D Intro Overlay */}
      {viewMode === ViewMode.INTRO && (
        <SplineIntro onEnter={handleEnterGallery} />
      )}

      {/* Main Content */}
      <div className={`transition-opacity duration-1000 ${viewMode === ViewMode.INTRO ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <Navbar />

        <main className="max-w-[1920px] mx-auto px-4 md:px-6 py-6">
          {/* Loading State */}
          {isLoading && !showMockData ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Masonry Layout */}
              <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                {artPieces.map((art, index) => (
                  <ArtCard
                    key={`${art.id}-${index}`}
                    art={art}
                    onClick={handleArtClick}
                  />
                ))}
              </div>

              {/* Load More Trigger */}
              {!showMockData && (
                <div className="mt-12 mb-12 flex justify-center">
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading more prompts...</span>
                    </div>
                  ) : hasMore ? (
                    <button
                      onClick={loadMore}
                      className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-neutral-900 px-6 font-medium text-neutral-200 transition-all duration-300 hover:bg-neutral-800 hover:text-white hover:ring-2 hover:ring-neutral-700 hover:ring-offset-2 hover:ring-offset-neutral-900"
                    >
                      <span className="relative">Load More Inspiration</span>
                    </button>
                  ) : (
                    <p className="text-gray-500">모든 아트를 불러왔습니다</p>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        {/* Detail Modal */}
        {selectedArt && (
          <DetailModal
            art={selectedArt}
            onClose={handleCloseModal}
            relatedArt={artPieces.filter(p => p.id !== selectedArt.id)}
            onSelectRelated={handleArtClick}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
