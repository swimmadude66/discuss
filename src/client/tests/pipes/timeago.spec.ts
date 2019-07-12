import {expect} from 'chai';
import {TimeagoPipe} from '@pipes/index';

describe('TimeagoPipe', () => {

    let pipe: TimeagoPipe;

    before(() => {
        pipe = new TimeagoPipe();
    });

    describe('transform', () => {

        it('should return "just now" for diff < 60s', () => {
            const now = new Date();
            const then = new Date(now.valueOf() - 1000); // 1s ago
            // Test with Date Object
            const agoDate = pipe.transform(then);
            expect(agoDate).to.exist;
            expect(agoDate).to.be.a('string');
            expect(agoDate).to.equal('just now');

            // Test with ISO string
            const agoString = pipe.transform(then.toISOString());
            expect(agoString).to.exist;
            expect(agoString).to.be.a('string');
            expect(agoString).to.equal('just now');
        });

        it('should return "just now" for future dates', () => {
            const now = new Date();
            const then = new Date(now.valueOf() + 60 * 1000); // 1m from now
            // Test with Date Object
            const agoDate = pipe.transform(then);
            expect(agoDate).to.exist;
            expect(agoDate).to.be.a('string');
            expect(agoDate).to.equal('just now');

            // Test with ISO string
            const agoString = pipe.transform(then.toISOString());
            expect(agoString).to.exist;
            expect(agoString).to.be.a('string');
            expect(agoString).to.equal('just now');
        });

        it('should return "1 minute" for times between 60 - 120 seconds', () => {
            const now = new Date();
            const then = new Date(now.valueOf() - 60 * 1000); // 1m ago 
            // Test with Date Object
            const agoDate = pipe.transform(then);
            expect(agoDate).to.exist;
            expect(agoDate).to.be.a('string');
            expect(agoDate).to.equal('1 minute ago');

            // Test with ISO string
            const agoString = pipe.transform(then.toISOString());
            expect(agoString).to.exist;
            expect(agoString).to.be.a('string');
            expect(agoString).to.equal('1 minute ago');
        });

        it('should return "x minutes" for times between 2 - 60 minutes', () => {
            const now = new Date();
            const then = new Date(now.valueOf() - 2 * 60 * 1000); // 2m ago 
            const then2 = new Date(now.valueOf() - 59 * 60 * 1000); // 59m ago 
            // Test with Date Object
            const agoDate = pipe.transform(then);
            expect(agoDate).to.exist;
            expect(agoDate).to.be.a('string');
            expect(agoDate).to.equal('2 minutes ago');

            const agoDate2 = pipe.transform(then2);
            expect(agoDate2).to.exist;
            expect(agoDate2).to.be.a('string');
            expect(agoDate2).to.equal('59 minutes ago');

            // Test with ISO string
            const agoString = pipe.transform(then.toISOString());
            expect(agoString).to.exist;
            expect(agoString).to.be.a('string');
            expect(agoString).to.equal('2 minutes ago');

            const agoString2 = pipe.transform(then2.toISOString());
            expect(agoString2).to.exist;
            expect(agoString2).to.be.a('string');
            expect(agoString2).to.equal('59 minutes ago');
        });

        it('should return "1 hour" for times between 60 - 120 minutes', () => {
            const now = new Date();
            const then = new Date(now.valueOf() - 60 * 60 * 1000); // 1h ago 
            // Test with Date Object
            const agoDate = pipe.transform(then);
            expect(agoDate).to.exist;
            expect(agoDate).to.be.a('string');
            expect(agoDate).to.equal('1 hour ago');

            // Test with ISO string
            const agoString = pipe.transform(then.toISOString());
            expect(agoString).to.exist;
            expect(agoString).to.be.a('string');
            expect(agoString).to.equal('1 hour ago');
        });

        it('should return "x hours" for times between 2 - 24 hours', () => {
            const now = new Date();
            const then = new Date(now.valueOf() - 2 * 60 * 60 * 1000); // 2h ago 
            const then2 = new Date(now.valueOf() - 23 * 60 * 60 * 1000); // 23h ago 
            // Test with Date Object
            const agoDate = pipe.transform(then);
            expect(agoDate).to.exist;
            expect(agoDate).to.be.a('string');
            expect(agoDate).to.equal('2 hours ago');

            const agoDate2 = pipe.transform(then2);
            expect(agoDate2).to.exist;
            expect(agoDate2).to.be.a('string');
            expect(agoDate2).to.equal('23 hours ago');

            // Test with ISO string
            const agoString = pipe.transform(then.toISOString());
            expect(agoString).to.exist;
            expect(agoString).to.be.a('string');
            expect(agoString).to.equal('2 hours ago');

            const agoString2 = pipe.transform(then2.toISOString());
            expect(agoString2).to.exist;
            expect(agoString2).to.be.a('string');
            expect(agoString2).to.equal('23 hours ago');
        });

        it('should return a simple date format for any diff >= 1 day', () => {
            const now = new Date();
            const then = new Date(now.valueOf() - 24 * 60 * 60 * 1000); // 1d ago 
            const then2 = new Date(now.valueOf() - 45 * 24 * 60 * 60 * 1000); // 45d ago 

            // Test with Date Object
            const agoDate = pipe.transform(then);
            expect(agoDate).to.exist;
            expect(agoDate).to.be.a('string');
            expect(agoDate).to.equal(`${then.getMonth()+1}/${then.getDate()}/${then.getFullYear()}`);

            const agoDate2 = pipe.transform(then2);
            expect(agoDate2).to.exist;
            expect(agoDate2).to.be.a('string');
            expect(agoDate2).to.equal(`${then2.getMonth()+1}/${then2.getDate()}/${then2.getFullYear()}`);

            // Test with ISO string
            const agoString = pipe.transform(then.toISOString());
            expect(agoString).to.exist;
            expect(agoString).to.be.a('string');
            expect(agoString).to.equal(`${then.getMonth()+1}/${then.getDate()}/${then.getFullYear()}`);
            const agoString2 = pipe.transform(then2);
            expect(agoString2).to.exist;
            expect(agoString2).to.be.a('string');
            expect(agoString2).to.equal(`${then2.getMonth()+1}/${then2.getDate()}/${then2.getFullYear()}`);
        });
        
    });
});
