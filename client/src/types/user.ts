export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  isOnline: boolean;
}

export interface GetMeData {
  me: CurrentUser; 
}