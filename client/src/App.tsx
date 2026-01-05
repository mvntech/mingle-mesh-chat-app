import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignUpPage } from "./pages/SignUpPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";

function App() {
  return (
      <>
        <Router>
          <Routes>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Router>
      </>
  )
}

export default App
