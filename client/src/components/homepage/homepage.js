import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Homepage = () => {
    // Spotify Client ID
    const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID; // Replace with your Spotify Client ID
    const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI; // Replace with your redirect URI
    const SCOPES = [
        "user-read-private",
        "user-read-email",
        "playlist-read-private",
    ]; // Spotify scopes for permissions

    const handleConnectSpotify = () => {
        const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
        )}&scope=${encodeURIComponent(SCOPES.join(" "))}`;
        window.location.href = spotifyAuthUrl; // Redirect to Spotify's authorization page
    };

    return (
        <>
            <div>
                <NavDropdown />
            </div>
            <div className="container">
                <h1>Welcome to the Homepage</h1>
                <button onClick={handleConnectSpotify}>
                    Connect Your Spotify Account
                </button>
            </div>
        </>
    );
};

export default Homepage;