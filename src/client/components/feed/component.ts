import {Component, OnInit} from '@angular/core';
import {SubscriberComponent} from '@core/index';
import {PostsService} from '@services/posts/service';
import {ToastService} from '@services/index';
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
        private _toast: ToastService
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
}
