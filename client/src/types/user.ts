export interface UserProfile {
    username: string;
    avatar?: string;
}

export interface GetMeData {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    isOnline?: boolean;
}