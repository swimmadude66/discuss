import {Component, Input} from '@angular/core';
import {SubscriberComponent} from '@core/index';
import {Post} from '@models/index';
import {PostsService, ToastService} from '@services/index';

@Component({
    selector: 'post-card',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class PostCardComponent extends SubscriberComponent {

    @Input('post') post: Post;
    
    constructor(
        private _posts: PostsService,
        private _toast: ToastService
    ) {
        super();
    }

    vote(score: (-1|0|1)): void {
        this.addSubscription(
            this._posts.voteForPost(this.post.PostId, score)
            .subscribe(
                _ => {
                    this.post.YourVote = score;
                    this.post.Votes += score;
                },
                err => {
                    this._toast.error(err.Error);
                    throw err;
                }
            )
        );
    }

}
