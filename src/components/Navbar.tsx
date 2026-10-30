import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Sparkles,
  Bell,
  Download,
  User,
  Settings,
  LogOut,
  ExternalLink,
  Music2,
  CheckCircle2,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export const Navbar: React.FC = () => {
  const {
    activeView,
    navigateTo,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    searchQuery,
    setSearchQuery,
    allSongs,
    allArtists,
    playSong,
    setIsPremiumModalOpen,
    setIsAuthModalOpen,
    currentUser,
    showToast,
  } = useMusic();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (activeView.type !== 'search') {
          navigateTo({ type: 'search' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, navigateTo]);

  // Search suggestions
  const suggestions = searchQuery.trim()
    ? [
        ...allSongs
          .filter(
            (s) =>
              s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.artistName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 4)
          .map((s) => ({ type: 'song' as const, item: s })),
        ...allArtists
          .filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 2)
          .map((a) => ({ type: 'artist' as const, item: a })),
      ]
    : [];

  return (
    <header className="h-16 bg-[#000000]/90 backdrop-blur-md sticky top-0 z-40 border-b border-white/[0.06] px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Brand Logo & Navigation History Buttons */}
      <div className="flex items-center gap-3 md:gap-5">
        <button
          onClick={() => navigateTo({ type: 'home' })}
          className="flex items-center gap-2 group text-left focus:outline-none"
          title="Trang chủ Aureon"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1ED760] via-[#10B981] to-[#00F0FF] p-0.5 shadow-lg shadow-[#1ED760]/20 group-hover:shadow-[#1ED760]/40 transition-all duration-300">
            <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-[#1ED760] to-[#00F0FF] text-lg tracking-tighter">
                A
              </span>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:inline">
            AUREON<span className="text-[#1ED760]">.</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              canGoBack
                ? 'bg-[#181818] text-white hover:bg-[#282828] cursor-pointer'
                : 'bg-[#121212] text-white/30 cursor-not-allowed'
            }`}
            title="Quay lại"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              canGoForward
                ? 'bg-[#181818] text-white hover:bg-[#282828] cursor-pointer'
                : 'bg-[#121212] text-white/30 cursor-not-allowed'
            }`}
            title="Tiếp theo"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Center: Search Bar with Suggestions */}
      <div className="relative flex-1 max-w-lg mx-2 md:mx-6">
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1e1e24] border transition-all duration-200 ${
            isSearchFocused
              ? 'border-[#1ED760] ring-2 ring-[#1ED760]/20 bg-[#24242e]'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <Search size={18} className={isSearchFocused ? 'text-[#1ED760]' : 'text-zinc-400'} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeView.type !== 'search') {
                navigateTo({ type: 'search', query: e.target.value });
              }
            }}
            onFocus={() => {
              setIsSearchFocused(true);
              if (activeView.type !== 'search') {
                navigateTo({ type: 'search', query: searchQuery });
              }
            }}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Bạn muốn nghe gì hôm nay? (Nhấn / để tìm)"
            className="w-full bg-transparent text-sm text-white placeholder-zinc-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-zinc-400 hover:text-white p-0.5"
              title="Xóa tìm kiếm"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Live Suggestions Dropdown */}
        {isSearchFocused && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-12 mt-1 bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-2 border-b border-white/5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3">
              Gợi ý kết quả nhanh
            </div>
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onMouseDown={() => {
                  if (item.type === 'song') {
                    playSong(item.item);
                  } else {
                    navigateTo({ type: 'artist', artistId: item.item.id });
                  }
                  setIsSearchFocused(false);
                }}
                className="flex items-center gap-3 p-2.5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                {item.type === 'song' ? (
                  <>
                    <img
                      src={item.item.coverUrl}
                      alt={item.item.title}
                      className="w-9 h-9 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.item.title}</p>
                      <p className="text-xs text-zinc-400 truncate">Bài hát • {item.item.artistName}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={item.item.avatarUrl}
                      alt={item.item.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.item.name}</p>
                      <p className="text-xs text-zinc-400 truncate">Nghệ sĩ</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Actions, Notifications & User Account */}
      <div className="flex items-center gap-2 md:gap-3" ref={menuRef}>
        {/* Explore Premium button */}
        <button
          onClick={() => setIsPremiumModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
        >
          <Sparkles size={14} className="text-[#1ED760]" />
          <span>Khám phá Premium</span>
        </button>

        {/* Download App */}
        <button
          onClick={() => showToast('Aureon Desktop & Mobile app đang sẵn sàng!')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Tải ứng dụng"
        >
          <Download size={15} />
          <span className="hidden md:inline">Cài đặt ứng dụng</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors relative"
            title="Thông báo"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1ED760] animate-pulse"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-11 w-80 bg-[#1e1e24] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-bold text-white">Thông báo mới</h4>
                <span className="text-[11px] text-[#1ED760] font-semibold">Tất cả đã đọc</span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#1ED760] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-zinc-200 font-medium">Bảng xếp hạng Top 50 Vietnam vừa cập nhật!</p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">2 giờ trước</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-zinc-200 font-medium">Imagine Dragons ra mắt ca khúc mới</p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">1 ngày trước</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer group"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/20 group-hover:border-[#1ED760] transition-colors"
            />
            <span className="hidden xl:inline text-xs font-semibold text-white max-w-[100px] truncate">
              {currentUser.name}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-11 w-56 bg-[#181818] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-white/10">
                <p className="font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-zinc-400 text-[11px] truncate">{currentUser.email}</p>
                {currentUser.isPremium && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#1ED760] bg-[#1ED760]/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={10} /> Aureon Premium
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsPremiumModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-zinc-200 hover:text-white hover:bg-white/10 text-left transition-colors"
              >
                <span>Nâng cấp tài khoản</span>
                <ExternalLink size={13} className="text-zinc-400" />
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigateTo({ type: 'settings' });
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-zinc-200 hover:text-white hover:bg-white/10 text-left transition-colors"
              >
                <Settings size={14} />
                <span>Cài đặt âm thanh & giao diện</span>
              </button>

              <div className="border-t border-white/10 my-1" />

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-white/10 text-left transition-colors"
              >
                <LogOut size={14} />
                <span>Đổi tài khoản / Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
