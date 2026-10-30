import React, { useState } from 'react';
import {
  Search,
  Play,
  Pause,
  Heart,
  Plus,
  Clock,
  Sparkles,
  Music2,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { GENRE_CATEGORIES } from '../data/mockMusic';
import { formatTime } from '../utils/audioQueue';

export const SearchView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    allSongs,
    allAlbums,
    allArtists,
    playSong,
    currentSong,
    isPlaying,
    togglePlayPause,
    navigateTo,
    toggleLike,
    isSongLiked,
    addSongToPlaylist,
    userPlaylists,
  } = useMusic();

  const [activeGenreFilter, setActiveGenreFilter] = useState<string | null>(null);

  const query = searchQuery.trim().toLowerCase();

  const filteredSongs = allSongs.filter((song) => {
    const matchesQuery =
      !query ||
      song.title.toLowerCase().includes(query) ||
      song.artistName.toLowerCase().includes(query) ||
      song.albumTitle.toLowerCase().includes(query) ||
      song.genre.toLowerCase().includes(query);

    const matchesGenre =
      !activeGenreFilter ||
      song.genre.toLowerCase().includes(activeGenreFilter.toLowerCase());

    return matchesQuery && matchesGenre;
  });

  const filteredArtists = allArtists.filter(
    (artist) =>
      !query ||
      artist.name.toLowerCase().includes(query) ||
      artist.bio.toLowerCase().includes(query)
  );

  const filteredAlbums = allAlbums.filter(
    (album) =>
      !query ||
      album.title.toLowerCase().includes(query) ||
      album.artistName.toLowerCase().includes(query)
  );

  const topResult = filteredSongs[0] || null;

  return (
    <div className="space-y-8 pb-12">
      {/* Big Search Header Input */}
      <div className="relative max-w-2xl">
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#1e1e24] border border-white/10 focus-within:border-[#1ED760] focus-within:ring-2 focus-within:ring-[#1ED760]/20 transition-all">
          <Search size={22} className="text-[#1ED760]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài hát, nghệ sĩ, album hoặc thể loại nhạc..."
            className="w-full bg-transparent text-base text-white placeholder-zinc-400 focus:outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* When NO query is typed: Show Browse All Genre Tiles */}
      {!query && (
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Duyệt tìm tất cả các thể loại
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {GENRE_CATEGORIES.map((genre) => (
              <div
                key={genre.id}
                onClick={() => setSearchQuery(genre.name)}
                className={`relative h-44 rounded-2xl p-4 overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:scale-[1.03] bg-gradient-to-br ${genre.color} group`}
              >
                <h3 className="text-xl font-black text-white tracking-tight relative z-10">
                  {genre.name}
                </h3>

                <img
                  src={genre.img}
                  alt={genre.name}
                  className="absolute -right-3 -bottom-3 w-28 h-28 object-cover rounded-xl shadow-2xl rotate-[22deg] group-hover:rotate-[18deg] group-hover:scale-110 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* When SEARCH QUERY is present: Show Grouped Results */}
      {query && (
        <div className="space-y-8">
          {filteredSongs.length === 0 && filteredArtists.length === 0 && (
            <div className="text-center py-16 bg-[#181818] rounded-3xl border border-white/5">
              <p className="text-lg font-bold text-white">Không tìm thấy kết quả cho "{searchQuery}"</p>
              <p className="text-xs text-zinc-400 mt-1">
                Hãy kiểm tra lại chính tả hoặc thử tìm kiếm bằng tên nghệ sĩ khác.
              </p>
            </div>
          )}

          {/* Top Result & Top Songs Split */}
          {topResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Result Card */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-lg font-bold text-white">Kết quả hàng đầu</h3>
                <div
                  onClick={() => playSong(topResult)}
                  className="bg-[#181818] hover:bg-[#242424] p-5 rounded-2xl border border-white/5 transition-all duration-300 group cursor-pointer relative shadow-xl"
                >
                  <img
                    src={topResult.coverUrl}
                    alt={topResult.title}
                    className="w-24 h-24 rounded-xl object-cover shadow-lg mb-4"
                  />
                  <h4 className="text-xl font-bold text-white tracking-tight truncate">
                    {topResult.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Bài hát • <span className="text-white font-medium">{topResult.artistName}</span>
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentSong?.id === topResult.id && isPlaying) {
                        togglePlayPause();
                      } else {
                        playSong(topResult);
                      }
                    }}
                    className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-[#1ED760] text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-105"
                  >
                    {currentSong?.id === topResult.id && isPlaying ? (
                      <Pause size={22} className="fill-black" />
                    ) : (
                      <Play size={22} className="fill-black translate-x-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Matching Songs List */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-lg font-bold text-white">Bài hát</h3>
                <div className="space-y-1">
                  {filteredSongs.slice(0, 5).map((song) => {
                    const isCurrent = currentSong?.id === song.id;
                    const isLiked = isSongLiked(song.id);

                    return (
                      <div
                        key={song.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl group transition-colors cursor-pointer ${
                          isCurrent ? 'bg-[#242424]' : 'hover:bg-white/[0.05]'
                        }`}
                        onClick={() => playSong(song, filteredSongs)}
                      >
                        <div className="relative w-11 h-11 flex-shrink-0">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-full h-full rounded-lg object-cover"
                          />
                          <div
                            className={`absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center transition-opacity ${
                              isCurrent && isPlaying
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isCurrent && isPlaying ? (
                              <Pause size={16} className="text-[#1ED760]" />
                            ) : (
                              <Play size={16} className="text-white fill-white translate-x-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
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

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song.id);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            isLiked ? 'text-[#1ED760]' : 'text-zinc-500 hover:text-white'
                          }`}
                        >
                          <Heart size={16} className={isLiked ? 'fill-[#1ED760]' : ''} />
                        </button>

                        <span className="text-xs font-mono text-zinc-400">
                          {formatTime(song.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Artists Matching */}
          {filteredArtists.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white">Nghệ sĩ</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => navigateTo({ type: 'artist', artistId: artist.id })}
                    className="p-3 bg-[#181818] hover:bg-[#242424] rounded-2xl text-center group cursor-pointer transition-all duration-200"
                  >
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto mb-3 ring-2 ring-transparent group-hover:ring-[#1ED760] transition-all"
                    />
                    <h4 className="text-sm font-bold text-white truncate">{artist.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Nghệ sĩ</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums Matching */}
          {filteredAlbums.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white">Album liên quan</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {filteredAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => navigateTo({ type: 'album', albumId: album.id })}
                    className="p-3 bg-[#181818] hover:bg-[#242424] rounded-2xl group cursor-pointer transition-all duration-200"
                  >
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full aspect-square rounded-xl object-cover mb-3"
                    />
                    <h4 className="text-sm font-bold text-white truncate">{album.title}</h4>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{album.artistName}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
