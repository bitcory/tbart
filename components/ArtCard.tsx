import React from 'react';
import { ArtPiece } from '../types';
import { PlayCircle } from 'lucide-react';

interface ArtCardProps {
  art: ArtPiece;
  onClick: (art: ArtPiece) => void;
}

const ArtCard: React.FC<ArtCardProps> = ({ art, onClick }) => {
  const hasMultipleImages = art.imageUrls.length > 1;

  return (
    <div
      className="break-inside-avoid mb-4 group relative cursor-pointer overflow-hidden rounded-xl bg-[#1f1f1f]"
      onClick={() => onClick(art)}
    >
      <div className="relative">
        <img
          src={art.imageUrls[0]}
          alt={art.title}
          loading="lazy"
          className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay gradient - bottom only */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
            <h3 className="text-white text-sm font-semibold truncate">{art.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{art.prompt}</p>
        </div>

        {/* Multiple images indicator */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 flex gap-1">
            {art.imageUrls.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {/* Video indicator mock (randomly applied for demo) */}
        {art.id === '6' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                <PlayCircle className="w-12 h-12 text-white/80 drop-shadow-lg backdrop-blur-sm rounded-full" />
            </div>
        )}
      </div>
    </div>
  );
};

export default ArtCard;
