import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlbumCard } from "../components/AlbumCard";
import { MountainRidge } from "../components/MountainRidge";
import { api, mediaUrl } from "../services/api";
import { Album } from "../types";
import { usePlayer } from "../context/PlayerContext";

export function Home() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const { currentTrack, isPlaying, playAlbumFrom, togglePlay } = usePlayer();

  useEffect(() => {
    setLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    api
      .get<{ albums: Album[] }>(`/api/albums${query}`)
      .then((data) => setAlbums(data.albums))
      .finally(() => setLoading(false));
  }, [search]);

  const totalAlbums = albums.length;
  const activeIndex = totalAlbums > 0 ? ((slideIndex % totalAlbums) + totalAlbums) % totalAlbums : 0;
  const currentAlbum = totalAlbums > 0 ? albums[activeIndex] : null;

  function handlePrev() {
    if (totalAlbums > 1) {
      setSlideIndex((prev) => (prev - 1 + totalAlbums) % totalAlbums);
    }
  }

  function handleNext() {
    if (totalAlbums > 1) {
      setSlideIndex((prev) => (prev + 1) % totalAlbums);
    }
  }

  const isCurrentPlaying = Boolean(
    currentAlbum &&
    currentTrack &&
    currentAlbum.tracks?.some((t) => t.id === currentTrack.id) &&
    isPlaying
  );

  function handlePlayCurrent() {
    if (!currentAlbum) return;
    if (isCurrentPlaying) {
      togglePlay();
    } else if (currentAlbum.tracks && currentAlbum.tracks.length > 0) {
      playAlbumFrom(currentAlbum, currentAlbum.tracks[0]);
    }
  }

  return (
    <>
      {!search && (
        <section className="hero hero--retro">
          <div className={`container hero__grid ${!currentAlbum ? "hero__grid--single" : ""}`}>
            {currentAlbum ? (
              <div className="hero__content-box">
                {/* Retro stamp with edition & position */}
                <div className="retro-stamp">
                  <span className="retro-stamp__badge">
                    {currentAlbum.year ? `${currentAlbum.year} EDITION` : "ANDES ARCHIVE"}
                  </span>
                  <span className="retro-stamp__text">
                    {currentAlbum.isFeatured ? "★ FEATURED DISC ★" : "ORIGINAL PANPIPES RECORDING"}
                  </span>
                </div>

                {/* Album Title */}
                <h1 className="hero__title">
                  <span className="accent-gold">{currentAlbum.title}</span>
                </h1>

                {/* Album Description */}
                <p className="hero__subtitle">
                  {currentAlbum.description ||
                    "Traditional Andean panflute melodies recorded in natural acoustic stereo ambience. Bamboo flutes whispering with the mountain breeze."}
                </p>

                {/* Badges */}
                <div className="hero__badges">
                  <span className="retro-pill">
                    <span className="retro-pill__dot">●</span> {currentAlbum.tracks?.length ?? 0} Audio Tracks
                  </span>
                  {currentAlbum.year && (
                    <span className="retro-pill">
                      <span className="retro-pill__dot">●</span> Year {currentAlbum.year}
                    </span>
                  )}
                  <span className="retro-pill">
                    <span className="retro-pill__dot">●</span> 24-Bit Pure Stereo
                  </span>
                </div>

                {/* Actions: Play and View Album Details */}
                <div className="hero__actions">
                  {currentAlbum.tracks && currentAlbum.tracks.length > 0 && (
                    <button onClick={handlePlayCurrent} className="btn btn--gold-glossy">
                      <span>{isCurrentPlaying ? "❚❚ Pause Album" : "▶ Play Album"}</span>
                    </button>
                  )}
                  <Link to={`/albums/${currentAlbum.id}`} className="btn btn--metal-glossy">
                    <span>💿 View CD Inlay & Tracks</span>
                  </Link>
                </div>

                {/* Carousel Navigation (when multiple albums exist) */}
                {totalAlbums > 1 && (
                  <div className="hero-slider-nav">
                    <button
                      onClick={handlePrev}
                      className="chrome-btn hero-slider-nav__btn"
                      title="Previous Album"
                      aria-label="Previous Album"
                    >
                      ❮ PREV DISC
                    </button>
                    <div className="hero-slider-indicators">
                      {albums.map((alb, idx) => (
                        <button
                          key={alb.id}
                          onClick={() => setSlideIndex(idx)}
                          className={`hero-slider-dot ${idx === activeIndex ? "is-active" : ""}`}
                          title={alb.title}
                          aria-label={`Go to ${alb.title}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleNext}
                      className="chrome-btn hero-slider-nav__btn"
                      title="Next Album"
                      aria-label="Next Album"
                    >
                      NEXT DISC ❯
                    </button>
                    <span className="hero-slider-counter">
                      DISC {String(activeIndex + 1).padStart(2, "0")} / {String(totalAlbums).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="hero__content-box">
                <div className="retro-stamp">
                  <span className="retro-stamp__badge">OFFICIAL ARCHIVE</span>
                  <span className="retro-stamp__text">DIGITAL AUDIO COLLECTION</span>
                </div>
                <h1 className="hero__title">
                  PANFLUTE <span className="accent-gold">JOURNEY</span>
                </h1>
                <p className="hero__subtitle">
                  Benvenuto nell'archivio multimediale di musica andina tradizionale. Al momento non ci sono album caricati nel catalogo. Accedi al pannello di amministrazione per caricare il tuo primo CD con copertina e tracce audio!
                </p>
                <div className="hero__actions">
                  <Link to="/admin/login" className="btn btn--gold-glossy">
                    <span>🔑 Accedi all'Admin</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Deluxe CD Showcase in Hero - displayed whenever currentAlbum exists */}
            {currentAlbum && (
              <div className="hero__showcase">
                <div className="deluxe-cd-frame">
                  <div className="deluxe-cd-frame__top-bar">
                    <span className="deluxe-cd-frame__indicator"></span>
                    <span className="deluxe-cd-frame__title">
                      {currentAlbum.title}
                    </span>
                  </div>

                  <div className="deluxe-cd-preview">
                    {/* CD Disc peeking behind cover */}
                    <div className="cd-disc-peek" aria-hidden="true">
                      <div className="cd-disc-inner">
                        <div className="cd-disc-hole"></div>
                      </div>
                    </div>

                    {/* CD Jewel Cover */}
                    <div className="jewel-case deluxe-jewel">
                      <div className="jewel-case__spine">
                        <div className="jewel-case__spine-ridge"></div>
                        <div className="jewel-case__spine-ridge"></div>
                        <div className="jewel-case__spine-ridge"></div>
                      </div>
                      <div className="jewel-case__tray">
                        <img
                          src={
                            currentAlbum.coverUrl
                              ? mediaUrl(currentAlbum.coverUrl)
                              : "/assets/panflute-cd-sample.jpg"
                          }
                          alt={`${currentAlbum.title} cover`}
                          className="jewel-case__cover-img"
                        />
                        <div className="jewel-case__gloss"></div>
                        <div className="jewel-case__cd-badge">
                          <span className="cd-badge__text">COMPACT</span>
                          <span className="cd-badge__disc">disc</span>
                          <span className="cd-badge__sub">DIGITAL AUDIO</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="deluxe-cd-caption">
                    <p>
                      {currentAlbum.isFeatured ? "Featured Release" : "Collection Release"} · {currentAlbum.tracks?.length ?? 0} Tracks{currentAlbum.year ? ` · ${currentAlbum.year}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <MountainRidge />
        </section>
      )}

      <div className="container">
        {!search && (
          <section className="retro-banner-strip">
            <div className="retro-banner-strip__inner">
              <span className="retro-banner-strip__icon">✦</span>
              <p className="retro-banner-strip__text">
                SACRED TRADITION • THE FLIGHT OF THE CONDOR • ANCIENT INCAN MELODIES • MASTER SOUND ARCHIVE
              </p>
              <span className="retro-banner-strip__icon">✦</span>
            </div>
          </section>
        )}

        <section id="albums" className="catalog-section">
          <div className="section-head retro-section-head">
            <div className="section-head__title-wrap">
              <span className="retro-kicker">DIGITAL AUDIO RECORDINGS</span>
              <h2>{search ? `Search Results: “${search}”` : "CD Discography & Albums"}</h2>
            </div>
            {!loading && (
              <div className="retro-count-box">
                <span className="retro-count-label">CATALOG COUNT</span>
                <span className="retro-count-num">
                  {String(albums.length).padStart(2, "0")} DISCS
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-state retro-panel">
              <div className="retro-spinner"></div>
              <p>ACCESSING AUDIO DATABASE… PLEASE WAIT</p>
            </div>
          ) : albums.length === 0 ? (
            <div className="empty-state retro-panel">
              <div className="empty-state__icon">💿</div>
              <h3>NO ALBUMS FOUND IN ARCHIVE</h3>
              <p>
                {search
                  ? `No releases match “${search}”. Try another keyword.`
                  : "No albums have been published yet in this edition. Visit the Admin Portal to upload your first CD!"}
              </p>
            </div>
          ) : (
            <div className="album-grid">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
