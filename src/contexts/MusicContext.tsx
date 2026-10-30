import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Song, Album, Artist, Playlist, RepeatMode, UserProfile, ActiveView } from '../types/music';
import {
  INITIAL_SONGS,
  INITIAL_ALBUMS,
  INITIAL_ARTISTS,
  INITIAL_FEATURED_CHARTS,
  INITIAL_MADE_FOR_YOU,
  INITIAL_USER_PLAYLISTS,
} from '../data/mockMusic';
import { globalAudioEngine } from '../utils/audioEngine';
import { api } from '../api';
import {
  getNextTrackIndex,
  getPreviousTrackIndex,
  shuffleQueue,
} from '../utils/audioQueue';

interface MusicContextType {
  // Playback state
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  queueIndex: number;
  visualizerData: number[];
  
  // Playback controls
  playSong: (song: Song, newQueue?: Song[], index?: number) => void;
  playCollection: (songs: Song[], startIndex?: number) => void;
  togglePlayPause: () => void;
  stopSong: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  // Catalog & user state
  allSongs: Song[];
  allAlbums: Album[];
  allArtists: Artist[];
  featuredCharts: Playlist[];
  madeForYou: Playlist[];
  userPlaylists: Playlist[];
  currentUser: UserProfile;
  authenticate: (mode: 'login' | 'register', name: string, email: string, password: string) => Promise<void>;
  toggleLike: (songId: string) => void;
  isSongLiked: (songId: string) => boolean;
  createPlaylist: (title: string, description?: string) => Playlist;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  followArtist: (artistId: string) => void;
  saveAlbum: (albumId: string) => void;

