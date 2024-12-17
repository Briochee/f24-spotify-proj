export const initializeSpotifyPlayer = (token, trackUri, snippetDuration = 3000) => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: "Web Playback SDK Sample",
            getOAuthToken: (cb) => cb(token),
            volume: 0.5,
        });

        player.addListener("ready", ({ device_id }) => {
            console.log("Ready with Device ID", device_id);
            playSongSnippet(token, device_id, trackUri, snippetDuration);
        });

        player.connect();
    };
};

const playSongSnippet = async (token, device_id, trackUri, snippetDuration) => {
    const startTime = Math.random() * (180 - 3) * 1000; // Random start time

    try {
        await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                uris: [trackUri],
                position_ms: startTime,
            }),
        });

        setTimeout(async () => {
            await fetch("https://api.spotify.com/v1/me/player/pause", {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Snippet playback ended.");
        }, snippetDuration);
    } catch (error) {
        console.error("Error playing snippet:", error);
    }
};