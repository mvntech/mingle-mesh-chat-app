import { useNavigate } from "react-router-dom";
import { Home, MessageCircle, Settings, LogOut } from "lucide-react";
import { cn } from "../../lib/utils.ts";
import useLogout from "../../lib/logout";
import type { SidebarProps } from "../../types/sidebar"

const navItems = [
    { id: "home", icon: Home, path: "/" },
    { id: "chat", icon: MessageCircle, path: "/" },
    { id: "settings", icon: Settings, path: "/settings" },
];

export function Sidebar({ activeNav, onNavChange, user }: SidebarProps) {
    const logout = useLogout();
    const navigate = useNavigate();

    return (
        <div className="w-[100px] bg-[#12121a] flex flex-col items-center py-6 rounded-2xl m-3">
            <div className="mb-8">
                <button
                    onClick={() => {
                        onNavChange("settings");
                        navigate("/settings");
                    }}
                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#3b82f6]"
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                            }}
                        />
                    ) : (
                        <img
                            src="/dummy-user.jpeg"
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    )}
                </button>
            </div>

            <nav className="flex-1 flex flex-col items-center gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavChange(item.id);
                                navigate(item.path);
                            }}
                            className={cn(
                                "relative w-16 h-16 flex items-center justify-center rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-[#3b82f6] text-white"
                                    : "text-[#6b7280] hover:text-white hover:bg-[#1f1f2e]"
                            )}
                        >
                            <Icon className="w-6 h-6" />
                            {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#facc15] rounded-l-full" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <button
                onClick={logout}
                className="w-16 h-16 flex items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#1f1f2e] rounded-xl transition-all duration-200 cursor-pointer"
            >
                <LogOut className="w-6 h-6" />
            </button>
        </div>
    );
}