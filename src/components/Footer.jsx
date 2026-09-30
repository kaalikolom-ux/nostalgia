import React from 'react';
import { Heart, Sparkles, Cloud, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 backdrop-blur py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Old Photo Restoration</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Cloudflare Pages</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Cloud</span>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1">
          <span>তৈরি করা হয়েছে ভালোবাসা দিয়ে</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>• স্মৃতিগুলো চিরদিনের জন্য জীবন্ত থাকুক</span>
        </p>

        <p className="text-[11px] text-slate-600">
          © {new Date().getFullYear()} Nostalgia. সকল স্বত্ব সংরক্ষিত।
        </p>
      </div>
    </footer>
  );
}
