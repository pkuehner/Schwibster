import React, { useEffect, useState } from 'react';
import { getUserPlaylists } from './lib/spotify';

export default function PlaylistSelect({ token, onStart }) {
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items = await getUserPlaylists(token);
        if (!cancelled) {
          setPlaylists(items);
          setSelected(items[0]?.id || '');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load playlists');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div class="container items-center text-center mt-45">
        <div class="playlist-area">
          {loading && <div>Loading playlists</div>}
          {error && <div>Error Loading playlists</div>}

          {!loading && playlists.length > 0 && (
            <div class="bg-violet-500 max-w-sm mx-auto text-2xl mb-6">
              <label htmlFor="playlist-select">Choose a playlist:</label>
              <select 
              class="lock w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body"
                id="playlist-select"
                value={selected}
                onChange={e => setSelected(e.target.value)}
              >
                {playlists.map(pl => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}{pl.owner && pl.owner.display_name ? ` — ${pl.owner.display_name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!loading && playlists.length === 0 && <div>No playlists found.</div>}

          <div>
            <button
              class="border rounded cursor-pointer items-center text-2xl font-medium bg-violet-500 text-black p-5"
              onClick={() => selected && onStart(selected)}
              disabled={!selected}
            >
              Start Game
            </button>
          </div>
      </div>
    </div>
  );
}