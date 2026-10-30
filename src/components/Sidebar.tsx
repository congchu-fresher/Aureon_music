import React, { useState } from 'react';
import {
  Home,
  Compass,
  Radio,
  Library,
  Plus,
  Heart,
  Search,
  Music,
  Disc3,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  FolderHeart,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    navigateTo,
    userPlaylists,
    setIsCreatePlaylistOpen,
    currentUser,
    allAlbums,
    allArtists,
    playCollection,
    allSongs,
  } = useMusic();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'playlist' | 'artist' | 'album'>('all');
  const [librarySearch, setLibrarySearch] = useState('');

  const likedSongsCount = currentUser.likedSongIds.length;
  const savedAlbums = allAlbums.filter((a) => currentUser.savedAlbumIds.includes(a.id));
  const followedArtists = allArtists.filter((a) => currentUser.followedArtistIds.includes(a.id));

  // Filter items in library
  const filteredPlaylists = userPlaylists.filter((p) =>
    p.title.toLowerCase().includes(librarySearch.toLowerCase())
  );
  const filteredAlbums = savedAlbums.filter((a) =>
    a.title.toLowerCase().includes(librarySearch.toLowerCase())
  );
  const filteredArtists = followedArtists.filter((a) =>
    a.name.toLowerCase().includes(librarySearch.toLowerCase())
  );

  return (
    <aside
      className={`h-full bg-[#121212] flex flex-col border-r border-white/[0.06] select-none transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72 lg:w-80'
      }`}
    >
      {/* Top Primary Nav */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => navigateTo({ type: 'home' })}
          className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            activeView.type === 'home'
              ? 'bg-[#181818] text-[#1ED760]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          title="Trang chủ"
        >
          <Home size={22} className={activeView.type === 'home' ? 'text-[#1ED760]' : ''} />
          {!isCollapsed && <span>Trang chủ</span>}
        </button>

        <button
          onClick={() => navigateTo({ type: 'search' })}
          className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            activeView.type === 'search'
              ? 'bg-[#181818] text-[#1ED760]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          title="Khám phá"
        >
          <Compass size={22} className={activeView.type === 'search' ? 'text-[#1ED760]' : ''} />
          {!isCollapsed && <span>Khám phá & Tìm kiếm</span>}
        </button>

        <button
          onClick={() => {
            const radioSongs = [...allSongs].sort(() => Math.random() - 0.5);
            playCollection(radioSongs);
          }}
          className="w-full flex items-center gap-4 px-3.5 py-3 rounded-xl font-semibold text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
          title="Aureon Radio"
        >
          <Radio size={22} />
          {!isCollapsed && <span>Aureon Radio</span>}
        </button>
      </div>

      <div className="mx-3 border-t border-white/[0.06]" />

      {/* Your Library Header */}
      <div className="p-3 flex items-center justify-between">
        <button
          onClick={() => navigateTo({ type: 'library' })}
          className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group"
          title="Thư viện của bạn"
        >
          <Library size={22} className="group-hover:text-white" />
          {!isCollapsed && <span className="font-bold text-sm tracking-wide">Thư viện của bạn</span>}
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCreatePlaylistOpen(true)}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Tạo playlist mới"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Thu gọn thanh bên"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors mx-auto"
            title="Mở rộng thanh bên"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Filter Chips (when not collapsed) */}
      {!isCollapsed && (
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterType === 'all'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#242424] text-zinc-300 hover:bg-[#2e2e2e]'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterType('playlist')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterType === 'playlist'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#242424] text-zinc-300 hover:bg-[#2e2e2e]'
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setFilterType('artist')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterType === 'artist'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#242424] text-zinc-300 hover:bg-[#2e2e2e]'
            }`}
          >
            Nghệ sĩ
          </button>
          <button
            onClick={() => setFilterType('album')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterType === 'album'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#242424] text-zinc-300 hover:bg-[#2e2e2e]'
            }`}
          >
            Album
          </button>
        </div>
      )}

      {/* Library Scrollable List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {/* Liked Songs Entry */}
        {(filterType === 'all' || filterType === 'playlist') && (
          <div
            onClick={() => navigateTo({ type: 'liked-songs' })}
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 group ${
              activeView.type === 'liked-songs'
                ? 'bg-[#242424]'
                : 'hover:bg-white/[0.05]'
            }`}
            title="Bài hát đã thích"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Heart size={20} className="text-white fill-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  activeView.type === 'liked-songs' ? 'text-[#1ED760]' : 'text-white'
                }`}>
                  Bài hát đã thích
                </p>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="text-[#1ED760]">★</span> Danh sách • {likedSongsCount} bài hát
                </p>
              </div>
            )}
          </div>
        )}

        {/* User Playlists */}
        {(filterType === 'all' || filterType === 'playlist') &&
          filteredPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => navigateTo({ type: 'playlist', playlistId: pl.id })}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                activeView.type === 'playlist' && activeView.playlistId === pl.id
                  ? 'bg-[#242424]'
                  : 'hover:bg-white/[0.05]'
              }`}
              title={pl.title}
            >
              <img
                src={pl.coverUrl}
                alt={pl.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    activeView.type === 'playlist' && activeView.playlistId === pl.id
                      ? 'text-[#1ED760]'
                      : 'text-white'
                  }`}>
                    {pl.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    Playlist • {pl.createdBy || 'Bạn'}
                  </p>
                </div>
              )}
            </div>
          ))}

        {/* Followed Artists */}
        {(filterType === 'all' || filterType === 'artist') &&
          filteredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigateTo({ type: 'artist', artistId: artist.id })}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                activeView.type === 'artist' && activeView.artistId === artist.id
                  ? 'bg-[#242424]'
                  : 'hover:bg-white/[0.05]'
              }`}
              title={artist.name}
            >
              <img
                src={artist.avatarUrl}
                alt={artist.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    activeView.type === 'artist' && activeView.artistId === artist.id
                      ? 'text-[#1ED760]'
                      : 'text-white'
                  }`}>
                    {artist.name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">Nghệ sĩ</p>
                </div>
              )}
            </div>
          ))}

        {/* Saved Albums */}
        {(filterType === 'all' || filterType === 'album') &&
          filteredAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => navigateTo({ type: 'album', albumId: album.id })}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                activeView.type === 'album' && activeView.albumId === album.id
                  ? 'bg-[#242424]'
                  : 'hover:bg-white/[0.05]'
              }`}
              title={album.title}
            >
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    activeView.type === 'album' && activeView.albumId === album.id
                      ? 'text-[#1ED760]'
                      : 'text-white'
                  }`}>
                    {album.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    Album • {album.artistName}
                  </p>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Bottom CTA when collapsed/expanded */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={() => setIsCreatePlaylistOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={16} />
            <span>Tạo Playlist Mới</span>
          </button>
        </div>
      )}
    </aside>
  );
};
