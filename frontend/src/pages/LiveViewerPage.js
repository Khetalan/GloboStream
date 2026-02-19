import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LiveViewer from '../components/LiveViewer';
import { useAuth } from '../contexts/AuthContext';

const LiveViewerPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <LiveViewer
      roomId={roomId}
      onLeave={() => navigate(-1)}
      user={user}
    />
  );
};

export default LiveViewerPage;
