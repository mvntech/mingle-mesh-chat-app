export interface UserProfile {
    username: string;
    avatar?: string | null;
}

export interface GetMeData {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    isOnline?: boolean;
    me: {
        id: string;
        username: string;
        email: string;
        avatar: string | null;
        isOnline: boolean;
    };
}

export interface SearchUsersData {
    getUsers: {
        id: string;
        username: string;
        avatar?: string | null;
        isOnline: boolean;
    }[];
}
