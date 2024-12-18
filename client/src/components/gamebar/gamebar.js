import React, { useEffect, useState } from "react";
import axios from "axios";
import "./gamebar.css"

const GameBar = ({ sessionScore = 0, refreshKey }) => {
    const [userInfo, setUserInfo] = useState({ spotifyUsername: "", firstName: "" });
    const [allTimeScore, setAllTimeScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGameBarData = async () => {
            try {
                // Fetch user information
                const userInfoResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/user-info`, 
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
                setUserInfo({
                    spotifyUsername: userInfoResponse.data.userInfo.spotifyUsername,
                    firstName: userInfoResponse.data.userInfo.firstName,
                });
    
                // Fetch quiz history
                const quizHistoryResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/quiz-history`, 
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
                setAllTimeScore(quizHistoryResponse.data.quizHistory.lifetimeScore);
            } catch (error) {
                console.error("Error fetching game bar data:", error.message);
            } finally {
                setLoading(false);
            }
        };
    
        fetchGameBarData();
    }, [refreshKey]);

    if (loading) {
        return <div className="gamebar">Loading Game Info...</div>;
    }

    return (
        <div className="gamebar">
            <div>
                <strong>Player:</strong>{" "}
                {userInfo.spotifyUsername || `${userInfo.firstName || "Unknown User"}`}
            </div>
            <div>
                <strong>All-Time Score:</strong> {allTimeScore}
            </div>
            <div>
                <strong>Session Score:</strong> {sessionScore}
            </div>
        </div>
    );
};

export default GameBar;