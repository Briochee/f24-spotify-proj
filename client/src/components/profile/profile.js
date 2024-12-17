import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Function to handle account deletion
    const handleDeleteAccount = async () => {
        const password = prompt("Please enter your password to delete your account:");

        if (!password) {
            alert("Password is required to delete your account.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("You must be logged in to delete your account.");
                navigate("/login");
                return;
            }

            const response = await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/api/users/delete-account`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    data: { password }, // Send password in the request body
                }
            );

            if (response.data.success) {
                alert("Your account has been successfully deleted.");
                localStorage.clear(); // Clear user data
                navigate("/login"); // Redirect to login page
            } else {
                alert(response.data.message || "Failed to delete account. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting account:", error.response?.data || error.message);
            alert(
                error.response?.data?.message ||
                    "An error occurred while deleting your account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectSpotify = async () => {
        const confirmDisconnect = window.confirm(
            "Are you sure you want to disconnect your Spotify account?"
        );
        if (!confirmDisconnect) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("You must be logged in.");
                navigate("/login");
                return;
            }

            // Call the backend API to disconnect Spotify
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/spotify/disconnect`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.message) {
                alert("Spotify account disconnected successfully.");
                // Clear Spotify tokens from localStorage
                localStorage.removeItem("spotifyTokens");
                navigate("/profile");
            }
        } catch (error) {
            console.error("Error disconnecting Spotify:", error.response?.data || error.message);
            alert("Failed to disconnect Spotify account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <NavDropdown />
            <div className="container">
                <h1>Profile</h1>
                <button onClick={handleDeleteAccount} disabled={loading}>
                    {loading ? "Deleting Account..." : "Delete Account"}
                </button>
                <button onClick={handleDisconnectSpotify} disabled={loading}>
                    {loading ? "Disconnecting Spotify..." : "Disconnect Spotify"}
                </button>
            </div>
        </div>
    );
};

export default Profile;