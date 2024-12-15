import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const NavDropdown = () => {
    const [isOpen, setIsOpen] = useState(false); // Toggle dropdown
    const navigate = useNavigate();

    const handleLogout = () => {
        // Perform logout actions (e.g., clearing tokens)
        localStorage.removeItem("token"); // Example: remove token from local storage
        navigate("/login"); // Redirect to login page
    };

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
                    <ul>
                        <li onClick={() => navigate("/")}>Home</li>
                        <li onClick={() => navigate("/profile")}>Profile</li>
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NavDropdown;