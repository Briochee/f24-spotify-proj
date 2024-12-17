import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Homepage = () => {
    const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect (() => {
        // handle tokens from query string
        handleQueryStringTokens();
    }, []);

    useEffect(() => {
        const initializeSpotifyConnection = async () => {
            try {
                // Check connection status
                const status = await fetchSpotifyConnectionStatus();

                if (!status) {
                    setIsSpotifyConnected(false);
                    return;
                }
                // Verify the actual Spotify connection
                const verified = await verifySpotifyConnection();
                setIsSpotifyConnected(verified);
            } catch (error) {
                console.error("Error initializing Spotify connection:", error);
                setIsSpotifyConnected(false);
            }
        };
        initializeSpotifyConnection();
        // console.log("CONNECTION: ", isSpotifyConnected);
    }, []);

    const handleQueryStringTokens = async () => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
    
        if (accessToken && refreshToken) {
            // Calculate expiry time (1 hour from now)
            const expiryTime = Date.now() + 3600 * 1000; // 1 hour in milliseconds
    
            // Store tokens and expiration time in localStorage
            const spotifyTokens = {
                accessToken,
                refreshToken,
                expiryTime,
            };
    
            localStorage.setItem("spotifyTokens", JSON.stringify(spotifyTokens));
            console.log("Spotify tokens stored in localStorage.");
    
            // Call backend to update user info
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("No auth token found.");
                    return;
                }
    
                // Call backend to update user info
                await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/spotify/update-info`,
                    { accessToken, refreshToken },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
    
                console.log("User info updated successfully.");
    
                // Invoke validate username after updating user info
                await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/spotify/validate-username`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
    
                console.log("Spotify username validated successfully.");
            } catch (error) {
                console.error("Failed to update user info or validate username:", error.response?.data || error.message);
            }
    
    
            // Clean up query parameters from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    };

    const verifySpotifyConnection = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found. User may not be logged in.");
                setIsSpotifyConnected(false);
                return;
            }
    
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/spotify/verify-connection`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
    
            if (response.data.connected === true) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error("Failed to verify Spotify connection:", error.response?.data || error.message);
            return false;
        }
    };

    const fetchSpotifyConnectionStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found. User may not be logged in.");
                setLoading(false);
                return;
            }
    
            // Check the Spotify connection status
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/users/check-connection`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
    
            const { connected, accessToken, refreshToken } = response.data;
    
            if (connected && accessToken?.token && accessToken?.date) {
                // Extract access token and calculate expiry time based on the returned date
                const expiryTime = new Date(accessToken.date).getTime() + 3600 * 1000;
    
                // Store the tokens in localStorage
                const spotifyTokens = {
                    accessToken: accessToken.token,
                    refreshToken,
                    expiryTime,
                };
    
                localStorage.setItem("spotifyTokens", JSON.stringify(spotifyTokens));
                console.log("Spotify tokens stored in localStorage.");
            }

            // console.log("ACCOUNT CONNECTION STATUS: ", connected);
    
            return connected;
        } catch (error) {
            console.error(
                "Failed to fetch Spotify connection status:",
                error.response?.data || error.message
            );
            return false;
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
                    <button onClick={() => navigate("/quiz-options")}>Song Quiz</button>
                )}
            </div>
        </>
    );
};

export default Homepage;