import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUserPlaylists, getPlaylistTracks } from "../spotify/spotifyFunctions.js";
import NavDropdown from "../navigate/navigate.js";
import GameBar from "../gamebar/gamebar.js";
import "./quizOptions.css";

const QuizOptions = () => {
    const [validPlaylists, setValidPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [selectedPlaylistName, setSelectedPlaylistName] = useState(null);
    const [playlistSelected, setPlaylistSelected] = useState(false);
    const [quizSizeOptions, setQuizSizeOptions] = useState([]);
    const [selectedSize, setSelectedSize] = useState(null);
    const [difficulty, setDifficulty] = useState("");
    const [sessionScore, setSessionScore] = useState(0);
    const [scrollDirection, setScrollDirection] = useState(1);
    const [isUserInteracting, setIsUserInteracting] = useState(false);
    const scrollContainerRef = useRef(null);

    const QUIZ_SIZES = [10, 25, 50, 100];
    const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const playlistsData = await getUserPlaylists(navigate);
            const valid = [];
            for (const playlist of playlistsData) {
                const totalTracks = await getPlaylistTracks(playlist.id);
                if (totalTracks >= 10) {
                    valid.push({ ...playlist, totalTracks });
                }
            }
            setValidPlaylists(valid);
        };

        const storedSessionScore = localStorage.getItem("sessionScore") || 0;
        setSessionScore(storedSessionScore);
        fetchData();
    }, [navigate]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
    
        const stopAutoScroll = () => {
            setIsUserInteracting(true);
        };
    
        const resumeAutoScroll = () => {
            setIsUserInteracting(false);
        };
    
        const handleUserInteraction = () => {
            stopAutoScroll();
            // resume auto-scroll after user interaction ends
            clearTimeout(scrollContainer.resumeTimeout);
            scrollContainer.resumeTimeout = setTimeout(resumeAutoScroll, 1000); // 1s delay
        };
    
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleUserInteraction);
            scrollContainer.addEventListener("mousedown", stopAutoScroll);
            scrollContainer.addEventListener("touchstart", stopAutoScroll);
            scrollContainer.addEventListener("mouseup", handleUserInteraction);
            scrollContainer.addEventListener("touchend", handleUserInteraction);
        }
    
        return () => {
            if (scrollContainer) {
                clearTimeout(scrollContainer.resumeTimeout);
                scrollContainer.removeEventListener("scroll", handleUserInteraction);
                scrollContainer.removeEventListener("mousedown", stopAutoScroll);
                scrollContainer.removeEventListener("touchstart", stopAutoScroll);
                scrollContainer.removeEventListener("mouseup", handleUserInteraction);
                scrollContainer.removeEventListener("touchend", handleUserInteraction);
            }
        };
    }, []);

    useEffect(() => {
        if (scrollContainerRef.current && !isUserInteracting && !playlistSelected) {
            const scrollContainer = scrollContainerRef.current;
            const interval = setInterval(() => {
                if (scrollDirection === 1 && scrollContainer.scrollLeft + scrollContainer.offsetWidth * 1.01 >= scrollContainer.scrollWidth) {
                    setScrollDirection(-1);
                } else if (scrollDirection === -1 && scrollContainer.scrollLeft <= 0) {
                    setScrollDirection(1);
                }
    
                const scrollAmount = scrollDirection * 4;
                scrollContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
            }, 50); // adjust speed, less is faster
    
            return () => clearInterval(interval);
        }
    }, [validPlaylists, scrollDirection, isUserInteracting, playlistSelected]);

    const handlePlaylistSelect = async (playlist) => {
        if (selectedPlaylist?.id === playlist.id) {
            setSelectedPlaylist(null);
            setSelectedPlaylistName(null);
            setPlaylistSelected(false);
            setScrollDirection(1);
            return;
        }
    
        setPlaylistSelected(true);
        setScrollDirection(0);
    
        let totalTracks = playlist.totalTracks;
        if (!totalTracks) {
            totalTracks = await getPlaylistTracks(playlist.id);
        }
    
        if (totalTracks < 10) {
            console.error("Playlist must have at least 10 songs.");
            return;
        }
    
        setSelectedPlaylist({ ...playlist, totalTracks });
        setSelectedPlaylistName(playlist.name);
    
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
            <GameBar sessionScore={sessionScore} />
            <div className="container">
                <h1>Choose a Playlist</h1>
                {/* Playlists */}
                {validPlaylists.length > 0 ? (
                    <div className="scroll-container" ref={scrollContainerRef}>
                        {validPlaylists.map((playlist) => (
                            <div
                                className="playlist-card"
                                key={playlist.id}
                                onClick={() => handlePlaylistSelect(playlist)}
                                style={{
                                    cursor: "pointer",
                                    backgroundColor: selectedPlaylist?.id === playlist.id ? "#333" : "transparent",
                                    color: selectedPlaylist?.id === playlist.id ? "white": "black",
                                }}
                            >
                                <img
                                    src={playlist.image}
                                    alt={playlist.name}
                                    className="playlist-image"
                                />
                                <span className="playlist-name">{playlist.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Loading playlists...</p>
                )}

                {selectedPlaylistName && (
                    <div className="selected-playlist-name">
                        <h3>Selected Playlist: {selectedPlaylistName}</h3>
                    </div>
                )}

                {/* Quiz Size Options */}
                {selectedPlaylist && (
                    <>
                        <h2>Select Quiz Size</h2>
                        <div className="size-container">
                            {quizSizeOptions.map((size) => (
                                <button
                                    className={`size-button ${selectedSize === size ? "selected" : ""}`}
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size} Songs
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Difficulty Selection */}
                {selectedSize && (
                    <>
                        <h2>Select Difficulty</h2>
                        <div className="difficulty-container">
                            {DIFFICULTY_OPTIONS.map((level) => (
                                <button
                                    className={`difficulty-button ${difficulty === level ? "selected" : ""}`}
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                        <br></br>
                        <button className="start-button" onClick={handleStartQuiz}>Start Quiz</button>
                    </>
                )}
            </div>
        </>
    );
};

export default QuizOptions;