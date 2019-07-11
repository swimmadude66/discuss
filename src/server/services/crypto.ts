import {from, Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {createHash, randomBytes} from 'crypto';
import * as argon2 from 'argon2';
import {HashAlgorithm} from '../models/crypto';

// An extra layer of separation, so I don't have to update the auth service/routes
// if we decide to switch password hashing methods

// I used sha in initial testing, moving to argon2 to "productionize" it
export class CryptoService {

    hashPassword(password: string, algorithm: HashAlgorithm): Observable<string> {
        switch (algorithm) {
            case 'argon2':
                return this._argonHash(password);
                break;
            case 'sha256':
                return this._sha256Hash(password);
                break;
            case 'sha512':
                return this._sha512Hash(password);
                break;
            default:
                return this._argonHash(password);
                break;
        }
    }

    validatePassword(provided: string, saved: string, algorithm: HashAlgorithm): Observable<boolean> {
        switch (algorithm) {
            case 'argon2':
                return this._argonVerify(provided, saved);
                break;
            case 'sha256':
                return this._sha256Verify(provided, saved);
                break;
            case 'sha512':
                return this._sha512Verify(provided, saved);
                break;
            default:
                return this._argonVerify(provided, saved);
                break;
        }
    }

    // Generate
    private _argonHash(password: string): Observable<string> {
        return from(argon2.hash(password))
        .pipe(
            map(hash => Buffer.from(hash, 'utf8').toString('base64'))
        );
    }

    private _sha256Hash(password: string, salt?: string): Observable<string> {
        if (!salt) {
            salt = randomBytes(16).toString('base64');
        }
        const shaHash = createHash('sha256').update(`${salt}|${password}`).digest('base64');
        return of(`${salt}|${shaHash}`);
    }

    private _sha512Hash(password: string, salt?: string): Observable<string> {
        if (!salt) {
            salt = randomBytes(16).toString('base64');
        }
        const shaHash = createHash('sha512').update(`${salt}|${password}`).digest('base64');
        return of(`${salt}|${shaHash}`);
    }

    // Compare
    private _argonVerify(provided: string, saved: string): Observable<boolean> {
        const hash = Buffer.from(saved, 'base64').toString('utf8');
        return from(argon2.verify(hash, provided))
        .pipe(
            catchError(e => of(false))
        );
    }

    private _sha256Verify(provided: string, saved: string): Observable<boolean> {
        const hashParts = provided.split('|', 2);
        if (!hashParts || hashParts.length < 2) {
            console.error('improperly formatted sha256 hash');
            return of(false);
        }
        const salt = hashParts[0];
        return this._sha256Hash(provided, salt).pipe(
            map(hash => hash === saved)
        );
    }

    private _sha512Verify(provided: string, saved: string): Observable<boolean> {
        const hashParts = provided.split('|', 2);
        if (!hashParts || hashParts.length < 2) {
            console.error('improperly formatted sha512 hash');
            return of(false);
        }
        const salt = hashParts[0];
        return this._sha512Hash(provided, salt).pipe(
            map(hash => hash === saved)
        );
    }
}
