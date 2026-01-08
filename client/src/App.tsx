import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MingleMeshAppWrapper as MingleMeshChat } from "./pages/MingleMeshChat";
import { SignUpPage } from "./pages/SignUpPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import ProtectedRoute from "./lib/protected-route";
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
                                <MingleMeshChat />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
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
                    duration: 2000,
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