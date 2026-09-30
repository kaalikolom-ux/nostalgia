import React, { useState } from 'react';
import Header from './components/Header';
import RestorationStudio from './components/RestorationStudio';
import GalleryView from './components/GalleryView';
import SettingsModal from './components/SettingsModal';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshGalleryKey, setRefreshGalleryKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grain selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'studio' && (
          <RestorationStudio
            onRestorationSaved={() => {
              setRefreshGalleryKey((prev) => prev + 1);
            }}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryView
            key={refreshGalleryKey}
            onSelectForStudio={(photo) => {
              setActiveTab('studio');
            }}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(settings) => {
          console.log('Updated settings:', settings);
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
