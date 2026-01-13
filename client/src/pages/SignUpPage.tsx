import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import toast from "react-hot-toast";
import type { RegisterVariables, RegisterResponse } from "../types/auth.ts";
import { REGISTER_USER } from "../mutations/register";
import { setAuthSource } from "../lib/auth-utils";

export function SignUpPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [validationError, setValidationError] = useState("");
    const navigate = useNavigate();
    const [register, { loading, error: mutationError }] = useMutation<RegisterResponse, RegisterVariables>(
        REGISTER_USER, {
        onCompleted: () => {
            toast.success("Registration successful!")
            navigate("/login");
        },
        onError: (error) => {
            toast.error(error.message || "An unexpected error occurred!")
            console.error(error);
        },
    }
    );
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (validationError) setValidationError("");
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setValidationError("");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setValidationError("Please enter a valid email address");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setValidationError("Passwords do not match");
            return;
        }
        if (formData.password.length < 8) {
            setValidationError("Password must be at least 8 characters");
            return;
        }
        if (!formData.username || !formData.email || !formData.password) {
            setValidationError("All fields are required");
            return;
        }
        try {
            await register({
                variables: {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                },
            });
        } catch (error) {
            console.error("Unexpected registration error:", error);
        }
    };
    const passwordRequirements = [
        { text: "At least 8 characters", met: formData.password.length >= 8 },
        { text: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
        { text: "Contains number", met: /[0-9]/.test(formData.password) },
    ];

    return (
        <div className="min-h-screen bg-[#12121A] flex items-center justify-center p-4 py-8">
            <div className="w-full max-w-md">

                <div className="flex flex-col items-center mb-6 md:mb-8">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-[#0A0A0F] rounded-2xl flex items-center justify-center mb-3 md:mb-4">
                        <img src="/icon.png" alt="Logo" />
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">
                        Mingle Mesh
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Connect with friends and family
                    </p>
                </div>

                <div className="bg-[#1A1A24] rounded-xl p-6 md:p-8 shadow-xl border border-[#2a2a35]">
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-6 text-center">
                        Create an Account
                    </h2>

                    {(mutationError || validationError) && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>
                                {validationError ||
                                    mutationError?.message ||
                                    "An error occurred during registration!"}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                                className="w-full bg-[#1f1f2e] text-white placeholder-[#6b7280] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] border border-transparent focus:border-transparent transition-all"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="w-full bg-[#1f1f2e] text-white placeholder-[#6b7280] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] border border-transparent focus:border-transparent transition-all"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a password"
                                    className="w-full bg-[#1f1f2e] text-white placeholder-[#6b7280] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] border border-transparent focus:border-transparent transition-all"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-3 space-y-1 bg-[#15151e] p-3 rounded-lg">
                                    {passwordRequirements.map((req, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <Check
                                                className={`w-3 h-3 ${req.met ? "text-[#22c55e]" : "text-[#6b7280]"
                                                    }`}
                                            />
                                            <span
                                                className={
                                                    req.met ? "text-[#22c55e]" : "text-[#6b7280]"
                                                }
                                            >
                                                {req.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    className={`w-full bg-[#1f1f2e] text-white placeholder-[#6b7280] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all border border-transparent ${formData.confirmPassword &&
                                        formData.password !== formData.confirmPassword
                                        ? "focus:ring-red-500"
                                        : "focus:ring-[#3b82f6]"
                                        }`}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="terms"
                                className="w-4 h-4 mt-0.5 rounded bg-[#1f1f2e] border-gray-600 checked:bg-[#3b82f6] checked:border-[#3b82f6] focus:ring-[#3b82f6] focus:ring-offset-0 focus:ring-offset-[#1A1A24]"
                                required
                                disabled={loading}
                            />
                            <label htmlFor="terms" className="text-sm text-gray-400">
                                {"I agree to the "}
                                <Link to="#" className="text-[#3b82f6] hover:underline">
                                    Terms of Service
                                </Link>
                                {" and "}
                                <Link to="#" className="text-[#3b82f6] hover:underline">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#3b82f6]/50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-[#2a2a4a]"></div>
                        <span className="text-sm text-gray-400">or sign up with</span>
                        <div className="flex-1 h-px bg-[#2a2a4a]"></div>
                    </div>

                    <div className="flex gap-3 md:gap-4">
                        <button
                            onClick={() => {
                                setAuthSource('oauth');
                                window.location.href = `${import.meta.env.VITE_AUTH_URL}/google`;
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#1F1F2E] hover:bg-[#25253A] text-white py-3 rounded-xl transition-colors text-sm md:text-base border border-[#2a2a35] hover:border-[#3a3a4a]">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="hidden sm:inline">Google</span>
                        </button>
                        <button
                            onClick={() => {
                                setAuthSource('oauth');
                                window.location.href = `${import.meta.env.VITE_AUTH_URL}/github`;
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#1F1F2E] hover:bg-[#25253A] text-white py-3 rounded-xl transition-colors text-sm md:text-base border border-[#2a2a35] hover:border-[#3a3a4a]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                            <span className="hidden sm:inline">GitHub</span>
                        </button>
                    </div>

                    <p className="text-center text-[#6b7280] mt-6 text-sm md:text-base">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-[#3b82f6] hover:underline font-medium"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}