import React from 'react';
import {
  Play,
  Pause,
  Heart,
  Clock,
  Sparkles,
  Music2,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { formatTime, calculateTotalDurationFormatted } from '../utils/audioQueue';

export const LikedSongsView: React.FC = () => {
  const {
    allSongs,
    currentUser,
    currentSong,
    isPlaying,
    playSong,
    playCollection,
    togglePlayPause,
    toggleLike,
    isSongLiked,
    navigateTo,
  } = useMusic();

  const likedSongs = allSongs.filter((s) => currentUser.likedSongIds.includes(s.id));
  const isLikedPlaying =
    isPlaying && likedSongs.some((s) => s.id === currentSong?.id);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header with vibrant purple/indigo gradient */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-4 pb-2">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 shadow-2xl flex items-center justify-center flex-shrink-0 group">
          <Heart size={80} className="text-white fill-white shadow-xl group-hover:scale-110 transition-transform duration-300" />
        </div>

        <div className="flex-1 space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Danh sách cá nhân
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Bài hát đã thích
          </h1>

          <div className="flex items-center justify-center md:justify-start gap-2 pt-2 text-xs font-medium text-zinc-300">
            <span className="text-white font-bold">{currentUser.name}</span>
            <span>•</span>
            <span>{likedSongs.length} bài hát đã lưu</span>
            {likedSongs.length > 0 && (
              <>
                <span>•</span>
                <span className="text-zinc-400">
                  {calculateTotalDurationFormatted(likedSongs)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4 py-2 border-y border-white/[0.06]">
        <button
          onClick={() => {
            if (isLikedPlaying) {
              togglePlayPause();
            } else if (likedSongs.length > 0) {
              playCollection(likedSongs);
            }
          }}
          disabled={likedSongs.length === 0}
          className={`w-13 h-13 rounded-full flex items-center justify-center transition-all shadow-xl shadow-[#1ED760]/20 ${
            likedSongs.length === 0
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-[#1ED760] text-black hover:scale-105 active:scale-95 cursor-pointer'
          }`}
          title="Phát tất cả bài hát đã thích"
        >
          {isLikedPlaying ? (
            <Pause size={24} className="fill-black" />
          ) : (
            <Play size={24} className="fill-black translate-x-0.5" />
          )}
        </button>
      </div>

      {/* List */}
      {likedSongs.length === 0 ? (
        <div className="text-center py-16 bg-[#181818] rounded-3xl border border-white/5 space-y-3">
          <Heart size={40} className="mx-auto text-zinc-500" />
          <h3 className="text-lg font-bold text-white">Bạn chưa thích bài hát nào</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Nhấn vào biểu tượng trái tim ở bất kỳ bài hát nào để lưu vào danh sách yêu thích của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-zinc-400 border-b border-white/[0.06] uppercase tracking-wider">
            <span className="col-span-1 text-center">#</span>
            <span className="col-span-6 md:col-span-7">Tiêu đề</span>
            <span className="col-span-3 md:col-span-3 hidden sm:block">Album</span>
            <span className="col-span-2 md:col-span-1 text-right flex items-center justify-end">
              <Clock size={14} />
            </span>
          </div>

          {likedSongs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;

            return (
              <div
                key={song.id}
                onClick={() => playSong(song, likedSongs, idx)}
                className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-xl items-center group cursor-pointer transition-colors ${
                  isCurrent ? 'bg-[#242424]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <span className="col-span-1 text-center text-xs font-mono text-zinc-400">
                  {isCurrent && isPlaying ? (
                    <span className="text-[#1ED760] font-bold">▶</span>
                  ) : (
                    idx + 1
                  )}
                </span>

                <div className="col-span-6 md:col-span-7 flex items-center gap-3 min-w-0">
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
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

                <div className="col-span-3 text-xs text-zinc-400 truncate hidden sm:block">
                  {song.albumTitle}
                </div>

                <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-2 text-xs font-mono text-zinc-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song.id);
                    }}
                    className="p-1 text-[#1ED760] hover:scale-110 transition-transform"
                    title="Xóa khỏi yêu thích"
                  >
                    <Heart size={15} className="fill-[#1ED760]" />
                  </button>
                  <span>{formatTime(song.duration)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
