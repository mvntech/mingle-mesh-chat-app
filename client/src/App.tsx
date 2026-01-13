import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
const MingleMeshChat = lazy(() => import("./pages/MingleMeshChat").then(module => ({ default: module.MingleMeshAppWrapper })));
const SignUpPage = lazy(() => import("./pages/SignUpPage").then(module => ({ default: module.SignUpPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(module => ({ default: module.LoginPage })));
const AuthCallback = lazy(() => import("./pages/AuthCallback").then(module => ({ default: module.AuthCallback })));
import Loader from "./pages/components/Loader";
import ProtectedRoute from "./lib/protected-route";
import PWAPrompt from "./pages/components/PWAPrompt";

export default function App() {
    return (
        <>
            <PWAPrompt />
            <Suspense fallback={<Loader message="Loading..." />}>
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
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/auth-callback" element={<AuthCallback />} />
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
            </Suspense>
        </>
    );
}