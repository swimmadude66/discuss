import {Router} from 'express';
import {Config} from '../models/config';
import {PostService} from '../services/posts';
import {UserSession} from '../models/auth';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;
    const postService = new PostService(APP_CONFIG.db, APP_CONFIG.logger);

    router.get('/', (req, res) => {
        const usersession: UserSession = res.locals.usersession;
        if (!usersession || !usersession.UserId) {
            return res.status(401).send({Error: 'Not logged in'});
        }
        let limit: number;
        let page: number;
        if (req.query.limit && /[0-9]+/.test(req.query.limit)) {
            limit = +req.query.limit;
        }
        if (('page' in req.query) && /[0-9]+/.test(req.query.page)) {
            page = +req.query.page;
        }
        postService.getPosts(usersession.UserId, limit, page)
        .subscribe(
            posts => {
                return res.send(posts);
            },
            err => {
                logger.logError(err);
                return res.status(500).send(err);
            }
        )
    });

    router.post('/', (req, res) => {
        const usersession: UserSession = res.locals.usersession;
        if (!usersession || !usersession.UserId) {
            return res.status(401).send({Error: 'Not logged in'});
        }
        const body = req.body;
        if (!body || !body.Title || !body.Body) {
            return res.status(400).send({Error: 'Title and Body are required fields'});
        } 
        
        postService.createPost(usersession.UserId, body.Title, body.Body)
        .subscribe(
            post => {
                return res.send(post);
            },
            err => {
                logger.logError(err);
                return res.status(500).send(err);
            }
        )
    });

    router.get('/:postId', (req, res) => {
        const usersession: UserSession = res.locals.usersession;
        if (!usersession || !usersession.UserId) {
            return res.status(401).send({Error: 'Not logged in'});
        }
        postService.getPost(req.params.postId, usersession.UserId)
        .subscribe(
            post => res.send(post),
            err => res.status(err.Status).send({Error: 'Could not retrieve post'})
        );
    });

    router.put('/:postId/vote', (req, res) => {
        const usersession: UserSession = res.locals.usersession;
        if (!usersession || !usersession.UserId) {
            return res.status(401).send({Error: 'Not logged in'});
        }
        const body = req.body;
        if (!body || !('Score' in body) || (body.Score !== -1 && body.Score !== 0 && body.Score !== 1)) {
            return res.status(400).send({Error: 'Score is required and must be -1, 0, or 1'});
        }
        postService.voteForPost(req.params.postId, usersession.UserId, body.Score)
        .subscribe(
            _ => res.send(),
            err => {
                logger.logError(err);
                return res.status(500).send(err);
            }
        )
    });

    router.post('/:postId/reply', (req, res) => {
        const usersession: UserSession = res.locals.usersession;
        if (!usersession || !usersession.UserId) {
            return res.status(401).send({Error: 'Not logged in'});
        }
        const body = req.body;
        if (!body || !body.RootId || !body.Body) {
            return res.status(400).send({Error: 'RootId and Body are required parameters'});
        }
        postService.createReply(body.RootId, req.params.postId, usersession.UserId, body.Body)
        .subscribe(
            reply => res.send(reply),
            err => {
                logger.logError(err);
                return res.status(500).send(err);
            }
        )
    });

    return router;
}
