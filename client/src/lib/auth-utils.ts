import type { NavigateFunction } from "react-router-dom";
import toast from "react-hot-toast";
import type { AuthSource } from "../types/auth";

const AUTH_SOURCE_KEY = 'auth_source';

export const setAuthSource = (source: AuthSource) => {
    sessionStorage.setItem(AUTH_SOURCE_KEY, source);
};

export const completeAuth = (navigate: NavigateFunction) => {
    const source = sessionStorage.getItem(AUTH_SOURCE_KEY) as AuthSource | null;
    if (source) {
        toast.success("Welcome back!");
        sessionStorage.removeItem(AUTH_SOURCE_KEY);
    }
    navigate("/");
};