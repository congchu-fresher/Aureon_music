import React, { useEffect } from 'react';
import { MusicProvider, useMusic } from './contexts/MusicContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MusicPlayer } from './components/MusicPlayer';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { QueuePanel } from './components/QueuePanel';
import { Modals } from './components/Modals';


import { HomeView } from './pages/HomeView';
import { SearchView } from './pages/SearchView';
import { AlbumView } from './pages/AlbumView';
import { ArtistView } from './pages/ArtistView';
import { PlaylistView } from './pages/PlaylistView';
import { LikedSongsView } from './pages/LikedSongsView';
import { LibraryView } from './pages/LibraryView';
import { SettingsView } from './pages/SettingsView';
import VisualizerDemo from './pages/VisualizerDemo';

const MainLayout: React.FC = () => {
  const {
    activeView,
    togglePlayPause,
    nextSong,
    prevSong,
    toggleMute,
    toggleLike,
    currentSong,
    isFullScreenPlayer,
  } = useMusic();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyL' && currentSong) {
        e.preventDefault();
        toggleLike(currentSong.id);
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        nextSong();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        prevSong();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, toggleMute, toggleLike, nextSong, prevSong, currentSong]);

  const renderActiveView = () => {
    switch (activeView.type) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'album':
        return <AlbumView albumId={activeView.albumId} />;
      case 'artist':
        return <ArtistView artistId={activeView.artistId} />;
      case 'playlist':
        return <PlaylistView playlistId={activeView.playlistId} />;
      case 'liked-songs':
        return <LikedSongsView />;
      case 'library':
        return <LibraryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-white overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace: Left Sidebar + Center Scrollable Content + Right Queue Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 bg-gradient-to-b from-[#181818] via-[#121212] to-[#0a0a0c]">
          {renderActiveView()}
        </main>

        <QueuePanel />
      </div>

      {/* Fixed Bottom Music Player */}
      {!isFullScreenPlayer && <MusicPlayer />}
      {isFullScreenPlayer && <FullScreenPlayer />}

      {/* Modals & Toasts */}
      <Modals />
    </div>
  );
};

export default function App() {
  // Keep the standalone demo available without mounting the site's audio player.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visualizer') === 'demo') {
    return <VisualizerDemo />;
  }

  return (
    <MusicProvider>
      <MainLayout />
    </MusicProvider>
  );
}
