import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedModule} from '@modules/shared';
import {FeedComponent, PostCardComponent, VoteBlockComponent, PostPageComponent, PostFormComponent, NewPostComponent} from '@components/feed';
import {PostResolver} from '@resolvers/post';

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(
            [
                {path: '', pathMatch: 'full', component: FeedComponent},
                {path: 'new', component: NewPostComponent},
                {path: ':postId', resolve: {post: PostResolver}, component: PostPageComponent}
            ]
        )
    ],
    declarations: [
        FeedComponent,
        PostCardComponent,
        VoteBlockComponent,
        PostPageComponent,
        PostFormComponent,
        NewPostComponent,
    ]
})
export class FeedLazyModule {}
