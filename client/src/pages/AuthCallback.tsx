import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("token", token);
            toast.success("Welcome back!");
            navigate("/");
        } else {
            toast.error("Authentication failed");
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-[#12121A] flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-[#3b82f6] animate-spin" />
                <p className="text-gray-400 font-medium">Completing your login...</p>
            </div>
        </div>
    );
}
