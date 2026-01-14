import { Home, MessageSquareText, Settings, Star, LogOut } from "lucide-react";
import { cn } from "../../lib/utils.ts";
import useLogout from "../../lib/logout";
import type { SidebarProps } from "../../types/sidebar"

const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "chat", icon: MessageSquareText, label: "Chats" },
    { id: "favorites", icon: Star, label: "Favorites" },
    { id: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ activeNav, onNavChange, user, unreadTotal }: SidebarProps) {
    const logout = useLogout();

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 h-20 bg-[#12121a]/95 backdrop-blur-lg flex flex-row items-center justify-around z-50 border-t border-[#1f1f2e] px-2",
            "md:relative md:bottom-auto md:left-auto md:right-auto md:h-[calc(100vh-24px)] md:w-20 lg:w-[100px] md:flex-col md:py-6 md:rounded-2xl md:m-3 md:border-none md:bg-[#12121a]"
        )}>
            <div className="hidden md:block mb-8">
                <button
                    onClick={() => onNavChange("settings")}
                    className="w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 border-[#3b82f6]"
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            src="https://res.cloudinary.com/dgm2hjnfx/image/upload/v1768382070/dummy-avatar_xq8or9.jpg"
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    )}
                </button>
            </div>

            <nav className="flex-1 flex flex-row md:flex-col items-center justify-around md:justify-start w-full md:gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;
                    const hasBadge = item.id === "chat" && (unreadTotal ?? 0) > 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavChange(item.id);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 group transition-all duration-200",
                                "w-full md:w-16 md:h-16 lg:w-16 lg:h-16 md:rounded-xl",
                                !isActive && "text-[#6b7280] hover:text-white"
                            )}
                        >
                            <div className={cn(
                                "relative flex items-center justify-center rounded-full transition-all duration-300",
                                "w-14 h-8 md:w-full md:h-full md:rounded-xl",
                                isActive && "bg-[#3b82f6]/20 text-[#3b82f6]",
                                isActive && "md:bg-[#3b82f6] md:text-white"
                            )}>
                                <Icon className="w-5 h-5 md:w-6 md:h-6" />
                                {hasBadge && (
                                    <div className="absolute -top-1 -right-1 md:-top-1 md:-right-1 bg-[#2563eb] text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                                        {unreadTotal}
                                    </div>
                                )}
                                {isActive && (
                                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#facc15] rounded-l-full" />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] sm:text-xs font-medium md:hidden transition-colors",
                                isActive ? "text-white" : "text-[#6b7280]"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            <button
                onClick={logout}
                className="hidden md:flex w-12 h-12 lg:w-16 lg:h-16 items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#1f1f2e] rounded-xl transition-all duration-200 cursor-pointer"
            >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            </button>
        </div>
    );
}
