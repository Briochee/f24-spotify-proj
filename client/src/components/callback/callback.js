import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SpotifyCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleSpotifyCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get("code");
            const token = localStorage.getItem("token");

            if (code && token) {
                try {
                    await axios.post(
                        `${process.env.REACT_APP_BACKEND_URL}/api/spotify/spotify-callback`,
                        { code },
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    );
        
                    const newUrl = window.location.href.split("?")[0];
                    window.history.replaceState({}, document.title, newUrl);

                    navigate("/homepage");
                } catch (error) {
                    console.error("Failed to connect to Spotify:", error.response?.data || error.message);
                }
            } else {
                console.error("Missing authorization code or token");
                // navigate("/login");
            }
        };

        handleSpotifyCallback();
    }, []);

    return <div>Connecting to Spotify...</div>;
};

export default SpotifyCallback;