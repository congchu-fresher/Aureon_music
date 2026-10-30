import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Volume2,
  Globe,
  Shield,
  Layers,
  Check,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export const SettingsView: React.FC = () => {
  const { showToast, setIsPremiumModalOpen } = useMusic();

  const [audioQuality, setAudioQuality] = useState<'lossless' | 'high' | 'normal'>('lossless');
  const [equalizerPreset, setEqualizerPreset] = useState<'bass' | 'vocal' | 'flat' | 'electronic'>('electronic');
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(3);
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);

  return (
    <div className="max-w-4xl space-y-8 pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Cài đặt hệ thống & Âm thanh
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Tùy chỉnh trải nghiệm phát nhạc, chất lượng lossless và giao diện Aureon.
        </p>
      </div>

      {/* Audio Quality Section */}
      <section className="bg-[#181818] rounded-3xl p-6 border border-white/5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1ED760]/10 text-[#1ED760]">
            <Volume2 size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Chất lượng âm thanh</h2>
            <p className="text-xs text-zinc-400">Chọn độ phân giải luồng âm thanh mong muốn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            {
              id: 'lossless',
              title: 'FLAC Lossless 24-bit',
              desc: 'Tần số 96kHz, độ chi tiết cao nhất (Khuyên dùng)',
              badge: 'Hi-Fi',
            },
            {
              id: 'high',
              title: 'AAC 320 kbps',
              desc: 'Chất lượng cao, cân bằng dữ liệu Internet',
              badge: 'Chuẩn',
            },
            {
              id: 'normal',
              title: 'Tiết kiệm 160 kbps',
              desc: 'Tối ưu cho kết nối mạng 3G/4G yếu',
              badge: 'Tiết kiệm',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setAudioQuality(item.id as typeof audioQuality);
                showToast(`Đã chuyển sang chất lượng: ${item.title}`);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                audioQuality === item.id
                  ? 'bg-[#1ED760]/10 border-[#1ED760] text-white'
                  : 'bg-[#121212] border-white/5 text-zinc-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                  {item.badge}
                </span>
                {audioQuality === item.id && (
                  <Check size={16} className="text-[#1ED760]" />
                )}
              </div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs text-zinc-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Equalizer & Crossfade */}
      <section className="bg-[#181818] rounded-3xl p-6 border border-white/5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Sliders size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Bộ chỉnh âm (Equalizer) & Chuyển tiếp</h2>
            <p className="text-xs text-zinc-400">Tùy biến dải âm trầm, giọng ca và hòa âm</p>
          </div>
        </div>

        {/* Equalizer Presets */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">
            Cấu hình bộ cân bằng âm thanh
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'electronic', name: 'Electronic & Synth' },
              { id: 'bass', name: 'Tăng cường Bass' },
              { id: 'vocal', name: 'Nổi bật giọng hát' },
              { id: 'flat', name: 'Âm thanh tự nhiên (Flat)' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setEqualizerPreset(preset.id as typeof equalizerPreset);
                  showToast(`Đã áp dụng cấu hình: ${preset.name}`);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  equalizerPreset === preset.id
                    ? 'bg-white text-black border-white shadow'
                    : 'bg-[#121212] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Crossfade slider */}
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">Chuyển tiếp mượt mà (Crossfade)</p>
              <p className="text-xs text-zinc-400">Hòa âm giữa hai bài hát liên tiếp</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1ED760]">
              {crossfadeSeconds} giây
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={crossfadeSeconds}
            onChange={(e) => setCrossfadeSeconds(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Volume normalization toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <p className="text-sm font-semibold text-white">Tự động cân bằng âm lượng</p>
            <p className="text-xs text-zinc-400">Giữ mức âm đồng đều cho mọi bài hát</p>
          </div>
          <button
            onClick={() => setNormalizeVolume(!normalizeVolume)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              normalizeVolume ? 'bg-[#1ED760]' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                normalizeVolume ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Language & Info */}
      <section className="bg-[#181818] rounded-3xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Ngôn ngữ hiển thị</h3>
            <p className="text-xs text-zinc-400">Giao diện người dùng</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 text-white">
            Tiếng Việt (Mặc định)
          </span>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
          <span>Phiên bản AUREON Desktop Web v2.4.0 (Build 2026)</span>
          <span>Bản quyền thuộc về Aureon Music Inc.</span>
        </div>
      </section>
    </div>
  );
};
