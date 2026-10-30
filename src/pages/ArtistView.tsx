import React from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  Heart,
  UserPlus,
  UserCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { formatTime } from '../utils/audioQueue';

interface ArtistViewProps {
  artistId: string;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artistId }) => {
  const {
    allArtists,
    allAlbums,
    allSongs,
    currentSong,
    isPlaying,
    playSong,
    playCollection,
    togglePlayPause,
    followArtist,
    currentUser,
    navigateTo,
    toggleLike,
    isSongLiked,
  } = useMusic();

  const artist = allArtists.find((a) => a.id === artistId) || allArtists[0];
  if (!artist) return null;

  const isFollowed = currentUser.followedArtistIds.includes(artist.id);
  const artistSongs = allSongs.filter((s) => s.artistId === artist.id || s.artistName === artist.name);
  const artistAlbums = allAlbums.filter((a) => a.artistId === artist.id);

  const isArtistPlaying =
    isPlaying && artistSongs.some((s) => s.id === currentSong?.id);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Hero Banner with artist image */}
      <div className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-end p-6 md:p-8 shadow-2xl">
        <img
          src={artist.bannerUrl || artist.avatarUrl}
          alt={artist.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/50 to-transparent" />

        <div className="relative z-10 space-y-2">
          {artist.isVerified && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600/60 backdrop-blur-md px-3 py-1 rounded-full w-fit">
              <CheckCircle2 size={14} className="text-white" />
              <span>Nghệ sĩ được xác minh</span>
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            {artist.name}
          </h1>

          <p className="text-xs md:text-sm font-semibold text-zinc-300">
            {artist.monthlyListeners.toLocaleString('vi-VN')} người nghe hàng tháng • {artist.followers.toLocaleString('vi-VN')} người theo dõi
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4 py-2 border-b border-white/[0.06]">
        <button
          onClick={() => {
            if (isArtistPlaying) {
              togglePlayPause();
            } else if (artistSongs.length > 0) {
              playCollection(artistSongs);
            }
          }}
          className="w-13 h-13 rounded-full bg-[#1ED760] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1ED760]/20 cursor-pointer"
          title={isArtistPlaying ? 'Tạm dừng' : 'Phát tất cả'}
        >
          {isArtistPlaying ? (
            <Pause size={24} className="fill-black" />
          ) : (
            <Play size={24} className="fill-black translate-x-0.5" />
          )}
        </button>

        <button
          onClick={() => followArtist(artist.id)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            isFollowed
              ? 'bg-transparent border-white/20 text-white hover:border-white'
              : 'bg-white text-black border-white hover:scale-105'
          }`}
        >
          {isFollowed ? (
            <>
              <UserCheck size={16} />
              <span>Đang theo dõi</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Theo dõi</span>
            </>
          )}
        </button>
      </div>

      {/* Popular Songs */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Phổ biến</h2>

        <div className="space-y-1">
          {artistSongs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;
            const isLiked = isSongLiked(song.id);

            return (
              <div
                key={song.id}
                onClick={() => playSong(song, artistSongs, idx)}
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

                <div className="col-span-7 flex items-center gap-3 min-w-0">
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
                      {song.albumTitle}
                    </p>
                  </div>
                </div>

                <div className="col-span-3 text-xs font-mono text-zinc-400 hidden sm:block">
                  {song.plays.toLocaleString('vi-VN')}
                </div>

                <div className="col-span-1 flex items-center justify-end gap-2 text-xs font-mono text-zinc-400">
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
      </section>

      {/* Discography / Albums */}
      {artistAlbums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Danh sách Album</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artistAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => navigateTo({ type: 'album', albumId: album.id })}
                className="bg-[#181818] hover:bg-[#242424] p-3.5 rounded-2xl border border-white/5 cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
              >
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full aspect-square object-cover rounded-xl mb-3 shadow-md"
                />
                <h4 className="font-bold text-sm text-white truncate group-hover:text-[#1ED760] transition-colors">
                  {album.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">{album.releaseYear} • Album</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="bg-[#181818] p-6 rounded-3xl border border-white/5 space-y-3">
        <h2 className="text-xl font-bold text-white">Giới thiệu về nghệ sĩ</h2>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
          {artist.bio}
        </p>
      </section>
    </div>
  );
};
