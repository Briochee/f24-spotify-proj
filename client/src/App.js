import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

// website constants
// import NavDropdown from "./components/navigate/navigate.js";

// webpages
import Login from "./components/login/login.js";
import Home from "./components/homepage/homepage.js";
import Callback from "./components/callback/callback.js";

function App() {
    return (
        <div className="App">
            <Router>
              <div className="App">
                  <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/homepage" element={<Home />} />
                      <Route path="/spotify-callback" element={<Callback />} />
                  </Routes>
              </div>
          </Router>
        </div>
    );
}

export default App;
