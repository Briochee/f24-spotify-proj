import React, { useState, useEffect, useCallback} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./homepage.css"

// website constants
import NavDropdown from "../navigate/navigate.js";

const Homepage = () => {
    const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [verify, setVerify] = useState(true);

    const navigate = useNavigate();

    useEffect (() => {
        // handle tokens from query string
        handleQueryStringTokens();
    }, []);

    const verifySpotifyConnection = useCallback(async () => {
        setVerify(false);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found. User may not be logged in.");
                setIsSpotifyConnected(false);
                setVerify(true);
                return false;
            }
    
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/spotify/verify-connection`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
    
            const { connected, refreshed } = response.data;
    
            if (connected) {
                if (refreshed) {
                    console.log("Access token refreshed. Updating tokens...");
                    await fetchSpotifyConnectionStatus();
                }
                setVerify(true);
                return true;
            } else {
                setVerify(true);
                return false;
            }
        } catch (error) {
            console.error("Failed to verify Spotify connection:", error.response?.data || error.message);
            setVerify(true);
            return false;
        }
    }, []);

    useEffect(() => {
        const initializeSpotifyConnection = async () => {
            try {
                const status = await fetchSpotifyConnectionStatus();

                if (!status) {
                    setIsSpotifyConnected(false);
                    return;
                }

                const verified = await verifySpotifyConnection();
                setIsSpotifyConnected(verified);
            } catch (error) {
                console.error("Error initializing Spotify connection:", error);
                setIsSpotifyConnected(false);
            }
        };
        initializeSpotifyConnection();
        // console.log("CONNECTION: ", isSpotifyConnected);
    }, [verifySpotifyConnection]);

    const handleQueryStringTokens = async () => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
    
        if (accessToken && refreshToken) {
            // Calculate expiry time (1 hour from now)
            const currentUTC = new Date();
            const localOffset = currentUTC.getTimezoneOffset() * 60 * 1000;
            const currentLocalTime = new Date(currentUTC.getTime() - localOffset);
            
            const expiryTime = currentLocalTime + 3600 * 1000; // 1 hour in milliseconds
    
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
    
            if (connected && accessToken?.token && accessToken?.obtainedAt) {
                // Extract access token and calculate expiry time based on the returned date
                const expiryTime = new Date(accessToken.obtainedAt).getTime() + 3600 * 1000;

                // console.log("Access token date: ", accessToken.obtainedAt, "/nExpiry date: ", expiryTime);
    
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
            <NavDropdown />
            <h1>Homepage</h1>
            <div className="homepage-container">
                {!isSpotifyConnected ? (
                    <button className="homepage-connect"
                        onClick={handleConnectSpotify}
                        disabled={loading || !verify}
                    >
                        <img alt="spotify" className="homepage-image"></img>
                        {loading ? "Verifying..." : "Connect Your Spotify Account"}
                    </button>
                ) : (
                    <button className="homepage-quiz" onClick={() => navigate("/quiz-options")}>Song Quiz</button>
                )}
            </div>
        </>
    );
};

export default Homepage;
