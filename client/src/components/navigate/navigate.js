import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NavDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
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
                    <button onClick={() => navigate("/homepage")}>Home</button>
                    <button onClick={() => navigate("/profile")}>Profile</button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            )}
        </div>
    );
};

export default NavDropdown;