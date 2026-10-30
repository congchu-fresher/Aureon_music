import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  getNextTrackIndex,
  getPreviousTrackIndex,
  shuffleQueue,
  filterSongs,
  calculateTotalDurationFormatted,
} from './audioQueue';
import { Song } from '../types/music';

const mockSongs: Song[] = [
  {
    id: 's1',
    title: 'Neon Horizon',
    artistId: 'a1',
    artistName: 'Luna Bay',
    albumId: 'alb1',
    albumTitle: 'Cyber Twilight',
    coverUrl: '',
    audioUrl: '',
    duration: 185,
    plays: 1000,
    genre: 'Synthwave',
    year: 2024,
  },
  {
    id: 's2',
    title: 'Midnight Echoes',
    artistId: 'a2',
    artistName: 'Solar Flare',
    albumId: 'alb2',
    albumTitle: 'Deep Space',
    coverUrl: '',
    audioUrl: '',
    duration: 210,
    plays: 2500,
    genre: 'Electronic',
    year: 2024,
  },
  {
    id: 's3',
    title: 'Sài Gòn Mưa Rơi',
    artistId: 'a3',
    artistName: 'Minh Vũ',
    albumId: 'alb3',
    albumTitle: 'Phố Đêm',
    coverUrl: '',
    audioUrl: '',
    duration: 240,
    plays: 5000,
    genre: 'Indie Pop',
    year: 2023,
  },
];

test('formatTime properly formats seconds', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(47), '0:47');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(288), '4:48');
  assert.equal(formatTime(3665), '1:01:05');
  assert.equal(formatTime(-10), '0:00');
});

test('getNextTrackIndex handles standard, repeat all, and repeat one', () => {
  // At index 0, next should be 1
  assert.equal(getNextTrackIndex(3, 0, 'off'), 1);
  // At end of queue, repeat off returns -1
  assert.equal(getNextTrackIndex(3, 2, 'off'), -1);
  // At end of queue, repeat all loops back to 0
  assert.equal(getNextTrackIndex(3, 2, 'all'), 0);
  // Repeat one stays on current index
  assert.equal(getNextTrackIndex(3, 1, 'one'), 1);
  // Empty queue returns -1
  assert.equal(getNextTrackIndex(0, 0, 'off'), -1);
});

test('getPreviousTrackIndex restarts track if playing for > 3s, else moves back', () => {
  // If 5 seconds in, it restarts the current track
  const res1 = getPreviousTrackIndex(3, 1, 5);
  assert.equal(res1.nextIndex, 1);
  assert.equal(res1.shouldRestart, true);

  // If 2 seconds in and not at track 0, goes to previous track
  const res2 = getPreviousTrackIndex(3, 1, 2);
  assert.equal(res2.nextIndex, 0);
  assert.equal(res2.shouldRestart, false);

  // If at track 0 and 1 second in, restarts track 0
  const res3 = getPreviousTrackIndex(3, 0, 1);
  assert.equal(res3.nextIndex, 0);
  assert.equal(res3.shouldRestart, true);
});

test('shuffleQueue preserves length and maintains current song at head if specified', () => {
  const shuffled = shuffleQueue(mockSongs, 's2');
  assert.equal(shuffled.length, mockSongs.length);
  assert.equal(shuffled[0].id, 's2');
  
  const allIds = new Set(shuffled.map(s => s.id));
  assert.equal(allIds.size, 3);
});

test('filterSongs filters case-insensitively by title, artist, or genre', () => {
  const matchTitle = filterSongs(mockSongs, 'horizon');
  assert.equal(matchTitle.length, 1);
  assert.equal(matchTitle[0].id, 's1');

  const matchArtist = filterSongs(mockSongs, 'minh');
  assert.equal(matchArtist.length, 1);
  assert.equal(matchArtist[0].id, 's3');

  const matchGenre = filterSongs(mockSongs, 'electronic');
  assert.equal(matchGenre.length, 1);
  assert.equal(matchGenre[0].id, 's2');

  const matchNone = filterSongs(mockSongs, 'nonexistentxyz');
  assert.equal(matchNone.length, 0);
});

test('calculateTotalDurationFormatted calculates human readable duration', () => {
  const formatted = calculateTotalDurationFormatted(mockSongs);
  // 185 + 210 + 240 = 635 seconds = 10 minutes
  assert.equal(formatted, '10 phút');
});
