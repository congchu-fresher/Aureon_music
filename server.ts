import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import {
  INITIAL_SONGS, INITIAL_ALBUMS, INITIAL_ARTISTS,
  INITIAL_FEATURED_CHARTS, INITIAL_MADE_FOR_YOU, INITIAL_USER_PLAYLISTS,
} from './src/data/mockMusic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 4000);
const API = '/api/v1';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith('replace-with-')) {
  console.warn('[security] Set JWT_SECRET to a random secret of at least 32 characters in .env');
}
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const dbConfig: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || 'AureonMusicDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: String(process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate: String(process.env.DB_TRUST_SERVER_CERTIFICATE || 'true').toLowerCase() === 'true',
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};
let pool: sql.ConnectionPool;
const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
const coverFallback = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80';

type AuthRequest = Request & { user?: { id: string; email: string } };
function fail(res: Response, status: number, message: string) { return res.status(status).json({ success: false, message }); }
function tokenFor(user: { UserID: string; Email: string }) {
  if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith('replace-with-')) throw new Error('Hãy đặt JWT_SECRET ngẫu nhiên dài ít nhất 32 ký tự trong file .env');
  return jwt.sign({ sub: user.UserID, email: user.Email }, JWT_SECRET, { expiresIn: '7d' });
}
function auth(required = true) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return required ? fail(res, 401, 'Vui lòng đăng nhập để sử dụng chức năng này.') : next();
    try {
      const decoded = jwt.verify(token, JWT_SECRET || '') as jwt.JwtPayload;
      if (typeof decoded.sub !== 'string') return fail(res, 401, 'Token không hợp lệ.');
      req.user = { id: decoded.sub, email: String(decoded.email || '') };
      next();
    } catch { return fail(res, 401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); }
  };
}
function id(prefix: string) { return `${prefix}-${randomUUID()}`; }

