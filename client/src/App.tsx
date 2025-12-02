import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MingleMeshAppWrapper as MingleMeshApp } from "./components/mingle-mesh-app";
import { SignUpPage } from "./components/sign-up";
import { LoginPage } from "./components/login";
import ProtectedRoute from "./lib/protected-routes";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MingleMeshApp />
              </ProtectedRoute>
            }
          />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#1F1F2E",
            color: "#FFFFFF",
            border: "1px solid #2A2A35",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#22C55E",
              secondary: "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
    </>
  );
}
