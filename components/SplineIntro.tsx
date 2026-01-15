import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface SplineIntroProps {
  onEnter: () => void;
}

const SplineIntro: React.FC<SplineIntroProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Loading Spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Spline Iframe - Scaled to 1.2x to push the "Built with Spline" badge out of the viewport */}
      <div className={`w-full h-full transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} relative`}>
        <iframe 
          src='https://my.spline.design/discover-k8M4gicgXa6f02TysWCbNqtP/' 
          frameBorder='0' 
          width='100%' 
          height='100%'
          className="w-full h-full scale-[1.2] origin-center pointer-events-auto"
          onLoad={() => setIsLoaded(true)}
          title="Spline 3D Scene"
        />
      </div>

      {/* Overlay Content */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-30 p-4">
        <button 
          onClick={onEnter}
          className="pointer-events-auto group relative flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all duration-300 hover:scale-105 hover:border-indigo-500/50"
        >
          <span className="font-medium tracking-wide">Enter Gallery</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default SplineIntro;