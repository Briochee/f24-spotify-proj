import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation} from "react-router-dom";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Profile = () => {
    const navigate = useNavigate();
    const handleDisconnectSpotify = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/spotify/disconnect`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            // Clear local Spotify tokens and update state
            localStorage.removeItem("spotifyAccessToken");
            localStorage.removeItem("spotifyRefreshToken");

            console.log("Spotify disconnected successfully.");
            
            // Navigate to homepage once user disconnects, change later if there are other profile options
            navigate("/homepage");
        } catch (error) {
            console.error("Failed to disconnect Spotify:", error.response?.data || error.message);
        }
    };
    
    // Add a disconnect button to the UI
    return (
        <div>
            <NavDropdown />
            <div className="container">
                <button onClick={handleDisconnectSpotify}>
                    Disconnect Your Spotify Account
                </button>
            </div>
        </div>
    );
};

export default Profile;