-- ==============================================================================
-- PROJECT AUREON: Microsoft SQL Server Database Schema (Transact-SQL)
-- Modern Music Streaming Platform Database Definition & Seed Script
-- ==============================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AureonMusicDB')
BEGIN
    CREATE DATABASE AureonMusicDB;
END
GO

USE AureonMusicDB;
GO

-- 1. Users Table
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserID NVARCHAR(64) NOT NULL PRIMARY KEY,
        Email NVARCHAR(256) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(512) NOT NULL,
        DisplayName NVARCHAR(128) NOT NULL,
        AvatarUrl NVARCHAR(1024) NULL,
        IsPremium BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE NONCLUSTERED INDEX IX_Users_Email ON dbo.Users(Email);
END
GO

-- 2. Genres Table
IF OBJECT_ID(N'dbo.Genres', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Genres (
        GenreID NVARCHAR(32) NOT NULL PRIMARY KEY,
        Name NVARCHAR(64) NOT NULL UNIQUE,
        Description NVARCHAR(256) NULL,
        ColorCode NVARCHAR(32) NULL
    );
END
GO

-- 3. Artists Table
IF OBJECT_ID(N'dbo.Artists', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Artists (
        ArtistID NVARCHAR(64) NOT NULL PRIMARY KEY,
        Name NVARCHAR(128) NOT NULL,
        AvatarUrl NVARCHAR(1024) NOT NULL,
        BannerUrl NVARCHAR(1024) NULL,
        Bio NVARCHAR(MAX) NULL,
        MonthlyListeners BIGINT NOT NULL DEFAULT 0,
        FollowersCount INT NOT NULL DEFAULT 0,
        IsVerified BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE NONCLUSTERED INDEX IX_Artists_Name ON dbo.Artists(Name);
END
GO

-- 4. Albums Table
IF OBJECT_ID(N'dbo.Albums', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Albums (
        AlbumID NVARCHAR(64) NOT NULL PRIMARY KEY,
        Title NVARCHAR(256) NOT NULL,
        ArtistID NVARCHAR(64) NOT NULL,
        CoverUrl NVARCHAR(1024) NOT NULL,
        ReleaseYear INT NOT NULL,
        GenreID NVARCHAR(32) NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Albums_Artists FOREIGN KEY (ArtistID) REFERENCES dbo.Artists(ArtistID) ON DELETE CASCADE,
        CONSTRAINT FK_Albums_Genres FOREIGN KEY (GenreID) REFERENCES dbo.Genres(GenreID) ON DELETE SET NULL
    );
    CREATE NONCLUSTERED INDEX IX_Albums_ArtistID ON dbo.Albums(ArtistID);
    CREATE NONCLUSTERED INDEX IX_Albums_Title ON dbo.Albums(Title);
END
GO

-- 5. Songs Table
IF OBJECT_ID(N'dbo.Songs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Songs (
        SongID NVARCHAR(64) NOT NULL PRIMARY KEY,
        Title NVARCHAR(256) NOT NULL,
        ArtistID NVARCHAR(64) NOT NULL,
        AlbumID NVARCHAR(64) NULL,
        GenreID NVARCHAR(32) NULL,
        DurationSeconds INT NOT NULL,
        AudioUrl NVARCHAR(1024) NOT NULL,
        CoverUrl NVARCHAR(1024) NOT NULL,
        PlayCount BIGINT NOT NULL DEFAULT 0,
        ReleaseDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        Lyrics NVARCHAR(MAX) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Songs_Artists FOREIGN KEY (ArtistID) REFERENCES dbo.Artists(ArtistID),
        CONSTRAINT FK_Songs_Albums FOREIGN KEY (AlbumID) REFERENCES dbo.Albums(AlbumID) ON DELETE SET NULL,
        CONSTRAINT FK_Songs_Genres FOREIGN KEY (GenreID) REFERENCES dbo.Genres(GenreID) ON DELETE SET NULL
    );
    CREATE NONCLUSTERED INDEX IX_Songs_Title ON dbo.Songs(Title);
    CREATE NONCLUSTERED INDEX IX_Songs_ArtistID ON dbo.Songs(ArtistID);
    CREATE NONCLUSTERED INDEX IX_Songs_AlbumID ON dbo.Songs(AlbumID);
    CREATE NONCLUSTERED INDEX IX_Songs_PlayCount ON dbo.Songs(PlayCount DESC);
END
GO

-- 6. Playlists Table
IF OBJECT_ID(N'dbo.Playlists', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Playlists (
        PlaylistID NVARCHAR(64) NOT NULL PRIMARY KEY,
        Title NVARCHAR(256) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        CoverUrl NVARCHAR(1024) NULL,
        UserID NVARCHAR(64) NULL, -- NULL indicates editorial/system playlist
        IsPublic BIT NOT NULL DEFAULT 1,
        FollowersCount INT NOT NULL DEFAULT 0,
        GradientFrom NVARCHAR(32) NULL,
        GradientTo NVARCHAR(32) NULL,
        Tag NVARCHAR(32) NULL, -- 'chart', 'made-for-you', 'custom'
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Playlists_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE SET NULL
    );
    CREATE NONCLUSTERED INDEX IX_Playlists_UserID ON dbo.Playlists(UserID);
END
GO

-- 7. PlaylistSongs (Many-to-Many junction)
IF OBJECT_ID(N'dbo.PlaylistSongs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlaylistSongs (
        PlaylistID NVARCHAR(64) NOT NULL,
        SongID NVARCHAR(64) NOT NULL,
        OrderIndex INT NOT NULL DEFAULT 0,
        AddedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_PlaylistSongs PRIMARY KEY (PlaylistID, SongID),
        CONSTRAINT FK_PlaylistSongs_Playlists FOREIGN KEY (PlaylistID) REFERENCES dbo.Playlists(PlaylistID) ON DELETE CASCADE,
        CONSTRAINT FK_PlaylistSongs_Songs FOREIGN KEY (SongID) REFERENCES dbo.Songs(SongID) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX IX_PlaylistSongs_Order ON dbo.PlaylistSongs(PlaylistID, OrderIndex);
END
GO

-- 8. Favorites (Liked Songs)
IF OBJECT_ID(N'dbo.Favorites', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Favorites (
        UserID NVARCHAR(64) NOT NULL,
        SongID NVARCHAR(64) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Favorites PRIMARY KEY (UserID, SongID),
        CONSTRAINT FK_Favorites_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        CONSTRAINT FK_Favorites_Songs FOREIGN KEY (SongID) REFERENCES dbo.Songs(SongID) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX IX_Favorites_User ON dbo.Favorites(UserID, CreatedAt DESC);
END
GO

-- 9. UserLibrary (Saved Albums & Playlists & Followed Artists)
IF OBJECT_ID(N'dbo.UserLibrary', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserLibrary (
        LibraryEntryID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID NVARCHAR(64) NOT NULL,
        ItemType NVARCHAR(16) NOT NULL, -- 'album', 'artist', 'playlist'
        ItemID NVARCHAR(64) NOT NULL,
        SavedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_UserLibrary_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
    );
    CREATE UNIQUE NONCLUSTERED INDEX UQ_UserLibrary_Entry ON dbo.UserLibrary(UserID, ItemType, ItemID);
END
GO

-- 10. ListeningHistory
IF OBJECT_ID(N'dbo.ListeningHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ListeningHistory (
        HistoryID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID NVARCHAR(64) NOT NULL,
        SongID NVARCHAR(64) NOT NULL,
        PlayedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        DurationListenedSeconds INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_ListeningHistory_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        CONSTRAINT FK_ListeningHistory_Songs FOREIGN KEY (SongID) REFERENCES dbo.Songs(SongID) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX IX_ListeningHistory_User ON dbo.ListeningHistory(UserID, PlayedAt DESC);
END
GO

-- 11. PlayQueue
IF OBJECT_ID(N'dbo.PlayQueue', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlayQueue (
        UserID NVARCHAR(64) NOT NULL,
        SongID NVARCHAR(64) NOT NULL,
        Position INT NOT NULL,
        AddedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_PlayQueue PRIMARY KEY (UserID, SongID, Position),
        CONSTRAINT FK_PlayQueue_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        CONSTRAINT FK_PlayQueue_Songs FOREIGN KEY (SongID) REFERENCES dbo.Songs(SongID) ON DELETE CASCADE
    );
END
GO

PRINT N'AureonMusicDB MS SQL Server schema created successfully.';

SELECT * FROM dbo.Artists;
SELECT * FROM dbo.Albums;
SELECT * FROM dbo.Songs;
