import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { useNavigate } from "react-router-dom";

// function to get user's Spotify playlists with retry logic
export const getUserPlaylists = async (navigate) => {
    try {
        const spotifyTokens = JSON.parse(localStorage.getItem("spotifyTokens"));

        if (!spotifyTokens || !spotifyTokens.accessToken) {
            throw new Error("No Spotify access token found. Please log in again.");
        }

        const { accessToken } = spotifyTokens;

        const maxRetries = 5;
        let waitTime = 4000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await axios.get("https://api.spotify.com/v1/me/playlists?limit=20", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });

                // Map the playlists to include image URLs
                const playlists = response.data.items.map((playlist) => ({
                    id: playlist.id,
                    name: playlist.name,
                    image: playlist.images?.[0]?.url || "",
                }));

                return playlists; // Return on success
            } catch (error) {
                if (error.response?.status === 429) {
                    const retryAfter = error.response.headers["retry-after"];
                    let currentWaitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : waitTime;
                    console.warn(`Rate limited. Retrying after ${currentWaitTime}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, currentWaitTime));
                    waitTime *= 2; // Exponential backoff
                } else {
                    throw error;
                }
            }
        }

        throw new Error("Failed to fetch playlists after multiple retries.");
    } catch (error) {
        console.error("Failed to fetch playlists with images:", error.response?.data || error.message);
        navigate("/homepage");
        return [];
    }
};

// function to fetch a playlist's total tracks
export const getPlaylistTracks = async (playlistId) => {
    try {
        const spotifyTokens = JSON.parse(localStorage.getItem("spotifyTokens"));
        if (!spotifyTokens || !spotifyTokens.accessToken) {
            throw new Error("No Spotify access token found. Please log in again.");
        }
        const { accessToken } = spotifyTokens;

        const response = await axios.get(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=1`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return response.data.total; // Returns the total number of tracks
    } catch (error) {
        console.error("Failed to fetch playlist tracks:", error.response?.data || error.message);
        return 0;
    }
};

// function to fetch random tracks from a playlist
export const getRandomPlaylistTracks = async (playlistId, numberOfTracks) => {
    try {
        const spotifyTokens = JSON.parse(localStorage.getItem("spotifyTokens"));
        if (!spotifyTokens || !spotifyTokens.accessToken) {
            throw new Error("No Spotify access token found. Please log in again.");
        }
        const { accessToken } = spotifyTokens;

        let allTracks = [];
        let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=20`;

        // Fetch all tracks from the playlist
        while (nextUrl) {
            const response = await axios.get(nextUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            allTracks = [...allTracks, ...response.data.items];
            nextUrl = response.data.next; // Next page of tracks
        }

        if (allTracks.length === 0) {
            throw new Error("No tracks found in this playlist.");
        }

        // Shuffle and return the desired number of tracks
        const shuffledTracks = allTracks.sort(() => 0.5 - Math.random());
        return shuffledTracks.slice(0, numberOfTracks);
    } catch (error) {
        console.error("Failed to fetch playlist tracks:", error.response?.data || error.message);
        return [];
    }
};

// function to fetch playlist details
export const getPlaylistDetails = async (playlistId) => {
    try {
        const spotifyTokens = JSON.parse(localStorage.getItem("spotifyTokens"));
        if (!spotifyTokens || !spotifyTokens.accessToken) {
            throw new Error("No Spotify access token found. Please log in again.");
        }
        const { accessToken } = spotifyTokens;

        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const { name, images } = response.data;
        return { name, image: images?.[0]?.url || null };
    } catch (error) {
        console.error("Failed to fetch playlist details:", error.message);
        return { name: "Unknown Playlist", image: null };
    }
};

let playerInstance = null;

// initialize spotify player
export const loadSpotifyPlayer = (accessToken) => {
    return new Promise((resolve, reject) => {
        // Define the global callback BEFORE loading the script
        window.onSpotifyWebPlaybackSDKReady = () => {
            // console.log("Spotify Web Playback SDK Ready");

            playerInstance = new window.Spotify.Player({
                name: "SUBSONIC",
                getOAuthToken: (cb) => cb(accessToken),
            });

            // Event listeners for the player
            playerInstance.addListener("ready", ({ device_id }) => {
                // console.log("Spotify Player is ready with Device ID:", device_id);
                resolve(device_id);
            });

            playerInstance.addListener("not_ready", ({ device_id }) => {
                console.error("Device ID is not ready:", device_id);
                reject("Spotify Player is not ready");
            });

            // Connect to the player
            playerInstance.connect();
        };

        if (!document.getElementById("spotify-player-script")) {
            const script = document.createElement("script");
            script.id = "spotify-player-script";
            script.src = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;
            script.onerror = () => reject("Failed to load Spotify SDK");
            document.body.appendChild(script);
        } else if (window.Spotify) {
            // If the SDK script is already loaded, call the callback manually
            window.onSpotifyWebPlaybackSDKReady();
        }
    });
};

// play snipet
const snippetStartCache = {}; // Starting point of snipet

export const playSongSnippet = async (deviceId, trackUri, duration = 20000) => {
    const spotifyTokens = JSON.parse(localStorage.getItem("spotifyTokens"));
    const { accessToken } = spotifyTokens;

    // Use cached starting point
    let startPosition = snippetStartCache[trackUri];
    if (!startPosition) {
        startPosition = Math.floor(Math.random() * (30 - duration / 1000)) * 1000;
        snippetStartCache[trackUri] = startPosition;
    }

    try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
                uris: [trackUri],
                position_ms: startPosition,
            }),
        });

        // Stop playback after the snippet duration
        setTimeout(async () => {
            await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
        }, duration);
    } catch (error) {
        console.error("Error playing song snippet:", error.message);
    }
};
