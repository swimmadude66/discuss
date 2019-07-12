import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {SubscriberComponent} from '@core/index';
import {PostsService, ToastService} from '@services/index';

@Component({
    selector: 'new-post',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class NewPostComponent extends SubscriberComponent implements OnInit {

    resetSubject: Subject<boolean>;

    constructor(
        private _postService: PostsService,
        private _toast: ToastService,
        private _router: Router
    ) {
        super();
    }

    ngOnInit() {
        this.resetSubject = new Subject<boolean>();
    }

    createPost(post: {Title: string, Body: string}): void {
        this.addSubscription(
            this._postService.createPost(post.Title, post.Body)
            .subscribe(
                r => {
                    this.resetSubject.next(true);
                    this._router.navigate(['/']);
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
