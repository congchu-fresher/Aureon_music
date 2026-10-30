import React, { useState } from 'react';
import {
  Play,
  Pause,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Heart,
  Plus,
  Flame,
  Radio,
  Compass,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { Song, Album, Artist, Playlist } from '../types/music';

export const HomeView: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    queue,
    playSong,
    playCollection,
    togglePlayPause,
    featuredCharts,
    allAlbums,
    allArtists,
    madeForYou,
    allSongs,
    navigateTo,
    toggleLike,
    isSongLiked,
    saveAlbum,
    currentUser,
  } = useMusic();

  const [activeCategory, setActiveCategory] = useState<'all' | 'music' | 'podcast'>('all');

  // Match the entire ordered queue, not just membership of the current song.
  // Otherwise several chart/album/playlist cards can all show Pause at once.
  const isSamePlaybackCollection = (songs: Song[]) =>
    songs.length > 0 && songs.length === queue.length &&
    songs.every((song, index) => song.id === queue[index]?.id);

  return (
    <div className="space-y-10 pb-12">
      {/* Category Tabs: Tất cả, Âm nhạc, Podcast */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeCategory === 'all'
              ? 'bg-white text-black shadow-md'
              : 'bg-[#242424] text-zinc-300 hover:bg-[#2e2e2e]'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setActiveCategory('music')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeCategory === 'music'
              ? 'bg-white text-black shadow-md'
              : 'bg-[#242424] text-zinc-300 hover:bg-[#2e2e2e]'
          }`}
        >
          Âm nhạc
        </button>
        <button
          onClick={() => setActiveCategory('podcast')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeCategory === 'podcast'
              ? 'bg-white text-black shadow-md'
              : 'bg-[#242424] text-zinc-300 hover:bg-[#2e2e2e]'
          }`}
        >
          Podcasts
        </button>
      </div>

      {/* SECTION 1: GETTING STARTED HERO BANNER (Image 2 style) */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 bg-gradient-to-r from-[#FF4B2B] via-[#FF416C] to-[#8A2387] group">
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-yellow-300" />
              Nổi bật tuần này
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Bắt đầu hành trình âm nhạc
            </h1>
            <p className="text-sm md:text-base text-white/90 font-medium">
              Khám phá những giai điệu thịnh hành độc quyền và danh sách phát cá nhân hóa được tuyển chọn riêng cho bạn.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (featuredCharts.length > 0) {
                    playCollection(featuredCharts[0].songs);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl hover:bg-zinc-100 cursor-pointer"
              >
                <Play size={16} className="fill-black" />
                <span>Khám phá ngay</span>
              </button>

              <button
                onClick={() => navigateTo({ type: 'search' })}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-black/40 hover:bg-black/60 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer"
              >
                <Compass size={16} />
                <span>Tìm kiếm âm nhạc</span>
              </button>
            </div>
          </div>

          {/* Featured Album Hero Card preview (Mercury: Act 1 & Music of the Spheres preview) */}
          <div
            onClick={() => {
              if (allAlbums[0]) {
                navigateTo({ type: 'album', albumId: allAlbums[0].id });
              }
            }}
            className="flex-shrink-0 cursor-pointer group/card"
          >
            <div className="w-56 md:w-64 bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 group-hover/card:scale-105 group-hover/card:border-white/40">
              <img
                src={allAlbums[0]?.coverUrl}
                alt="Featured Album"
                className="w-full aspect-square object-cover rounded-xl shadow-lg mb-3"
              />
              <p className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Album đề xuất</p>
              <h3 className="text-sm font-bold text-white truncate">{allAlbums[0]?.title}</h3>
              <p className="text-xs text-white/70 truncate">{allAlbums[0]?.artistName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: FEATURED CHARTS (Horizontal Carousel) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={22} className="text-[#1ED760]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Bảng xếp hạng nổi bật
            </h2>
          </div>
          <span className="text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1">
            Xem tất cả <ChevronRight size={14} />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {featuredCharts.map((chart) => {
            const isChartSelected =
              isSamePlaybackCollection(chart.songs) &&
              chart.songs.some((s) => s.id === currentSong?.id);

            return (
              <div
                key={chart.id}
                onClick={() => navigateTo({ type: 'playlist', playlistId: chart.id })}
                className="group relative bg-[#181818] hover:bg-[#242424] p-3.5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-lg"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-md">
                  <img
                    src={chart.coverUrl}
                    alt={chart.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-multiply"
                    style={{
                      background: `linear-gradient(135deg, ${chart.gradientFrom || '#10B981'}, ${chart.gradientTo || '#047857'})`,
                    }}
                  />

                  {/* Play Button hover-up */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isChartSelected) {
                        togglePlayPause();
                      } else {
                        playCollection(chart.songs);
                      }
                    }}
                    className={`absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-[#1ED760] text-black flex items-center justify-center shadow-xl transition-all duration-300 transform ${
                      isChartSelected
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-95'
                    }`}
                    title={isChartSelected && isPlaying ? 'Tạm dừng' : 'Phát bảng xếp hạng'}
                  >
                    {isChartSelected && isPlaying ? (
                      <Pause size={20} className="fill-black" />
                    ) : (
                      <Play size={20} className="fill-black translate-x-0.5" />
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1ED760] transition-colors">
                  {chart.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                  {chart.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: POPULAR ALBUMS AND SINGLES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={22} className="text-amber-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Album & Đĩa đơn phổ biến
            </h2>
          </div>
          <span className="text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1">
            Xem tất cả <ChevronRight size={14} />
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allAlbums.map((album) => {
            const isAlbumSelected =
              isSamePlaybackCollection(album.songs) &&
              album.songs.some((s) => s.id === currentSong?.id);
            const isSaved = currentUser.savedAlbumIds.includes(album.id);

            return (
              <div
                key={album.id}
                onClick={() => navigateTo({ type: 'album', albumId: album.id })}
                className="group relative bg-[#181818] hover:bg-[#242424] p-3.5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-lg"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-md">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAlbumSelected) {
                        togglePlayPause();
                      } else {
                        playCollection(album.songs);
                      }
                    }}
                    className={`absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-[#1ED760] text-black flex items-center justify-center shadow-xl transition-all duration-300 transform ${
                      isAlbumSelected
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-95'
                    }`}
                    title="Phát album"
                  >
                    {isAlbumSelected && isPlaying ? (
                      <Pause size={20} className="fill-black" />
                    ) : (
                      <Play size={20} className="fill-black translate-x-0.5" />
                    )}
                  </button>

                  {/* Save to library icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveAlbum(album.id);
                    }}
                    className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all ${
                      isSaved
                        ? 'bg-[#1ED760] text-black opacity-100'
                        : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80'
                    }`}
                    title={isSaved ? 'Đã lưu trong thư viện' : 'Lưu album'}
                  >
                    <Heart size={14} className={isSaved ? 'fill-black' : ''} />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1ED760] transition-colors">
                  {album.title}
                </h3>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {album.artistName} • {album.releaseYear}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: MADE FOR YOU */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-[#1ED760]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Dành riêng cho bạn
            </h2>
          </div>
          <span className="text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1">
            Xem tất cả <ChevronRight size={14} />
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {madeForYou.map((pl) => {
            const isPlaylistSelected =
              isSamePlaybackCollection(pl.songs) &&
              pl.songs.some((s) => s.id === currentSong?.id);

            return (
              <div
                key={pl.id}
                onClick={() => navigateTo({ type: 'playlist', playlistId: pl.id })}
                className="group relative bg-[#181818] hover:bg-[#242424] p-3.5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-lg"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-md">
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay"
                    style={{
                      background: `linear-gradient(135deg, ${pl.gradientFrom || '#3B82F6'}, ${pl.gradientTo || '#1E3A8A'})`,
                    }}
                  />

                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPlaylistSelected) {
                        togglePlayPause();
                      } else {
                        playCollection(pl.songs);
                      }
                    }}
                    className={`absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-[#1ED760] text-black flex items-center justify-center shadow-xl transition-all duration-300 transform ${
                      isPlaylistSelected
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-95'
                    }`}
                  >
                    {isPlaylistSelected && isPlaying ? (
                      <Pause size={20} className="fill-black" />
                    ) : (
                      <Play size={20} className="fill-black translate-x-0.5" />
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white truncate group-hover:text-[#1ED760] transition-colors">
                  {pl.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                  {pl.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: TRENDING ARTISTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={22} className="text-[#1ED760]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Nghệ sĩ thịnh hành
            </h2>
          </div>
          <span className="text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer flex items-center gap-1">
            Xem tất cả <ChevronRight size={14} />
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {allArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigateTo({ type: 'artist', artistId: artist.id })}
              className="group flex flex-col items-center text-center p-3 rounded-2xl hover:bg-[#181818] transition-all duration-300 cursor-pointer"
            >
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 p-1 ring-2 ring-transparent group-hover:ring-[#1ED760] transition-all duration-300 shadow-xl">
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <h3 className="font-bold text-sm text-white truncate max-w-full group-hover:text-[#1ED760] transition-colors">
                {artist.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Nghệ sĩ</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
