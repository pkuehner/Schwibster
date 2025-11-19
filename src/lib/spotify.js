export async function fetchAuthToken() {
  const res = await fetch('/auth/token');
  if (!res.ok) throw new Error(`Auth token request failed: ${res.status}`);
  const json = await res.json();
  return json.access_token;
}

export async function getUserPlaylists(token, { limit = 50 } = {}) {
  const url = `https://api.spotify.com/v1/me/playlists?limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch playlists: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.items || [];
}

/**
 * Start playback for a playlist. If deviceId is omitted, Spotify will attempt to play on the user's
 * currently active device.
 */
export async function playPlaylist(token, playlistId, deviceId) {
  const url = deviceId
    ? `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`
    : 'https://api.spotify.com/v1/me/player/play';

  const body = { context_uri: `spotify:playlist:${playlistId}` };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to start playback: ${res.status} ${text}`);
  }
  return true;
}

// --- new exports ---

export async function getDevices(token) {
  const url = 'https://api.spotify.com/v1/me/player/devices';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch devices: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.devices || [];
}

/**
 * Transfer playback to the given device id. Pass play=true to start playback immediately.
 */
export async function transferPlayback(token, deviceId, play = false) {
  const url = 'https://api.spotify.com/v1/me/player';
  const body = { device_ids: [deviceId], play };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to transfer playback: ${res.status} ${text}`);
  }
  return true;
}

export async function getTrack(token, trackId) {
    const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch track (${res.status})`);
    return res.json();
}

// New REST control helpers

export async function nextTrack(token, deviceId) {
  const url = deviceId
    ? `https://api.spotify.com/v1/me/player/next?device_id=${encodeURIComponent(deviceId)}`
    : 'https://api.spotify.com/v1/me/player/next';
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to skip to next track: ${res.status} ${text}`);
  }
  return true;
}

export async function previousTrack(token, deviceId) {
  const url = deviceId
    ? `https://api.spotify.com/v1/me/player/previous?device_id=${encodeURIComponent(deviceId)}`
    : 'https://api.spotify.com/v1/me/player/previous';
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to skip to previous track: ${res.status} ${text}`);
  }
  return true;
}

export async function pausePlayback(token, deviceId) {
  const url = deviceId
    ? `https://api.spotify.com/v1/me/player/pause?device_id=${encodeURIComponent(deviceId)}`
    : 'https://api.spotify.com/v1/me/player/pause';
  const res = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to pause playback: ${res.status} ${text}`);
  }
  return true;
}

export async function resumePlayback(token, deviceId) {
  const url = deviceId
    ? `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`
    : 'https://api.spotify.com/v1/me/player/play';
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to resume playback: ${res.status} ${text}`);
  }
  return true;
}

export async function setShuffle(token, state, deviceId) {
  const url = deviceId
    ? `https://api.spotify.com/v1/me/player/shuffle?state=${state}&device_id=${encodeURIComponent(deviceId)}`
    : `https://api.spotify.com/v1/me/player/shuffle?state=${state}`;
  const res = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to set shuffle: ${res.status} ${text}`);
  }
  return true;
}

/**
 * Get current playback state (track, is_playing, device, shuffle_state, context, etc.)
 */
export async function getCurrentPlayback(token) {
  const url = 'https://api.spotify.com/v1/me/player';
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 204) return null; // no content (no active device)
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch current playback: ${res.status} ${text}`);
  }
  return res.json();
}