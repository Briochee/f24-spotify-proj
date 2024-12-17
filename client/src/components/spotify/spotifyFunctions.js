import axios from "axios";

// function to get user's Spotify playlists
export const getUserPlaylists = async () => {
    try {
        // retrieve spotify tokens from localStorage
        const spotifyTokens = JSON.parse(localStorage.getItem("spotifyTokens"));

        if (!spotifyTokens || !spotifyTokens.accessToken) {
            throw new Error("No Spotify access token found. Please log in again.");
        }

        const { accessToken } = spotifyTokens;

        // axios request to fetch playlists
        const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        return response.data.items; // return the array of playlists
    } catch (error) {
        console.error("Failed to fetch playlists:", error.response?.data || error.message);
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
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=1`, // Fetching metadata only
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