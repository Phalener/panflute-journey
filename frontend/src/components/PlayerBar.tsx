import { useState } from "react";
import { Link } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import { mediaUrl } from "../services/api";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, VolumeIcon } from "./icons";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const {
    currentTrack,
    currentAlbum,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
  } = usePlayer();

  const [showLyricsWindow, setShowLyricsWindow] = useState(false);

  if (!currentTrack) return null;

  const coverSrc = currentAlbum?.coverUrl
    ? mediaUrl(currentAlbum.coverUrl)
    : "/assets/panflute-cd-sample.jpg";

  return (
    <div className="player-bar winamp-player" role="region" aria-label="Music player">
      {/* Winamp Docked Lyrics Window */}
      {showLyricsWindow && (
        <div className="winamp-lyrics-dock" role="dialog" aria-label="Lyrics window">
          <div className="winamp-lyrics-dock__header">
            <span className="winamp-lyrics-dock__title">
              ♫ WINAMP LYRICS • {currentTrack.title}
            </span>
            <button
              type="button"
              className="winamp-lyrics-dock__close"
              onClick={() => setShowLyricsWindow(false)}
              aria-label="Close lyrics"
            >
              ✕
            </button>
          </div>
          <div className="winamp-lyrics-dock__body">
            {currentTrack.lyrics ? (
              <pre className="winamp-lyrics-dock__text">{currentTrack.lyrics}</pre>
            ) : (
              <p className="winamp-lyrics-dock__empty">No lyrics recorded for this song.</p>
            )}
          </div>
        </div>
      )}

      {/* Decorative top screw / rivet bar */}
      <div className="winamp-player__screws" aria-hidden="true">
        <span className="winamp-screw" />
        <span className="winamp-player__header-label">PANFLUTE MULTIMEDIA PLAYER v2.0 • HI-FI STEREO</span>
        <span className="winamp-screw" />
      </div>

      <div className="player-bar__inner">
        {/* Track info & mini CD jewel */}
        <div className="player-bar__track">
          <div className="player-bar__mini-jewel">
            <img src={coverSrc} alt="" />
            <div className="player-bar__mini-jewel-gloss" />
          </div>
          <div className="player-bar__titles">
            <div className="player-bar__title" title={currentTrack.title}>
              {currentTrack.title}
            </div>
            {currentAlbum && (
              <Link to={`/albums/${currentAlbum.id}`} className="player-bar__album">
                💿 {currentAlbum.title}
              </Link>
            )}
          </div>
        </div>

        {/* Center: Winamp style green/cyan LCD display + chrome controls */}
        <div className="player-bar__center">
          {/* LCD Screen */}
          <div className="winamp-lcd">
            {/* Visualizer bars */}
            <div className={`winamp-visualizer ${isPlaying ? "is-playing" : ""}`} aria-hidden="true">
              <span className="eq-bar bar-1" />
              <span className="eq-bar bar-2" />
              <span className="eq-bar bar-3" />
              <span className="eq-bar bar-4" />
              <span className="eq-bar bar-5" />
              <span className="eq-bar bar-6" />
              <span className="eq-bar bar-7" />
            </div>

            {/* Time readout */}
            <div className="winamp-lcd__time">
              <span className="winamp-status-lamp">{isPlaying ? "► PLAY" : "❚❚ PAUSE"}</span>
              <span className="winamp-digits">
                {formatTime(currentTime)} <span className="winamp-sep">/</span> {formatTime(duration)}
              </span>
            </div>

            {/* Scrolling track readout */}
            <div className="winamp-lcd__marquee">
              <span className="winamp-marquee-text">
                NOW PLAYING: {currentTrack.title} — {currentAlbum?.title ?? "Panflute Journey"} • 256kbps 44.1kHz STEREO
              </span>
            </div>
          </div>

          {/* Controls & seek */}
          <div className="winamp-controls-row">
            <div className="player-bar__controls">
              <button
                className="chrome-btn player-bar__control-btn"
                onClick={playPrevious}
                aria-label="Previous track"
                title="Previous (Z)"
              >
                <PrevIcon size={14} />
              </button>
              <button
                className="chrome-btn chrome-btn--play player-bar__play"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause (C)" : "Play (X)"}
              >
                {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              </button>
              <button
                className="chrome-btn player-bar__control-btn"
                onClick={playNext}
                aria-label="Next track"
                title="Next (B)"
              >
                <NextIcon size={14} />
              </button>
            </div>

            <div className="player-bar__seek">
              <span className="player-bar__time">{formatTime(currentTime)}</span>
              <input
                className="player-bar__range retro-slider"
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Seek"
              />
              <span className="player-bar__time player-bar__time--end">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Volume section with retro level meter */}
        <div className="player-bar__volume">
          <VolumeIcon size={16} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="retro-slider retro-slider--volume"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="winamp-vol-text">{Math.round(volume * 100)}%</span>

          {currentTrack.lyrics && (
            <button
              type="button"
              className={`winamp-lyrics-btn ${showLyricsWindow ? "is-active" : ""}`}
              onClick={() => setShowLyricsWindow(!showLyricsWindow)}
              title={showLyricsWindow ? "Hide lyrics" : "Show lyrics"}
            >
              📜 LYRICS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
