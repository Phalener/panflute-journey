import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="container">
      <div className="error-state">
        <h2 style={{ marginBottom: 14 }}>Page not found</h2>
        <p style={{ marginBottom: 20 }}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn--primary">
          Back to albums
        </Link>
      </div>
    </div>
  );
}
