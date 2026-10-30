export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
  plays: number;
  genre: string;
  year: number;
  isLiked?: boolean;
  lyrics?: string[];
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseYear: number;
  songsCount: number;
  totalDuration: number; // in seconds
  genre: string;
  description: string;
  songs: Song[];
  gradientColor?: string;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bannerUrl: string;
  monthlyListeners: number;
  followers: number;
  bio: string;
  isVerified: boolean;
  isFollowed?: boolean;
  popularSongs: Song[];
  albums: Album[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  songs: Song[];
  trackCount: number;
  duration: string;
  isCustom?: boolean;
  createdBy?: string;
  followers?: number;
  gradientFrom?: string;
  gradientTo?: string;
  tag?: 'chart' | 'made-for-you' | 'radio' | 'custom' | 'podcast';
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isPremium: boolean;
  likedSongIds: string[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  playlists: Playlist[];
}

export type ActiveView = 
  | { type: 'home' }
  | { type: 'search'; query?: string }
  | { type: 'album'; albumId: string }
  | { type: 'artist'; artistId: string }
  | { type: 'playlist'; playlistId: string }
  | { type: 'liked-songs' }
  | { type: 'library' }
  | { type: 'settings' };
