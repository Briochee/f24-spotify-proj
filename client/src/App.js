import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

// website constants
// import NavDropdown from "./components/navigate/navigate.js";

// webpages
import Login from "./components/login/login.js";
import Home from "./components/homepage/homepage.js";
import QuizOptions from "./components/quiz/quizOptions.js";
import Quiz from "./components/quiz/quiz.js";
import Profile from "./components/profile/profile.js";

function App() {
    return (
        <div className="App">
            <Router>
              <div className="App">
                  <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/homepage" element={<Home />} />
                      <Route path="/quiz-options" element={<QuizOptions />} />
                      <Route path="/quiz" element={<Quiz />} />
                      <Route path="/profile" element={<Profile />} />
                  </Routes>
              </div>
          </Router>
        </div>
    );
}

export default App;