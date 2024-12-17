import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SpotifyCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleSpotifyCallback = async () => {
            // Ensure the callback is not processed more than once
            if (sessionStorage.getItem("spotifyCallbackProcessed")) {
                console.log("Spotify callback already processed.");
                navigate("/homepage"); // Redirect to homepage if already processed
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get("code");
            const token = localStorage.getItem("token");

            if (!code) {
                console.error("Authorization code is missing.");
                navigate("/login"); // Redirect to login if authorization code is missing
                return;
            }

            if (!token) {
                console.error("User token is missing.");
                navigate("/login");
                return;
            }

            // Mark callback as processed early to prevent duplicate runs
            sessionStorage.setItem("spotifyCallbackProcessed", "true");

            try {
                const response = await axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/api/spotify/spotify-callback`,
                    { code },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const { access_token, refresh_token } = response.data;

                // Save tokens to localStorage
                localStorage.setItem("spotifyAccessToken", access_token);
                localStorage.setItem("spotifyRefreshToken", refresh_token);

                // Navigate to the homepage
                navigate("/homepage");
            } catch (error) {
                console.error("Failed to connect to Spotify:", error.response?.data || error.message);

                // Reset sessionStorage flag on error for retry
                sessionStorage.removeItem("spotifyCallbackProcessed");
            }
        };

        // Call the handler
        handleSpotifyCallback();
    }, [navigate]);

    return <div>Processing Spotify callback...</div>;
};

export default SpotifyCallback;