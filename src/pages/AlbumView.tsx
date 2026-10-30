import React from 'react';
import {
  Play,
  Pause,
  Heart,
  Clock,
  Plus,
  Share2,
  Disc3,
  Calendar,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { formatTime, calculateTotalDurationFormatted } from '../utils/audioQueue';

interface AlbumViewProps {
  albumId: string;
}

export const AlbumView: React.FC<AlbumViewProps> = ({ albumId }) => {
  const {
    allAlbums,
    currentSong,
    isPlaying,
    playSong,
    playCollection,
    togglePlayPause,
    toggleLike,
    isSongLiked,
    saveAlbum,
    currentUser,
    navigateTo,
    showToast,
  } = useMusic();

  const album = allAlbums.find((a) => a.id === albumId) || allAlbums[0];
  if (!album) return null;

  const isSaved = currentUser.savedAlbumIds.includes(album.id);
  const isCurrentAlbumPlaying =
    isPlaying && album.songs.some((s) => s.id === currentSong?.id);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-4 pb-2">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 group relative">
          <img
            src={album.coverUrl}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex-1 space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Album
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {album.title}
          </h1>

          <p className="text-sm text-zinc-300 max-w-2xl line-clamp-2 pt-1">
            {album.description}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2 text-xs font-medium text-zinc-300">
            <span
              onClick={() => navigateTo({ type: 'artist', artistId: album.artistId })}
              className="text-white font-bold hover:underline cursor-pointer"
            >
              {album.artistName}
            </span>
            <span>•</span>
            <span>{album.releaseYear}</span>
            <span>•</span>
            <span>{album.songs.length} bài hát</span>
            <span>•</span>
            <span className="text-zinc-400">{calculateTotalDurationFormatted(album.songs)}</span>
          </div>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="flex items-center gap-4 py-2 border-y border-white/[0.06]">
        <button
          onClick={() => {
            if (isCurrentAlbumPlaying) {
              togglePlayPause();
            } else {
              playCollection(album.songs);
            }
          }}
          className="w-13 h-13 rounded-full bg-[#1ED760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1ED760]/20 cursor-pointer"
          title={isCurrentAlbumPlaying ? 'Tạm dừng' : 'Phát tất cả'}
        >
          {isCurrentAlbumPlaying ? (
            <Pause size={24} className="fill-black" />
          ) : (
            <Play size={24} className="fill-black translate-x-0.5" />
          )}
        </button>

        <button
          onClick={() => saveAlbum(album.id)}
          className={`p-3 rounded-full transition-colors ${
            isSaved ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
          }`}
          title={isSaved ? 'Đã lưu trong thư viện' : 'Lưu album'}
        >
          <Heart size={24} className={isSaved ? 'fill-[#1ED760]' : ''} />
        </button>

        <button
          onClick={() => showToast('Đã sao chép liên kết album vào bộ nhớ tạm')}
          className="p-3 rounded-full text-zinc-400 hover:text-white transition-colors"
          title="Chia sẻ album"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Tracklist Table */}
      <div className="space-y-1">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-zinc-400 border-b border-white/[0.06] uppercase tracking-wider">
          <span className="col-span-1 text-center">#</span>
          <span className="col-span-6 md:col-span-7">Tiêu đề</span>
          <span className="col-span-3 md:col-span-3 hidden sm:block">Lượt phát</span>
          <span className="col-span-2 md:col-span-1 text-right flex items-center justify-end">
            <Clock size={14} />
          </span>
        </div>

        {/* Tracks */}
        {album.songs.map((song, idx) => {
          const isCurrent = currentSong?.id === song.id;
          const isLiked = isSongLiked(song.id);

          return (
            <div
              key={song.id}
              onClick={() => playSong(song, album.songs, idx)}
              className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-xl items-center group cursor-pointer transition-colors ${
                isCurrent ? 'bg-[#242424]' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div className="col-span-1 text-center text-xs font-mono text-zinc-400">
                {isCurrent && isPlaying ? (
                  <span className="text-[#1ED760] font-bold">▶</span>
                ) : (
                  <span className="group-hover:hidden">{idx + 1}</span>
                )}
                <span className="hidden group-hover:inline text-white">▶</span>
              </div>

              <div className="col-span-6 md:col-span-7 flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isCurrent ? 'text-[#1ED760]' : 'text-white'
                    }`}
                  >
                    {song.title}
                  </p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {song.artistName}
                  </p>
                </div>
              </div>

              <div className="col-span-3 md:col-span-3 hidden sm:block text-xs font-mono text-zinc-400">
                {song.plays.toLocaleString('vi-VN')}
              </div>

              <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-2 text-xs font-mono text-zinc-400">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(song.id);
                  }}
                  className={`p-1 transition-colors ${
                    isLiked ? 'text-[#1ED760]' : 'text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white'
                  }`}
                  title="Yêu thích"
                >
                  <Heart size={15} className={isLiked ? 'fill-[#1ED760]' : ''} />
                </button>
                <span>{formatTime(song.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
