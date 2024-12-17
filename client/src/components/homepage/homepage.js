import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Homepage = () => {
    const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCallbackRedirect, setIsCallbackRedirect] = useState(false);

    const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
    const SCOPES = ["user-read-private", "user-read-email", "playlist-read-private"];

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.has("callback")) {
            setIsCallbackRedirect(true);
            setLoading(false);
        } else {
            fetchUserStatus();
        }
    }, [location.search]);

    const fetchUserStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found. User may not be logged in.");
                setLoading(false);
                return;
            }

            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/users/check-connection`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );

            setIsSpotifyConnected(response.data.connected);

            if (!response.data.connected) clearSpotifyTokens();
        } catch (error) {
            console.error("Failed to fetch user status:", error);
            clearSpotifyTokens();
        } finally {
            setLoading(false);
        }
    };

    const clearSpotifyTokens = () => {
        localStorage.removeItem("spotifyAccessToken");
        localStorage.removeItem("spotifyRefreshToken");
        console.log("Spotify tokens cleared.");
    };

    const handleConnectSpotify = () => {
        const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
        )}&scope=${encodeURIComponent(SCOPES.join(" "))}`;
        window.location.href = spotifyAuthUrl;
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
                ) : (
                    <button onClick={() => navigate("/quiz")}>
                        Song Quiz
                    </button>
                )}
            </div>
        </>
    );
};

export default Homepage;