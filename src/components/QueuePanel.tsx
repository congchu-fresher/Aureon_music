import React, { useState } from 'react';
import {
  X,
  Play,
  Trash2,
  Music2,
  Mic2,
  Radio,
  Share2,
  Plus,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { formatTime } from '../utils/audioQueue';

export const QueuePanel: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    isLyricsOpen,
    setIsLyricsOpen,
    currentSong,
    queue,
    queueIndex,
    isPlaying,
    playSong,
    removeFromQueue,
    clearQueue,
    visualizerData,
    currentTime,
    showToast,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics'>(
    isLyricsOpen ? 'lyrics' : 'queue'
  );

  // Sync tab with lyrics toggle
  React.useEffect(() => {
    if (isLyricsOpen) setActiveTab('lyrics');
  }, [isLyricsOpen]);

  if (!isQueueOpen && !isLyricsOpen) return null;

  const currentLyrics = currentSong?.lyrics || [
    'Lời bài hát đang được cập nhật...',
    'Thưởng thức giai điệu cùng Aureon High-Fidelity Audio.',
  ];

  // Estimate active lyric line based on time
  const activeLyricIndex = Math.min(
    currentLyrics.length - 1,
    Math.floor((currentTime / (currentSong?.duration || 200)) * currentLyrics.length)
  );

  return (
    <aside className="w-80 lg:w-96 h-full bg-[#121212] border-l border-white/[0.06] flex flex-col z-30 select-none animate-in slide-in-from-right duration-200 shadow-2xl">
      {/* Panel Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-[#181818] rounded-xl">
          <button
            onClick={() => {
              setActiveTab('queue');
              setIsLyricsOpen(false);
              setIsQueueOpen(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'queue'
                ? 'bg-[#242424] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hàng đợi
          </button>
          <button
            onClick={() => {
              setActiveTab('lyrics');
              setIsLyricsOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'lyrics'
                ? 'bg-[#242424] text-[#1ED760] shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic2 size={13} />
            <span>Lời bài hát</span>
          </button>
        </div>

        <button
          onClick={() => {
            setIsQueueOpen(false);
            setIsLyricsOpen(false);
          }}
          className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Đóng bảng"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tab: Play Queue Content */}
      {activeTab === 'queue' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* NOW PLAYING CARD (Inspired by Image 2 & 3) */}
          {currentSong && (
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Đang phát
              </h3>

              <div className="bg-[#181818] p-4 rounded-2xl border border-white/5 space-y-3.5 shadow-lg relative overflow-hidden group">
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl">
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-[#1ED760] font-bold border border-[#1ED760]/30">
                    FLAC 24-bit / 96kHz
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">{currentSong.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{currentSong.artistName}</p>
                </div>

                {/* Real-time Dynamic Waveform visualizer (Image 2 & 3) */}
                <div className="bg-[#121212] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-2">
                    <span className="flex items-center gap-1 text-[#1ED760]">
                      <Radio size={12} className={isPlaying ? 'animate-pulse' : ''} />
                      Aureon Sound Engine
                    </span>
                    <span>320 kbps</span>
                  </div>

                  <div className="h-10 flex items-center justify-between gap-1 px-1">
                    {visualizerData.map((val, idx) => {
                      const height = Math.max(4, Math.min(36, (val / 100) * 36));
                      return (
                        <div
                          key={idx}
                          className="flex-1 bg-gradient-to-t from-[#10B981] to-[#1ED760] rounded-full transition-all duration-75"
                          style={{
                            height: `${height}px`,
                            opacity: isPlaying ? 0.9 : 0.3,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UP NEXT QUEUE */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Tiếp theo trong hàng ({queue.length})
              </h3>
              {queue.length > 1 && (
                <button
                  onClick={clearQueue}
                  className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              {queue.map((song, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${song.id}-${idx}`}
                    className={`flex items-center gap-3 p-2 rounded-xl group transition-all ${
                      isCurrent
                        ? 'bg-[#1ED760]/10 border border-[#1ED760]/20'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="w-5 text-center text-xs font-mono text-zinc-500">
                      {isCurrent ? (
                        <Radio size={14} className="text-[#1ED760] animate-pulse inline" />
                      ) : (
                        idx + 1
                      )}
                    </span>

                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />

                    <div
                      onClick={() => playSong(song, queue, idx)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p
                        className={`text-xs font-semibold truncate ${
                          isCurrent ? 'text-[#1ED760]' : 'text-white group-hover:text-[#1ED760]'
                        }`}
                      >
                        {song.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {song.artistName}
                      </p>
                    </div>

                    <span className="text-[11px] font-mono text-zinc-500">
                      {formatTime(song.duration)}
                    </span>

                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-white transition-opacity"
                      title="Xóa khỏi hàng đợi"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Synced Lyrics Content */}
      {activeTab === 'lyrics' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-center">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-white">{currentSong?.title}</h4>
            <p className="text-xs text-zinc-400 mt-1">{currentSong?.artistName}</p>
          </div>

          <div className="space-y-6 py-4">
            {currentLyrics.map((line, idx) => {
              const isActive = idx === activeLyricIndex;
              return (
                <p
                  key={idx}
                  className={`text-base md:text-lg transition-all duration-300 font-medium ${
                    isActive
                      ? 'text-[#1ED760] font-bold scale-105'
                      : idx < activeLyricIndex
                      ? 'text-zinc-500'
                      : 'text-zinc-400 opacity-80'
                  }`}
                >
                  {line}
                </p>
              );
            })}
          </div>

          <div className="pt-8 border-t border-white/5 text-xs text-zinc-500">
            Lời bài hát được đồng bộ bởi Aureon Lyrics AI Engine.
          </div>
        </div>
      )}
    </aside>
  );
};
