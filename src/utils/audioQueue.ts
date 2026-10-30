import { Song, RepeatMode } from '../types/music';

/**
 * Formats time in seconds to mm:ss or hh:mm:ss format.
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  if (hrs > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}

/**
 * Determines the next track index given queue, current index, and repeat mode.
 * Returns -1 if end of queue reached and repeat is off.
 */
export function getNextTrackIndex(
  queueLength: number,
  currentIndex: number,
  repeatMode: RepeatMode
): number {
  if (queueLength === 0) return -1;
  if (repeatMode === 'one') {
    return currentIndex >= 0 ? currentIndex : 0;
  }
  if (currentIndex + 1 < queueLength) {
    return currentIndex + 1;
  }
  if (repeatMode === 'all') {
    return 0;
  }
  return -1;
}

/**
 * Determines the previous track index. If more than 3 seconds in, restart track.
 * Otherwise, move to previous track.
 */
export function getPreviousTrackIndex(
  queueLength: number,
  currentIndex: number,
  currentSeconds: number
): { nextIndex: number; shouldRestart: boolean } {
  if (queueLength === 0) return { nextIndex: -1, shouldRestart: false };
  if (currentSeconds > 3) {
    return { nextIndex: currentIndex, shouldRestart: true };
  }
  if (currentIndex > 0) {
    return { nextIndex: currentIndex - 1, shouldRestart: false };
  }
  return { nextIndex: 0, shouldRestart: true };
}

/**
 * Shuffles an array of songs, preserving current active song at index 0 if provided.
 */
export function shuffleQueue(songs: Song[], currentSongId?: string): Song[] {
  if (songs.length <= 1) return [...songs];
  
  const currentSong = currentSongId ? songs.find(s => s.id === currentSongId) : null;
  const remaining = songs.filter(s => s.id !== currentSongId);

  // Fisher-Yates shuffle
  const shuffled = [...remaining];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  if (currentSong) {
    return [currentSong, ...shuffled];
  }
  return shuffled;
}

/**
 * Filter songs or albums by text query against title, artist name, and genre.
 */
export function filterSongs(songs: Song[], query: string): Song[] {
  const q = query.trim().toLowerCase();
  if (!q) return songs;
  return songs.filter(song => 
    song.title.toLowerCase().includes(q) ||
    song.artistName.toLowerCase().includes(q) ||
    song.albumTitle.toLowerCase().includes(q) ||
    song.genre.toLowerCase().includes(q)
  );
}

/**
 * Calculates total duration formatted in minutes or hours for album/playlist.
 */
export function calculateTotalDurationFormatted(songs: Song[]): string {
  const totalSecs = songs.reduce((acc, s) => acc + s.duration, 0);
  const mins = Math.floor(totalSecs / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} giờ ${remMins} phút`;
  }
  return `${mins} phút`;
}
