import React, { useState, useEffect, useRef} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    getRandomPlaylistTracks,
    getPlaylistDetails,
    loadSpotifyPlayer,
    playSongSnippet,
} from "../spotify/spotifyFunctions";
import NavDropdown from "../navigate/navigate.js";
import GameBar from "../gamebar/gamebar.js";

const Quiz = () => {
    const [playlistDetails, setPlaylistDetails] = useState({ name: "", image: null });
    const [songs, setSongs] = useState([]);
    const [deviceId, setDeviceId] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userInput, setUserInput] = useState({ song: "", artist: "" });
    const [points, setPoints] = useState(0);
    const [quizOver, setQuizOver] = useState(false);
    const [loading, setLoading] = useState(true);
    const [inputsDisabled, setInputsDisabled] = useState(false);
    const [scoreMessage, setScoreMessage] = useState("");
    const [difficulty, setDifficulty] = useState("easy");
    const [albumCoverRevealed, setAlbumCoverRevealed] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const playlistId = params.get("playlistId");
        const quizSizeParam = params.get("quizSize");
        const difficultyParam = params.get("difficulty") || "easy";

        setDifficulty(difficultyParam);

        if (playlistId && quizSizeParam) {
            initializeQuiz(playlistId, parseInt(quizSizeParam, 10));
        }
    }, [location]);

    useEffect(() => {
        setInputsDisabled(false);
        setUserInput({ song: "", artist: "" });
    
        setTimeout(() => {
            const songInput = document.querySelector(".song-input");
            if (songInput) {
                songInput.focus();
            }
        }, 0);
    }, [currentQuestionIndex]);

    const handleKeyDown = (e, nextInputRef) => {
        if (e.key === "Enter") {
            if (nextInputRef) {
                nextInputRef.current.focus();
            } else {
                handleSubmit();
            }
        }
    };

    const initializeQuiz = async (playlistId, size) => {
        try {
            setLoading(true);

            const details = await getPlaylistDetails(playlistId);
            setPlaylistDetails(details);

            const tracks = await getRandomPlaylistTracks(playlistId, size);
            setSongs(tracks);

            const spotifyTokens = JSON.parse(localStorage.getItem("spotifyTokens"));
            const deviceId = await loadSpotifyPlayer(spotifyTokens.accessToken);
            setDeviceId(deviceId);
        } catch (error) {
            console.error("Error initializing quiz:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaySnippet = (trackUri) => {
        if (deviceId) {
            let snippetDuration = 15000; // Easy: 15s
            if (difficulty === "medium") snippetDuration = 6000; // Medium: 6s
            else if (difficulty === "hard") snippetDuration = 3000; // Hard: 3s

            playSongSnippet(deviceId, trackUri, snippetDuration);
        } else {
            console.error("Spotify Player not initialized");
        }
    };

    const handleSubmit = () => {
        const currentSong = songs[currentQuestionIndex]?.track;

        const correctSong = currentSong.name.toLowerCase();
        const correctArtist = currentSong.artists[0].name.toLowerCase();

        const inputSong = userInput.song.toLowerCase().trim();
        const inputArtist = userInput.artist.toLowerCase().trim();

        let scoreIncrement = 0;

        if (inputSong === correctSong && inputArtist === correctArtist) {
            scoreIncrement = isRevealed ? 2 : 10; // Reduced points if revealed
            setCorrectAnswersCount((prev) => prev + 1); // Increment correct answers
            setScoreMessage(`Score increased by ${scoreIncrement}!`);
        } else if (inputSong === correctSong || inputArtist === correctArtist) {
            scoreIncrement = isRevealed ? 2 : 5;
            setCorrectAnswersCount((prev) => prev + 1); // Partial correct is also counted
            setScoreMessage(`Score increased by ${scoreIncrement}!`);
        } else {
            setIncorrectAnswersCount((prev) => prev + 1); // Increment incorrect answers
            setScoreMessage(
                `Incorrect! Correct song: "${currentSong.name}" by ${correctArtist}.`
            );
        }

        setPoints((prevPoints) => prevPoints + scoreIncrement);

        setTimeout(() => {
            setScoreMessage("");
            setAlbumCoverRevealed(false);
            setIsRevealed(false);
            if (currentQuestionIndex + 1 < songs.length) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setUserInput({ song: "", artist: "" });
                setInputsDisabled(false);
            } else {
                handleQuizCompletion();
            }
        }, 1500);
    };

    const handleQuizCompletion = async () => {
        setQuizOver(true);

        try {
            const token = localStorage.getItem("token"); // JWT stored in local storage
            const data = {
                quizzesTaken: 1,
                questionsAnswered: correctAnswersCount + incorrectAnswersCount,
                lifetimeScore: points,
                correctAnswers: correctAnswersCount,
                incorrectAnswers: incorrectAnswersCount,
            };

            await axios.put("/api/quiz-history", data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Quiz history updated successfully!");
        } catch (error) {
            console.error("Error updating quiz history:", error.message);
        }
    };


    const handleAlbumReveal = () => {
        if (difficulty !== "hard") {
            setAlbumCoverRevealed(true);
            setIsRevealed(true);
        }
    };

    const getBlurValue = () => {
        if (difficulty === "easy") return "5px";
        if (difficulty === "medium") return "10px";
        if (difficulty === "hard") return "25px";
    };

    return (
        <div>
            <NavDropdown />
            <GameBar sessionScore={points} />
            <div className="container">
                {loading ? (
                    <p>Loading quiz...</p>
                ) : quizOver ? (
                    <div style={{ textAlign: "center" }}>
                        <h1>Quiz Over!</h1>
                        <p>Your Score: {points}</p>
                        <button onClick={() => navigate("/quiz-options")}>New Quiz</button>
                    </div>
                ) : (
                    <>
                        <h2>Question {currentQuestionIndex + 1} of {songs.length}</h2>
                        
                        {/* Album Cover */}
                        <div style={{ position: "relative", textAlign: "center" }}>
                            {songs[currentQuestionIndex]?.track.album.images[0]?.url && (
                                <div
                                    style={{
                                        width: "300px",
                                        height: "300px",
                                        margin: "0 auto",
                                        backgroundImage: `url(${songs[currentQuestionIndex].track.album.images[0].url})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        filter: albumCoverRevealed ? "none" : `blur(${getBlurValue()})`,
                                        position: "relative",
                                        borderRadius: "10px",
                                    }}
                                />
                            )}
                        </div>
    
                        {/* Controls: Play Snippet & Reveal */}
                        <div style={{ textAlign: "center", marginTop: "20px" }}>
                            <button
                                onClick={() =>
                                    handlePlaySnippet(songs[currentQuestionIndex]?.track.uri)
                                }
                                style={{
                                    marginRight: "10px",
                                    padding: "10px 20px",
                                    cursor: "pointer",
                                    borderRadius: "5px",
                                    backgroundColor: "",
                                    color: "",
                                    border: "none",
                                }}
                            >
                                Play Snippet
                            </button>
                            {difficulty !== "hard" && (
                                <button
                                    onClick={handleAlbumReveal}
                                    style={{
                                        padding: "10px 20px",
                                        cursor: "pointer",
                                        borderRadius: "5px",
                                        backgroundColor: "",
                                        color: "#333",
                                        border: "none",
                                    }}
                                    disabled={albumCoverRevealed}
                                >
                                    {albumCoverRevealed ? "Revealed" : "Reveal"}
                                </button>
                            )}
                        </div>
    
                        {/* Inputs */}
                        <p>Enter the song name and artist:</p>
                        <input
                            type="text"
                            placeholder="Song name"
                            className="song-input"
                            value={userInput.song}
                            onChange={(e) => setUserInput({ ...userInput, song: e.target.value })}
                            onKeyDown={(e) =>
                                handleKeyDown(e, document.querySelector(".artist-input"))
                            }
                            disabled={inputsDisabled}
                        />
                        <input
                            type="text"
                            placeholder="Artist name"
                            className="artist-input"
                            value={userInput.artist}
                            onChange={(e) => setUserInput({ ...userInput, artist: e.target.value })}
                            onKeyDown={(e) => handleKeyDown(e, null)}
                            disabled={inputsDisabled}
                        />
                        <button onClick={handleSubmit} disabled={inputsDisabled}>
                            Submit
                        </button>
                        {scoreMessage && <p>{scoreMessage}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default Quiz;