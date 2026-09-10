import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function Header() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    navigate(query.trim() ? `/?search=${encodeURIComponent(query.trim())}` : "/");
  }

  return (
    <header className="site-header">
      {/* Early 2000s nostalgic ticker */}
      <div className="retro-ticker">
        <div className="retro-ticker__track">
          <span>✦ ♫ SACRED SOUNDS OF THE ANDES • ORIGINAL MASTER RECORDINGS • HIGH FIDELITY STEREO • VINTAGE PANPIPES DIGITAL ARCHIVE ♫ ✦</span>
          <span>✦ ♫ SACRED SOUNDS OF THE ANDES • ORIGINAL MASTER RECORDINGS • HIGH FIDELITY STEREO • VINTAGE PANPIPES DIGITAL ARCHIVE ♫ ✦</span>
        </div>
      </div>

      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <div className="brand__emblem">
            <svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF1B8" />
                  <stop offset="40%" stopColor="#F5C453" />
                  <stop offset="75%" stopColor="#D49A24" />
                  <stop offset="100%" stopColor="#7E4F0A" />
                </linearGradient>
              </defs>
              <path
                d="M12 52 L17 16 L22 52"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 52 L27 22 L32 52"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 52 L37 28 L42 52"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M42 52 L46 34 L50 52"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="10" r="3" fill="url(#goldGrad)" />
            </svg>
          </div>
          <div className="brand__text">
            <span className="brand__name">
              PANFLUTE <em>JOURNEY</em>
            </span>
            <span className="brand__tagline">ECHOES OF THE ANDES • DIGITAL AUDIO ARCHIVE</span>
          </div>
        </Link>

        <nav className="site-nav">
          <a href="/#albums" className="nav-tab">
            <span className="nav-tab__icon">💿</span> Discography
          </a>
          <Link to="/admin/login" className="nav-tab nav-tab--admin">
            <span className="nav-tab__icon">🔑</span> Admin
          </Link>

          <form className="search-field" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search music…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search catalog"
            />
            <button type="submit" className="search-field__btn">
              GO
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
