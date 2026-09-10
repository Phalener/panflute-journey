import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, mediaUrl } from "../services/api";
import { Album, Track } from "../types";
import { DragHandleIcon, TrashIcon, UploadIcon } from "../components/icons";

export function AdminAlbumEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [saving, setSaving] = useState(false);

  const [uploadingTracks, setUploadingTracks] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function load() {
    if (!id) return;
    setLoading(true);
    api
      .get<{ album: Album }>(`/api/admin/albums/${id}`)
      .then((data) => {
        setAlbum(data.album);
        setTitle(data.album.title);
        setDescription(data.album.description);
        setYear(data.album.year ? String(data.album.year) : "");
        setIsPublished(data.album.isPublished);
        setIsFeatured(data.album.isFeatured);
      })
      .catch(() => setError("Album not found."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!album) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const data = await api.put<{ album: Album }>(`/api/admin/albums/${album.id}`, {
        title,
        description,
        year: year || null,
        isPublished,
        isFeatured,
      });
      setAlbum((prev) => (prev ? { ...prev, ...data.album, tracks: prev.tracks } : prev));
      setSaveMessage("Changes saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !album) return;
    setUploadingCover(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const data = await api.upload<{ album: Album }>(`/api/admin/albums/${album.id}/cover`, formData);
      setAlbum((prev) => (prev ? { ...prev, coverUrl: data.album.coverUrl } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload cover.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function uploadTracks(files: FileList | File[]) {
    if (!album) return;
    const mp3Files = Array.from(files).filter((f) => f.type === "audio/mpeg" || f.name.toLowerCase().endsWith(".mp3"));
    if (mp3Files.length === 0) {
      setError("Please select MP3 files only.");
      return;
    }
    setUploadingTracks(true);
    setError(null);
    try {
      const formData = new FormData();
      mp3Files.forEach((f) => formData.append("tracks", f));
      const data = await api.upload<{ tracks: Track[] }>(`/api/admin/albums/${album.id}/tracks`, formData);
      setAlbum((prev) => (prev ? { ...prev, tracks: [...(prev.tracks ?? []), ...data.tracks] } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload tracks.");
    } finally {
      setUploadingTracks(false);
      if (trackInputRef.current) trackInputRef.current.value = "";
    }
  }

  function handleTrackFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadTracks(e.target.files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) uploadTracks(e.dataTransfer.files);
  }

  async function handleRenameTrack(track: Track, newTitle: string) {
    if (!album || newTitle.trim() === track.title || !newTitle.trim()) return;
    const data = await api.put<{ track: Track }>(`/api/admin/tracks/${track.id}`, { title: newTitle.trim() });
    setAlbum((prev) =>
      prev
        ? { ...prev, tracks: prev.tracks?.map((t) => (t.id === track.id ? data.track : t)) }
        : prev
    );
  }

  async function handleSaveLyrics(track: Track, lyrics: string | null) {
    if (!album) return;
    const data = await api.put<{ track: Track }>(`/api/admin/tracks/${track.id}`, { lyrics });
    setAlbum((prev) =>
      prev
        ? { ...prev, tracks: prev.tracks?.map((t) => (t.id === track.id ? data.track : t)) }
        : prev
    );
  }

  async function handleDeleteTrack(track: Track) {
    if (!album) return;
    if (!confirm(`Remove “${track.title}” from this album?`)) return;
    await api.delete(`/api/admin/tracks/${track.id}`);
    setAlbum((prev) => (prev ? { ...prev, tracks: prev.tracks?.filter((t) => t.id !== track.id) } : prev));
  }

  async function persistOrder(tracks: Track[]) {
    if (!album) return;
    await api.put(`/api/admin/albums/${album.id}/tracks/reorder`, {
      orderedTrackIds: tracks.map((t) => t.id),
    });
  }

  function moveTrack(index: number, direction: -1 | 1) {
    if (!album?.tracks) return;
    const tracks = [...album.tracks];
    const target = index + direction;
    if (target < 0 || target >= tracks.length) return;
    [tracks[index], tracks[target]] = [tracks[target], tracks[index]];
    setAlbum({ ...album, tracks });
    persistOrder(tracks);
  }

  async function handleDeleteAlbum() {
    if (!album) return;
    if (!confirm(`Delete “${album.title}” permanently, including all tracks and its cover?`)) return;
    await api.delete(`/api/admin/albums/${album.id}`);
    navigate("/admin");
  }

  if (loading) return <div className="loading-state">Loading album…</div>;
  if (error && !album) return <div className="error-state">{error}</div>;
  if (!album) return null;

  return (
    <>
      <div className="admin-header">
        <div>
          <Link to="/admin" style={{ fontSize: "0.86rem", color: "var(--ink-faint)" }}>
            ← All albums
          </Link>
          <h1 style={{ marginTop: 6 }}>{album.title}</h1>
        </div>
        <button className="btn btn--danger" onClick={handleDeleteAlbum}>
          Delete album
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      {saveMessage && <div className="form-success">{saveMessage}</div>}

      <div className="edit-grid">
        <div>
          <label className="cover-uploader" htmlFor="cover-input">
            {album.coverUrl ? (
              <img src={mediaUrl(album.coverUrl)} alt="Album cover" />
            ) : (
              <div className="cover-uploader__empty">
                {uploadingCover ? "Uploading…" : "Click to upload a square cover image (JPG, PNG or WEBP)"}
              </div>
            )}
          </label>
          <input
            id="cover-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            ref={coverInputRef}
            onChange={handleCoverSelected}
          />
          {album.coverUrl && (
            <button
              className="btn btn--ghost btn--small"
              style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
              onClick={() => coverInputRef.current?.click()}
            >
              Replace cover
            </button>
          )}
        </div>

        <form onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="edit-title">Album title</label>
            <input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="edit-description">Description</label>
            <textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 140 }}>
            <label htmlFor="edit-year">Year</label>
            <input id="edit-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>

          <div className="checkbox-row">
            <input
              id="published"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <label htmlFor="published">Published — visible to visitors</label>
          </div>
          <div className="checkbox-row">
            <input
              id="featured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <label htmlFor="featured">Featured on homepage</label>
          </div>

          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="section-head">
        <h2 style={{ fontSize: "1.3rem" }}>Tracks</h2>
        <span className="section-head__meta">{album.tracks?.length ?? 0} uploaded</span>
      </div>

      <div
        className={`dropzone ${dragging ? "is-dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => trackInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <UploadIcon size={22} />
        <p style={{ marginTop: 10 }}>
          {uploadingTracks ? (
            "Uploading tracks…"
          ) : (
            <>
              <strong>Click to select MP3 files</strong> or drag them here — multiple files at once are fine
            </>
          )}
        </p>
        <input
          ref={trackInputRef}
          type="file"
          accept="audio/mpeg,.mp3"
          multiple
          onChange={handleTrackFilesSelected}
        />
      </div>

      {album.tracks && album.tracks.length > 0 && (
        <div style={{ marginTop: 24, marginBottom: 60 }}>
          {album.tracks.map((track, index) => (
            <TrackEditRow
              key={track.id}
              track={track}
              index={index}
              total={album.tracks!.length}
              onMove={moveTrack}
              onRename={handleRenameTrack}
              onSaveLyrics={handleSaveLyrics}
              onDelete={handleDeleteTrack}
            />
          ))}
        </div>
      )}
    </>
  );
}

function TrackEditRow({
  track,
  index,
  total,
  onMove,
  onRename,
  onSaveLyrics,
  onDelete,
}: {
  track: Track;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onRename: (track: Track, title: string) => void;
  onSaveLyrics: (track: Track, lyrics: string | null) => Promise<void>;
  onDelete: (track: Track) => void;
}) {
  const [value, setValue] = useState(track.title);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState(track.lyrics ?? "");
  const [savingLyrics, setSavingLyrics] = useState(false);
  const [lyricsSaved, setLyricsSaved] = useState(false);

  useEffect(() => {
    setValue(track.title);
    setLyricsText(track.lyrics ?? "");
  }, [track.title, track.lyrics]);

  return (
    <div className="admin-track-card">
      <div className="admin-track-row">
        <span className="admin-track-row__drag" title="Reorder with the arrows">
          <DragHandleIcon />
        </span>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onRename(track, value)}
          />
          <audio controls src={mediaUrl(track.url)} style={{ height: 30, width: "100%", marginTop: 4 }} />
        </div>
        <div className="admin-track-row__actions">
          <button
            type="button"
            className={`btn btn--small ${track.lyrics ? "btn--gold-glossy" : "btn--metal-glossy"}`}
            style={{ padding: "4px 10px", fontSize: "0.76rem" }}
            onClick={() => setShowLyrics(!showLyrics)}
            title={track.lyrics ? "Edit lyrics" : "Add lyrics"}
          >
            📜 {track.lyrics ? "Edit Lyrics" : "+ Add Lyrics"}
          </button>
          <button className="icon-btn" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Move up">
            ↑
          </button>
          <button
            className="icon-btn"
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            aria-label="Move down"
          >
            ↓
          </button>
          <button className="icon-btn icon-btn--danger" onClick={() => onDelete(track)} aria-label="Delete track">
            <TrashIcon />
          </button>
        </div>
      </div>

      {showLyrics && (
        <div className="admin-track-lyrics-box">
          <div className="admin-track-lyrics-header">
            <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>
              Song Lyrics / Testo per: <em>{track.title}</em>
            </span>
            <span style={{ fontSize: "0.76rem", color: "var(--ink-faint)" }}>
              {lyricsText.split("\n").filter((l) => l.trim()).length} lines
            </span>
          </div>
          <textarea
            className="admin-lyrics-textarea"
            placeholder="Type or paste the song lyrics here..."
            rows={7}
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
          />
          <div className="admin-track-lyrics-actions">
            {track.lyrics && (
              <button
                type="button"
                className="btn btn--danger btn--small"
                disabled={savingLyrics}
                onClick={async () => {
                  if (confirm("Remove lyrics for this track?")) {
                    setSavingLyrics(true);
                    try {
                      setLyricsText("");
                      await onSaveLyrics(track, null);
                      setShowLyrics(false);
                    } finally {
                      setSavingLyrics(false);
                    }
                  }
                }}
              >
                Remove Lyrics
              </button>
            )}
            <button
              type="button"
              className="btn btn--small btn--primary"
              disabled={savingLyrics}
              onClick={async () => {
                setSavingLyrics(true);
                try {
                  await onSaveLyrics(track, lyricsText.trim() || null);
                  setLyricsSaved(true);
                  setTimeout(() => setLyricsSaved(false), 2000);
                } finally {
                  setSavingLyrics(false);
                }
              }}
            >
              {savingLyrics ? "Saving…" : lyricsSaved ? "✓ Saved!" : "Save Lyrics"}
            </button>
            <button
              type="button"
              className="btn btn--small btn--ghost"
              onClick={() => setShowLyrics(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
