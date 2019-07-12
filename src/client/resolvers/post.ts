import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, empty } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {Post} from '@models/index';
import {PostsService} from '@services/index';

@Injectable({
    providedIn: 'root'
})
export class PostResolver implements Resolve<Post> {

    constructor(
        private _router: Router,
        private _post: PostsService
    ) {}

    resolve(route: ActivatedRouteSnapshot): Observable<Post> {
        return this._post.getPost(route.paramMap.get('postId'))
        .pipe(
            catchError((err) => {
                this._router.navigate(['/']);
                return empty();
            })
        );
    }
}
