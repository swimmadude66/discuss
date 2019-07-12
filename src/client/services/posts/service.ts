import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpCacheService} from '@services/caching';
import {Post, Reply} from '@models/post';

@Injectable({
    providedIn: 'root'
})
export class PostsService {

    constructor(
        private _http: HttpClient,
        private _cache: HttpCacheService,
    ) {

    }

    getPosts(limit: number = 25, page: number = 0): Observable<Post[]> {
        return this._cache.cacheRequest(
            `feed_${limit}_${page}`,
            this._http.get<Post[]>(`/api/posts?limit=${limit}&page=${page}`),
            {cacheTime: 30*1000}    
        );
    }

    getPost(postId: string): Observable<Post> {
        return this._cache.cacheRequest(
            `post_${postId}`,
            this._http.get<Post>(`/api/posts/${postId}`),
            {cacheTime: 30*1000}    
        );
    }

    createPost(title: string, body: string): Observable<Post> {
        this._cache.invalidateCachePattern(/feed_.*/i);
        return this._http.post<Post>('/api/posts', {Title: title, Body: body});
    }

    createReply(rootId: string, parentId: string, body: string): Observable<Reply> {
        this._cache.invalidateCache(`post_${parentId}`);
        return this._http.post<Reply>(`/api/posts/${parentId}/reply`, {RootId: rootId, Body: body});
    }

    voteForPost(postId: string, score: number): Observable<any> {
        return this._http.put<any>(`/api/posts/${postId}/vote`, {Score: score});
    }
}
