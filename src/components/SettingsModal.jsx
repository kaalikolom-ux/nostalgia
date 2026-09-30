import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Database, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSave }) {
  const [engine, setEngine] = useState('browser');
  const [replicateToken, setReplicateToken] = useState('');
  const [hfToken, setHfToken] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedEngine = localStorage.getItem('nostalgia_engine') || 'browser';
      const savedRepToken = localStorage.getItem('nostalgia_replicate_token') || '';
      const savedHfToken = localStorage.getItem('nostalgia_hf_token') || '';
      setEngine(savedEngine);
      setReplicateToken(savedRepToken);
      setHfToken(savedHfToken);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('nostalgia_engine', engine);
    localStorage.setItem('nostalgia_replicate_token', replicateToken);
    localStorage.setItem('nostalgia_hf_token', hfToken);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSave?.({ engine, replicateToken, hfToken });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">সেটিংস ও এআই ইঞ্জিন</h3>
              <p className="text-xs text-slate-400">রিস্টোরেশন মেথড এবং এপিআই কি কনফিগার করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            রিস্টোরেশন ইঞ্জিন নির্বাচন করুন
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEngine('browser')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                engine === 'browser'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/50'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-white">ইন-ব্রাউজার ইঞ্জিন</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  বিনামূল্যে
                </span>
              </div>
              <p className="text-xs text-slate-400">
                কোনো API key লাগবে না। ব্রাউজারের নিজস্ব ইমেজ প্রসেসর দিয়ে তাৎক্ষণিক কাজ করে।
              </p>
            </button>

            <button
              type="button"
              onClick={() => setEngine('replicate')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                engine === 'replicate'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/50'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-white">Replicate ক্লাউড AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  CodeFormer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                সরাসরি ডিপ-লার্নিং নিউরাল মডেল (GFPGAN, Real-ESRGAN, DeOldify) রান করে।
              </p>
            </button>
          </div>
        </div>

        {/* API Token Input if Cloud AI selected */}
        {engine === 'replicate' && (
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Replicate API Token</span>
              </label>
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>টোকেন তৈরি করুন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={replicateToken}
              onChange={(e) => setReplicateToken(e.target.value)}
              placeholder="r8_..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
            <p className="text-[11px] text-slate-500">
              আপনার টোকেনটি শুধুমাত্র আপনার ব্রাউজারের লোকাল স্টোরেজে নিরাপদে সংরক্ষিত থাকে।
            </p>
          </div>
        )}

        {/* Supabase Status Banner */}
        <div className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <span>Supabase ডাটাবেস ও স্টোরেজ</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            </div>
            <p className="text-slate-400 text-[11px]">
              সরাসরি ক্লাউড স্টোরেজে ছবি সংরক্ষণ ও গ্যালারির সাথে সংযুক্ত।
            </p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg transition"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>সংরক্ষিত!</span>
              </>
            ) : (
              <span>সেভ করুন</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
