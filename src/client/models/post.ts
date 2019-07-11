export interface BasePost {
    PostId: string; // Id of post/comment
    PosterId: string; // userId of poster
    Title: string;
    PostDate: Date;
    Votes: number;
    Body: string;
    Type: PostType;
    Replies?: Reply[];
    YourVote?: number;
}

export type PostType = 'post' | 'reply';

export interface Post extends BasePost {
    Type: 'post';
}

export interface Reply extends BasePost {
    Type: 'reply';
    ParentId: string; // Id of parent post/comment
    RootId: string; // Id of post if not top level
}

