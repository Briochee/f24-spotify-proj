import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isLogin, setIsLogin] = useState(true);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const navigate = useNavigate(); // Initialize useNavigate

    // Handle login
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${BACKEND_URL}/api/users/login`, {
                email,
                password,
            });

            // Navigate to homepage after successful login
            navigate("/homepage");
        } catch (err) {
            const errorMessage =
                err.response && err.response.data && err.response.data.message
                    ? err.response.data.message
                    : "Error: " + err.message;
            alert("Login Failed: " + errorMessage);
        }
    };

    // Handle registration
    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${BACKEND_URL}/api/users/register`, {
                email,
                password,
                firstName,
                lastName,
            });

            // Navigate to homepage after successful registration
            navigate("/homepage");
        } catch (err) {
            console.error("Registration Failed: ", err);
        }
    };

    return (
        <div className="login">
            <h2>{isLogin ? "Login" : "Sign Up"}</h2>
            <form onSubmit={isLogin ? handleLogin : handleRegister}>
                {!isLogin && (
                    <>
                        <div>
                            <label>First Name:</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                        <div>
                            <label>Last Name:</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    </>
                )}
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)}>
                Switch to {isLogin ? "Sign Up" : "Login"}
            </button>
        </div>
    );
};

export default Login;