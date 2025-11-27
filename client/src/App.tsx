import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MingleMeshApp } from "./components/mingle-mesh-app";
import { SignUpPage } from "./components/sign-up";
import { LoginPage } from "./components/login";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MingleMeshApp />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}
