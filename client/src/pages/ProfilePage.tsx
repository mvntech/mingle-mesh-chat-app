import { useState, useEffect } from "react";
import { useMutation, useApolloClient } from "@apollo/client/react";
import toast from "react-hot-toast";
import { uploadToCloudinary } from "../lib/cloudinary";
import { cn } from "../lib/utils";
import useLogout from "../lib/logout";
import { Camera, Loader2, LogOut } from "lucide-react";
import { UPDATE_PROFILE } from "../mutations/updateProfile";
import type { ProfilePageProps } from "../types/user";

export function ProfilePage({ user }: ProfilePageProps) {
    const client = useApolloClient();
    const [updateProfile] = useMutation(UPDATE_PROFILE);
    const logout = useLogout();
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => {
        if (user) {
            setUsername(user.username || "");
            setAvatar(user.avatar || "");
        }
    }, [user]);
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            const result = await uploadToCloudinary(file, client);
            setAvatar(result.secure_url);
            toast.success("Avatar uploaded successfully!");
        } catch {
            toast.error("Avatar upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            toast.error("Username cannot be empty");
            return;
        }
        try {
            setIsSaving(true);
            await updateProfile({
                variables: {
                    username: username.toLowerCase().trim(),
                    avatar,
                },
                onCompleted: () =>
                    toast.success("Profile updated successfully!"),
                onError: (error) =>
                    toast.error(error.message || "Failed to update profile"),
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 py-8 pb-24 md:pb-8 w-full h-full bg-[#0a0a0f]">
            <div className="w-full max-w-md space-y-8">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#12121a] bg-[#111116]">
                            <img
                                src={avatar || "https://res.cloudinary.com/dgm2hjnfx/image/upload/v1768382070/dummy-avatar_xq8or9.jpg"}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full cursor-pointer shadow-lg transition">
                            <Camera className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                disabled={isUploading}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <h1 className="text-xl md:text-2xl font-bold text-white">
                        Edit your profile
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Update your personal information below
                    </p>
                </div>

                <div className="bg-[#1A1A24] rounded-xl p-6 shadow-xl border border-[#2a2a35]">
                    <form onSubmit={handleSave} className="space-y-4">

                        <div className="space-y-2">
                            <label className="block text-sm text-gray-400 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="w-full bg-[#1f1f2e] text-white placeholder-[#6b7280] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] border border-transparent focus:border-transparent transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2 opacity-80">
                            <label className="block text-sm text-gray-400 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full bg-[#1f1f2e] text-gray-400 placeholder-[#6b7280] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6] border border-transparent focus:border-transparent transition-all cursor-not-allowed"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={
                                isSaving ||
                                isUploading ||
                                (username === user?.username && avatar === user?.avatar)
                            }
                            className={cn(
                                "w-full mt-2 py-3 rounded-xl font-medium text-white transition-colors",
                                "flex items-center justify-center gap-2",
                                "bg-[#3b82f6] hover:bg-[#2563eb]",
                                "disabled:bg-[#3b82f6]/80 disabled:cursor-not-allowed"
                            )}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving changes...
                                </>
                            ) : (
                                "Save changes"
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full mt-2 px-4 py-3 rounded-xl text-white bg-[#2a2a35] transition-colors md:hidden flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
