import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminRoute from './routes/AdminRoute';

// ── Code-split heavy pages to reduce initial bundle size ──────────────────────
const BookHouse = lazy(() => import('./pages/BookHouse'));
const SaturdayStory = lazy(() => import('./pages/SaturdayStory'));
const Discussions = lazy(() => import('./pages/Discussions'));
const About = lazy(() => import('./pages/About'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// ── Literary loading fallback for lazy-loaded route chunks ────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-brand-cream border-2 border-brand-cream flex items-center justify-center">
          <span className="text-brand-primary font-serif text-xl">📖</span>
        </div>
        <p className="text-brand-primary font-serif text-lg">
          Opening Chapter &amp; Chats...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="book-house" element={<BookHouse />} />

              <Route path="six-word-story" element={<SaturdayStory />} />
              <Route path="discussions" element={<Discussions />} />
              <Route path="about" element={<About />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:username" element={<Profile />} />
              
              {/* Dedicated Executive Admin Operations Hub */}
              <Route
                path="admin-portal"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
