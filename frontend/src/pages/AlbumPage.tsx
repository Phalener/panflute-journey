import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import { api, mediaUrl } from "../services/api";
import { Album } from "../types";
import { PauseIcon, PlayIcon } from "../components/icons";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state retro-panel">
          <div className="retro-spinner"></div>
          <p>LOADING COMPACT DISC DATA… PLEASE WAIT</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="container">
        <div className="error-state retro-panel">
          <h3>DISC ERROR</h3>
          <p>{error ?? "Compact disc could not be found."}</p>
          <Link to="/" className="btn btn--gold-glossy" style={{ marginTop: "18px", display: "inline-block" }}>
            ← Return to CD Catalog
          </Link>
        </div>
      </div>
    );
  }

  const tracks = album.tracks ?? [];
  const totalDuration = tracks.reduce((sum, t) => sum + (t.durationSeconds ?? 0), 0);
  const coverSrc = album.coverUrl ? mediaUrl(album.coverUrl) : "/assets/panflute-cd-sample.jpg";

  function handleTrackClick(track: (typeof tracks)[number]) {
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
        <Link to="/">🏠 CD CATALOG</Link>
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
                <div className="jewel-case__cd-badge">
                  <span className="cd-badge__text">COMPACT</span>
                  <span className="cd-badge__disc">disc</span>
                  <span className="cd-badge__sub">DIGITAL AUDIO</span>
                </div>
              </div>
            </div>

            <div className="cd-audio-specs" aria-hidden="true">
              <span>● HI-FI STEREO</span>
              <span>● 44.1 kHz / 16-BIT</span>
              <span>● MASTER RECORDING</span>
            </div>
          </div>

          <div className="album-hero__info">
            <div className="retro-stamp">
              <span className="retro-stamp__badge">OFFICIAL RELEASE</span>
              <span className="retro-stamp__text">TRADITIONAL ANDEAN PANPIPES</span>
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
                <span className="spec-value">{totalDuration > 0 ? formatTotalDuration(totalDuration) : "FULL LENGTH"}</span>
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
                      <PauseIcon size={16} /> ❚❚ Pause Disc
                    </>
                  ) : (
                    <>
                      <PlayIcon size={16} /> ▶ Play Full CD
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CD Inlay Tray / Tracklist */}
        <div className="cd-inlay-tray">
          <div className="cd-inlay-tray__header">
            <h3>✦ COMPACT DISC TRACK INDEX ✦</h3>
            <span className="cd-inlay-tray__subtitle">ORIGINAL ANDEAN RECORDINGS</span>
          </div>

          {tracks.length === 0 ? (
            <div className="empty-state">This album doesn't have any tracks yet.</div>
          ) : (
            <ol className="tracklist retro-tracklist">
              {tracks.map((track, index) => {
                const isActive = currentTrack?.id === track.id;
                return (
                  <li
                    key={track.id}
                    className={`track-row retro-track-row ${isActive ? "is-active" : ""}`}
                  >
                    <button
                      className="track-row__button"
                      onClick={() => handleTrackClick(track)}
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
                      <span className="track-row__duration">
                        {formatDuration(track.durationSeconds)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="cd-inlay-tray__footer">
            <span>COMPACT DISC DIGITAL AUDIO • ALL RIGHTS OF THE PRODUCER AND OWNER OF THE WORK RESERVED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
