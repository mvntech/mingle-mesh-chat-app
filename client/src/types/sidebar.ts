import type { UserProfile } from "./user";

export interface SidebarProps {
    activeNav: string;
    onNavChange: (id: string) => void;
    user?: UserProfile;
    unreadTotal?: number;
}
