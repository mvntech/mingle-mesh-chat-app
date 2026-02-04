import { useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client/react";
import { useCallback } from "react";
import toast from "react-hot-toast";

export default function useLogout() {
    const navigate = useNavigate();
    const client = useApolloClient();

    return useCallback(async () => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            await client.clearStore();
            navigate("/login", { replace: true });
            toast.success("Logged out successfully!");
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Logout failed. Please try again!");
        }
    }, [client, navigate]);
}