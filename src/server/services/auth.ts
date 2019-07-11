import {Observable, of, throwError, forkJoin} from 'rxjs';
import {map, switchMap, catchError} from 'rxjs/operators';
import * as uuid from 'uuid/v4';
import {HashAlgorithm} from '../models/crypto';
import {CryptoService} from './crypto';
import {DatabaseService} from './db';
import {LoggingService} from './logger';

export class AuthService {

    constructor(
        private _crypto: CryptoService,
        private _db: DatabaseService,
        private _logger: LoggingService,
    ) {}

    validatePasswordCriteria(password: string): boolean {
        const length = password.length >= 8;
        const lowerCase = /[a-z]/.test(password);
        const upperCase = /[A-Z]/.test(password);
        const numbers = /[0-9]/.test(password);
        const symobls = /[^a-zA-Z0-9]/.test(password);
        const whitespace = !(/\s/.test(password));
        return length && lowerCase && upperCase && symobls && numbers && whitespace;
    }

    signupWithPassword(email: string, password: string, algorithm: HashAlgorithm): Observable<string> {
        const userId = uuid();
        return this._crypto.hashPassword(password, algorithm)
        .pipe(
            switchMap(passHash => {
                const q = 'Insert into `users` (`UserId`, `Email`, `PasswordHash`, `PasswordAlgorithm`) VALUES(?,?,?,?);';
                return this._db.query(q, [userId, email, passHash, algorithm]);
            }),
            map(_ => userId),
            catchError(err => {
                if (err.Status && err.Error) {
                    return throwError(err);
                }
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not complete signup'});
            })
        );
    }
    
    loginWithPassword(email: string, password: string, algorithm: HashAlgorithm): Observable<string> { // returns userId of successful login
        return this._db.query<any[]>('Select `UserId`, `Email`, `PasswordHash`, `PasswordAlgorithm` from `users` Where `Email`=? LIMIT 1;', [email])
        .pipe(
            switchMap(results => {
                if (!results || results.length <  1) {
                    return throwError({Status: 404, Error: 'No User Found'});
                }
                const authCheck = results[0];
                return of(authCheck).pipe(
                    switchMap(authCheck => {
                        const existingPassHash = this._crypto.validatePassword(password, authCheck.PasswordHash, authCheck.PasswordAlgorithm);
                        if (authCheck.PasswordAlgorithm === algorithm) {
                            return existingPassHash;
                        } else {
                            // If using an older hashing function, hash in old and new
                            // to migrate the user, but only if successful
                            return forkJoin(
                                existingPassHash,
                                this._crypto.hashPassword(password, algorithm)
                            );
                        }
                    }),
                    switchMap(hashes => {
                        let valid: boolean;
                        if (Array.isArray(hashes)) {
                            valid = hashes[0];
                            if (valid) {
                                return this._db.query('Update `users` SET `PasswordHash`=?, `PasswordAlgorithm`=? Where `Email`=?;', [hashes[1], algorithm, email])
                                .pipe(
                                    map(_ => valid)
                                );
                            }
                        } else {
                            valid = hashes;
                        }
                        return of(valid);
                    }),
                    switchMap(valid => {
                        if (!valid) {
                            return throwError({Status: 400, Error: 'Invalid Username or Password'});
                        } else {
                            return of(authCheck.UserId);
                        }
                    })
                )
            }),
            catchError(err => {
                if (err.Status && err.Error) {
                    return throwError(err);
                }
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not complete login'});
            })
        );
    }

    changePassword(userId: string, oldpassword: string, newPassword: string, algorithm: HashAlgorithm): Observable<any> {
        return this._db.query<{PasswordHash: string, PasswordAlgorithm: HashAlgorithm}>('Select `PasswordHash`, `PasswordAlgorithm` from `users` where `UserId`=?;', [userId])
        .pipe(    
            switchMap(savedHash => forkJoin(
                this._crypto.validatePassword(oldpassword, savedHash.PasswordHash, savedHash.PasswordAlgorithm),
                this._crypto.hashPassword(newPassword, algorithm)
            )),
            switchMap(([isValid, passHash]) => {
                if (!isValid) {
                    return throwError({Status: 400, Error: 'Invalid Password'});
                }
                return this._db.query<void>('Update `users` SET `PasswordHash`=?, `PasswordAlgorithm`=? Where `UserId`=?;', [passHash, algorithm, userId]);
            }),
            catchError(err => {
                if (err.Status && err.Error) {
                    return throwError(err);
                }
                this._logger.logError(err);
                return throwError({Status: 500, Error: 'Could not password change'});
            })
        );
    }
}
