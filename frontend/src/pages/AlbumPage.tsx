import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import { api, mediaUrl } from "../services/api";
import { Album, Track } from "../types";
import { PauseIcon, PlayIcon } from "../components/icons";

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTotalDuration(totalSeconds: number): string {
  const mins = Math.round(totalSeconds / 60);
  return `${mins} MIN`;
}

export function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<number, number>>({});
  const { currentTrack, isPlaying, playAlbumFrom, togglePlay } = usePlayer();

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ album: Album }>(`/api/albums/${id}`)
      .then((data) => setAlbum(data.album))
      .catch(() => setError("This album could not be found in the catalog."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDurationLoaded = (trackId: number, sec: number) => {
    setDurations((prev) => (prev[trackId] === sec ? prev : { ...prev, [trackId]: sec }));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state retro-panel">
          <div className="retro-spinner"></div>
          <p>Loading album… please wait</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="container">
        <div className="error-state retro-panel">
          <h3>Album Error</h3>
          <p>{error ?? "Album could not be found."}</p>
          <Link to="/" className="btn btn--gold-glossy" style={{ marginTop: "18px", display: "inline-block" }}>
            ← Return to Discography
          </Link>
        </div>
      </div>
    );
  }

  const tracks = album.tracks ?? [];
  const totalDuration = tracks.reduce(
    (sum, t) => sum + (durations[t.id] ?? t.durationSeconds ?? 0),
    0
  );
  const coverSrc = album.coverUrl ? mediaUrl(album.coverUrl) : "/assets/panflute-cd-sample.jpg";

  function handleTrackClick(track: Track) {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playAlbumFrom(album!, track);
    }
  }

  const isCurrentAlbumPlaying =
    currentTrack && tracks.some((t) => t.id === currentTrack.id) && isPlaying;

  return (
    <div className="container">
      {/* Breadcrumb navigation */}
      <div className="retro-breadcrumb">
        <Link to="/">Discography</Link>
        <span>&gt;</span>
        <span className="retro-breadcrumb__current">{album.title}</span>
      </div>

      <div className="album-detail-box retro-panel">
        <div className="album-hero">
          {/* Jewel case showcase */}
          <div className="album-hero__jewel-wrap">
            <div className="jewel-case album-hero__jewel">
              <div className="jewel-case__spine">
                <div className="jewel-case__spine-ridge"></div>
                <div className="jewel-case__spine-ridge"></div>
                <div className="jewel-case__spine-ridge"></div>
              </div>
              <div className="jewel-case__tray">
                <img
                  src={coverSrc}
                  alt={`${album.title} cover art`}
                  className="jewel-case__cover-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/panflute-cd-sample.jpg";
                  }}
                />
                <div className="jewel-case__gloss"></div>
              </div>
            </div>
          </div>

          <div className="album-hero__info">
            <div className="retro-stamp">
              <span className="retro-stamp__badge">ALBUM</span>
              <span className="retro-stamp__text">{album.year ? `${album.year}` : "RELEASE"}</span>
            </div>

            <h1 className="album-hero__title">{album.title}</h1>

            {album.description && (
              <p className="album-hero__desc">{album.description}</p>
            )}

            <div className="album-specs-grid">
              <div className="spec-card">
                <span className="spec-label">TOTAL TRACKS</span>
                <span className="spec-value">{tracks.length}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">RUNNING TIME</span>
                <span className="spec-value">
                  {totalDuration > 0 ? formatTotalDuration(totalDuration) : "FULL LENGTH"}
                </span>
              </div>
              <div className="spec-card">
                <span className="spec-label">RELEASE YEAR</span>
                <span className="spec-value">{album.year ? album.year : "CLASSIC"}</span>
              </div>
            </div>

            {tracks.length > 0 && (
              <div className="album-hero__actions">
                <button
                  className="btn btn--gold-glossy"
                  onClick={() =>
                    currentTrack && tracks.some((t) => t.id === currentTrack.id)
                      ? togglePlay()
                      : playAlbumFrom(album, tracks[0])
                  }
                >
                  {isCurrentAlbumPlaying ? (
                    <>
                      <PauseIcon size={16} /> ❚❚ Pause Album
                    </>
                  ) : (
                    <>
                      <PlayIcon size={16} /> ▶ Play Full Album
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tracklist Box */}
        <div className="cd-inlay-tray">
          <div className="cd-inlay-tray__header">
            <h3>Tracklist</h3>
            <span className="cd-inlay-tray__subtitle">
              {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            </span>
          </div>

          {tracks.length === 0 ? (
            <div className="empty-state">This album doesn't have any tracks yet.</div>
          ) : (
            <ol className="tracklist retro-tracklist">
              {tracks.map((track, index) => {
                const isActive = currentTrack?.id === track.id;
                return (
                  <TrackRowItem
                    key={track.id}
                    track={track}
                    index={index}
                    isActive={isActive}
                    isPlaying={isPlaying}
                    onClick={() => handleTrackClick(track)}
                    onDurationLoaded={handleDurationLoaded}
                  />
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackRowItem({
  track,
  index,
  isActive,
  isPlaying,
  onClick,
  onDurationLoaded,
}: {
  track: Track;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onDurationLoaded: (trackId: number, duration: number) => void;
}) {
  const [duration, setDuration] = useState<number | null>(track.durationSeconds ?? null);
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    if (track.durationSeconds && track.durationSeconds > 0) {
      setDuration(track.durationSeconds);
      onDurationLoaded(track.id, track.durationSeconds);
      return;
    }

    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = mediaUrl(track.url);

    const onLoaded = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        const sec = Math.round(audio.duration);
        setDuration(sec);
        onDurationLoaded(track.id, sec);
      }
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.src = "";
    };
  }, [track.url, track.durationSeconds, track.id]);

  return (
    <li className={`track-row retro-track-row ${isActive ? "is-active" : ""}`}>
      <button
        className="track-row__button"
        onClick={onClick}
        title={`Play ${track.title}`}
      >
        <span className="track-row__index">
          {isActive && isPlaying ? (
            <span className="track-row__playing-indicator">►</span>
          ) : (
            String(index + 1).padStart(2, "0")
          )}
        </span>
        <span className="track-row__title">
          {track.title}
          {isActive && isPlaying && (
            <span className="track-row__now-tag">NOW PLAYING</span>
          )}
        </span>
        <span className="track-row__leader" aria-hidden="true" />

        {track.lyrics && (
          <span
            className={`track-row__lyrics-pill ${showLyrics ? "is-active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowLyrics(!showLyrics);
            }}
            title={showLyrics ? "Hide lyrics" : "Show lyrics"}
            role="button"
            tabIndex={0}
          >
            📜 Lyrics
          </span>
        )}

        <span className="track-row__duration">
          {formatDuration(duration)}
        </span>
      </button>

      {showLyrics && track.lyrics && (
        <div className="track-row__lyrics-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="lyrics-drawer__header">
            <span className="lyrics-drawer__title">
              📜 <em>{track.title}</em> — Lyrics
            </span>
            <button
              type="button"
              className="lyrics-drawer__close"
              onClick={() => setShowLyrics(false)}
            >
              ✕ Close
            </button>
          </div>
          <div className="lyrics-drawer__body">
            <pre className="lyrics-pre">{track.lyrics}</pre>
          </div>
        </div>
      )}
    </li>
  );
}
