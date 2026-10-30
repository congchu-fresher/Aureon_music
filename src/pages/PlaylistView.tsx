import React from 'react';
import {
  Play,
  Pause,
  Heart,
  Clock,
  Trash2,
  Share2,
  Music2,
  FolderPlus,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { formatTime, calculateTotalDurationFormatted } from '../utils/audioQueue';

interface PlaylistViewProps {
  playlistId: string;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId }) => {
  const {
    userPlaylists,
    featuredCharts,
    madeForYou,
    currentSong,
    isPlaying,
    playSong,
    playCollection,
    togglePlayPause,
    toggleLike,
    isSongLiked,
    showToast,
  } = useMusic();

  const allPlaylists = [...featuredCharts, ...madeForYou, ...userPlaylists];
  const playlist = allPlaylists.find((p) => p.id === playlistId) || allPlaylists[0];

  if (!playlist) return null;

  const isPlaylistPlaying =
    isPlaying && playlist.songs.some((s) => s.id === currentSong?.id);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-4 pb-2">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 group relative">
          <img
            src={playlist.coverUrl}
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex-1 space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Danh sách phát
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {playlist.title}
          </h1>

          <p className="text-sm text-zinc-300 max-w-2xl line-clamp-2 pt-1">
            {playlist.description}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2 text-xs font-medium text-zinc-300">
            <span className="text-white font-bold">{playlist.createdBy || 'Aureon Editorial'}</span>
            <span>•</span>
            <span>{playlist.songs.length} bài hát</span>
            <span>•</span>
            <span className="text-zinc-400">
              {calculateTotalDurationFormatted(playlist.songs)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4 py-2 border-y border-white/[0.06]">
        <button
          onClick={() => {
            if (isPlaylistPlaying) {
              togglePlayPause();
            } else if (playlist.songs.length > 0) {
              playCollection(playlist.songs);
            }
          }}
          disabled={playlist.songs.length === 0}
          className={`w-13 h-13 rounded-full flex items-center justify-center transition-all shadow-xl shadow-[#1ED760]/20 ${
            playlist.songs.length === 0
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-[#1ED760] text-black hover:scale-105 active:scale-95 cursor-pointer'
          }`}
          title={isPlaylistPlaying ? 'Tạm dừng' : 'Phát playlist'}
        >
          {isPlaylistPlaying ? (
            <Pause size={24} className="fill-black" />
          ) : (
            <Play size={24} className="fill-black translate-x-0.5" />
          )}
        </button>

        <button
          onClick={() => showToast('Đã sao chép liên kết playlist')}
          className="p-3 rounded-full text-zinc-400 hover:text-white transition-colors"
          title="Chia sẻ playlist"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Song list or empty state */}
      {playlist.songs.length === 0 ? (
        <div className="text-center py-16 bg-[#181818] rounded-3xl border border-white/5 space-y-3">
          <Music2 size={36} className="mx-auto text-zinc-500" />
          <h3 className="text-lg font-bold text-white">Playlist này hiện chưa có bài hát nào</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Hãy khám phá thư viện âm nhạc và thêm những bài hát yêu thích của bạn vào danh sách này.
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

          {playlist.songs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;
            const isLiked = isSongLiked(song.id);

            return (
              <div
                key={`${song.id}-${idx}`}
                onClick={() => playSong(song, playlist.songs, idx)}
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
                    className={`p-1 transition-colors ${
                      isLiked ? 'text-[#1ED760]' : 'text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white'
                    }`}
                  >
                    <Heart size={15} className={isLiked ? 'fill-[#1ED760]' : ''} />
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
