import {Component, Input} from '@angular/core';
import {SubscriberComponent} from '@core/index';
import {Post} from '@models/index';
import {PostsService, ToastService} from '@services/index';

@Component({
    selector: 'post-card',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class PostCardComponent {

    @Input('post') post: Post;
    
    constructor() {}

}
