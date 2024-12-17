import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation} from "react-router-dom";

// reuseable modules
import { checkSpotifyConnection, clearSpotifyTokens, connectSpotify} from "../spotify/spotifyConnect.js"

// website constants
import NavDropdown from "../navigate/navigate.js";

const Homepage = () => {
    const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserStatus();
    }, []);

    // check user account connection status
    const fetchUserStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/users/check-connection`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        withCredentials: true,
                    }
                );
    
                // Check connection and retrieve tokens if connected
                const { connected, accessToken, refreshToken } = response.data;
    
                // Verify Spotify connection status
                const connectionStatus = connected;
    
                if (connectionStatus) {
                    // Save tokens to local storage
                    if (accessToken && refreshToken) {
                        localStorage.setItem("spotifyAccessToken", accessToken);
                        localStorage.setItem("spotifyRefreshToken", refreshToken);
                        console.log("Spotify tokens stored successfully.");
                    }
    
                    setIsSpotifyConnected(true);
                    updateConnectionStatus(true);
                } else {
                    // console.log("CONNECTION STATUS: ", response);
                    setIsSpotifyConnected(false);
                    updateConnectionStatus(false);
                    clearSpotifyTokens(); // Clear invalid tokens
                    sessionStorage.removeItem("spotifyCallbackProcessed");
                    sessionStorage.removeItem("spotifyRedirectInitiated");
                    console.log("User not connected, clearing tokens");
                }
            }
        } catch (error) {
            console.error("Failed to fetch user status:", error);
            clearSpotifyTokens();
        } finally {
            setLoading(false);
        }
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

    const handleQuizButton = async () => {
        navigate("/quiz");
    }

    const handleConnectSpotify = async () => {
        connectSpotify();
    }

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
                    <button onClick={handleQuizButton}>
                        Song Quiz
                    </button>
                )}
            </div>
        </>
    );
};

export default Homepage;