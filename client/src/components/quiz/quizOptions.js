import React, { useState, useEffect } from "react";
import { getUserPlaylists, getPlaylistTracks } from "../spotify/spotifyFunctions.js";
import NavDropdown from "../navigate/navigate.js";

const QuizOptions = () => {
    const [playlists, setPlaylists] = useState([]); // List of playlists
    const [validPlaylists, setValidPlaylists] = useState([]); // Playlists with >= 10 tracks
    const [selectedPlaylist, setSelectedPlaylist] = useState(null); // Chosen playlist
    const [trackCount, setTrackCount] = useState(0); // Track count of selected playlist
    const [quizSizeOptions, setQuizSizeOptions] = useState([]); // Available quiz sizes

    const QUIZ_SIZES = [10, 25, 50, 100];

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        const data = await getUserPlaylists();
        const valid = [];
        for (const playlist of data) {
            const totalTracks = await getPlaylistTracks(playlist.id);
            if (totalTracks >= 10) valid.push({ ...playlist, totalTracks });
        }
        setPlaylists(data);
        setValidPlaylists(valid);
    };

    const handlePlaylistSelect = async (playlist) => {
        let totalTracks = playlist.totalTracks; // Check if totalTracks already exists
    
        if (!totalTracks) {
            totalTracks = await getPlaylistTracks(playlist.id); // Fetch totalTracks dynamically
        }
    
        if (totalTracks < 10) {
            console.error("Playlist must have at least 10 songs.");
            return;
        }
    
        setSelectedPlaylist({ ...playlist, totalTracks });
        setTrackCount(totalTracks);
    
        // Determine available quiz sizes
        const availableSizes = QUIZ_SIZES.filter((size) => size <= totalTracks);
        setQuizSizeOptions(availableSizes);
    };

    return (
        <>
            <NavDropdown />
            <div className="container">
                <h1>Choose a Playlist</h1>

                {/* Playlists */}
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
                                    {!isValid}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>Loading playlists...</p>
                )}

                {/* Quiz Size Options */}
                {selectedPlaylist && (
                    <div>
                        <h2>Select Quiz Size</h2>
                        {QUIZ_SIZES.map((size) => (
                            <button
                                key={size}
                                disabled={!quizSizeOptions.includes(size)}
                                style={{
                                    color: quizSizeOptions.includes(size) ? "black" : "gray",
                                    cursor: quizSizeOptions.includes(size) ? "pointer" : "not-allowed",
                                }}
                            >
                                {size} Songs
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default QuizOptions;