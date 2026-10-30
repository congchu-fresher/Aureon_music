import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Mic2,
  Maximize2,
  Minimize2,
  Sliders,
  Radio,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { formatTime } from '../utils/audioQueue';

export const MusicPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    togglePlayPause,
    stopSong,
    nextSong,
    prevSong,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isSongLiked,
    isQueueOpen,
    setIsQueueOpen,
    isLyricsOpen,
    setIsLyricsOpen,
    isMiniPlayer,
    setIsMiniPlayer,
    isFullScreenPlayer,
    setIsFullScreenPlayer,
    navigateTo,
  } = useMusic();

  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLiked = isSongLiked(currentSong.id);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverTime(ratio * duration);
  };

  return (
    <footer className="h-24 bg-[#121212] border-t border-white/[0.08] px-4 md:px-6 flex items-center justify-between select-none relative z-50 shadow-2xl">
      {/* LEFT: Currently Playing Song Metadata */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px] max-w-[320px]">
        <div
          onClick={() => navigateTo({ type: 'album', albumId: currentSong.albumId })}
          className="relative group cursor-pointer flex-shrink-0"
          title={`Xem album: ${currentSong.albumTitle}`}
        >
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className={`w-14 h-14 rounded-lg object-cover shadow-lg transition-transform duration-300 ${
              isPlaying ? 'ring-2 ring-[#1ED760]/60 scale-100' : 'opacity-90'
            }`}
          />
          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Radio size={16} className="text-[#1ED760] animate-pulse" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p
            onClick={() => navigateTo({ type: 'album', albumId: currentSong.albumId })}
            className="text-sm font-semibold text-white truncate hover:underline cursor-pointer tracking-tight"
            title={currentSong.title}
          >
            {currentSong.title}
          </p>
          <p
            onClick={() => navigateTo({ type: 'artist', artistId: currentSong.artistId })}
            className="text-xs text-zinc-400 truncate hover:text-white hover:underline cursor-pointer mt-0.5"
            title={currentSong.artistName}
          >
            {currentSong.artistName}
          </p>
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={() => toggleLike(currentSong.id)}
          className={`p-2 rounded-full transition-transform active:scale-125 ${
            isLiked ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
          }`}
          title={isLiked ? 'Xóa khỏi danh sách yêu thích' : 'Lưu vào bài hát yêu thích'}
        >
          <Heart size={19} className={isLiked ? 'fill-[#1ED760]' : ''} />
        </button>
      </div>

      {/* CENTER: Player Controls & Live Waveform Scrubber */}
      <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
        {/* Playback Action Buttons */}
        <div className="flex items-center gap-4 md:gap-6 mb-1.5">
          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition-colors relative ${
              shuffle ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
            }`}
            title={shuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
          >
            <Shuffle size={18} />
            {shuffle && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1ED760]"></span>}
          </button>

          {/* Stop playback */}
          <button
            onClick={stopSong}
            className="p-1.5 text-zinc-400 hover:text-white transition-transform active:scale-95"
            title="Dừng phát và đưa tiến trình về đầu"
            aria-label="Dừng phát nhạc"
          >
            <Square size={15} fill="currentColor" />
          </button>

          {/* Previous Track */}
          <button
            onClick={prevSong}
            className="p-1.5 text-zinc-300 hover:text-white transition-transform active:scale-95"
            title="Bài trước đó (hoặc phát lại từ đầu)"
          >
            <SkipBack size={21} />
          </button>

          {/* Main Big Play / Pause Button */}
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-white/10 cursor-pointer"
            title={isPlaying ? 'Tạm dừng (Phím Space)' : 'Phát (Phím Space)'}
          >
            {isPlaying ? (
              <Pause size={20} className="fill-black" />
            ) : (
              <Play size={20} className="fill-black translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextSong}
            className="p-1.5 text-zinc-300 hover:text-white transition-transform active:scale-95"
            title="Bài tiếp theo"
          >
            <SkipForward size={21} />
          </button>

          {/* Repeat Button */}
          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-full transition-colors relative ${
              repeatMode !== 'off' ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Chế độ lặp lại: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={19} /> : <Repeat size={18} />}
            {repeatMode !== 'off' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1ED760]"></span>
            )}
          </button>
        </div>

        {/* Progress Timeline with live mini waveform preview */}
        <div className="w-full flex items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>

          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => {
              setIsHoveringProgress(false);
              setHoverTime(null);
            }}
            onMouseMove={handleProgressMouseMove}
            className="relative flex-1 h-4 flex items-center cursor-pointer group"
          >
            {/* Tooltip on hover */}
            {isHoveringProgress && hoverTime !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 bg-[#282828] text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none"
                style={{
                  left: `${Math.max(10, Math.min(90, (hoverTime / duration) * 100))}%`,
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}

            {/* Background track bar */}
            <div className="w-full h-1 group-hover:h-1.5 bg-white/20 rounded-full overflow-hidden transition-all relative">
              {/* Progress filled bar */}
              <div
                className="h-full bg-white group-hover:bg-[#1ED760] transition-colors rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Scrubber thumb circle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progressPercentage}% - 7px)` }}
            />
          </div>

          <span className="w-10 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: Auxiliary Utilities & Volume Scrubber */}
      <div className="flex items-center justify-end gap-2.5 md:gap-4 w-1/4 min-w-[200px]">
        {/* Lyrics Button */}
        <button
          onClick={() => setIsLyricsOpen((prev) => !prev)}
          className={`p-2 rounded-full transition-colors ${
            isLyricsOpen ? 'text-[#1ED760] bg-white/10' : 'text-zinc-400 hover:text-white'
          }`}
          title="Lời bài hát"
        >
          <Mic2 size={18} />
        </button>

        {/* Queue Button */}
        <button
          onClick={() => setIsQueueOpen((prev) => !prev)}
          className={`p-2 rounded-full transition-colors ${
            isQueueOpen ? 'text-[#1ED760] bg-white/10' : 'text-zinc-400 hover:text-white'
          }`}
          title="Danh sách hàng đợi"
        >
          <ListMusic size={19} />
        </button>

        {/* Volume Slider & Mute Toggle */}
        <div className="flex items-center gap-2 group">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <div className="w-20 md:w-24 relative flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/20 group-hover:bg-white/30 rounded-lg appearance-none cursor-pointer"
              title={`Âm lượng: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>

        {/* Full-screen player */}
        <button
          onClick={() => setIsFullScreenPlayer((prev) => !prev)}
          className="text-zinc-400 hover:text-white transition-colors p-1"
          title={isFullScreenPlayer ? 'Đóng trình phát toàn màn hình' : 'Mở trình phát toàn màn hình'}
          aria-label="Bật/tắt trình phát toàn màn hình"
        >
          <Maximize2 size={17} />
        </button>

        {/* Mini Player toggle */}
        <button
          onClick={() => setIsMiniPlayer((prev) => !prev)}
          className="text-zinc-400 hover:text-white transition-colors hidden sm:block p-1"
          title={isMiniPlayer ? 'Thoát chế độ nổi' : 'Mở chế độ nổi'}
        >
          {isMiniPlayer ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>
    </footer>
  );
};
