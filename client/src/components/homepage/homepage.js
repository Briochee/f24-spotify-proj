import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Homepage = () => {
    const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        fetchSpotifyConnectionStatus();
    }, []);

    const fetchSpotifyConnectionStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found. User may not be logged in.");
                setLoading(false);
                return;
            }

            // Check the Spotify connection status
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/check-connection`, 
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setIsSpotifyConnected(response.data.connected);
        } catch (error) {
            console.error("Failed to fetch Spotify connection status:", error.response?.data || error.message);
            setIsSpotifyConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectSpotify = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("User is not logged in.");
                navigate("/login");
                return;
            }

            // Call the backend to initiate the Spotify OAuth flow
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/spotify/login`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Redirect the user to the Spotify authorization URL provided by the backend
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error("Failed to initiate Spotify connection:", error.response?.data || error.message);
            alert("Failed to connect Spotify account. Please try again.");
        }
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
                    <button onClick={handleConnectSpotify}>Connect Your Spotify Account</button>
                ) : (
                    <button onClick={() => navigate("/quiz")}>Song Quiz</button>
                )}
            </div>
        </>
    );
};

export default Homepage;