async function seedCatalog() {
  // Create/resolve Genres first: Albums and Songs reference this table by foreign key.
  const genreNames = [...new Set([
    ...INITIAL_SONGS.map((s) => s.genre),
    ...INITIAL_ALBUMS.map((a) => a.genre),
  ].map((name) => String(name || '').trim()).filter(Boolean))];
  const genres = new Map<string, string>();

  for (const name of genreNames) {
    const existing = await pool.request()
      .input('name', sql.NVarChar(64), name)
      .query('SELECT TOP (1) GenreID FROM dbo.Genres WHERE Name = @name');
    if (existing.recordset.length) {
      genres.set(name, existing.recordset[0].GenreID);
      continue;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'genre';
    const genreId = `g-${slug}-${randomUUID().slice(0, 6)}`;
    await pool.request()
      .input('id', sql.NVarChar(32), genreId)
      .input('name', sql.NVarChar(64), name)
      .query('IF NOT EXISTS (SELECT 1 FROM dbo.Genres WHERE Name = @name) INSERT dbo.Genres(GenreID, Name) VALUES(@id, @name)');
    const saved = await pool.request().input('name', sql.NVarChar(64), name)
      .query('SELECT TOP (1) GenreID FROM dbo.Genres WHERE Name = @name');
    if (saved.recordset.length) genres.set(name, saved.recordset[0].GenreID);
  }

  // Do not mix mock content into a database that already contains real songs.
  // Genre repair is still performed on each startup and is idempotent.
  const check = await pool.request().query('SELECT COUNT_BIG(*) AS total FROM dbo.Songs');
  if (Number(check.recordset[0].total) > 0) {
    console.log('[database] Existing songs detected; demo catalog import skipped.');
    return;
  }
  console.log('[database] Songs table is empty; importing demo catalog from mockMusic.ts...');
  
  // Bổ sung nghệ sĩ còn thiếu từ dữ liệu album và bài hát.
  const artistMap = new Map(
    INITIAL_ARTISTS.map(a => [a.id, {
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl || fallbackAvatar,
      bannerUrl: a.bannerUrl || null,
      bio: a.bio || '',
      monthlyListeners: a.monthlyListeners || 0,
      followers: a.followers || 0,
      isVerified: !!a.isVerified,
    }])
  );

  for (const item of [...INITIAL_ALBUMS, ...INITIAL_SONGS]) {
    if (!artistMap.has(item.artistId)) {
      const song = INITIAL_SONGS.find(s => s.artistId === item.artistId);
      const album = INITIAL_ALBUMS.find(a => a.artistId === item.artistId);

      artistMap.set(item.artistId, {
        id: item.artistId,
        name: song?.artistName || album?.artistName || item.artistId,
        avatarUrl: song?.coverUrl || album?.coverUrl || fallbackAvatar,
        bannerUrl: null,
        bio: '',
        monthlyListeners: 0,
        followers: 0,
        isVerified: false,
      });
    }
  }

  // Luôn tạo nghệ sĩ trước album.
  for (const a of artistMap.values()) {
    await pool.request()
      .input('id', sql.NVarChar(64), a.id)
      .input('name', sql.NVarChar(128), a.name)
      .input('avatar', sql.NVarChar(1024), a.avatarUrl)
      .input('banner', sql.NVarChar(1024), a.bannerUrl)
      .input('bio', sql.NVarChar(sql.MAX), a.bio)
      .input('listeners', sql.BigInt, a.monthlyListeners)
      .input('followers', sql.Int, a.followers)
      .input('verified', sql.Bit, a.isVerified)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM dbo.Artists WHERE ArtistID = @id
        )
        INSERT dbo.Artists
          (ArtistID, Name, AvatarUrl, BannerUrl, Bio,
           MonthlyListeners, FollowersCount, IsVerified)
        VALUES
          (@id, @name, @avatar, @banner, @bio,
           @listeners, @followers, @verified)
      `);
  }

  // Bổ sung các album được tham chiếu trong Songs nhưng
  // chưa có trong INITIAL_ALBUMS.
  const albumMap = new Map(
    INITIAL_ALBUMS.map(a => [a.id, {
      id: a.id,
      title: a.title,
      artistId: a.artistId,
      coverUrl: a.coverUrl || coverFallback,
      releaseYear: a.releaseYear || new Date().getFullYear(),
      genre: a.genre,
      description: a.description || '',
    }])
  );

  for (const s of INITIAL_SONGS) {
    if (s.albumId && !albumMap.has(s.albumId)) {
      albumMap.set(s.albumId, {
        id: s.albumId,
        title: s.albumTitle || 'Đĩa đơn',
        artistId: s.artistId,
        coverUrl: s.coverUrl || coverFallback,
        releaseYear: s.year || new Date().getFullYear(),
        genre: s.genre,
        description: '',
      });
    }
  }

  // Chỉ tạo album sau khi tất cả nghệ sĩ đã tồn tại.
  for (const a of albumMap.values()) {
    const genreId = genres.get(a.genre) || null;

    await pool.request()
      .input('id', sql.NVarChar(64), a.id)
      .input('title', sql.NVarChar(256), a.title)
      .input('artist', sql.NVarChar(64), a.artistId)
      .input('cover', sql.NVarChar(1024), a.coverUrl)
      .input('year', sql.Int, a.releaseYear)
      .input('genre', sql.NVarChar(32), genreId)
      .input('description', sql.NVarChar(sql.MAX), a.description)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM dbo.Albums WHERE AlbumID = @id
        )
        INSERT dbo.Albums
          (AlbumID, Title, ArtistID, CoverUrl,
           ReleaseYear, GenreID, Description)
        VALUES
          (@id, @title, @artist, @cover,
           @year, @genre, @description)
      `);
  }

  for (const s of INITIAL_SONGS) {
    const genreId = genres.get(s.genre) || null;
    await pool.request().input('id', sql.NVarChar(64), s.id).input('title', sql.NVarChar(256), s.title)
      .input('artist', sql.NVarChar(64), s.artistId).input('album', sql.NVarChar(64), s.albumId || null)
      .input('genre', sql.NVarChar(32), genreId).input('duration', sql.Int, Math.max(1, s.duration || 1))
      .input('audio', sql.NVarChar(1024), s.audioUrl || 'synth://demo').input('cover', sql.NVarChar(1024), s.coverUrl || coverFallback)
      .input('plays', sql.BigInt, s.plays || 0).input('year', sql.Date, new Date(`${s.year || new Date().getFullYear()}-01-01T00:00:00Z`))
      .input('lyrics', sql.NVarChar(sql.MAX), Array.isArray(s.lyrics) ? s.lyrics.join('\n') : null)
      .query(`IF NOT EXISTS (SELECT 1 FROM dbo.Songs WHERE SongID=@id)
        INSERT dbo.Songs(SongID,Title,ArtistID,AlbumID,GenreID,DurationSeconds,AudioUrl,CoverUrl,PlayCount,ReleaseDate,Lyrics)
        VALUES(@id,@title,@artist,@album,@genre,@duration,@audio,@cover,@plays,@year,@lyrics)`);
  }
  const lists = [...INITIAL_FEATURED_CHARTS, ...INITIAL_MADE_FOR_YOU, ...INITIAL_USER_PLAYLISTS];
  for (const p of lists) {
    await pool.request().input('id', sql.NVarChar(64), p.id).input('title', sql.NVarChar(256), p.title)
      .input('description', sql.NVarChar(sql.MAX), p.description || '').input('cover', sql.NVarChar(1024), p.coverUrl || coverFallback)
      .input('from', sql.NVarChar(32), p.gradientFrom || null).input('to', sql.NVarChar(32), p.gradientTo || null)
      .input('tag', sql.NVarChar(32), p.tag || 'chart')
      .query(`IF NOT EXISTS (SELECT 1 FROM dbo.Playlists WHERE PlaylistID=@id)
        INSERT dbo.Playlists(PlaylistID,Title,Description,CoverUrl,GradientFrom,GradientTo,Tag,IsPublic)
        VALUES(@id,@title,@description,@cover,@from,@to,@tag,1)`);
    for (let i = 0; i < (p.songs || []).length; i++) {
      const s = p.songs[i];
      await pool.request().input('pid', sql.NVarChar(64), p.id).input('sid', sql.NVarChar(64), s.id).input('pos', sql.Int, i)
        .query(`IF EXISTS(SELECT 1 FROM dbo.Songs WHERE SongID=@sid) AND NOT EXISTS(SELECT 1 FROM dbo.PlaylistSongs WHERE PlaylistID=@pid AND SongID=@sid)
          INSERT dbo.PlaylistSongs(PlaylistID,SongID,OrderIndex) VALUES(@pid,@sid,@pos)`);
    }
  }
  console.log(`[database] Demo catalog imported (${INITIAL_SONGS.length} songs).`);
}

