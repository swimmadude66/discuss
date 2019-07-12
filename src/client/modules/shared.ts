import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {InputGroupComponent} from '@components/inputgroup/component';
import {ToastComponent} from '@components/toast/component';
import {ShortenTextPipe, FloorNumberPipe, TimeagoPipe} from '@pipes/index';
import {AltTextDirective, ExternalLinkDirective} from '@directives/index';

@NgModule({
    imports:[
        RouterModule,
        CommonModule,
        ReactiveFormsModule,
        HttpClientModule,
    ],
    declarations: [
        InputGroupComponent,
        ToastComponent,
        ShortenTextPipe,
        TimeagoPipe,
        FloorNumberPipe,
        AltTextDirective,
        ExternalLinkDirective,
    ],
    exports: [
        //imports
        RouterModule,
        CommonModule,
        ReactiveFormsModule,
        HttpClientModule,
        // declarations
        InputGroupComponent,
        ToastComponent,
        ShortenTextPipe,
        TimeagoPipe,
        FloorNumberPipe,
        AltTextDirective,
        ExternalLinkDirective,
    ]
})
export class SharedModule {}
