import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserPlaylists, getPlaylistTracks } from "../spotify/spotifyFunctions.js";
import NavDropdown from "../navigate/navigate.js";
import GameBar from "../gamebar/gamebar.js";

const QuizOptions = () => {
    const [playlists, setPlaylists] = useState([]);
    const [validPlaylists, setValidPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [quizSizeOptions, setQuizSizeOptions] = useState([]);
    const [selectedSize, setSelectedSize] = useState(10);
    const [difficulty, setDifficulty] = useState("easy");
    const [sessionScore, setSessionScore] = useState(0);

    const QUIZ_SIZES = [5, 10, 25, 50, 100];
    const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];

    const navigate = useNavigate();

    const fetchPlaylists = useCallback( async () => {
        const data = await getUserPlaylists(navigate);
        const valid = [];
        for (const playlist of data) {
            const totalTracks = await getPlaylistTracks(playlist.id);
            if (totalTracks >= 10) valid.push({ ...playlist, totalTracks });
        }
        setPlaylists(data);
        setValidPlaylists(valid);
    }, [navigate]);

    useEffect(() => {
        fetchPlaylists();
        const token = localStorage.getItem("token");
        const userId = JSON.parse(atob(token.split(".")[1])).id;

        const storedSessionScore = JSON.parse(localStorage.getItem("sessionScore"));
        if (storedSessionScore && storedSessionScore.userId === userId) {
            setSessionScore(storedSessionScore.points);
        } else {
            setSessionScore(0);
        }
    }, [fetchPlaylists]);

    const handlePlaylistSelect = async (playlist) => {
        let totalTracks = playlist.totalTracks;

        if (!totalTracks) {
            totalTracks = await getPlaylistTracks(playlist.id);
        }

        if (totalTracks < 10) {
            console.error("Playlist must have at least 10 songs.");
            return;
        }

        setSelectedPlaylist({ ...playlist, totalTracks });

        const availableSizes = QUIZ_SIZES.filter((size) => size <= totalTracks);
        setQuizSizeOptions(availableSizes);
    };

    const handleStartQuiz = () => {
        if (selectedPlaylist && selectedSize) {
            navigate(
                `/quiz?playlistId=${selectedPlaylist.id}&quizSize=${selectedSize}&difficulty=${difficulty}`
            );
        }
    };

    return (
        <>
            <NavDropdown />
            <GameBar sessionScore={sessionScore}/>
            <div className="container">
                <h1>Choose a Playlist</h1>
                {validPlaylists.length > 0 ? (
                    <div>
                        {playlists.map((playlist) => {
                            const isValid = validPlaylists.find((p) => p.id === playlist.id);
                            return (
                                <div className="playlist-item" key={playlist.id}>
                                    <button
                                        onClick={() => handlePlaylistSelect(playlist)}
                                        disabled={!isValid}
                                        style={{
                                            color: isValid ? "black" : "gray",
                                            cursor: isValid ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        {playlist.name}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>Loading playlists...</p>
                )}

                {/* Quiz Size Options */}
                {selectedPlaylist && (
                    <>
                        <h2>Select Quiz Size</h2>
                        {quizSizeOptions.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                style={{
                                    fontWeight: selectedSize === size ? "bold" : "normal",
                                }}
                            >
                                {size} Songs
                            </button>
                        ))}
                    </>
                )}

                {/* Difficulty Selection */}
                {selectedSize && (
                    <>
                        <h2>Select Difficulty</h2>
                        {DIFFICULTY_OPTIONS.map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                style={{
                                    fontWeight: difficulty === level ? "bold" : "normal",
                                }}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                        <br />
                        <button onClick={handleStartQuiz}>Start Quiz</button>
                    </>
                )}
            </div>
        </>
    );
};

export default QuizOptions;