async function getCatalog(userId?: string) {
  const [songResult, albumResult, artistResult, playlistResult, favoritesResult, libraryResult] = await Promise.all([
    pool.request().query(`SELECT s.SongID,s.Title,s.ArtistID,a.Name AS ArtistName,s.AlbumID,al.Title AS AlbumTitle,s.CoverUrl,s.AudioUrl,s.DurationSeconds,s.PlayCount,g.Name AS Genre,s.ReleaseDate,s.Lyrics
      FROM dbo.Songs s JOIN dbo.Artists a ON a.ArtistID=s.ArtistID LEFT JOIN dbo.Albums al ON al.AlbumID=s.AlbumID LEFT JOIN dbo.Genres g ON g.GenreID=s.GenreID WHERE s.IsActive=1 ORDER BY s.CreatedAt,s.Title`),
    pool.request().query(`SELECT al.AlbumID,al.Title,al.ArtistID,a.Name AS ArtistName,al.CoverUrl,al.ReleaseYear,g.Name AS Genre,al.Description
      FROM dbo.Albums al JOIN dbo.Artists a ON a.ArtistID=al.ArtistID LEFT JOIN dbo.Genres g ON g.GenreID=al.GenreID ORDER BY al.CreatedAt DESC`),
    pool.request().query('SELECT ArtistID,Name,AvatarUrl,BannerUrl,Bio,MonthlyListeners,FollowersCount,IsVerified FROM dbo.Artists ORDER BY Name'),
    pool.request().input('uid', sql.NVarChar(64), userId ?? null).query(`SELECT p.PlaylistID,p.Title,p.Description,p.CoverUrl,p.UserID,p.IsPublic,p.FollowersCount,p.GradientFrom,p.GradientTo,p.Tag,ps.SongID,ps.OrderIndex
      FROM dbo.Playlists p
      LEFT JOIN dbo.PlaylistSongs ps ON ps.PlaylistID=p.PlaylistID
      WHERE p.UserID IS NULL OR p.IsPublic=1 OR p.UserID=@uid
      ORDER BY p.CreatedAt DESC,ps.OrderIndex`),
    userId ? pool.request().input('uid', sql.NVarChar(64), userId).query('SELECT SongID FROM dbo.Favorites WHERE UserID=@uid') : Promise.resolve({ recordset: [] } as any),
    userId ? pool.request().input('uid', sql.NVarChar(64), userId).query("SELECT ItemType,ItemID FROM dbo.UserLibrary WHERE UserID=@uid") : Promise.resolve({ recordset: [] } as any),
  ]);
  const songs = songResult.recordset.map((r: any) => ({
    id: r.SongID, title: r.Title, artistId: r.ArtistID, artistName: r.ArtistName, albumId: r.AlbumID || '', albumTitle: r.AlbumTitle || 'Đĩa đơn',
    coverUrl: r.CoverUrl || coverFallback, audioUrl: r.AudioUrl, duration: r.DurationSeconds, plays: Number(r.PlayCount || 0), genre: r.Genre || 'Khác',
    year: r.ReleaseDate ? new Date(r.ReleaseDate).getUTCFullYear() : new Date().getFullYear(), isLiked: favoritesResult.recordset.some((f: any) => f.SongID === r.SongID),
    lyrics: r.Lyrics ? String(r.Lyrics).split(/\r?\n/) : [],
  }));
  const albums = albumResult.recordset.map((r: any) => {
    const albumSongs = songs.filter((s: any) => s.albumId === r.AlbumID);
    return { id: r.AlbumID, title: r.Title, artistId: r.ArtistID, artistName: r.ArtistName, coverUrl: r.CoverUrl || coverFallback,
      releaseYear: r.ReleaseYear, songsCount: albumSongs.length, totalDuration: albumSongs.reduce((n: number, s: any) => n + s.duration, 0),
      genre: r.Genre || 'Khác', description: r.Description || '', songs: albumSongs };
  });
  const artists = artistResult.recordset.map((r: any) => {
    const artistAlbums = albums.filter((a: any) => a.artistId === r.ArtistID);
    return { id: r.ArtistID, name: r.Name, avatarUrl: r.AvatarUrl || fallbackAvatar, bannerUrl: r.BannerUrl || r.AvatarUrl || fallbackAvatar,
      monthlyListeners: Number(r.MonthlyListeners || 0), followers: r.FollowersCount || 0, bio: r.Bio || '', isVerified: !!r.IsVerified,
      isFollowed: libraryResult.recordset.some((x: any) => x.ItemType === 'artist' && x.ItemID === r.ArtistID),
      popularSongs: songs.filter((s: any) => s.artistId === r.ArtistID).sort((a: any,b: any) => b.plays-a.plays).slice(0,5), albums: artistAlbums };
  });
  const grouped = new Map<string, any>();
  for (const r of playlistResult.recordset) {
    if (!grouped.has(r.PlaylistID)) grouped.set(r.PlaylistID, { id: r.PlaylistID, title: r.Title, description: r.Description || '', coverUrl: r.CoverUrl || coverFallback,
      songs: [], trackCount: 0, duration: '0 phút', isCustom: !!r.UserID, createdBy: r.UserID || undefined,
      isPublic: !!r.IsPublic, followers: r.FollowersCount || 0,
      gradientFrom: r.GradientFrom || undefined, gradientTo: r.GradientTo || undefined, tag: r.Tag || 'chart' });
    const p = grouped.get(r.PlaylistID);
    if (r.SongID) { const song = songs.find((s: any) => s.id === r.SongID); if (song) p.songs.push(song); }
  }
  const playlists = [...grouped.values()].map((p: any) => ({ ...p, trackCount: p.songs.length,
    duration: `${Math.round(p.songs.reduce((n: number,s: any) => n+s.duration,0)/60)} phút` }));
  return { songs, albums, artists, playlists, likedSongIds: favoritesResult.recordset.map((x: any) => x.SongID),
    savedAlbumIds: libraryResult.recordset.filter((x: any) => x.ItemType === 'album').map((x: any) => x.ItemID),
    followedArtistIds: libraryResult.recordset.filter((x: any) => x.ItemType === 'artist').map((x: any) => x.ItemID) };
}

