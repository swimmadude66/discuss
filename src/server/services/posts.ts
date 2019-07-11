import {Observable, throwError, of} from 'rxjs';
import {map, switchMap, catchError, tap} from 'rxjs/operators';
import * as uuid from 'uuid/v4';
import { Post, Reply, BasePost} from '../models/post';
import {DatabaseService} from './db';
import {LoggingService} from './logger';

type PostWithVote = Post & {YourVote: number};

export class PostService {
    constructor(
        private _db: DatabaseService,
        private _logger: LoggingService
    ) {}

    createPost(userId: string, title: string, body: string): Observable<PostWithVote> {
        if (!userId.length || !title.length || !body.length) {
            return throwError({Status: 400, Error: 'UserId, Title, and Body are required'});
        }
        const postId = uuid();
        const createQ  = 'Insert into `posts` (`PostId`, `PosterId`, `Title`, `Body`) VALUES (?,?,?,?);';
        const voteQ = 'Insert into `post_votes` (`PostId`, `VoterId`, `Score`) VALUES(?,?,?) ON DUPLICATE KEY UPDATE `Score`=VALUES(`Score`);';
        return this._db.getConnection()
        .pipe(
            switchMap(conn => {
                return this._db.beginTransaction(conn)
                .pipe(
                    switchMap(_ => this._db.connectionQuery(conn, createQ, [postId, userId, title, body])),
                    switchMap(_ => this._db.connectionQuery(conn, voteQ, [postId, userId, 1])),
                    switchMap(_ => this._db.connectionCommit(conn)),
                    catchError(err => this._db.connectionRollback(conn).pipe(switchMap(_ => throwError(err)))),
                    tap(_ => conn.release(), err=> conn.release())
                );
            }),
            map(_ => {
                const post: PostWithVote = {
                    Type: 'post',
                    PostId: postId,
                    PosterId: userId,
                    Title: title,
                    Body: body,
                    PostDate: new Date(),
                    Votes: 0,
                    Replies: [],
                    YourVote: 1
                };
                return post;
            }),
            catchError(err => {
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not create post'});
            })
        );
    }

    editPost(postId: string, userId: string, title: string, body: string): Observable<Post> {
        if (!postId.length || !userId.length || !title.length || !body.length) {
            return throwError({Status: 400, Error: 'PostId, UserId, Title, and Body are required'});
        }
        const q  = 'Update `posts` SET `Title`=?, `Body`=?) WHERE PostId=? AND PosterId=?;';
        return this._db.query(q, [title, body, postId, userId])
        .pipe(
            map(_ => {
                const post: Post = {
                    Type: 'post',
                    PostId: postId,
                    PosterId: userId,
                    Title: title,
                    Body: body,
                    PostDate: new Date(),
                    Votes: 0,
                    Replies: []
                };
                return post;
            }),
            catchError(err => {
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not edit post'});
            })
        );
    }

    createReply(rootId: string, parentId: string, userId: string, title: string, body: string): Observable<Reply> {
        if (!userId.length || !title.length || !body.length || !parentId.length) {
            return throwError({Status: 400, Error: 'ParentId, UserId, Title, and Body are required'});
        }
        const postId = uuid();
        return this._db.query<{PostId: string, Score: number}[]>('Select `PostId`, `Score` from `post_votes` Where `PostId` in (?) && `VoterId`=?;', [[parentId, rootId], userId])
        .pipe(
            switchMap(scores => {
                if (!scores || scores.length < 1) {
                    return throwError({Status: 400, Error: 'You must upvote this post and this reply to continue the discussion'});
                }
                const root = scores.find(s => s.PostId === rootId);
                const parent = scores.find(s => s.PostId === parentId);
                if (!root || !parent || !parent.Score || !root.Score || root.Score !== 1 || parent.Score !== 1) {
                    return throwError({Status: 400, Error: 'You must upvote this post and this reply to continue the discussion'});
                }
                const q  = 'Insert into `posts` (`PostId`, `PosterId`, `Title`, `Body`, `ParentId`) VALUES (?,?,?,?,?);';
                return this._db.query(q, [postId, userId, title, body, parentId])
            }),
            map(_ => {
                const post: Reply = {
                    Type: 'reply',
                    PostId: postId,
                    PosterId: userId,
                    ParentId: parentId,
                    RootId: rootId,
                    Title: title,
                    Body: body,
                    PostDate: new Date(),
                    Votes: 0,
                    Replies: []
                };
                return post;
            }),
            catchError(err => {
                if (err.Status && err.Error) {
                    return throwError(err);
                }
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not create reply'});
            }),
        );
    }

