import React, { useState } from 'react';
import {
  Library,
  Heart,
  Plus,
  Music2,
  Disc3,
  UserCheck,
  Play,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export const LibraryView: React.FC = () => {
  const {
    userPlaylists,
    allAlbums,
    allArtists,
    currentUser,
    setIsCreatePlaylistOpen,
    navigateTo,
    playCollection,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'all' | 'playlists' | 'artists' | 'albums'>('all');

  const savedAlbums = allAlbums.filter((a) => currentUser.savedAlbumIds.includes(a.id));
  const followedArtists = allArtists.filter((a) => currentUser.followedArtistIds.includes(a.id));

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Thư viện của bạn
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tổng hợp danh sách phát, nghệ sĩ và album bạn đã lưu.
          </p>
        </div>

        <button
          onClick={() => setIsCreatePlaylistOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1ED760] text-black font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#1ED760]/20 cursor-pointer"
        >
          <Plus size={16} />
          <span>Tạo Playlist</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'playlists', label: 'Playlists' },
          { id: 'artists', label: 'Nghệ sĩ' },
          { id: 'albums', label: 'Album' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-black shadow'
                : 'bg-[#1e1e24] text-zinc-300 hover:bg-[#282830]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Liked Songs Card */}
        {(activeTab === 'all' || activeTab === 'playlists') && (
          <div
            onClick={() => navigateTo({ type: 'liked-songs' })}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-700 to-rose-600 cursor-pointer hover:scale-[1.02] transition-transform shadow-xl flex flex-col justify-between h-56"
          >
            <div className="flex justify-end">
              <Heart size={32} className="text-white fill-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Bài hát đã thích</h3>
              <p className="text-xs text-white/80 mt-1">
                {currentUser.likedSongIds.length} bài hát đã lưu
              </p>
            </div>
          </div>
        )}

        {/* User Playlists */}
        {(activeTab === 'all' || activeTab === 'playlists') &&
          userPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => navigateTo({ type: 'playlist', playlistId: pl.id })}
              className="p-3.5 bg-[#181818] hover:bg-[#242424] rounded-2xl border border-white/5 cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
            >
              <img
                src={pl.coverUrl}
                alt={pl.title}
                className="w-full aspect-square object-cover rounded-xl mb-3 shadow-md"
              />
              <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1ED760] transition-colors">
                {pl.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Playlist • {pl.createdBy || 'Bạn'}</p>
            </div>
          ))}

        {/* Followed Artists */}
        {(activeTab === 'all' || activeTab === 'artists') &&
          followedArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigateTo({ type: 'artist', artistId: artist.id })}
              className="p-3.5 bg-[#181818] hover:bg-[#242424] rounded-2xl border border-white/5 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
            >
              <img
                src={artist.avatarUrl}
                alt={artist.name}
                className="w-28 h-28 rounded-full object-cover mx-auto mb-3 ring-2 ring-transparent group-hover:ring-[#1ED760] transition-all"
              />
              <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1ED760] transition-colors">
                {artist.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Nghệ sĩ</p>
            </div>
          ))}

        {/* Saved Albums */}
        {(activeTab === 'all' || activeTab === 'albums') &&
          savedAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => navigateTo({ type: 'album', albumId: album.id })}
              className="p-3.5 bg-[#181818] hover:bg-[#242424] rounded-2xl border border-white/5 cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
            >
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full aspect-square object-cover rounded-xl mb-3 shadow-md"
              />
              <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1ED760] transition-colors">
                {album.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Album • {album.artistName}</p>
            </div>
          ))}
      </div>
    </div>
  );
};
