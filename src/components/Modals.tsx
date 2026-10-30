import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Music,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Headphones,
  Zap,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export const Modals: React.FC = () => {
  const {
    isCreatePlaylistOpen,
    setIsCreatePlaylistOpen,
    createPlaylist,
    authenticate,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isPremiumModalOpen,
    setIsPremiumModalOpen,
    toastMessage,
    showToast,
  } = useMusic();

  // Create Playlist State
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistTitle.trim()) return;
    createPlaylist(playlistTitle, playlistDesc);
    setPlaylistTitle('');
    setPlaylistDesc('');
    setIsCreatePlaylistOpen(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setAuthError('');
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    if (authMode === 'register' && authName.trim().length < 2) {
      setAuthError('Tên hiển thị phải có ít nhất 2 ký tự.');
      return;
    }
    if (authMode === 'register' && authPassword.length < 8) {
      setAuthError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    try {
      setAuthLoading(true);
      await authenticate(authMode, authName, authEmail, authPassword);
      showToast(authMode === 'login' ? 'Đăng nhập thành công!' : 'Tạo tài khoản thành công!');
      setIsAuthModalOpen(false);
      setAuthPassword('');
      setAuthError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xác thực tài khoản.';
      setAuthError(message);
      showToast(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-[#282828] text-white border border-white/10 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-2 h-2 rounded-full bg-[#1ED760] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CREATE PLAYLIST MODAL */}
      {isCreatePlaylistOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music size={20} className="text-[#1ED760]" />
                Tạo Playlist mới
              </h3>
              <button
                onClick={() => setIsCreatePlaylistOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Tên Playlist *
                </label>
                <input
                  type="text"
                  required
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  placeholder="Ví dụ: Nhạc chill cuối tuần, Coding flow..."
                  className="w-full bg-[#121212] border border-white/10 focus:border-[#1ED760] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  placeholder="Thêm mô tả thú vị cho danh sách phát này..."
                  className="w-full bg-[#121212] border border-white/10 focus:border-[#1ED760] rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePlaylistOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1ED760] text-black hover:bg-[#22e569] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#1ED760]/20"
                >
                  Tạo danh sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTH MODAL (Login / Register) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1ED760] text-black font-extrabold flex items-center justify-center text-xs">
                  A
                </div>
                <h3 className="text-base font-bold text-white">
                  {authMode === 'login' ? 'Đăng nhập vào Aureon' : 'Tạo tài khoản Aureon'}
                </h3>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 bg-[#121212] rounded-xl my-4">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  authMode === 'login' ? 'bg-[#242424] text-white shadow' : 'text-zinc-400'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  authMode === 'register' ? 'bg-[#242424] text-white shadow' : 'text-zinc-400'
                }`}
              >
                Đăng ký mới
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Họ tên của bạn</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#121212] border border-white/10 rounded-xl focus-within:border-[#1ED760]">
                    <User size={16} className="text-zinc-500" />
                    <input
                      type="text"
                      autoComplete="name"
                      maxLength={128}
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Alex Aureon"
                      className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Địa chỉ Email</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#121212] border border-white/10 rounded-xl focus-within:border-[#1ED760]">
                  <Mail size={16} className="text-zinc-500" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={256}
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Mật khẩu</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#121212] border border-white/10 rounded-xl focus-within:border-[#1ED760]">
                  <Lock size={16} className="text-zinc-500" />
                  <input
                    type="password"
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={authMode === 'register' ? 8 : 1}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {authError && (
                <p role="alert" className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {authError}
                </p>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-4 py-2.5 rounded-xl text-xs font-bold bg-[#1ED760] text-black hover:bg-[#22e569] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#1ED760]/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Đang xử lý...' : authMode === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản miễn phí'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PREMIUM MODAL */}
      {isPremiumModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1c2720] via-[#141816] to-[#0e0e10] border border-[#1ED760]/30 rounded-3xl w-full max-w-lg p-7 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1ED760]/10 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={() => setIsPremiumModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1ED760]/20 border border-[#1ED760]/30 text-xs font-bold text-[#1ED760] mb-4">
              <Sparkles size={14} />
              <span>AUREON PREMIUM HI-FI</span>
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
              Nghe nhạc không giới hạn, chuẩn âm thanh 24-bit Lossless
            </h2>
            <p className="text-xs text-zinc-300 mt-2">
              Trải nghiệm độ trong trẻo tuyệt đối với tần số mẫu lên tới 96kHz, hoàn toàn không quảng cáo.
            </p>

            <div className="my-6 space-y-3">
              {[
                'Âm thanh chuẩn Studio FLAC 24-bit / 96kHz',
                'Không bị gián đoạn bởi bất kỳ quảng cáo nào',
                'Tải nhạc và nghe ngoại tuyến không cần Internet',
                'Chuyển bài không giới hạn và nghe cùng bạn bè',
                'Xem lời bài hát động theo thời gian thực',
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-zinc-200">
                  <div className="w-5 h-5 rounded-full bg-[#1ED760]/20 flex items-center justify-center text-[#1ED760] flex-shrink-0">
                    <Check size={12} />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-white">Gói Cá Nhân Premium</p>
                <p className="text-xs text-zinc-400">59.000 đ / tháng sau dùng thử</p>
              </div>
              <span className="text-xs font-bold text-[#1ED760] bg-[#1ED760]/10 px-2.5 py-1 rounded-lg">
                Miễn phí 1 tháng
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  showToast('Chúc mừng bạn! Bạn đã kích hoạt Aureon Premium 1 tháng miễn phí.');
                  setIsPremiumModalOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl font-bold text-xs bg-[#1ED760] text-black hover:bg-[#22e569] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1ED760]/20 cursor-pointer"
              >
                Bắt đầu 1 tháng miễn phí
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
