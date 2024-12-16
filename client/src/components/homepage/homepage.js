import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation} from "react-router-dom";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Homepage = () => {
    const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCallbackRedirect, setIsCallbackRedirect] = useState(false);

    const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
    const SCOPES = [
        "user-read-private",
        "user-read-email",
        "playlist-read-private",
    ]; // Spotify scopes for permissions

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // check for prev redirect
        const params = new URLSearchParams(location.search);
        if (params.has("callback")) {
            setIsCallbackRedirect(true);
            setLoading(false);
        } else {
            fetchUserStatus();
        }
    }, [location.search]);

    // check user account connection status
    const fetchUserStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found. User may not be logged in.");
                setLoading(false);
                return;
            }
    
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/check-connection`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );
    
            const connected = response.data.connected;
            setIsSpotifyConnected(connected);
    
            if (!connected) {
                clearSpotifyTokens(); // Clear invalid tokens
            }
    
            // If connected, check Spotify connection via API
            if (connected) {
                await checkSpotifyConnection();
            }
        } catch (error) {
            console.error("Failed to fetch user status:", error);
            clearSpotifyTokens();
        } finally {
            setLoading(false);
        }
    };

    // check spotify connection itself
    const checkSpotifyConnection = async () => {
        try {
            const token = localStorage.getItem("token");
    
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/spotify/connection-status`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );
    
            const connected = response.data.connected;
    
            if (!connected) {
                console.log("Spotify connection invalid. Attempting token refresh...");
                const refreshed = await refreshSpotifyToken();
                if (refreshed) {
                    await checkSpotifyConnection();
                } else {
                    console.log("Failed to refresh Spotify token. Clearing tokens...");
                    clearSpotifyTokens();
                }
            } else {
                setIsSpotifyConnected(true);
                updateConnectionStatus(connected);
            }
        } catch (error) {
            console.error("Failed to fetch Spotify connection status:", error.response?.data || error.message);
            clearSpotifyTokens();
        }
    };

    const refreshSpotifyToken = async () => {
        try {
            const refreshToken = localStorage.getItem("spotifyRefreshToken");
            if (!refreshToken) {
                console.error("No Spotify refresh token found.");
                return false;
            }
    
            const response = await axios.post("https://accounts.spotify.com/api/token",
                new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                    client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
                    client_secret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
    
            const { access_token } = response.data;
            localStorage.setItem("spotifyAccessToken", access_token);
    
            console.log("Spotify access token refreshed successfully.");
            return true;
        } catch (error) {
            console.error("Failed to refresh Spotify token:", error.response?.data || error.message);
            return false;
        }
    };

    const clearSpotifyTokens = () => {
        console.log("No spotify connection found, clearing tokens");
        localStorage.removeItem("spotifyAccessToken");
        localStorage.removeItem("spotifyRefreshToken");
        // console.log("Cleared Spotify tokens from local storage.");
    };

    const updateConnectionStatus = async ( connection ) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/set-status`,
                { connection },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
        } catch (error) {
            console.error("Could not change user connection status: ", error);
        }
    };

    const handleConnectSpotify = () => {
        const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
        )}&scope=${encodeURIComponent(SCOPES.join(" "))}`;
        window.location.href = spotifyAuthUrl; // Redirect to Spotify's authorization page
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div>
                <NavDropdown />
            </div>
            <div className="container">
                <h1>Welcome to the Homepage</h1>
                {!isSpotifyConnected ? (
                    <button onClick={handleConnectSpotify}>
                        Connect Your Spotify Account
                    </button>
                ) : ""}
            </div>
        </>
    );
};

export default Homepage;