app.get(`${API}/health`, async (_req, res) => {
  try { await pool.request().query('SELECT 1 AS ok'); res.json({ success: true, database: 'connected' }); }
  catch { res.status(503).json({ success: false, database: 'disconnected', message: 'Không kết nối được SQL Server.' }); }
});
app.get(`${API}/catalog`, auth(false), async (req: AuthRequest, res) => {
  try { const catalog = await getCatalog(req.user?.id); res.json({ success: true, data: catalog }); }
  catch (e) { console.error('GET catalog failed', e); fail(res, 500, 'Không thể tải dữ liệu nhạc từ cơ sở dữ liệu.'); }
});
app.get(`${API}/genres`, async (_req, res) => {
  try {
    const result = await pool.request().query('SELECT GenreID, Name, Description, ColorCode FROM dbo.Genres ORDER BY Name');
    res.json({ success: true, count: result.recordset.length, data: result.recordset.map((g: any) => ({
      id: g.GenreID, name: g.Name, description: g.Description || '', colorCode: g.ColorCode || null,
    })) });
  } catch (e) { console.error('GET genres failed', e); fail(res, 500, 'Không thể tải thể loại nhạc.'); }
});

app.get(`${API}/songs`, async (req, res) => {
  try {
    const catalog = await getCatalog(); let songs = catalog.songs;
    if (req.query.q) { const q = String(req.query.q).toLocaleLowerCase(); songs = songs.filter((s: any) => `${s.title} ${s.artistName} ${s.albumTitle}`.toLocaleLowerCase().includes(q)); }
    if (req.query.genre) songs = songs.filter((s: any) => s.genre.toLocaleLowerCase() === String(req.query.genre).toLocaleLowerCase());
    if (req.query.artistId) songs = songs.filter((s: any) => s.artistId === String(req.query.artistId));
    const total = songs.length;
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || '100'), 10) || 100));
    const offset = Math.max(0, Number.parseInt(String(req.query.offset || '0'), 10) || 0);
    res.json({ success: true, count: total, limit, offset, data: songs.slice(offset, offset + limit) });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể tải danh sách bài hát.'); }
});
app.get(`${API}/songs/:id`, async (req, res) => {
  try { const r = await pool.request().input('id', sql.NVarChar(64), req.params.id).query(`SELECT s.SongID FROM dbo.Songs s WHERE s.SongID=@id AND s.IsActive=1`);
    if (!r.recordset.length) return fail(res, 404, 'Không tìm thấy bài hát.');
    const c = await getCatalog(); res.json({ success: true, data: c.songs.find((s: any) => s.id === req.params.id) });
  } catch (e) { console.error(e); fail(res, 500, 'Lỗi khi tải bài hát.'); }
});
app.get(`${API}/albums`, async (_req, res) => { try { res.json({ success: true, data: (await getCatalog()).albums }); } catch (e) { console.error(e); fail(res, 500, 'Không thể tải album.'); } });
app.get(`${API}/albums/:id`, async (req, res) => { try { const c = await getCatalog(); const item = c.albums.find((x: any) => x.id === req.params.id); return item ? res.json({ success: true, data: item }) : fail(res, 404, 'Không tìm thấy album.'); } catch (e) { console.error(e); fail(res, 500, 'Lỗi khi tải album.'); } });
app.get(`${API}/artists`, async (_req, res) => { try { res.json({ success: true, data: (await getCatalog()).artists }); } catch (e) { console.error(e); fail(res, 500, 'Không thể tải nghệ sĩ.'); } });
app.get(`${API}/artists/:id`, async (req, res) => { try { const c = await getCatalog(); const item = c.artists.find((x: any) => x.id === req.params.id); return item ? res.json({ success: true, data: item }) : fail(res, 404, 'Không tìm thấy nghệ sĩ.'); } catch (e) { console.error(e); fail(res, 500, 'Lỗi khi tải nghệ sĩ.'); } });
app.get(`${API}/playlists`, auth(false), async (req: AuthRequest, res) => {
  try {
    let lists = (await getCatalog(req.user?.id)).playlists;
    if (req.query.tag) lists = lists.filter((p: any) => p.tag === String(req.query.tag));
    res.json({ success: true, count: lists.length, data: lists });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể tải playlist.'); }
});
app.get(`${API}/playlists/:id`, auth(false), async (req: AuthRequest, res) => {
  try {
    const item = (await getCatalog(req.user?.id)).playlists.find((p: any) => p.id === req.params.id);
    return item ? res.json({ success: true, data: item }) : fail(res, 404, 'Không tìm thấy playlist.');
  } catch (e) { console.error(e); fail(res, 500, 'Lỗi khi tải playlist.'); }
});
app.post(`${API}/auth/register`, async (req, res) => {
  const name = String(req.body?.name || '').trim(), email = String(req.body?.email || '').trim().toLowerCase(), password = String(req.body?.password || '');
  if (name.length < 2 || name.length > 128) return fail(res, 400, 'Tên hiển thị phải từ 2 đến 128 ký tự.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Email không hợp lệ.');
  if (password.length < 8) return fail(res, 400, 'Mật khẩu phải có ít nhất 8 ký tự.');
  try {
    const exists = await pool.request().input('email', sql.NVarChar(256), email).query('SELECT UserID FROM dbo.Users WHERE Email=@email');
    if (exists.recordset.length) return fail(res, 409, 'Email này đã được đăng ký.');
    const userId = id('usr'), passwordHash = await bcrypt.hash(password, 12);
    await pool.request().input('id', sql.NVarChar(64), userId).input('email', sql.NVarChar(256), email).input('hash', sql.NVarChar(512), passwordHash)
      .input('name', sql.NVarChar(128), name).input('avatar', sql.NVarChar(1024), fallbackAvatar)
      .query('INSERT dbo.Users(UserID,Email,PasswordHash,DisplayName,AvatarUrl) VALUES(@id,@email,@hash,@name,@avatar)');
    const user = { id: userId, name, email, avatarUrl: fallbackAvatar, isPremium: false, likedSongIds: [], savedAlbumIds: [], followedArtistIds: [], playlists: [] };
    res.status(201).json({ success: true, token: tokenFor({ UserID: userId, Email: email }), user });
  } catch (e: any) {
    // A concurrent registration can pass the pre-check; SQL Server's UNIQUE constraint is authoritative.
    if (e?.number === 2601 || e?.number === 2627) return fail(res, 409, 'Email này đã được đăng ký.');
    console.error('register failed', e);
    fail(res, 500, 'Không thể tạo tài khoản lúc này.');
  }
});
app.post(`${API}/auth/login`, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase(), password = String(req.body?.password || '');
  if (!email || !password) return fail(res, 400, 'Vui lòng nhập email và mật khẩu.');
  try {
    const result = await pool.request().input('email', sql.NVarChar(256), email).query('SELECT UserID,Email,PasswordHash,DisplayName,AvatarUrl,IsPremium FROM dbo.Users WHERE Email=@email');
    const row = result.recordset[0];
    if (!row || !(await bcrypt.compare(password, row.PasswordHash))) return fail(res, 401, 'Email hoặc mật khẩu không chính xác.');
    const c = await getCatalog(row.UserID);
    res.json({ success: true, token: tokenFor(row), user: { id: row.UserID, name: row.DisplayName, email: row.Email, avatarUrl: row.AvatarUrl || fallbackAvatar, isPremium: !!row.IsPremium,
      likedSongIds: c.likedSongIds, savedAlbumIds: c.savedAlbumIds, followedArtistIds: c.followedArtistIds, playlists: c.playlists.filter((p: any) => p.createdBy === row.UserID) } });
  } catch (e) { console.error('login failed', e); fail(res, 500, 'Không thể đăng nhập lúc này.'); }
});
app.get(`${API}/users/me`, auth(), async (req: AuthRequest, res) => {
  try {
    const r = await pool.request().input('id', sql.NVarChar(64), req.user!.id).query('SELECT UserID,Email,DisplayName,AvatarUrl,IsPremium FROM dbo.Users WHERE UserID=@id');
    const u = r.recordset[0]; if (!u) return fail(res, 404, 'Không tìm thấy tài khoản.');
    const c = await getCatalog(u.UserID);
    res.json({ success: true, user: { id: u.UserID, name: u.DisplayName, email: u.Email, avatarUrl: u.AvatarUrl || fallbackAvatar, isPremium: !!u.IsPremium,
      likedSongIds: c.likedSongIds, savedAlbumIds: c.savedAlbumIds, followedArtistIds: c.followedArtistIds, playlists: c.playlists.filter((p: any) => p.createdBy === u.UserID) } });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể tải thông tin tài khoản.'); }
});
app.post(`${API}/library/favorites`, auth(), async (req: AuthRequest, res) => {
  const songId = String(req.body?.songId || ''); if (!songId) return fail(res, 400, 'songId là bắt buộc.');
  try {
    const result = await pool.request().input('uid', sql.NVarChar(64), req.user!.id).input('sid', sql.NVarChar(64), songId).query(`IF NOT EXISTS(SELECT 1 FROM dbo.Songs WHERE SongID=@sid AND IsActive=1) SELECT 'missing' AS result
      ELSE IF EXISTS(SELECT 1 FROM dbo.Favorites WHERE UserID=@uid AND SongID=@sid) BEGIN DELETE dbo.Favorites WHERE UserID=@uid AND SongID=@sid; SELECT 'removed' AS result END
      ELSE BEGIN INSERT dbo.Favorites(UserID,SongID) VALUES(@uid,@sid); SELECT 'added' AS result END`);
    const state = result.recordset[0]?.result; if (state === 'missing') return fail(res, 404, 'Không tìm thấy bài hát.');
    const all = await pool.request().input('uid', sql.NVarChar(64), req.user!.id).query('SELECT SongID FROM dbo.Favorites WHERE UserID=@uid');
    res.json({ success: true, isLiked: state === 'added', likedSongIds: all.recordset.map((x: any) => x.SongID) });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể cập nhật bài hát yêu thích.'); }
});
app.post(`${API}/library/items`, auth(), async (req: AuthRequest, res) => {
  const itemType = String(req.body?.itemType || ''), itemId = String(req.body?.itemId || '');
  if (!['album', 'artist', 'playlist'].includes(itemType) || !itemId) return fail(res, 400, 'Dữ liệu thư viện không hợp lệ.');
  try {
    let valid;
    if (itemType === 'album') {
      valid = await pool.request().input('id', sql.NVarChar(64), itemId).query('SELECT AlbumID AS ItemID FROM dbo.Albums WHERE AlbumID=@id');
    } else if (itemType === 'artist') {
      valid = await pool.request().input('id', sql.NVarChar(64), itemId).query('SELECT ArtistID AS ItemID FROM dbo.Artists WHERE ArtistID=@id');
    } else {
      valid = await pool.request().input('id', sql.NVarChar(64), itemId).input('uid', sql.NVarChar(64), req.user!.id)
        .query('SELECT PlaylistID AS ItemID FROM dbo.Playlists WHERE PlaylistID=@id AND (IsPublic=1 OR UserID=@uid)');
    }
    if (!valid.recordset.length) return fail(res, 404, 'Không tìm thấy nội dung cần lưu hoặc bạn không có quyền truy cập.');
    const r = await pool.request().input('uid', sql.NVarChar(64), req.user!.id).input('type', sql.NVarChar(16), itemType).input('item', sql.NVarChar(64), itemId)
      .query(`IF EXISTS(SELECT 1 FROM dbo.UserLibrary WHERE UserID=@uid AND ItemType=@type AND ItemID=@item) BEGIN DELETE dbo.UserLibrary WHERE UserID=@uid AND ItemType=@type AND ItemID=@item; SELECT CAST(0 AS bit) AS saved END ELSE BEGIN INSERT dbo.UserLibrary(UserID,ItemType,ItemID) VALUES(@uid,@type,@item); SELECT CAST(1 AS bit) AS saved END`);
    res.json({ success: true, saved: !!r.recordset[0].saved });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể cập nhật thư viện.'); }
});
app.post(`${API}/playlists`, auth(), async (req: AuthRequest, res) => {
  const title = String(req.body?.title || '').trim(), description = String(req.body?.description || 'Playlist được tạo trên Aureon.').trim();
  if (!title || title.length > 256) return fail(res, 400, 'Tên playlist là bắt buộc và tối đa 256 ký tự.');
  try {
    const playlistId = id('pl');
    await pool.request().input('id', sql.NVarChar(64), playlistId).input('title', sql.NVarChar(256), title).input('desc', sql.NVarChar(sql.MAX), description)
      .input('cover', sql.NVarChar(1024), coverFallback).input('uid', sql.NVarChar(64), req.user!.id)
      .query("INSERT dbo.Playlists(PlaylistID,Title,Description,CoverUrl,UserID,IsPublic,Tag) VALUES(@id,@title,@desc,@cover,@uid,1,'custom')");
    res.status(201).json({ success: true, data: { id: playlistId, title, description, coverUrl: coverFallback, songs: [], trackCount: 0, duration: '0 phút', isCustom: true, createdBy: req.user!.id, tag: 'custom' } });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể tạo playlist.'); }
});
app.post(`${API}/playlists/:id/songs`, auth(), async (req: AuthRequest, res) => {
  const songId = String(req.body?.songId || ''), playlistId = req.params.id;
  if (!songId) return fail(res, 400, 'songId là bắt buộc.');
  try {
    const p = await pool.request().input('pid', sql.NVarChar(64), playlistId).input('uid', sql.NVarChar(64), req.user!.id).query('SELECT PlaylistID FROM dbo.Playlists WHERE PlaylistID=@pid AND UserID=@uid');
    if (!p.recordset.length) return fail(res, 404, 'Không tìm thấy playlist của bạn.');
    const s = await pool.request().input('sid', sql.NVarChar(64), songId).query('SELECT SongID FROM dbo.Songs WHERE SongID=@sid AND IsActive=1');
    if (!s.recordset.length) return fail(res, 404, 'Không tìm thấy bài hát.');
    await pool.request().input('pid', sql.NVarChar(64), playlistId).input('sid', sql.NVarChar(64), songId)
      .query('IF NOT EXISTS(SELECT 1 FROM dbo.PlaylistSongs WHERE PlaylistID=@pid AND SongID=@sid) INSERT dbo.PlaylistSongs(PlaylistID,SongID,OrderIndex) SELECT @pid,@sid,ISNULL(MAX(OrderIndex),-1)+1 FROM dbo.PlaylistSongs WHERE PlaylistID=@pid');
    const playlist = (await getCatalog(req.user!.id)).playlists.find((x: any) => x.id === playlistId);
    res.json({ success: true, data: playlist });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể thêm bài hát vào playlist.'); }
});
app.delete(`${API}/playlists/:id/songs/:songId`, auth(), async (req: AuthRequest, res) => {
  try {
    const result = await pool.request()
      .input('pid', sql.NVarChar(64), req.params.id)
      .input('sid', sql.NVarChar(64), req.params.songId)
      .input('uid', sql.NVarChar(64), req.user!.id)
      .query(`DELETE ps FROM dbo.PlaylistSongs ps
        INNER JOIN dbo.Playlists p ON p.PlaylistID=ps.PlaylistID
        WHERE ps.PlaylistID=@pid AND ps.SongID=@sid AND p.UserID=@uid;
        SELECT @@ROWCOUNT AS affected;`);
    if (!result.recordset[0]?.affected) return fail(res, 404, 'Không tìm thấy bài hát trong playlist của bạn.');
    const playlist = (await getCatalog(req.user!.id)).playlists.find((item: any) => item.id === req.params.id);
    res.json({ success: true, data: playlist });
  } catch (e) { console.error('DELETE playlist song failed', e); fail(res, 500, 'Không thể xóa bài hát khỏi playlist.'); }
});

app.delete(`${API}/playlists/:id`, auth(), async (req: AuthRequest, res) => {
  try {
    const result = await pool.request()
      .input('pid', sql.NVarChar(64), req.params.id)
      .input('uid', sql.NVarChar(64), req.user!.id)
      .query('DELETE FROM dbo.Playlists WHERE PlaylistID=@pid AND UserID=@uid; SELECT @@ROWCOUNT AS affected;');
    if (!result.recordset[0]?.affected) return fail(res, 404, 'Không tìm thấy playlist của bạn.');
    res.json({ success: true, deleted: true, id: req.params.id });
  } catch (e) { console.error('DELETE playlist failed', e); fail(res, 500, 'Không thể xóa playlist.'); }
});

app.get(`${API}/users/me/queue`, auth(), async (req: AuthRequest, res) => {
  try {
    const saved = await pool.request().input('uid', sql.NVarChar(64), req.user!.id)
      .query('SELECT SongID, Position FROM dbo.PlayQueue WHERE UserID=@uid ORDER BY Position');
    const catalog = await getCatalog(req.user!.id);
    const songsById = new Map(catalog.songs.map((song: any) => [song.id, song]));
    const songs = saved.recordset.map((row: any) => songsById.get(row.SongID)).filter(Boolean);
    res.json({ success: true, songIds: saved.recordset.map((row: any) => row.SongID), data: songs });
  } catch (e) { console.error('GET queue failed', e); fail(res, 500, 'Không thể tải hàng đợi phát.'); }
});

app.put(`${API}/users/me/queue`, auth(), async (req: AuthRequest, res) => {
  const rawIds = req.body?.songIds;
  if (!Array.isArray(rawIds) || rawIds.length > 500 || rawIds.some((value: unknown) => typeof value !== 'string' || !value.trim() || value.length > 64)) {
    return fail(res, 400, 'songIds phải là danh sách tối đa 500 ID bài hát hợp lệ.');
  }
  const songIds = rawIds.map((value: string) => value.trim());
  try {
    if (songIds.length) {
      const checkRequest = pool.request();
      const uniqueIds = [...new Set(songIds)];
      const params = uniqueIds.map((songId, index) => {
        const key = `song${index}`;
        checkRequest.input(key, sql.NVarChar(64), songId);
        return `@${key}`;
      });
      const valid = await checkRequest.query(`SELECT SongID FROM dbo.Songs WHERE IsActive=1 AND SongID IN (${params.join(',')})`);
      if (valid.recordset.length !== uniqueIds.length) return fail(res, 400, 'Hàng đợi chứa ID bài hát không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction).input('uid', sql.NVarChar(64), req.user!.id)
        .query('DELETE FROM dbo.PlayQueue WHERE UserID=@uid');
      for (let position = 0; position < songIds.length; position++) {
        await new sql.Request(transaction)
          .input('uid', sql.NVarChar(64), req.user!.id)
          .input('sid', sql.NVarChar(64), songIds[position])
          .input('position', sql.Int, position)
          .query('INSERT dbo.PlayQueue(UserID,SongID,Position) VALUES(@uid,@sid,@position)');
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    res.json({ success: true, count: songIds.length, songIds });
  } catch (e) { console.error('PUT queue failed', e); fail(res, 500, 'Không thể lưu hàng đợi phát.'); }
});

app.post(`${API}/users/me/history`, auth(), async (req: AuthRequest, res) => {
  const songId = String(req.body?.songId || '');
  const durationListenedSeconds = Math.min(86400, Math.max(0, Number.parseInt(String(req.body?.durationListenedSeconds || '0'), 10) || 0));
  if (!songId) return fail(res, 400, 'songId là bắt buộc.');
  try {
    const result = await pool.request().input('uid', sql.NVarChar(64), req.user!.id).input('sid', sql.NVarChar(64), songId)
      .input('duration', sql.Int, durationListenedSeconds)
      .query(`IF EXISTS(SELECT 1 FROM dbo.Songs WHERE SongID=@sid AND IsActive=1)
        BEGIN
          INSERT dbo.ListeningHistory(UserID,SongID,DurationListenedSeconds) VALUES(@uid,@sid,@duration);
          UPDATE dbo.Songs SET PlayCount = PlayCount + 1 WHERE SongID=@sid;
          SELECT CAST(1 AS bit) AS saved;
        END
        ELSE SELECT CAST(0 AS bit) AS saved;`);
    if (!result.recordset[0]?.saved) return fail(res, 404, 'Không tìm thấy bài hát.');
    res.json({ success: true });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể lưu lịch sử nghe.'); }
});
app.get(`${API}/users/me/history`, auth(), async (req: AuthRequest, res) => {
  try {
    const r = await pool.request().input('uid', sql.NVarChar(64), req.user!.id).query(`SELECT TOP 30 h.PlayedAt,h.DurationListenedSeconds,s.SongID FROM dbo.ListeningHistory h JOIN dbo.Songs s ON s.SongID=h.SongID WHERE h.UserID=@uid ORDER BY h.PlayedAt DESC`);
    const catalog = await getCatalog(req.user!.id);
    res.json({ success: true, history: r.recordset.map((x: any) => ({ song: catalog.songs.find((s: any) => s.id === x.SongID), playedAt: new Date(x.PlayedAt).toISOString(), durationListenedSeconds: x.DurationListenedSeconds || 0 })).filter((x: any) => x.song) });
  } catch (e) { console.error(e); fail(res, 500, 'Không thể tải lịch sử nghe.'); }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api error]', err);
  if (res.headersSent) return;
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: 'JSON gửi lên không hợp lệ.' });
    return;
  }
  res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
});

async function startServer() {
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log(`[database] Connected to SQL Server database "${dbConfig.database}".`);
    await seedCatalog();
  } catch (e) {
    console.error('[database] Cannot connect to SQL Server. Check .env and run db/schema.sql first.', e);
    process.exit(1);
  }
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
  }
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`Aureon running at http://localhost:${PORT}`));
  const shutdown = async () => { server.close(); if (pool) await pool.close(); process.exit(0); };
  process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
}
startServer();
