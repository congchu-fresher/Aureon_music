const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isPremium: boolean;
  likedSongIds: string[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  playlists: any[];
}

export interface AuthResponse {
  success: true;
  token: string;
  user: AuthUser;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aureon_token') : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    // A wrong password during login must not silently erase an existing session.
    // Only clear an expired token on protected endpoints.
    const isAuthEntry = path === '/auth/login' || path === '/auth/register';
    if (response.status === 401 && !isAuthEntry && token && typeof localStorage !== 'undefined') {
      localStorage.removeItem('aureon_token');
    }
    throw new Error(payload.message || `Yêu cầu thất bại (${response.status}).`);
  }
  return payload as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const enc = (value: string) => encodeURIComponent(value);

export const api = {
  request,
  health: () => request<any>('/health'),
  catalog: () => request<any>('/catalog'),
  genres: () => request<any>('/genres'),
  songs: (params: { q?: string; genre?: string; artistId?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length) query.set(key, String(value));
    });
    const queryString = query.toString();
    return request<any>(`/songs${queryString ? `?${queryString}` : ''}`);
  },
  song: (songId: string) => request<any>(`/songs/${enc(songId)}`),
  albums: () => request<any>('/albums'),
  album: (albumId: string) => request<any>(`/albums/${enc(albumId)}`),
  artists: () => request<any>('/artists'),
  artist: (artistId: string) => request<any>(`/artists/${enc(artistId)}`),
  playlists: (tag?: string) => request<any>(`/playlists${tag ? `?tag=${enc(tag)}` : ''}`),
  playlist: (playlistId: string) => request<any>(`/playlists/${enc(playlistId)}`),
  me: () => request<any>('/users/me'),
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', json('POST', {
    email: email.trim().toLowerCase(), password,
  })),
  register: (name: string, email: string, password: string) => request<AuthResponse>('/auth/register', json('POST', {
    name: name.trim(), email: email.trim().toLowerCase(), password,
  })),
  toggleFavorite: (songId: string) => request<any>('/library/favorites', json('POST', { songId })),
  createPlaylist: (title: string, description?: string) => request<any>('/playlists', json('POST', { title, description })),
  addSongToPlaylist: (playlistId: string, songId: string) => request<any>(`/playlists/${enc(playlistId)}/songs`, json('POST', { songId })),
  removeSongFromPlaylist: (playlistId: string, songId: string) => request<any>(`/playlists/${enc(playlistId)}/songs/${enc(songId)}`, json('DELETE')),
  deletePlaylist: (playlistId: string) => request<any>(`/playlists/${enc(playlistId)}`, json('DELETE')),
  toggleLibraryItem: (itemType: 'album' | 'artist' | 'playlist', itemId: string) => request<any>('/library/items', json('POST', { itemType, itemId })),
  history: (songId: string, durationListenedSeconds = 0) => request<any>('/users/me/history', json('POST', { songId, durationListenedSeconds })),
  listeningHistory: () => request<any>('/users/me/history'),
  getQueue: () => request<any>('/users/me/queue'),
  saveQueue: (songIds: string[]) => request<any>('/users/me/queue', json('PUT', { songIds })),
};
