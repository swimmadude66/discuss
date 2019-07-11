import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedModule} from '@modules/shared';
import {FeedComponent, PostCardComponent} from '@components/feed';

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(
            [
                {path: '', pathMatch: 'full', component: FeedComponent},
            ]
        )
    ],
    declarations: [
        FeedComponent,
        PostCardComponent
    ]
})
export class FeedLazyModule {}
