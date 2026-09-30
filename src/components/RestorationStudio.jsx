import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  Sparkles,
  Sliders,
  Download,
  Save,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Palette,
  Wand2,
  Maximize2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { RESTORATION_MODES, runClientSideRestoration, runReplicateRestoration } from '../lib/restorationEngine';
import { uploadImageToStorage, saveRestorationRecord } from '../lib/supabase';
import { SAMPLE_PHOTOS } from '../lib/samplePhotos';
import ImageComparisonSlider from './ImageComparisonSlider';

export default function RestorationStudio({ onRestorationSaved }) {
  // Image states
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [restoredImageUrl, setRestoredImageUrl] = useState(null);
  const [restoredBlob, setRestoredBlob] = useState(null);

  // Settings & Modes
  const [activeMode, setActiveMode] = useState('full_magic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sliders, setSliders] = useState({
    sharpen: 60,
    contrast: 25,
    brightness: 5,
    denoise: 35,
    colorize: true
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);
  const hiddenImgRef = useRef(null);

  // Handle local file selection
  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WEBP) নির্বাচন করুন।');
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setOriginalImageUrl(objectUrl);
    setRestoredImageUrl(null);
    setRestoredBlob(null);
    setSaveSuccess(false);
  };

  // Handle sample photo selection
  const handleSelectSample = (sample) => {
    setErrorMessage(null);
    setSelectedFile(null);
    setOriginalImageUrl(sample.url);
    setRestoredImageUrl(null);
    setRestoredBlob(null);
    setSaveSuccess(false);
  };

  // Trigger Restoration
  const handleRestore = async () => {
    if (!originalImageUrl) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressText('রিস্টোরেশন শুরু হচ্ছে...');

    try {
      const engine = localStorage.getItem('nostalgia_engine') || 'browser';
      const replicateToken = localStorage.getItem('nostalgia_replicate_token');

      let finalRestoredUrl = null;
      let finalBlob = null;

      if (engine === 'replicate' && replicateToken) {
        // Run cloud AI
        finalRestoredUrl = await runReplicateRestoration({
          imageUrl: originalImageUrl,
          mode: activeMode,
          apiToken: replicateToken,
          onProgress: setProgressText
        });
        // Fetch blob from replicate url
        const res = await fetch(finalRestoredUrl);
        finalBlob = await res.blob();
      } else {
        // Run browser canvas restoration
        // Ensure image element is loaded
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = originalImageUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('ছবি লোড করা সম্ভব হয়নি।'));
        });

        const customSettings = {
          contrast: 1 + sliders.contrast / 100,
          brightness: 1 + sliders.brightness / 100,
          sharpen: sliders.sharpen / 100,
          denoise: sliders.denoise / 100,
          colorize: activeMode === 'colorize' || sliders.colorize
        };

        const result = await runClientSideRestoration({
          imageElement: img,
          mode: activeMode,
          customSettings,
          onProgress: setProgressText
        });

        finalRestoredUrl = result.url;
        finalBlob = result.blob;
      }

      setRestoredImageUrl(finalRestoredUrl);
      setRestoredBlob(finalBlob);

      // Trigger celebration confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore confetti errors
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'রিস্টোর করার সময় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  // Save to Supabase Storage & Database
  const handleSaveToCloud = async () => {
    if (!restoredBlob && !restoredImageUrl) return;
    setIsSaving(true);

    try {
      // 1. Upload original photo
      let origUrl = originalImageUrl;
      if (selectedFile) {
        const uploadedOrig = await uploadImageToStorage(selectedFile, 'originals');
        if (uploadedOrig) origUrl = uploadedOrig;
      }

      // 2. Upload restored photo
      let restUrl = restoredImageUrl;
      if (restoredBlob) {
        const uploadedRest = await uploadImageToStorage(restoredBlob, 'restored');
        if (uploadedRest) restUrl = uploadedRest;
      }

      // 3. Save to database table
      await saveRestorationRecord({
        title: selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'Vintage Photo Memory',
        originalUrl: origUrl,
        restoredUrl: restUrl,
        restorationType: activeMode,
        settings: sliders
      });

      setSaveSuccess(true);
      onRestorationSaved?.();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setErrorMessage('ক্লাউডে সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  // Download high-resolution image
  const handleDownload = () => {
    if (!restoredImageUrl) return;
    const a = document.createElement('a');
    a.href = restoredImageUrl;
    a.download = `nostalgia-restored-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Render mode icon
  const renderModeIcon = (iconName) => {
    switch (iconName) {
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'UserCheck': return <UserCheck className="w-5 h-5" />;
      case 'Palette': return <Palette className="w-5 h-5" />;
      case 'Wand2': return <Wand2 className="w-5 h-5" />;
      case 'Maximize2': return <Maximize2 className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          পুরোনো ছবি ঠিক করে তুলুন <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">ঝকঝকে ও রঙিন</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          আপনার দাদা-দাদির দুর্লভ ছবি, বিবর্ণ পারিবারিক অ্যালবাম বা যেকোনো স্ক্র্যাচযুক্ত সাদাকালো ছবিকে কয়েক সেকেন্ডে স্পষ্ট, ঝকঝকে ও প্রাকৃতিক রঙে রূপান্তর করুন।
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm max-w-3xl mx-auto animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      {/* Upload & Workspace Area */}
      {!originalImageUrl ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Drag & Drop Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className="group relative border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-3xl p-8 sm:p-12 text-center bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition-all duration-300 shadow-xl"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              accept="image/*"
              className="hidden"
            />
            
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110 mb-4 border border-amber-500/20">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2">
              ছবি আপলোড করুন অথবা ড্রপ করুন
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
              যেকোনো পুরোনো, বিবর্ণ, ঘোলাটে বা সাদাকালো ছবি নির্বাচন করুন (JPG, PNG, WEBP)
            </p>

            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 group-hover:bg-amber-400 transition">
              <ImageIcon className="w-4 h-4" />
              <span>ডিভাইস থেকে ব্রাউজ করুন</span>
            </span>
          </div>

          {/* Quick Test Samples */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-medium">ছবি নেই? দ্রুত পরীক্ষা করতে নমুনা ছবি বেছে নিন:</span>
              <span className="text-[11px] text-amber-400">১-ক্লিকে পরীক্ষা</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SAMPLE_PHOTOS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all hover:bg-slate-900"
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white group-hover:text-amber-300 truncate">
                      {sample.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{sample.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Workspace when image is selected */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Preview or Comparison (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {restoredImageUrl ? (
              <ImageComparisonSlider
                originalUrl={originalImageUrl}
                restoredUrl={restoredImageUrl}
              />
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center shadow-xl">
                <img
                  src={originalImageUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur text-xs font-medium text-slate-300 border border-slate-700">
                    আসল ছবি (Original)
                  </span>
                </div>
              </div>
            )}

            {/* Quick Actions below image */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setOriginalImageUrl(null);
                  setRestoredImageUrl(null);
                  setRestoredBlob(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>নতুন ছবি পরিবর্তন</span>
              </button>

              {restoredImageUrl && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveToCloud}
                    disabled={isSaving}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                      saveSuccess
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>সেভ হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'সেভ হচ্ছে...' : 'Supabase-এ সেভ করুন'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 shadow transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>এইচডি ডাউনলোড</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Controls & Restoration Modes (5 cols) */}
          <div className="lg:col-span-5 space-y-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>রিস্টোরেশন মোড নির্বাচন করুন</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ছবির ধরন অনুযায়ী সেরা AI অ্যালগরিদম বেছে নিন
              </p>
            </div>

            {/* Mode selection buttons */}
            <div className="space-y-2.5">
              {RESTORATION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                    activeMode === mode.id
                      ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500/40 shadow-sm'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    activeMode === mode.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {renderModeIcon(mode.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-sm text-white">{mode.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-medium border border-slate-700">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{mode.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Fine-Tuning Advanced Sliders Toggle */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 py-1"
              >
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>ম্যানুয়াল ফাইন-টিউনিং (Custom Adjustments)</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 animate-in fade-in">
                  {/* Sharpen */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>শার্পনেস ও মুখের স্পষ্টতা:</span>
                      <span className="text-amber-400 font-mono">{sliders.sharpen}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.sharpen}
                      onChange={(e) => setSliders({ ...sliders, sharpen: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>কনট্রাস্ট ও ডিপনেস:</span>
                      <span className="text-amber-400 font-mono">+{sliders.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={sliders.contrast}
                      onChange={(e) => setSliders({ ...sliders, contrast: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Denoise & Scratch Removal */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>স্ক্র্যাচ ও নয়েজ কমানো:</span>
                      <span className="text-amber-400 font-mono">{sliders.denoise}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.denoise}
                      onChange={(e) => setSliders({ ...sliders, denoise: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Colorize checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={sliders.colorize}
                      onChange={(e) => setSliders({ ...sliders, colorize: e.target.checked })}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">সাদাকালো হলে কৃত্রিম বুদ্ধিমত্তা দিয়ে রঙ যোগ করুন</span>
                  </label>
                </div>
              )}
            </div>

            {/* Restore Action Button */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleRestore}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{progressText || 'প্রসেসিং হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-slate-950" />
                    <span>ছবি ঠিক করুন (Restore Photo)</span>
                  </>
                )}
              </button>

              {isProcessing && (
                <div className="space-y-1.5 text-center">
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-1.5 rounded-full animate-pulse w-3/4"></div>
                  </div>
                  <p className="text-[11px] text-amber-300">{progressText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
