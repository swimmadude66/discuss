import {Component, Input} from '@angular/core';
import {SubscriberComponent} from '@core/index';
import {ToastService, PostsService} from '@services/index';

@Component({
    selector: 'vote-block',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class VoteBlockComponent extends SubscriberComponent {

    @Input('postId') postId: string;
    @Input('voteCount') voteCount: number;
    @Input('yourVote') yourVote: number;

    constructor(
        private _posts: PostsService,
        private _toast: ToastService,
    ) {
        super();
    }

    vote(score: number): void {
        if (score === 0) {
            return; // invalid state, someone's messing around;
        }
        // save this. if voting fails, we need to be able to restore the vote
        const oldVote = this.yourVote;
        if (this.yourVote === score) {
            // undo your vote from count
            this.voteCount -= this.yourVote;
            // set to 0
            this.yourVote = 0;
        } else {
            const scoreDiff = score - this.yourVote;
            this.yourVote = score;
            this.voteCount += scoreDiff;
        }
        this.addSubscription(
            this._posts.voteForPost(this.postId, this.yourVote)
            .subscribe(
                _ => _,
                err => {
                    this._toast.error(err.error.Error || 'Could not vote on post');
                    const scoreDiff = oldVote - this.yourVote;
                    this.yourVote = oldVote;
                    this.voteCount += scoreDiff;
                }
            )
        );
    }
}
