import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  Heart,
  AudioLines,
  Circle,
  Waves,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { formatTime } from '../utils/audioQueue';

type VisualizerMode = 'bars' | 'wave' | 'circular';

export const FullScreenPlayer: React.FC = () => {
  const {
    currentSong, isPlaying, currentTime, duration, volume, isMuted,
    togglePlayPause, stopSong, nextSong, prevSong, seek, setVolume, toggleMute,
    setIsFullScreenPlayer, toggleLike, isSongLiked, visualizerData,
  } = useMusic();
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullScreenPlayer(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setIsFullScreenPlayer]);

  const values = visualizerData.length ? visualizerData : Array(24).fill(12);
  const wavePath = useMemo(() => {
    const data = visualizerData.length ? visualizerData : Array(24).fill(12);
    return data.map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 1000;
      const y = 76 - Math.min(64, Math.max(3, (value / 255) * 130));
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [visualizerData]);

  if (!currentSong) return null;

  return (
    <section className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-gradient-to-br from-[#202020] via-[#101010] to-black text-white px-5 py-5 md:px-12 md:py-8" aria-label="Trình phát nhạc toàn màn hình">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">AUREON</p>
          <p className="mt-1 text-sm text-zinc-300">Đang phát</p>
        </div>
        <button onClick={() => setIsFullScreenPlayer(false)} className="rounded-full p-3 text-zinc-300 hover:bg-white/10 hover:text-white" title="Đóng toàn màn hình (Esc)" aria-label="Đóng trình phát toàn màn hình">
          <ArrowDown size={23} />
        </button>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 py-8 md:grid-cols-2 md:gap-14">
        <div className="mx-auto w-full max-w-[420px]">
          <img src={currentSong.coverUrl} alt={`Bìa ${currentSong.title}`} className="aspect-square w-full rounded-2xl object-cover shadow-2xl shadow-black/50" />
        </div>
        <div className="mx-auto w-full max-w-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#1ED760]">Now playing</p>
          <h1 className="break-words text-3xl font-bold leading-tight md:text-5xl">{currentSong.title}</h1>
          <p className="mt-3 text-lg text-zinc-400 md:text-xl">{currentSong.artistName}</p>

          <div className="mt-8">
            <input aria-label="Tiến trình bài hát" type="range" min={0} max={Math.max(duration, 1)} step={1} value={Math.min(currentTime, duration || 0)} onChange={(e) => seek(Number(e.target.value))} className="w-full cursor-pointer accent-[#1ED760]" />
            <div className="mt-1 flex justify-between font-mono text-xs text-zinc-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-5 md:justify-start md:gap-7">
            <button onClick={() => toggleLike(currentSong.id)} className={`p-2 ${isSongLiked(currentSong.id) ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'}`} title="Yêu thích" aria-label="Yêu thích bài hát"><Heart size={22} fill={isSongLiked(currentSong.id) ? 'currentColor' : 'none'} /></button>
            <button onClick={prevSong} className="p-2 text-zinc-300 hover:text-white" title="Bài trước" aria-label="Bài trước"><SkipBack size={26} /></button>
            <button onClick={togglePlayPause} className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black transition hover:scale-105" title={isPlaying ? 'Tạm dừng' : 'Phát'} aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}>{isPlaying ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" />}</button>
            <button onClick={stopSong} className="p-2 text-zinc-300 hover:text-white" title="Dừng và về đầu bài" aria-label="Dừng phát"><Square size={18} fill="currentColor" /></button>
            <button onClick={nextSong} className="p-2 text-zinc-300 hover:text-white" title="Bài tiếp theo" aria-label="Bài tiếp theo"><SkipForward size={26} /></button>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white" title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'} aria-label={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}>{isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
            <input aria-label="Âm lượng" type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-36 cursor-pointer accent-[#1ED760]" />
            <span className="text-xs text-zinc-500">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Large visualizer reuses the existing global audio engine data; it never creates a second audio stream. */}
      <section className="mx-auto mb-4 w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 md:p-6" aria-label="Visualizer âm thanh">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AudioLines className="text-[#1ED760]" size={20} />
            <div>
              <h2 className="text-sm font-semibold text-white md:text-base">Audio Visualizer</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Phản hồi theo âm thanh đang phát</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-black/30 p-1" role="group" aria-label="Chọn kiểu visualizer">
            <button onClick={() => setVisualizerMode('bars')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${visualizerMode === 'bars' ? 'bg-[#1ED760] text-black' : 'text-zinc-400 hover:text-white'}`} aria-pressed={visualizerMode === 'bars'}><ChartNoAxesColumnIncreasing size={15} />Bars</button>
            <button onClick={() => setVisualizerMode('wave')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${visualizerMode === 'wave' ? 'bg-[#1ED760] text-black' : 'text-zinc-400 hover:text-white'}`} aria-pressed={visualizerMode === 'wave'}><Waves size={15} />Wave</button>
            <button onClick={() => setVisualizerMode('circular')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${visualizerMode === 'circular' ? 'bg-[#1ED760] text-black' : 'text-zinc-400 hover:text-white'}`} aria-pressed={visualizerMode === 'circular'}><Circle size={15} />Circular</button>
          </div>
        </div>

        <div className="relative h-32 overflow-hidden rounded-xl bg-black/25 px-3 py-3 md:h-40 md:px-6">
          {visualizerMode === 'bars' && (
            <div className="flex h-full items-center justify-center gap-1.5 md:gap-2">
              {values.map((value, index) => (
                <span key={index} className={`w-full max-w-5 rounded-full transition-[height,opacity] duration-75 ${isPlaying ? 'bg-gradient-to-t from-[#0b8e45] via-[#1ED760] to-[#b4ffd0]' : 'bg-zinc-600'}`} style={{ height: `${Math.max(5, Math.min(100, (value / 255) * 100))}%`, opacity: isPlaying ? 0.95 : 0.45 }} />
              ))}
            </div>
          )}
          {visualizerMode === 'wave' && (
            <svg viewBox="0 0 1000 152" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Dạng sóng âm thanh">
              <defs><linearGradient id="aureonWaveGradient" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#0b8e45" /><stop offset="50%" stopColor="#1ED760" /><stop offset="100%" stopColor="#b4ffd0" /></linearGradient></defs>
              <path d={`${wavePath} L 1000 76 L 0 76 Z`} fill="url(#aureonWaveGradient)" opacity={isPlaying ? 0.18 : 0.07} />
              <path d={wavePath} fill="none" stroke={isPlaying ? 'url(#aureonWaveGradient)' : '#71717a'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {visualizerMode === 'circular' && (
            <svg viewBox="0 0 300 150" className="h-full w-full" role="img" aria-label="Visualizer hình tròn">
              <defs><linearGradient id="aureonCircularGradient" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#1ED760" /><stop offset="100%" stopColor="#b4ffd0" /></linearGradient></defs>
              <circle cx="150" cy="75" r="28" fill="#1ED760" opacity={isPlaying ? 0.12 : 0.04} />
              <circle cx="150" cy="75" r="28" fill="none" stroke="#1ED760" strokeOpacity="0.5" />
              {values.map((value, index) => {
                const angle = (index / values.length) * Math.PI * 2 - Math.PI / 2;
                const inner = 35;
                const outer = inner + Math.max(4, Math.min(42, (value / 255) * 52));
                const x1 = 150 + Math.cos(angle) * inner;
                const y1 = 75 + Math.sin(angle) * inner;
                const x2 = 150 + Math.cos(angle) * outer;
                const y2 = 75 + Math.sin(angle) * outer;
                return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isPlaying ? 'url(#aureonCircularGradient)' : '#71717a'} strokeWidth="3" strokeLinecap="round" opacity={isPlaying ? 0.95 : 0.5} />;
              })}
              <circle cx="150" cy="75" r="7" fill={isPlaying ? '#1ED760' : '#71717a'} />
            </svg>
          )}
        </div>
      </section>
      <footer className="pb-2 text-center text-xs text-zinc-600">Nhấn Esc hoặc nút mũi tên xuống để quay lại giao diện chính</footer>
    </section>
  );
};
