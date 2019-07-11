import {Router} from 'express';
import {createHmac} from 'crypto';
import {tap} from 'rxjs/operators';
import {Config} from '../models/config';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;
    const sessionManager = APP_CONFIG.sessionManager;

    router.use((req, res, next) => {
        if (res.locals.auth) {
            return next();
        }
        if ((!req.headers.authorization || req.headers.authorization.length< 1) && (!req.signedCookies || !req.signedCookies[APP_CONFIG.cookie_name])) {
            res.locals.auth = null;
            return next();
        }
        let accessToken;
        // Check for auth header, used for secure webviews and server-side rendering
        if (req.headers.authorization && req.headers.authorization.length) {
            let auth = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
            const authParts = auth.split('|', 2);
            let body = '';
            let sig = '';
            if (authParts && authParts.length) {
                body = authParts[0].replace(/^\s*bearer\s+/i, '');
            }
            if (authParts && authParts.length > 1) {
                sig = authParts[1];
            }
            if (body.length && sig.length) {
                const hmac = createHmac('sha512', APP_CONFIG.cookie_secret);
                const sigCompare = hmac.update(body).digest('base64');
                if (sigCompare === sig) {
                    accessToken = body;
                }
            }
        }
        // prefer signed cookies if present
        if (!accessToken && req.signedCookies && req.signedCookies[APP_CONFIG.cookie_name]) {
            accessToken = req.signedCookies[APP_CONFIG.cookie_name];
        }
        // otherwise, assume no-auth
        if (!accessToken) {
            delete res.locals.auth;
            delete res.locals.session;
            return next();
        }
        // update user's session
        sessionManager.getUserSession(accessToken)
        .pipe(
            tap(result => {
                if (result && result.SessionKey) {
                    sessionManager.updateAccess(result.SessionKey).subscribe(_ => _, err=> logger.logError(err));
                }
            })
        )
        .subscribe(
            result => {
                if (!result) {
                    return next();
                }
                res.locals.usersession = result;
                return next();
            }, err => {
                logger.logError(err);
                return next();
            }
        );
    });


    return router;
}
