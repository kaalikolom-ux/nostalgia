import React, { useState, useEffect } from 'react';
import { fetchRecentRestorations, supabase } from '../lib/supabase';
import { Image, Download, Trash2, Calendar, Eye, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import ImageComparisonSlider from './ImageComparisonSlider';

export default function GalleryView({ onSelectForStudio }) {
  const [restorations, setRestorations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchRecentRestorations(30);
    setRestorations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('আপনি কি এই রিস্টোরেশনটি মুছে ফেলতে চান?')) return;
    try {
      await supabase.from('restorations').delete().eq('id', id);
      setRestorations((prev) => prev.filter((item) => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getBadgeTitle = (type) => {
    switch (type) {
      case 'colorize': return 'রঙিন ছবি';
      case 'face_restore': return 'ফেস রিস্টোর';
      case 'scratch_repair': return 'দাগমুক্ত';
      case 'hd_upscale': return 'এইচডি আপস্কেল';
      default: return 'ফুল ম্যাজিক';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <span>স্মৃতির গ্যালারি</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Supabase Cloud
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            আপনার ঠিক করা পুরোনো ছবিগুলোর সংরক্ষিত ইতিহাস
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-sm font-medium transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Selected Item Modal / Comparison Preview */}
      {selectedItem && (
        <div className="bg-slate-900/90 rounded-2xl border border-amber-500/30 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-serif font-bold text-white">{selectedItem.title}</h3>
              <p className="text-xs text-slate-400">
                তারিখ: {new Date(selectedItem.created_at).toLocaleDateString('bn-BD', { dateStyle: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={selectedItem.restored_url}
                download="nostalgia-restored.jpg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-semibold shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ডাউনলোড</span>
              </a>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>

          <ImageComparisonSlider
            originalUrl={selectedItem.original_url}
            restoredUrl={selectedItem.restored_url}
          />
        </div>
      )}

      {/* Grid of Restorations */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : restorations.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 text-amber-400 flex items-center justify-center mx-auto">
            <Image className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">এখনও কোনো ছবি সেভ করা হয়নি</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              স্টুডিও থেকে কোনো ছবি রিস্টোর করে "Supabase-এ সেভ করুন" চাপলে এখানে সংরক্ষিত থাকবে।
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restorations.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-amber-500/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 flex flex-col"
            >
              {/* Image Preview with Hover Reveal */}
              <div
                className="relative aspect-[4/3] bg-slate-950 cursor-pointer overflow-hidden"
                onClick={() => setSelectedItem(item)}
              >
                <img
                  src={item.restored_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-medium border border-amber-500/30 shadow">
                    {getBadgeTitle(item.restoration_type)}
                  </span>
                </div>

                {/* View Overlay on Hover */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                  <button className="p-3 rounded-full bg-amber-500 text-slate-950 font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info & Footer */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-serif font-bold text-white text-base line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleDateString('bn-BD')}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <span>আগে ও পরের তুলনা দেখুন</span>
                  </button>
                  <a
                    href={item.restored_url}
                    download="restored.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="ছবি ডাউনলোড করুন"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
