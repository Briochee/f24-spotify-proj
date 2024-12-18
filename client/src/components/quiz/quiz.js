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
import "./quiz.css"

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
    const [isSnippetPlaying, setIsSnippetPlaying] = useState(false);
    const [gameBarRefreshKey, setGameBarRefreshKey] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [snippetPlayCount, setSnippetPlayCount] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();

    const songInputRef = useRef(null);
    const artistInputRef = useRef(null);

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
            if (nextInputRef && nextInputRef.current) {
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

    const handlePlaySnippet = async (trackUri) => {
        if (deviceId) {
            let snippetDuration = 10000; // Easy: 10s
            if (difficulty === "medium") snippetDuration = 5000; // Medium: 5s
            else if (difficulty === "hard") snippetDuration = 2000; // Hard: 2s
    
            setIsSnippetPlaying(true);
    
            // Play the snippet
            await playSongSnippet(deviceId, trackUri, snippetDuration);
    
            setTimeout(() => {
                setIsSnippetPlaying(false);
            }, snippetDuration);
    
            setSnippetPlayCount((prevCount) => {
                const newCount = prevCount + 1;
    
                if (
                    (difficulty === "easy" && newCount > 3) ||
                    (difficulty === "medium" && newCount > 2) ||
                    (difficulty === "hard" && newCount > 1)
                ) {
                    setPoints((prevPoints) => Math.max(prevPoints - 1));
                }
    
                return newCount;
            });
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
    
        // If no input is provided
        if (!inputSong && !inputArtist) {
            const penalty = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 5;
            setScoreMessage(`No input provided! ${penalty} points deducted.`);
            setPoints((prevPoints) => Math.max(prevPoints - penalty, 0));
            setIncorrectAnswersCount((prev) => prev + 1);
            moveToNextQuestion();
            return;
        }
    
        // If one or both inputs are incorrect
        if (inputSong !== correctSong || inputArtist !== correctArtist) {
            const penalty = !inputSong || !inputArtist
                ? difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3 
                : difficulty === "easy" ? 1 : difficulty === "medium" ? 3 : 5;
    
            setScoreMessage(`Incorrect! ${penalty} points deducted.`);
            setPoints((prevPoints) => Math.max(prevPoints - penalty, 0));
            setIncorrectAnswersCount((prev) => prev + 1);
        }
    
        // Full correct answer
        if (inputSong === correctSong && inputArtist === correctArtist) {
            if (isRevealed) {
                scoreIncrement = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 10;
            } else {
                scoreIncrement = 10;
            }
            setCorrectAnswersCount((prev) => prev + 1);
            setScoreMessage(`Score increased by ${scoreIncrement}!`);
        }
        // Partial correct answer
        else if (inputSong === correctSong || inputArtist === correctArtist) {
            if (isRevealed) {
                scoreIncrement = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 5;
            } else {
                scoreIncrement = 5;
            }
            setCorrectAnswersCount((prev) => prev + 1);
            setScoreMessage(`Score increased by ${scoreIncrement}!`);
        }
    
        // Update points after scoring logic
        setPoints((prevPoints) => prevPoints + scoreIncrement);
    
        moveToNextQuestion();
    };

    const moveToNextQuestion = () => {
        setTimeout(() => {
            setScoreMessage("");
            setAlbumCoverRevealed(false);
            setIsRevealed(false);
            if (currentQuestionIndex + 1 < songs.length) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setSnippetPlayCount(0);
                setUserInput({ song: "", artist: "" });
                setInputsDisabled(false);
            } else {
                handleQuizCompletion();
            }
        }, 1500);
    };

    const handleQuizCompletion = async () => {
        setQuizOver(true);
        localStorage.setItem("sessionScore", points);
    
        try {
            const token = localStorage.getItem("token");
            const data = {
                quizzesTaken: 1,
                questionsAnswered: correctAnswersCount + incorrectAnswersCount,
                lifetimeScore: points,
                correctAnswers: correctAnswersCount,
                incorrectAnswers: incorrectAnswersCount,
            };
    
            await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/users/quiz-history`, data, {
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

    const handleRetry = async () => {
        setQuizOver(false);
        setPoints(0);
        setCorrectAnswersCount(0);
        setIncorrectAnswersCount(0);
        setCurrentQuestionIndex(0);
    
        try {
            setLoading(true);
            if (!playlistDetails?.id) {
                console.error("Playlist ID is missing. Cannot retry quiz.");
                setLoading(false);
                return;
            }
    
            const newSongs = await getRandomPlaylistTracks(
                playlistDetails.id,
                songs.length
            );
    
            setSongs(newSongs);
        } catch (error) {
            console.error("Error retrying quiz:", error.message);
        } finally {
            setLoading(false);
            setGameBarRefreshKey((prevKey) => prevKey + 1); // Increment refresh key
        }
    };

    const getBlurClass = () => {
        if (difficulty === "easy") return "blur-easy";
        if (difficulty === "medium") return "blur-medium";
        if (difficulty === "hard") return "blur-hard";
    };

    return (
        <div>
            <NavDropdown />
            <GameBar sessionScore={points} refreshKey={gameBarRefreshKey} />            <div className="container">
                {loading ? (
                    <p>Loading quiz...</p>
                ) : quizOver ? (
                    <div className="quiz-over-container">
                        <h1>Quiz Over!</h1>
                        <p>Your Score: {points}</p>
                        <button onClick={() => navigate("/quiz-options")} className="quiz-button">
                            New Quiz
                        </button>
                        <button onClick={handleRetry} className="quiz-button">
                            Retry Quiz
                        </button>
                    </div>
                ) : (
                    <>
                        <h2>Question {currentQuestionIndex + 1} of {songs.length}</h2>
    
                        {/* Album Cover */}
                        <div className="album-cover-container">
                            {songs[currentQuestionIndex]?.track.album.images[0]?.url && (
                                <div
                                    className={`album-cover ${
                                        albumCoverRevealed ? "revealed" : getBlurClass()
                                    }`}
                                    style={{
                                        backgroundImage: `url(${songs[currentQuestionIndex]?.track.album.images[0]?.url})`,
                                    }}
                                />
                            )}
                        </div>
                        <div className="quiz-actions">
                            <button
                                onClick={() =>
                                    handlePlaySnippet(songs[currentQuestionIndex]?.track.uri)
                                }
                                className={`play-snippet-button ${isSnippetPlaying ? "disabled" : ""}`}
                                disabled={isSnippetPlaying}
                            >
                                {isSnippetPlaying ? "Playing..." : "Play Snippet"}
                            </button>
                            {difficulty !== "hard" && (
                                <button
                                    onClick={handleAlbumReveal}
                                    className={`reveal-button ${albumCoverRevealed ? "disabled" : ""}`}
                                    disabled={albumCoverRevealed}
                                >
                                    {albumCoverRevealed ? "Revealed" : "Reveal"}
                                </button>
                            )}
                        </div>
                        <div className="message-container">
                            {scoreMessage && <p className="score-message">{scoreMessage}</p>}
                        </div>
    
                        {/* Inputs */}
                        <div className="quiz-inputs">
                            <p>Enter the song name and artist:</p>
                            <input
                                type="text"
                                placeholder="Song name"
                                className="song-input"
                                ref={songInputRef}
                                value={userInput.song}
                                onChange={(e) => setUserInput({ ...userInput, song: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, artistInputRef)}
                                disabled={inputsDisabled}
                            />
                            <input
                                type="text"
                                placeholder="Artist name"
                                className="artist-input"
                                ref={artistInputRef}
                                value={userInput.artist}
                                onChange={(e) => setUserInput({ ...userInput, artist: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, null)}
                                disabled={inputsDisabled}
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={inputsDisabled || isSnippetPlaying}
                                className="submit-button"
                            >
                                Submit
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Quiz;