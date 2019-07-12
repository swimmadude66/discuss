import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {SubscriberComponent} from '@core/index';
import {PostsService} from '@services/posts/service';
import {ToastService, AuthService} from '@services/index';
import {Post} from '@models/post';

@Component({
    selector: 'feed',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class FeedComponent extends SubscriberComponent implements OnInit {

    posts: Post[] = [];
    
    constructor(
        private _postService: PostsService,
        private _auth: AuthService,
        private _toast: ToastService,
        private _router: Router
    ) {
        super();
    }

    ngOnInit() {
        this.addSubscription(
            this._postService.getPosts()
            .subscribe(
                posts => {
                    this.posts = posts;
                },
                err => {
                    this._toast.error('Could not load posts', 'There was a problem!');
                    throw err;
                }
            )
        );
    }

    logOut() {
        this.addSubscription(
            this._auth.logOut()
            .pipe(
                catchError(e => of(true))
            )
            .subscribe(
                _ => this._router.navigate(['/login'])
            )
        );
    }
}
