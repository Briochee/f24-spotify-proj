import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./profile.css";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [quizHistory, setQuizHistory] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("You must be logged in.");
                    navigate("/login");
                    return;
                }
    
                // Fetch user info
                const userInfoResponse = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/users/user-info`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setUserInfo(userInfoResponse.data.userInfo);
    
                // Fetch quiz history
                const quizHistoryResponse = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/users/quiz-history`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setQuizHistory(quizHistoryResponse.data.quizHistory);
            } catch (error) {
                console.error("Error fetching profile data:", error.message);
                alert("Failed to load profile data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
    
        fetchProfileData();
    }, [navigate]);

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
            <NavDropdown isDisabled={true} />
            <div className="container">
                <h1>Profile</h1>
    
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        {userInfo && (
                            <div className="user-information">
                                <h2>User Information</h2>
                                <p><strong>Email:</strong> {userInfo.email}</p>
                                <p><strong>Name:</strong> {userInfo.firstName + " " + userInfo.lastName}</p>
                                <p className="username"><strong>Spotify Username:</strong> {userInfo.spotifyUsername}</p>
                            </div>
                        )}
    
                        {quizHistory && (
                            <div className="quiz-info">
                                <h2>Quiz History</h2>
                                <p><strong>Quizzes Taken:</strong> {quizHistory.quizzesTaken}</p>
                                <p><strong>Questions Answered:</strong> {quizHistory.questionsAnswered}</p>
                                <p className="lifetime"><strong>Lifetime Score:</strong> {quizHistory.lifetimeScore}</p>
                                <p className="correct"><strong>Correct Answers:</strong> {quizHistory.correctAnswers}</p>
                                <p className="wrong"><strong>Incorrect Answers:</strong> {quizHistory.incorrectAnswers}</p>
                            </div>
                        )}
                        <div className="button-container">
                            <button className="delete-account" onClick={handleDeleteAccount} disabled={loading}>
                                {loading ? "Deleting Account..." : "Delete Account"}
                            </button>
                            <button className="disconnect-spotify" onClick={handleDisconnectSpotify} disabled={loading}>
                                {loading ? "Disconnecting Spotify..." : "Disconnect Spotify"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Profile;
