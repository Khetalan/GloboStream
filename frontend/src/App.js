import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages publiques
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Pages authentifiées
import Home from './pages/Home';
import Profile from './pages/Profile';
import Swipe from './pages/Swipe';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Support from './pages/Support';
import ModerationPanel from './pages/ModerationPanel';
import PublicProfile from './pages/PublicProfile';
import Settings from './pages/Settings';

// Pages Stream
import StreamHub from './pages/StreamHub';
import LiveSurprise from './pages/LiveSurprise';
import LivePublic from './pages/LivePublic';
import LiveCompetition from './pages/LiveCompetition';
import LiveEvent from './pages/LiveEvent';
import LiveViewerPage from './pages/LiveViewerPage';

// Route protégée
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const { t } = useTranslation();
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          containerStyle={{
            top: 16,
            left: 0,
            right: 0,
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1E1E1E',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: 'calc(100vw - 32px)',
            },
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes authentifiées */}
          <Route path="/home" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          <Route path="/profile/:userId" element={
            <PrivateRoute>
              <PublicProfile />
            </PrivateRoute>
          } />

          <Route path="/swipe" element={
            <PrivateRoute>
              <Swipe />
            </PrivateRoute>
          } />

          <Route path="/matches" element={
            <PrivateRoute>
              <Matches />
            </PrivateRoute>
          } />

          <Route path="/chat" element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          } />

          <Route path="/chat/:userId" element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          } />

          <Route path="/support" element={
            <PrivateRoute>
              <Support />
            </PrivateRoute>
          } />

          <Route path="/settings" element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } />

          <Route path="/moderation" element={
            <PrivateRoute>
              <ModerationPanel />
            </PrivateRoute>
          } />

          {/* Routes Stream - Structure hiérarchique */}
          <Route path="/stream" element={
            <PrivateRoute>
              <StreamHub />
            </PrivateRoute>
          } />

          <Route path="/stream/surprise" element={
            <PrivateRoute>
              <LiveSurprise />
            </PrivateRoute>
          } />

          <Route path="/stream/live" element={
            <PrivateRoute>
              <LivePublic />
            </PrivateRoute>
          } />

          <Route path="/stream/competition" element={
            <PrivateRoute>
              <LiveCompetition />
            </PrivateRoute>
          } />

          <Route path="/stream/event" element={
            <PrivateRoute>
              <LiveEvent />
            </PrivateRoute>
          } />

          <Route path="/stream/watch/:roomId" element={
            <PrivateRoute>
              <LiveViewerPage />
            </PrivateRoute>
          } />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
