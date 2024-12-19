import React, { useEffect, useState } from "react";
import axios from "axios";
import "./gamebar.css";

const GameBar = ({ refreshKey }) => {
    const [userInfo, setUserInfo] = useState({ spotifyUsername: "", firstName: "" });
    const [allTimeScore, setAllTimeScore] = useState(0);
    const [currentSessionScore, setCurrentSessionScore] = useState(0);

    useEffect(() => {
        const fetchGameBarData = async () => {
            try {
                const token = localStorage.getItem("token");
                // Fetch user information
                const userInfoResponse = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/users/user-info`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                
                const { spotifyUsername, firstName, userId } = userInfoResponse.data.userInfo;
                setUserInfo({ spotifyUsername, firstName });
    
                // Fetch quiz history
                const quizHistoryResponse = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/users/quiz-history`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                setAllTimeScore(quizHistoryResponse.data.quizHistory.lifetimeScore);
    
                // Handle session score
                const savedScore = localStorage.getItem(`sessionScore_${userId}`);
                // console.log("Fetched session score:", savedScore, " ", userId); // Debugging
                setCurrentSessionScore(parseInt(savedScore, 10) || 0);
            } catch (error) {
                console.error("Error fetching game bar data:", error.message);
            }
        };
        fetchGameBarData();
    }, [refreshKey]);

    return (
        <div className="gamebar">
            <div>
                <strong>Player:</strong>{" "}
                {userInfo.spotifyUsername || userInfo.firstName || "Unknown User"}
            </div>
            <div>
                <strong>All-Time Score:</strong> {allTimeScore}
            </div>
            <div>
                <strong>Session Score:</strong> {currentSessionScore}
            </div>
        </div>
    );
};

export default GameBar;
