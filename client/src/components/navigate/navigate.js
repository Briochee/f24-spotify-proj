import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./navigate.css";

const NavDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
    }, [navigate]);

    // Handle jwt expiry
    const checkTokenValidity = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            handleLogout();
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000; // Current time in seconds
            if (decoded.exp < currentTime) {
                console.warn("Token expired. Logging out...");
                handleLogout();
            }
        } catch (error) {
            console.error("Invalid token. Logging out...", error);
            handleLogout();
        }
    }, [handleLogout]);

    useEffect(() => {
        checkTokenValidity();
    }, [checkTokenValidity]);

    return (
        <div className="navbar">
            <div className="title" onClick={() => navigate("/homepage")}>
                SUBSONIC
            </div>
            <div className="menu-portion">
                <div className={`menu ${isOpen ? "open" : ""}`}>
                    <ul>
                        <li><button onClick={() => navigate("/homepage")}>Home</button></li>
                        <li><button onClick={() => navigate("/profile")}>Profile</button></li>
                        <li><button onClick={handleLogout}>Log Out</button></li>
                    </ul>
                </div>
                <div className="hamburger" onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            
        </div>
    );
};

export default NavDropdown;