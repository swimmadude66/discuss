import {Component, Input, Output, EventEmitter} from '@angular/core';
import {FormControl, Validators, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {PostType} from '@models/index';
import {SubscriberComponent} from '@core/index';

type PartialPost = {
    Title?: string;
    Body: string;
};

@Component({
    selector: 'post-form',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class PostFormComponent extends SubscriberComponent {

    isLoading: boolean;

    @Input('type') set type(t: PostType) {
        this._type = t;
        if (t === 'post') {
            this.isReply = false;
            this.titleControl.enable();
            this.titleControl.setValidators([Validators.required]);
        } else {
            this.isReply = true;
            this.titleControl.setValue(null);
            this.titleControl.disable();
            this.titleControl.setValidators([]);
        }
    }

    @Input('resetSubject') set resetSubject(r: Subject<boolean>) {
        this.addSubscription(
            r.subscribe(
                success => {
                    if (success) {
                        this.form.reset();
                    }
                    if (!this.isReply) {
                        this.titleControl.enable();
                    }
                    this.isLoading = false;
                }
            )
        );
    }

    @Output('result') result: EventEmitter<PartialPost> = new EventEmitter<PartialPost>();

    get type(): PostType {
        return this._type;
    }

    isReply: boolean;
    private _type: PostType;

    titleControl = new FormControl(null, []);
    bodyControl = new FormControl(null, [Validators.required]);

    form: FormGroup = new FormGroup({
        Title: this.titleControl,
        Body: this.bodyControl
    });

    constructor() {
        super();
    }

    onSubmit() {
        this.isLoading = true;
        const post: PartialPost = this.form.value;
        this.titleControl.disable();
        this.result.emit(post);
    }
}
