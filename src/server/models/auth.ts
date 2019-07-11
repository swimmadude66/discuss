export interface UserSession {
    UserId: string; // User Id
    Email?: string;
    SessionKey: string;
    Expires: number;
}

export interface SessionInfo {
    SessionKey: string;
    UserId: number;
    Expires: number;
    UserAgent?: string;
    Created?: Date;
    LastUsed?: number; // unix timestamp from db
    LastAccess?: Date; // Date for use in model
}
