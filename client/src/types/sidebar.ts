import type { UserProfile } from "./user.ts";

export interface SidebarProps {
    activeNav: string;
    onNavChange: (nav: string) => void;
    user?: UserProfile;
}