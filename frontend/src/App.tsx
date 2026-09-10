import { Link, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { PlayerBar } from "./components/PlayerBar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./components/AdminLayout";
import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import { Home } from "./pages/Home";
import { AlbumPage } from "./pages/AlbumPage";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminAlbumEdit } from "./pages/AdminAlbumEdit";
import { NotFound } from "./pages/NotFound";

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">{children}</main>

      <PlayerBar />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Routes>
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/albums/:id" element={<PublicLayout><AlbumPage /></PublicLayout>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="albums/:id" element={<AdminAlbumEdit />} />
            </Route>
          </Route>
          <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
        </Routes>
      </PlayerProvider>
    </AuthProvider>
  );
}
