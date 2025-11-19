import React, { useState, useEffect } from 'react';
import WebPlayback from './WebPlayback'
import Login from './Login'
import PlaylistSelect from './PlaylistSelect'
import { fetchAuthToken } from './lib/spotify';

function App() {
  const [token, setToken] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const t = await fetchAuthToken();
        if (!cancelled) setToken(t);
      } catch (err) {
        console.error('Failed to fetch auth token', err);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  if (token === '') {
    return <Login />;
  }

  // after login: show playlist selector first, then start the game
  if (!selectedPlaylistId) {
    return <PlaylistSelect token={token} onStart={id => setSelectedPlaylistId(id)} />;
  }

  return (
    <>
      <WebPlayback token={token} selectedPlaylistId={selectedPlaylistId} />
    </>
  );
}

export default App;