    voteForPost(postId: string, voterId: string, score: (-1 | 0 | 1)): Observable<any> {
        return this._db.query<string[]>('Select `PostId` from `posts` Where `PosterId`=? AND (`RootId`=? OR `ParentId`=?);', [voterId, postId, postId])
        .pipe(
            switchMap(userPosts => {
                if (!userPosts || userPosts.length < 1 || score === 1) {
                    // we good, no comments on the post you are voting on or you are doing a no-op
                    const q  = 'Insert into `post_votes` (`PostId`, `VoterId`, `Score`) VALUES (?,?,?) ON DUPLICATE KEY UPDATE `Score`=VALUES(`Score`);';
                    return this._db.query(q, [postId, voterId, score]);
                } else {
                    // no changing your vote after you comment!
                    return throwError({Status: 400, Error: 'Vote would invalidate your replies'});
                }
            }),
            catchError(err => {
                if (err.Status && err.Error) {
                    return throwError(err);
                }
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not vote on post'});
            }),
        );
    }

    getPosts(userId: string, limit: number = 25, page: number = 0): Observable<PostWithVote[]> {
        const q = 'Select p.*, pr.Score from `postrank` pr join `posts` p on pr.`PostId`=p.`PostId` Where p.`ParentId` is null ORDER BY pr.Rank DESC, pr.Score DESC LIMIT ? OFFSET ?;';
        return this._db.query<Post[]>(q, [limit, (page * limit)])
        .pipe(
            map(results => results.map(r => {
                const post: Post = {
                    Type: 'post',
                    PostId: r.PostId,
                    PosterId: r.PosterId,
                    PostDate: r.PostDate,
                    Title: r.Title,
                    Votes: (r as any).Score,
                    Body: r.Body,
                };
                return post;
            })),
            switchMap(posts => {
                const postIds = posts.map(p => p.PostId);
                const yourScoreQ = 'Select `PostId`, `Score` from `post_votes` Where `VoterId`=? AND `PostId` in (?);'
                return this._db.query<{PostId: string, Score: number}[]>(yourScoreQ, [userId, postIds])
                .pipe(
                    map(votes => {
                        const voteRecord = votes.reduce((prev, curr) => {
                            prev[curr.PostId] = curr.Score || 0;
                            return prev;
                        }, {});
                        const postsWithVotes: PostWithVote[] = posts.map(p => {
                            const pv: PostWithVote = {
                                ...p,
                                YourVote: voteRecord[p.PostId]
                            }
                            return pv;
                        });
                        return postsWithVotes;
                    })
                )
            }),
            catchError(err => {
                if (err.Status && err.Error) {
                    return throwError(err);
                }
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not get Posts'});
            }),
        );
    }

    getPost(postId: string, userId: string): Observable<PostWithVote> {
        const q = 'Select p.*, ps.`Score` as Score from `postscore` ps join `posts` p on p.`PostId`=ps.`PostId` Where (p.`PostId`=? OR p.`RootId`=?) LIMIT 1;';
        return this._db.query<BasePost[]>(q, [postId, postId])
        .pipe(
            switchMap(results => {
                if (!results || results.length < 1) {
                    return throwError({Status: 404, Error: 'Cannot find post'});
                }
                const rootPost = results.find(r => r.PostId === postId);
                if (!rootPost) {
                    return throwError({Status: 404, Error: 'Cannot find post'});
                }
                rootPost.Replies = this._mapReplyTree((results as Reply[]), rootPost.PostId)
                return this._db.query<{Score: number}[]>('Select `Score` from `post_votes` WHERE `PostId`=? AND `VoterId`=?;', [postId, userId])
                .pipe(
                    map(votes => {
                        if (!votes || votes.length < 1) {
                            votes = [{Score: 0}];
                        }
                        const yourVote = votes[0].Score;
                        const post: PostWithVote = {
                            Type: 'post',
                            PostId: rootPost.PostId,
                            PosterId: rootPost.PosterId,
                            PostDate: rootPost.PostDate,
                            Title: rootPost.Title,
                            Votes: (rootPost as any).Score,
                            Body: rootPost.Body,
                            Replies: rootPost.Replies,
                            YourVote: yourVote
                        };
                        return post;
                    }),
                );
            }),
            catchError(err => {
                if (err.Status && err.Error) {
                    return throwError(err);
                }
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not get post'});
            }),
        );
    }

    private _mapReplyTree(posts: Reply[], parentId: string): Reply[] {
        const replies = posts.filter(r => r.ParentId === parentId);
        const filledReplies = replies.map(r => {
            r.Replies = this._mapReplyTree(replies, r.PostId);
            return r;
        });
        return filledReplies;
    }
}
