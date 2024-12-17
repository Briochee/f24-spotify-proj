import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation} from "react-router-dom";

// website constants
import NavDropdown from "../navigate/navigate.js";

const Quiz = () => {
    const [playlists, setPlaylists] = useState([]); // To store user's playlists
    const [selectedPlaylist, setSelectedPlaylist] = useState(null); // To store the selected playlist

    useEffect(() => {
        const token = localStorage.getItem("spotifyAccessToken");
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const token = localStorage.getItem("spotifyAccessToken");
            if (!token) {
                console.error("No Spotify access token found.");
                return;
            }

            // Fetch the user's playlists from Spotify API
            const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setPlaylists(response.data.items);
        } catch (error) {
            console.error("Failed to fetch playlists:", error.response?.data || error.message);
        }
    };

    const handlePlaylistSelect = (playlistId) => {
        setSelectedPlaylist(playlistId);
        // console.log(`Selected Playlist ID: ${playlistId}`);
    };

    return (
        <>
            <div>
                <NavDropdown />
            </div>
            <div className="container">
                
                <h1>Choose a Playlist</h1>

                {/* Render the playlists */}
                {playlists.length > 0 ? (
                    <div>
                        {playlists.map((playlist) => (
                            <div className="playlist-item" key={playlist.id}>
                                <button onClick={() => handlePlaylistSelect(playlist.id)}>
                                    {playlist.name}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Loading playlists or none found...</p>
                )}
            </div>
        </>
    );
};

export default Quiz;