  // Navigation
  activeView: ActiveView;
  navigateTo: (view: ActiveView) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Modals & Panels
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isCreatePlaylistOpen: boolean;
  setIsCreatePlaylistOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isPremiumModalOpen: boolean;
  setIsPremiumModalOpen: (open: boolean) => void;
  isMiniPlayer: boolean;
  setIsMiniPlayer: (mini: boolean | ((prev: boolean) => boolean)) => void;
  isFullScreenPlayer: boolean;
  setIsFullScreenPlayer: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSwitching, setIsSwitching] = useState(false);
  // Catalog
  const [allSongs, setAllSongs] = useState<Song[]>(INITIAL_SONGS);
  const [allAlbums, setAllAlbums] = useState<Album[]>(INITIAL_ALBUMS);
  const [allArtists, setAllArtists] = useState<Artist[]>(INITIAL_ARTISTS);
  const [featuredCharts] = useState<Playlist[]>(INITIAL_FEATURED_CHARTS);
  const [madeForYou] = useState<Playlist[]>(INITIAL_MADE_FOR_YOU);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(INITIAL_USER_PLAYLISTS);
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([...INITIAL_FEATURED_CHARTS, ...INITIAL_MADE_FOR_YOU]);

  // Playback
  const [currentSong, setCurrentSong] = useState<Song | null>(INITIAL_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_SONGS[0].duration);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Song[]>(INITIAL_SONGS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(32).fill(12));

  // User
  const [currentUser, setCurrentUser] = useState<UserProfile>({ 
    id: 'guest', name: 'Khách', email: '', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    isPremium: false, likedSongIds: [], savedAlbumIds: [], followedArtistIds: [], playlists: [],
  });

  // Load the catalog from SQL Server through the REST API; mock data is only the initial loading fallback.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.catalog();
        if (cancelled || !response.data) return;
        const catalog = response.data;
        console.table(
        catalog.songs?.map((song) => ({
        id: song.id,
        title: song.title,
        audioUrl: song.audioUrl,
          }))
        );
        setAllSongs(catalog.songs || []);
        setAllAlbums(catalog.albums || []);
        setAllArtists(catalog.artists || []);
        const lists: Playlist[] = catalog.playlists || [];
        setAllPlaylists(lists.filter((p) => p.tag === 'chart' || p.tag === 'radio' || p.tag === 'podcast'));
        setUserPlaylists(lists.filter((p) => p.tag === 'custom'));
        if (catalog.songs?.length) {
          setCurrentSong(catalog.songs[0]); setDuration(catalog.songs[0].duration); setQueue(catalog.songs); setQueueIndex(0);
        }
      } catch (error) { console.error('Aureon API catalog:', error); }
    };
    load();
    const token = localStorage.getItem('aureon_token');
    if (token) api.me().then((r) => {
      if (cancelled || !r.user) return;
      setCurrentUser({
        ...r.user,
        likedSongIds: r.user.likedSongIds || [],
        savedAlbumIds: r.user.savedAlbumIds || [],
        followedArtistIds: r.user.followedArtistIds || [],
        playlists: r.user.playlists || [],
      });
      setUserPlaylists((r.user.playlists || []).filter((p: Playlist) => p.tag === 'custom'));
    }).catch((error) => {
      console.warn('Aureon API session:', error);
      localStorage.removeItem('aureon_token');
    });
    return () => { cancelled = true; };
  }, []);

  const authenticate = useCallback(async (mode: 'login' | 'register', name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Địa chỉ email không hợp lệ.');
    }
    if (mode === 'register' && normalizedName.length < 2) {
      throw new Error('Tên hiển thị phải có ít nhất 2 ký tự.');
    }
    if (mode === 'register' && normalizedName.length > 128) {
      throw new Error('Tên hiển thị không được vượt quá 128 ký tự.');
    }
    if (password.length < (mode === 'register' ? 8 : 1)) {
      throw new Error(mode === 'register' ? 'Mật khẩu phải có ít nhất 8 ký tự.' : 'Vui lòng nhập mật khẩu.');
    }

    const response = mode === 'login'
      ? await api.login(normalizedEmail, password)
      : await api.register(normalizedName, normalizedEmail, password);

    if (!response?.success || !response.token || !response.user?.id) {
      throw new Error('Máy chủ trả về dữ liệu xác thực không hợp lệ.');
    }

    // Persist token only after the server has successfully authenticated/created the user.
    localStorage.setItem('aureon_token', response.token);
    setCurrentUser({
      ...response.user,
      likedSongIds: response.user.likedSongIds || [],
      savedAlbumIds: response.user.savedAlbumIds || [],
      followedArtistIds: response.user.followedArtistIds || [],
      playlists: response.user.playlists || [],
    });
    setUserPlaylists((response.user.playlists || []).filter((p: Playlist) => p.tag === 'custom'));
  }, []);

  // Navigation History
  const [historyStack, setHistoryStack] = useState<ActiveView[]>([{ type: 'home' }]);
  const [historyPointer, setHistoryPointer] = useState<number>(0);
  const activeView = historyStack[historyPointer] || { type: 'home' };

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState<boolean>(false);
  const [isFullScreenPlayer, setIsFullScreenPlayer] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const originalQueueRef = useRef<Song[]>(INITIAL_SONGS);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Visualizer loop when playing
  useEffect(() => {
    let animId: number;
    const updateVisualizer = () => {
      if (isPlaying) {
        setVisualizerData(globalAudioEngine.getVisualizerData());
      } else {
        setVisualizerData((prev) => prev.map((v) => Math.max(8, v * 0.9)));
      }
      animId = requestAnimationFrame(updateVisualizer);
    };
    animId = requestAnimationFrame(updateVisualizer);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handleTrackEnded = useCallback(() => {
    setRepeatMode((currentRepeat) => {
      setQueue((currentQueue) => {
        setQueueIndex((currentIndex) => {
          const nextIdx = getNextTrackIndex(currentQueue.length, currentIndex, currentRepeat);
          if (nextIdx !== -1 && currentQueue[nextIdx]) {
            const nextTrack = currentQueue[nextIdx];
            setCurrentSong(nextTrack);
            setDuration(nextTrack.duration);
            setCurrentTime(0);
            globalAudioEngine.loadAndPlay(nextTrack.audioUrl, nextTrack.duration);
            return nextIdx;
          } else {
            setIsPlaying(false);
            return currentIndex;
          }
        });
        return currentQueue;
      });
      return currentRepeat;
    });
  }, []);

  // Setup audio callbacks only once while the provider is mounted.
  useEffect(() => {
    globalAudioEngine.setCallbacks(
      (time, dur) => {
        setCurrentTime(time);

        if (dur && Number.isFinite(dur) && dur > 0) {
          setDuration(dur);
        }
      },
      () => {
        handleTrackEnded();
      },
      (playing) => {
        setIsPlaying(playing);
      },
      (errorMsg) => {
        showToast(errorMsg);
      }
    );

    return () => {
      globalAudioEngine.pause();
      globalAudioEngine.setCallbacks(
        () => {},
        () => {},
        () => {},
        () => {}
      );
    };
  }, [handleTrackEnded, showToast]);

  const playSong = useCallback((song: Song, newQueue?: Song[], index?: number) => {
    if (localStorage.getItem('aureon_token')) api.history(song.id).catch((e) => console.warn('Could not save listening history:', e));
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(song.duration);
    
    if (newQueue) {
      setQueue(newQueue);
      originalQueueRef.current = newQueue;
      const idx = index !== undefined ? index : newQueue.findIndex((s) => s.id === song.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      // If song not in queue, insert next
      setQueue((prevQueue) => {
        const found = prevQueue.findIndex((s) => s.id === song.id);
        if (found >= 0) {
          setQueueIndex(found);
          return prevQueue;
        } else {
          const updated = [...prevQueue, song];
          setQueueIndex(updated.length - 1);
          return updated;
        }
      });
      
    }

    globalAudioEngine.loadAndPlay(song.audioUrl, song.duration);
  }, []);

  const playCollection = useCallback((songs: Song[], startIndex: number = 0) => {
    if (songs.length === 0) return;
    const targetSong = songs[startIndex] || songs[0];
    playSong(targetSong, songs, startIndex);
  }, [playSong]);

  const togglePlayPause = useCallback(() => {
    if (!currentSong) {
      if (allSongs.length > 0) playSong(allSongs[0]);
      return;
    }
    if (isPlaying) {
      globalAudioEngine.pause();
    } else {
      globalAudioEngine.resume();
    }
  }, [currentSong, isPlaying, allSongs, playSong]);

  const stopSong = useCallback(() => {
    globalAudioEngine.stopCurrentAudio();
    setIsPlaying(false);
    setCurrentTime(0);
    showToast('Đã dừng phát nhạc');
  }, [showToast]);

  const nextSong = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = getNextTrackIndex(queue.length, queueIndex, repeatMode === 'one' ? 'all' : repeatMode);
    if (nextIdx !== -1 && queue[nextIdx]) {
      const nextTrack = queue[nextIdx];
      setQueueIndex(nextIdx);
      setCurrentSong(nextTrack);
      setDuration(nextTrack.duration);
      setCurrentTime(0);
      globalAudioEngine.loadAndPlay(nextTrack.audioUrl, nextTrack.duration);
    } else {
      showToast('Đã đến cuối hàng đợi phát');
    }
  }, [queue, queueIndex, repeatMode, showToast]);

  const prevSong = useCallback(() => {
    if (queue.length === 0) return;
    const { nextIndex, shouldRestart } = getPreviousTrackIndex(queue.length, queueIndex, currentTime);
    if (shouldRestart) {
      globalAudioEngine.seek(0);
      setCurrentTime(0);
    } else if (queue[nextIndex]) {
      const prevTrack = queue[nextIndex];
      setQueueIndex(nextIndex);
      setCurrentSong(prevTrack);
      setDuration(prevTrack.duration);
      setCurrentTime(0);
      globalAudioEngine.loadAndPlay(prevTrack.audioUrl, prevTrack.duration);
    }
  }, [queue, queueIndex, currentTime]);

  const seek = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    globalAudioEngine.seek(seconds);
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) {
      setIsMuted(false);
    }
    globalAudioEngine.setVolume(val);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      globalAudioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      globalAudioEngine.setVolume(0);
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const nextShuffle = !prev;
      if (nextShuffle) {
        const shuffled = shuffleQueue(queue, currentSong?.id);
        setQueue(shuffled);
        setQueueIndex(0);
        showToast('Đã bật chế độ phát ngẫu nhiên');
      } else {
        setQueue(originalQueueRef.current);
        const idx = originalQueueRef.current.findIndex((s) => s.id === currentSong?.id);
        setQueueIndex(idx >= 0 ? idx : 0);
        showToast('Đã tắt chế độ phát ngẫu nhiên');
      }
      return nextShuffle;
    });
  }, [queue, currentSong, showToast]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') {
        showToast('Lặp lại toàn bộ danh sách');
        return 'all';
      }
      if (prev === 'all') {
        showToast('Lặp lại bài hát hiện tại');
        return 'one';
      }
      showToast('Đã tắt lặp lại');
      return 'off';
    });
  }, [showToast]);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
    originalQueueRef.current = [...originalQueueRef.current, song];
    showToast(`Đã thêm "${song.title}" vào hàng đợi`);
  }, [showToast]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const clearQueue = useCallback(() => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
    showToast('Đã làm trống hàng đợi');
  }, [currentSong, showToast]);

  // Favorites & Likes
  const isSongLiked = useCallback(
    (songId: string) => currentUser.likedSongIds.includes(songId),
    [currentUser.likedSongIds]
  );

  const toggleLike = useCallback((songId: string) => {
    if (localStorage.getItem('aureon_token')) {
      api.toggleFavorite(songId).then((r) => setCurrentUser((prev) => ({ ...prev, likedSongIds: r.likedSongIds || prev.likedSongIds })))
        .catch((e) => showToast(e instanceof Error ? e.message : 'Không thể lưu bài hát.'));
    }
    setCurrentUser((prev) => {
      const exists = prev.likedSongIds.includes(songId);
      const updated = exists
        ? prev.likedSongIds.filter((id) => id !== songId)
        : [...prev.likedSongIds, songId];
      
      showToast(exists ? 'Đã xóa khỏi bài hát yêu thích' : 'Đã thêm vào bài hát yêu thích');
      return { ...prev, likedSongIds: updated };
    });
  }, [showToast]);

  // Playlists
  const createPlaylist = useCallback((title: string, description?: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title,
      description: description || 'Playlist tạo bởi bạn',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
      songs: [],
      trackCount: 0,
      duration: '0 phút',
      isCustom: true,
      createdBy: currentUser.name,
      tag: 'custom',
    };
    setUserPlaylists((prev) => [newPl, ...prev]);
    if (localStorage.getItem('aureon_token')) api.createPlaylist(title, description).then((r) => { if (r.data) setUserPlaylists((prev) => prev.map((p) => p.id === newPl.id ? r.data : p)); }).catch((e) => showToast(e instanceof Error ? e.message : 'Không thể tạo playlist.'));
    showToast(`Đã tạo playlist "${title}"`);
    return newPl;
  }, [currentUser.name, showToast]);

  const addSongToPlaylist = useCallback((playlistId: string, song: Song) => {
    if (localStorage.getItem('aureon_token')) api.addSongToPlaylist(playlistId, song.id).catch((e) => showToast(e instanceof Error ? e.message : 'Không thể thêm bài hát.'));
    setUserPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.songs.some((s) => s.id === song.id)) {
            showToast('Bài hát đã có trong playlist này');
            return pl;
          }
          showToast(`Đã thêm vào "${pl.title}"`);
          const songs = [...pl.songs, song];
          return {
            ...pl,
            songs,
            trackCount: songs.length,
          };
        }
        return pl;
      })
    );
  }, [showToast]);

  const followArtist = useCallback((artistId: string) => {
    if (localStorage.getItem('aureon_token')) api.toggleLibraryItem('artist', artistId).catch((e) => showToast(e instanceof Error ? e.message : 'Không thể cập nhật theo dõi.'));
    setCurrentUser((prev) => {
      const isFollowing = prev.followedArtistIds.includes(artistId);
      const followedArtistIds = isFollowing
        ? prev.followedArtistIds.filter((id) => id !== artistId)
        : [...prev.followedArtistIds, artistId];
      showToast(isFollowing ? 'Đã hủy theo dõi nghệ sĩ' : 'Đã theo dõi nghệ sĩ');
      return { ...prev, followedArtistIds };
    });
    setAllArtists((prev) =>
      prev.map((a) =>
        a.id === artistId ? { ...a, isFollowed: !a.isFollowed } : a
      )
    );
  }, [showToast]);

  const saveAlbum = useCallback((albumId: string) => {
    if (localStorage.getItem('aureon_token')) api.toggleLibraryItem('album', albumId).catch((e) => showToast(e instanceof Error ? e.message : 'Không thể lưu album.'));
    setCurrentUser((prev) => {
      const isSaved = prev.savedAlbumIds.includes(albumId);
      const savedAlbumIds = isSaved
        ? prev.savedAlbumIds.filter((id) => id !== albumId)
        : [...prev.savedAlbumIds, albumId];
      showToast(isSaved ? 'Đã xóa album khỏi thư viện' : 'Đã lưu album vào thư viện');
      return { ...prev, savedAlbumIds };
    });
  }, [showToast]);

  // Navigation
  const navigateTo = useCallback((view: ActiveView) => {
    setHistoryStack((prev) => {
      const nextStack = prev.slice(0, historyPointer + 1);
      return [...nextStack, view];
    });
    setHistoryPointer((prev) => prev + 1);
  }, [historyPointer]);

  const canGoBack = historyPointer > 0;
  const canGoForward = historyPointer < historyStack.length - 1;

  const goBack = useCallback(() => {
    if (canGoBack) setHistoryPointer((prev) => prev - 1);
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (canGoForward) setHistoryPointer((prev) => prev + 1);
  }, [canGoForward]);

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume: isMuted ? 0 : volume,
        isMuted,
        shuffle,
        repeatMode,
        queue,
        queueIndex,
        visualizerData,
        playSong,
        playCollection,
        togglePlayPause,
        stopSong,
        nextSong,
        prevSong,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        allSongs,
        allAlbums,
        allArtists,
        featuredCharts: allPlaylists.filter((p) => p.tag === 'chart'),
        madeForYou: allPlaylists.filter((p) => p.tag === 'made-for-you'),
        userPlaylists,
        currentUser,
        authenticate,
        toggleLike,
        isSongLiked,
        createPlaylist,
        addSongToPlaylist,
        followArtist,
        saveAlbum,
        activeView,
        navigateTo,
        canGoBack,
        canGoForward,
        goBack,
        goForward,
        searchQuery,
        setSearchQuery,
        isQueueOpen,
        setIsQueueOpen,
        isLyricsOpen,
        setIsLyricsOpen,
        isCreatePlaylistOpen,
        setIsCreatePlaylistOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isPremiumModalOpen,
        setIsPremiumModalOpen,
        isMiniPlayer,
        setIsMiniPlayer,
        isFullScreenPlayer,
        setIsFullScreenPlayer,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
};
