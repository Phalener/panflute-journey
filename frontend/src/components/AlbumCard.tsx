import { Link } from "react-router-dom";
import { mediaUrl } from "../services/api";
import { Album } from "../types";
import { usePlayer } from "../context/PlayerContext";
import { PlayIcon } from "./icons";

export function AlbumCard({ album }: { album: Album }) {
  const { playAlbumFrom } = usePlayer();

  function handlePlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (album.tracks && album.tracks.length > 0) {
      playAlbumFrom(album, album.tracks[0]);
    }
  }

  const coverSrc = album.coverUrl ? mediaUrl(album.coverUrl) : "/assets/panflute-cd-sample.jpg";

  return (
    <Link to={`/albums/${album.id}`} className="album-card jewel-case-wrap">
      {/* Authentic CD Jewel Case */}
      <div className="jewel-case">
        {/* Spine hinge on the left */}
        <div className="jewel-case__spine" aria-hidden="true">
          <div className="jewel-case__spine-ridge"></div>
          <div className="jewel-case__spine-ridge"></div>
          <div className="jewel-case__spine-ridge"></div>
        </div>

        {/* Cover artwork container */}
        <div className="jewel-case__tray">
          <img
            src={coverSrc}
            alt={`${album.title} cover art`}
            className="jewel-case__cover-img"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/assets/panflute-cd-sample.jpg";
            }}
          />

          {/* Glossy specular glass reflection */}
          <div className="jewel-case__gloss" aria-hidden="true" />

          {/* Compact Disc Digital Audio emblem */}
          <div className="jewel-case__cd-badge" aria-hidden="true">
            <span className="cd-badge__text">COMPACT</span>
            <span className="cd-badge__disc">disc</span>
            <span className="cd-badge__sub">DIGITAL AUDIO</span>
          </div>

          {/* Play button */}
          {album.tracks && album.tracks.length > 0 && (
            <button
              className="jewel-case__play-btn"
              onClick={handlePlay}
              aria-label={`Play ${album.title}`}
            >
              <PlayIcon size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="album-card__info">
        <h3 className="album-card__title">{album.title}</h3>
        <p className="album-card__meta">
          <span className="album-card__tracks-count">
            {album.trackCount ?? album.tracks?.length ?? 0} Audio Tracks
          </span>
          {album.year ? (
            <span className="album-card__year"> · {album.year}</span>
          ) : (
            <span className="album-card__year"> · Stereo CD</span>
          )}
        </p>
      </div>
    </Link>
  );
}
