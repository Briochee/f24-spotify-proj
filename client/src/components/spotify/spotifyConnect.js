import axios from "axios";

// check spotify connection itself
export const checkSpotifyConnection = async () => {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("No token found in local storage.");
            clearSpotifyTokens();
            return false;
        }

        const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/spotify/connection-status`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            }
        );

        const connected = response.data.connected;

        if (connected) {
            console.log("Spotify account is connected.");
            return true;
        } else {
            console.log("Spotify connection invalid. Attempting token refresh...");
            const refreshed = await refreshSpotifyToken();
            if (refreshed) {
                return await checkSpotifyConnection();
            } else {
                console.log("Failed to refresh Spotify token. Clearing tokens...");
                clearSpotifyTokens();
                return false;
            }
        }
    } catch (error) {
        console.error(
            "Failed to fetch Spotify connection status:",
            error.response?.data || error.message
        );
        clearSpotifyTokens();
        return false;
    }
};


export const refreshSpotifyToken = async () => {
    try {
        const token = localStorage.getItem("token"); // JWT for authentication

        if (!token) {
            console.error("No token found. User may not be logged in.");
            return null;
        }

        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/spotify/refresh-spotify-token`,
            {}, // No body needed for this request
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const { access_token } = response.data;

        // Save the refreshed access token to localStorage
        localStorage.setItem("spotifyAccessToken", access_token);

        console.log("Spotify access token refreshed successfully.");
        return access_token;
    } catch (error) {
        console.error("Failed to refresh Spotify token:", error.response?.data || error.message);
        return null;
    }
};

export const clearSpotifyTokens = () => {
    if (localStorage.removeItem("spotifyAccessToken") || localStorage.removeItem("spotifyRefreshToken")){
        console.log("No spotify connection found, clearing tokens");
    }
    // console.log("Cleared Spotify tokens from local storage.");
};

export const connectSpotify = () => {
    if (!sessionStorage.getItem("spotifyRedirectInitiated")) {
        sessionStorage.setItem("spotifyRedirectInitiated", "true");

        const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
        const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
        const SCOPES = [
            "user-read-private",
            "user-read-email",
            "playlist-read-private",
            "streaming",
        ];

        const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
        )}&scope=${encodeURIComponent(SCOPES.join(" "))}`;
        window.location.href = spotifyAuthUrl;
    } else {
        console.log("Spotify Redirect Already Initiated");
    }
};