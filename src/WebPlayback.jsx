import React, { useEffect, useState } from 'react';
import {
    playPlaylist,
    transferPlayback,
    getTrack,
    nextTrack,
    previousTrack,
    pausePlayback,
    resumePlayback,
    setShuffle,
    getCurrentPlayback
} from './lib/spotify';

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

export default function WebPlayback({ token, selectedPlaylistId }) {
    const [error, setError] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [is_paused, setPaused] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [current_track, setTrack] = useState(track);
    const [showInfo, setShowInfo] = useState(false);
    const [sdkDeviceId, setSdkDeviceId] = useState('');
    const [shuffle, setShuffleState] = useState(false);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;

        //For some reason only works if done here
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(token); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setSdkDeviceId(device_id);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', (state => {
                console.log('Player state changed:', state);
            }));

            player.connect().catch(err => console.error('Player connect error', err));
        };

        return () => {
            cancelled = true;
            if (window.onSpotifyWebPlaybackSDKReady) {
                try { delete window.onSpotifyWebPlaybackSDKReady; } catch { }
            }
            const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
            if (existingScript) existingScript.remove();
            if (player && player.disconnect) {
                player.disconnect().catch(() => { });
            }
        };
    }, [token]);

    useEffect(() => setInterval(() => {
        refreshPlayback();
    }, 10000), [token, sdkDeviceId]);

    // refresh current playback info from REST API
    async function refreshPlayback() {
        console.log("Refreshing playback");
        if (!token) return;
        try {
            const status = await getCurrentPlayback(token);
            console.log("Status");
            console.log(status);
            if (!status) {
                return;
            }
            setPaused(!status.is_playing);
            setShuffleState(status.shuffle_state);
            const trackId = status.item?.id;
            if (trackId) {
                if(current_track && current_track.id === trackId) {
                    return; // no change
                }
                getTrack(token, trackId).then(data => setTrack(data)).catch(() => { });
            }
        } catch (err) {
            console.error('refreshPlayback error', err);
        }
    }

    // when we get a new SDK device id, refresh state
    useEffect(() => {
        if (!sdkDeviceId) return;
        refreshPlayback();
    }, [sdkDeviceId]);

    // play when playlist is provided (selected in PlaylistSelect)
    useEffect(() => {
        async function startIfReady() {
            if (!selectedPlaylistId) return;
            try {
                setError(null);
                setPlaying(true);
                // ensure playback goes to the SDK device if available
                await playPlaylist(token, selectedPlaylistId, sdkDeviceId || undefined);
            } catch (err) {
                setError(err.message || 'Playback failed');
            } finally {
                setPlaying(false);
                refreshPlayback();
            }
        }
        startIfReady();
    }, [selectedPlaylistId, token, sdkDeviceId]);

    async function activateSdk(play = false) {
        if (!sdkDeviceId) {
            setError('SDK device not ready yet');
            return;
        }
        setError(null);
        try {
            await transferPlayback(token, sdkDeviceId, play);
            await refreshPlayback();
        } catch (err) {
            setError(err.message || 'Failed to activate SDK device');
        }
    }

    // REST-driven control handlers (target the SDK device)
    async function handleNext() {
        try {
            await nextTrack(token);
            await refreshPlayback();
        } catch (err) {
            setError(err.message || 'Next failed');
        }
    }

    async function handlePrevious() {
        try {
            await previousTrack(token);
            await refreshPlayback();
        } catch (err) {
            setError(err.message || 'Previous failed');
        }
    }

    async function handleTogglePlayPause() {
        try {
            await refreshPlayback();
            if (is_paused) {
                await resumePlayback(token);
            } else {
                await pausePlayback(token);
            }
            setPaused(!is_paused);
        } catch (err) {
            setError(err.message || 'Play/pause failed');
        }
    }

    async function handleToggleShuffle() {
        try {
            const newState = !shuffle;
            await setShuffle(token, newState);
            setShuffleState(newState);
        } catch (err) {
            setError(err.message || 'Shuffle toggle failed');
        }
    }

    return (
        <>
            <div class="items-center text-center mt-20">
                <div class="flex flex-col max-w-md mx-auto gap-2">


                    <div class="items-center">
                        <button
                            class="border rounded cursor-pointer items-center text-2xl font-medium bg-violet-500 text-black p-5"
                            onClick={() => { try { handlePrevious(); } catch (e) { console.error(e); } }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </svg>
                        </button>

                        <button
                            class="border rounded cursor-pointer items-center text-2xl font-medium bg-violet-500 text-black p-5"
                            onClick={() => { try { handleTogglePlayPause(); } catch (e) { console.error(e); } }}
                        >
                            {is_paused ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                </svg>
                            }
                        </button>

                        <button
                            class="border rounded cursor-pointer items-center text-2xl font-medium bg-violet-500 text-black p-5"
                            onClick={() => { try { setShowInfo(false); handleNext(); } catch (e) { console.error(e); } }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </button>
                        <button
                            class={"border rounded cursor-pointer items-center text-2xl font-medium text-black p-5" + (shuffle ? " bg-violet-700" : " bg-violet-500")}
                            onClick={() => handleToggleShuffle()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                            </svg>
                        </button>
                    </div>

                    <button
                        class="border rounded cursor-pointer items-center text-2xl font-medium bg-violet-500 text-black p-5"
                        onClick={() => activateSdk(true)}
                    >
                        Listen on this browser
                    </button>

                    <button
                        class={"border rounded cursor-pointer items-center text-2xl font-medium text-black p-5 bg-violet-500"}
                        onClick={() => setShowInfo(s => !s)}
                    >
                        {showInfo ? "Hide" : "Reveal"}
                    </button>


                    {showInfo && (
                        <div class="b">
                            <div class="columns-2 border rounded cursor-pointer items-center text-2xl font-medium text-black p-5 bg-grey-500">
                                <div class="flex flex-col text-left">
                                    <span>Song</span>
                                    <span>Artist</span>
                                    <span>Release</span>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span>{current_track.name}</span>
                                    <span>{current_track.artists[0].name}</span>
                                    <span>{current_track.album?.release_date
                                        ? current_track.album.release_date.slice(0, 4)
                                        : ""}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
