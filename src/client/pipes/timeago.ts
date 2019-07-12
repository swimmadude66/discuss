import {PipeTransform, Pipe} from '@angular/core';

const TIMES = {
    min :   60,
    hour:   60 * 60,
    day :   60 * 60 * 24,
    week:   60 * 60 * 24 * 7, // just in case
}

@Pipe({
    name: 'timeago',
    pure: false
})
export class TimeagoPipe implements PipeTransform {
 
    transform(input: string | Date): string {
        let datestring: string;
        if (typeof input !== 'string') {
            datestring = input.toISOString();
        } else {
            datestring = input;
        }
        
        const now = new Date().valueOf();
        const then = new Date(datestring);

        // diff is the number of seconds between then and now
        const diff = Math.floor((now - then.valueOf())/1000);
        if (diff < TIMES.min) { // less than 1 minute ago
            return 'just now';
        }
        if (diff < TIMES.hour) { // less than 1 hour ago
            const minutes = Math.max(Math.floor(diff / TIMES.min), 1);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        }
        if (diff < TIMES.day) { // less than 1 day ago
            const hours = Math.max(Math.floor(diff / TIMES.hour), 1);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
        if (diff >= TIMES.day) { // 1 or more days
            return `${then.getMonth()+1}/${then.getDate()}/${then.getFullYear()}`;
        }
    }
}
