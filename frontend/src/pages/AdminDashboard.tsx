import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, mediaUrl } from "../services/api";
import { Album } from "../types";

export function AdminDashboard() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    api
      .get<{ albums: Album[] }>("/api/admin/albums")
      .then((data) => setAlbums(data.albums))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Album title is required.");
      return;
    }
    setCreating(true);
    try {
      const data = await api.post<{ album: Album }>("/api/admin/albums", {
        title,
        description,
        year: year || undefined,
      });
      navigate(`/admin/albums/${data.album.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create album.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(album: Album) {
    if (!confirm(`Delete “${album.title}” and all of its tracks? This cannot be undone.`)) return;
    await api.delete(`/api/admin/albums/${album.id}`);
    load();
  }

  return (
    <>
      <div className="admin-header">
        <h1>Albums</h1>
        <button className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New album"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: 40, maxWidth: 460 }}>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label htmlFor="title">Album title</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note about this album's story or mood."
            />
          </div>
          <div className="field" style={{ maxWidth: 140 }}>
            <label htmlFor="year">Year (optional)</label>
            <input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <button className="btn btn--primary" type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create album"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading-state">Loading albums…</div>
      ) : albums.length === 0 ? (
        <div className="empty-state">
          You haven't created any albums yet. Start with “+ New album”.
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Tracks</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {albums.map((album) => (
              <tr key={album.id}>
                <td>
                  {album.coverUrl ? (
                    <img className="admin-table__cover" src={mediaUrl(album.coverUrl)} alt="" />
                  ) : (
                    <div className="admin-table__cover" />
                  )}
                </td>
                <td>
                  <Link to={`/admin/albums/${album.id}`}>{album.title}</Link>
                </td>
                <td>{album.tracks?.length ?? 0}</td>
                <td>
                  <span className={`badge ${album.isPublished ? "badge--published" : "badge--draft"}`}>
                    {album.isPublished ? "Published" : "Draft"}
                  </span>
                  {album.isFeatured && <span className="badge badge--featured" style={{ marginLeft: 6 }}>Featured</span>}
                </td>
                <td>
                  <div className="admin-table__actions">
                    <Link to={`/admin/albums/${album.id}`} className="btn btn--ghost btn--small">
                      Edit
                    </Link>
                    <button className="btn btn--danger btn--small" onClick={() => handleDelete(album)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
