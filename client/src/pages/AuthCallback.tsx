import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "./components/Loader";
import { completeAuth } from "../lib/auth-utils";

export function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("token", token);
            completeAuth(navigate);
        } else {
            toast.error("Authentication failed");
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return (
        <Loader message="Completing your login..." />
    );
}
