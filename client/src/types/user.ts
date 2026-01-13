export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatar?: string | null;
    isOnline: boolean;
    favorites: string[];
}

export interface ProfilePageProps {
    user?: UserProfile | null;
}

export interface GetMeData {
    me: UserProfile;
}

export interface SearchUsersData {
    getUsers: {
        id: string;
        username: string;
        avatar?: string | null;
        isOnline: boolean;
    }[];
}