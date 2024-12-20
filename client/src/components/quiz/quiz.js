import React, { useState, useEffect, useRef, useCallback} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    getRandomPlaylistTracks,
    loadSpotifyPlayer,
    playSongSnippet,
} from "../spotify/spotifyFunctions";
import { verifyAnswer } from "../quiz/quizQuestions";
import NavDropdown from "../navigate/navigate.js";
import GameBar from "../gamebar/gamebar.js";
import "./quiz.css"

const Quiz = () => {
    const [songs, setSongs] = useState([]);
    const [deviceId, setDeviceId] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userInput, setUserInput] = useState({ song: "", artist: "" });
    const [quizOver, setQuizOver] = useState(false);
    const [loading, setLoading] = useState(true);
    const [inputsDisabled, setInputsDisabled] = useState(false);
    const [scoreMessage, setScoreMessage] = useState("");
    const [difficulty, setDifficulty] = useState("easy");
    const [isRevealed, setIsRevealed] = useState(false);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0);
    const [isSnippetPlaying, setIsSnippetPlaying] = useState(false);
    const [gameBarRefreshKey, setGameBarRefreshKey] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [snippetPlayCount, setSnippetPlayCount] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [isConnectedToPlayback, setIsConnectedToPlayback] = useState(false);


    const location = useLocation();
    const navigate = useNavigate();

    const songInputRef = useRef(null);
    const artistInputRef = useRef(null);

    const pointsRef = useRef(0);

    const saveQuizHistory = (finalPoints) => {
        const token = localStorage.getItem("token");
        
        const data = {
            quizzesTaken: 1,
            questionsAnswered: correctAnswersCount + incorrectAnswersCount,
            lifetimeScore: finalPoints,
            correctAnswers: correctAnswersCount,
            incorrectAnswers: incorrectAnswersCount,
        };
        
        try {
            axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/users/quiz-history`, data, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
            });
            // console.log("Quiz History Saved, Points: ", finalPoints);
            setGameBarRefreshKey((prevKey) => prevKey + 1);
        } catch (error) {
            console.error("Error updating quiz history:", error);
        }
    };

    const initializeQuiz = useCallback(async (playlistId, size) => {
        try {
            setLoading(true);
    
            const tracks = await getRandomPlaylistTracks(playlistId, size);
            setSongs(tracks);
    
            const spotifyTokens = JSON.parse(localStorage.getItem("spotifyTokens"));
    
            if (!isConnectedToPlayback) {
                const deviceId = await loadSpotifyPlayer(spotifyTokens.accessToken);
                setDeviceId(deviceId);
            }
    
            setIsConnectedToPlayback(true);
        } catch (error) {
            console.error("Error initializing quiz:", error.message);
            setIsConnectedToPlayback(false);
        } finally {
            setLoading(false);
        }
    }, [isConnectedToPlayback]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userId = JSON.parse(atob(token.split(".")[1])).id;
        const storedSessionScore = parseInt(localStorage.getItem(`sessionScore_${userId}`), 10);
        if (isNaN(storedSessionScore)){
            localStorage.removeItem(`sessionScore_${userId}`);
            localStorage.setItem(`sessionScore_${userId}`, "0");
            console.log("Session score was invalid. Reset to 0.");
        }
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const playlistId = params.get("playlistId");
        const quizSizeParam = params.get("quizSize");
        const difficultyParam = params.get("difficulty") || "easy";

        setDifficulty(difficultyParam);

        if (playlistId && quizSizeParam) {
            initializeQuiz(playlistId, parseInt(quizSizeParam, 10));
        }
    }, [location, initializeQuiz]);

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

    const handlePlaySnippet = (trackUri) => {
        if (deviceId) {
        
            let snippetDuration = 5000; // Default: 5s
            if (difficulty === "easy") {
                snippetDuration = 10000;    // Easy: 10s
            } else if (difficulty === "medium"){
                snippetDuration = 5000; // Medium: 5s
            } else if (difficulty === "hard") {
                snippetDuration = 2000; // Hard: 2s
            }
        
            setIsSnippetPlaying(true);
            
            try {
                playSongSnippet(deviceId, trackUri, snippetDuration);
                setTimeout(() => {
                    setIsSnippetPlaying(false);
                }, snippetDuration);
            } catch (error) {
                setIsSnippetPlaying(false);
                console.error("Error playing snippet:", error);
            }

            setSnippetPlayCount((prevCount) => {
                const newCount = prevCount + 1;
                if ((difficulty === "easy" && newCount > 3) || (difficulty === "medium" && newCount > 2) || (difficulty === "hard" && newCount > 1)) {
                    pointsRef.current--;
                }
                return newCount;
            });
        } else {
            console.error("Spotify Player not initialized");
            return;
        }
    };

    const moveToNextQuestion = () => {
        setScoreMessage("");
        setIsRevealed(false);
        if (currentQuestionIndex + 1 < songs.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSnippetPlayCount(0);
            setUserInput({ song: "", artist: "" });
            setInputsDisabled(false);
        } else {
            const finalPoints = pointsRef.current;
            saveQuizHistory(finalPoints);
            setQuizOver(true);
        }
    };

    const handleSubmit = () => {
        const token = localStorage.getItem("token");
        const userId = JSON.parse(atob(token.split(".")[1])).id;
        const currentSong = songs[currentQuestionIndex]?.track;
    
        if (!currentSong || !currentSong.artists || currentSong.artists.length === 0) {
            setScoreMessage("Invalid song data. Skipping question.");
            moveToNextQuestion();
            return;
        }
    
        const { scoreIncrement, penalty, feedbackMessage, isCorrect } = verifyAnswer({
            currentSong, userInput, difficulty, isRevealed,
        });
        
        let increment = scoreIncrement - penalty;
        pointsRef.current += increment;

        const currentSessionScore = parseInt(localStorage.getItem(`sessionScore_${userId}` || 0, 10));
        const updatedSessionScore = currentSessionScore + increment;
        localStorage.setItem(`sessionScore_${userId}`, updatedSessionScore);
        setGameBarRefreshKey((prevKey) => prevKey + 1);
        console.log("New Points after verify: ", currentSessionScore);
    
        if (isCorrect) {
            setCorrectAnswersCount((prev) => prev + 1);
        } else {
            setIncorrectAnswersCount((prev) => prev + 1);
        }
    
        setScoreMessage(feedbackMessage);
        setTimeout(() => {
            setScoreMessage("");
            moveToNextQuestion();
        }, 1750);
    };

    const handleRetry = async () => {
        setQuizOver(false);
        pointsRef.current = 0;
        setCorrectAnswersCount(0);
        setIncorrectAnswersCount(0);
        setCurrentQuestionIndex(0);
    
        try {
            setLoading(true);
            const params = new URLSearchParams(location.search);
            const playlistId = params.get("playlistId");
            if (!playlistId) {
                console.error("Playlist ID is missing. Cannot retry quiz.");
                setLoading(false);
                return;
            }

            const newSongs = await getRandomPlaylistTracks(playlistId, songs.length);
            setSongs(newSongs);
        } catch (error) {
            console.error("Error retrying quiz:", error.message);
        } finally {
            setLoading(false);
            setGameBarRefreshKey((prevKey) => prevKey + 1);
        }
    };

    const handleKeyDown = (e, nextInputRef) => {
        if (e.key === "Enter") {
            if (nextInputRef && nextInputRef.current) {
                nextInputRef.current.focus();
            } else {
                handleSubmit();
            }
        }
    };

    const handleAlbumReveal = () => {
        if (difficulty !== "hard") {
            setIsRevealed(true);
        }
    };

    const handleNewQuiz = () => { 
        navigate("/quiz-options");
    };

    const getBlurClass = () => {
        if (difficulty === "easy") return "blur-easy";
        if (difficulty === "medium") return "blur-medium";
        if (difficulty === "hard") return "blur-hard";
    };

    return (
        <div>
            <NavDropdown />
            <GameBar refreshKey={gameBarRefreshKey} />            
            <div className="quiz-container">
                {loading ? (
                    <p>Loading quiz...</p>
                ) : quizOver ? (
                    <div className="quiz-over-container">
                        <h1>Quiz Over!</h1>
                        <p>Your Score: {pointsRef.current}</p>
                        <button onClick={handleNewQuiz} className="quiz-button">
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
                                        isRevealed ? "revealed" : getBlurClass()
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
                                    className={`reveal-button ${isRevealed ? "disabled" : ""}`}
                                    disabled={isRevealed}
                                >
                                    {isRevealed ? "Revealed" : "Reveal"}
                                </button>
                            )}
                        </div>
                        <div className="quiz-message-container">
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
