import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SpotifyCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
            axios.post("http://localhost:5000/api/spotify/spotify-callback", { code })
                .then((response) => {
                    console.log("Spotify connected:", response.data);
                    // Optionally, save the tokens in local storage or state
                    navigate("/homepage"); // Redirect back to the homepage
                })
                .catch((error) => {
                    console.error("Failed to connect to Spotify:", error);
                });
        }
    }, []);

    return <div>Connecting to Spotify...</div>;
};

export default SpotifyCallback;