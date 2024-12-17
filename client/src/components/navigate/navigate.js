import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const NavDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

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
        <div className="nav-dropdown">
            {/* Dropdown button */}
            <button
                className="nav-button"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                Menu
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="dropdown-menu">
                    <button onClick={() => navigate("/homepage")}>Home</button>
                    <button onClick={() => navigate("/profile")}>Profile</button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            )}
        </div>
    );
};

export default NavDropdown;