export interface ProtectedRouteProps {
    children: React.ReactNode;
}

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    isOnline?: boolean;
}

export interface AuthPayload {
    token: string;
    user: AuthUser;
}

export interface LoginResponse {
    login: AuthPayload;
}

export interface LoginVariables {
    email: string;
    password: string;
}

export interface RegisterResponse {
    register: AuthPayload;
}

export interface RegisterVariables {
    username: string;
    email: string;
    password: string;
}

export type AuthSource = 'oauth' | 'credentials';
