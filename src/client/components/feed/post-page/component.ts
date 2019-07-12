import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {SubscriberComponent} from '@core/index';
import {PostsService, ToastService} from '@services/index';
import {Post} from '@models/index';

@Component({
    selector: 'post-page',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class PostPageComponent extends SubscriberComponent implements OnInit {

    post: Post;
    resetSubject: Subject<boolean>;

    constructor(
        private _postService: PostsService,
        private _route: ActivatedRoute,
        private _toast: ToastService
    ) {
        super();
    }

    ngOnInit() {
        const snapshot = this._route.snapshot;
        if (snapshot && snapshot.data && snapshot.data.post) {
            this.post = snapshot.data.post;
        }

        this.resetSubject = new Subject<boolean>();

    }

    addReply(reply: {Body: string}): void {
        this.addSubscription(
            this._postService.createReply(this.post.PostId, this.post.PostId, reply.Body)
            .subscribe(
                r => {
                    this.resetSubject.next(true);
                    this.post.Replies.push(r);
                },
                err => {
                    this._toast.error(err.error.Error);
                    this.resetSubject.next(false);
                    throw err;
                } 
            )
        );
    }
}
