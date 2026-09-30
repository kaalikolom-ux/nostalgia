import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns, SplitSquareVertical, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ImageComparisonSlider({
  originalUrl,
  restoredUrl,
  title = 'তুলনা'
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'sideBySide'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className={`relative flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 p-4 transition-all shadow-xl ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-6 flex flex-col justify-center' : ''
    }`}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>ফলাফল তুলনা (Comparison Preview)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all ${
                viewMode === 'split' ? 'bg-amber-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="স্প্লিট স্লাইডার"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">স্লাইডার</span>
            </button>
            <button
              onClick={() => setViewMode('sideBySide')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all ${
                viewMode === 'sideBySide' ? 'bg-amber-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="পাশাপাশি ভিউ"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">পাশাপাশি</span>
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            title={isFullscreen ? 'সাধারণ ভিউ' : 'ফুলস্ক্রিন ভিউ'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Comparison Area */}
      {viewMode === 'split' ? (
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[600px] overflow-hidden rounded-xl cursor-ew-resize select-none border border-slate-800 bg-slate-950"
        >
          {/* Restored Image (Underneath) */}
          <img
            src={restoredUrl}
            alt="Restored"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Original Image (Clipped overlay) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={originalUrl}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)] cursor-ew-resize z-20"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Circular Handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-900 pointer-events-none">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M8 7l-5 5 5 5V7zm8 0v10l5-5-5-5z" />
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
            <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-slate-300 text-xs font-medium border border-slate-700/80 shadow">
              আগের ছবি (Original)
            </span>
          </div>
          <div className="absolute top-3 right-3 z-30 pointer-events-none">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/90 text-slate-950 text-xs font-bold border border-amber-300 shadow">
              উন্নত ছবি (Restored) ✨
            </span>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur text-[11px] text-slate-400 border border-slate-800">
              তুলনা দেখতে ডানে-বামে ড্র্যাগ করুন
            </span>
          </div>
        </div>
      ) : (
        /* Side by Side Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3]">
            <img src={originalUrl} alt="Original" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur text-slate-300 text-xs font-medium border border-slate-700">
                আগের ছবি (Original)
              </span>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-amber-500/30 bg-slate-950 aspect-[4/3]">
            <img src={restoredUrl} alt="Restored" className="w-full h-full object-contain" />
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-bold shadow">
                উন্নত ছবি (Restored) ✨
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
