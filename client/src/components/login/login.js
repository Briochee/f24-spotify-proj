import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isLogin, setIsLogin] = useState(true);

    const navigate = useNavigate();

    // Handle login
    const handleLogin = async (e) => {
        e.preventDefault();
    
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/login`,
                { email, password }
            );
    
            // console.log("Login response:", response.data);
            localStorage.setItem("token", response.data.token); // Save token
            navigate("/homepage"); // Redirect after successful login
        } catch (error) {
            console.error("Login failed:", error.response?.data || error.message);
        }
    };

    // Handle registration
    const handleRegister = async (e) => {
        e.preventDefault();
    
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/register`, {
                email,
                password,
                firstName,
                lastName,
            });
            const token = response.data.token;
    
            // Store the token in local storage
            localStorage.setItem("token", token);
    
            // Navigate to the homepage after successful registration
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