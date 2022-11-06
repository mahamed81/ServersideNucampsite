const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');
const cors = require('./cors');
const campsiteRouter = express.Router();
////////// NOTE: We do not need body parser or anyhting related to it. I will comment it out.
/*
const bodyParser = require('body-parser');
campsiteRouter.use(bodyParser.json());
*/
////////// END NOTE

campsiteRouter.route('/')
////////// FIX 1: The GET endpoint should be accessible to everyone, not just logged in users
//OLD CODE: .get(authenticate.verifyUser, (req, res, next) => {
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
////////// END FIX 1
    Campsite.find()
////////// NOTE: You had commented out the populate method (maybe you were getting errors and commented this out to move on?). It is necessary. I will un-comment it.
    .populate('comments.author')
////////// END NOTE
    .then(campsites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsites);
    })
    .catch(err => next(err));
})
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.create(req.body)
    .then(campsite => {
        console.log('Campsite Created ', campsite);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
})
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /campsites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

campsiteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
////////// NOTE: Same thing here. You had commented out the populate method call. It is needed. I will un-comment it.
    .populate('comments.author')
////////// END NOTE
    .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
})
////////// FIX 2: The assignment wanted you to make the PUT route accessible only by admins.
// OLD CODE: .put(authenticate.verifyUser, (req, res, next) => {
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        ////////// END FIX 2
    Campsite.findByIdAndUpdate(req.params.campsiteId, {
        $set: req.body
    }, { new: true })
    .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndDelete(req.params.campsiteId)
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});


///Comments ends points

campsiteRouter.route('/:campsiteId/comments')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
////////// NOTE: Same thing here. You had commented out the populate method call. It is needed. I will un-comment it.
    .populate('comments.author')
////////// END NOTE
    .then(campsite => {
        if (campsite) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(campsite.comments);
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
////////// FIX 3: Any logged in user should be able to post comments. No need to make it admin only.
// OLD CODE: .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        ////////// END FIX 3
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite) {
            req.body.author = req.user._id;
            campsite.comments.push(req.body);
            campsite.save()
            .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite) {
            for (let i = (campsite.comments.length-1); i >= 0; i--) {
                campsite.comments.id(campsite.comments[i]._id).remove();
            }
            campsite.save()
            .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

campsiteRouter.route('/:campsiteId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
////////// NOTE: Same thing here. You had commented out the populate method call. It is needed. I will un-comment it.
    .populate('comments.author')
////////// END NOTE
    .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(campsite.comments.id(req.params.commentId));
        } else if (!campsite) {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
        } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
////////// FIX 4.1: Looks like you did not attempt Task 4. You were asked to make it so that only the user who originally postedthe comment could edit it.
// We need to test to see if the comment author's ID matches the current user ID (we are using the Mongoose "equals" method since each ID is a special object and not a simple string where could just use "===").
            if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
////////// END FIX 4.1
                if (req.body.rating) {
                    campsite.comments.id(req.params.commentId).rating = req.body.rating;
                }
                if (req.body.text) {
                    campsite.comments.id(req.params.commentId).text = req.body.text;
                }
                campsite.save()
                .then(campsite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite);
                })
                .catch(err => next(err));
////////// FIX 4.2: Else, if the user does not match the comment author, we return the appropriate error message
            } else {
                const err = new Error('You are not authorized to update this comment!');
                err.status = 403;
                return next(err);
            }
////////// END FIX 4.2
        } else if (!campsite) {
            const err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 403;
            return next(err);
        } else {
            const err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 403;
            return next(err);
        }
    })
    .catch(err => next(err));
})
////////// FIX 5: This route should not be limited to admins. Any logged in user should be able to delete their own comment.
// OLD CODE: .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        ////////// END FIX 5
    Campsite.findById(req.params.campsiteId)
    .then(campsite => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
////////// FIX 6.1: Again, Task 4 wanted you to test that the comment's author andthe logged in user matched to ensure that one could only delete a comment they wrote.
// We will use the same logic as in the PUT route.
            if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
////////// END FIX 6.1
                campsite.comments.id(req.params.commentId).remove();
                campsite.save()
                .then(campsite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite);
                })
                .catch(err => next(err));
////////// FIX 6.2: And here's the ELSE to cover when the user and comment author do not match.
            } else {
                const err = new Error('You are not authorized to delete this comment!');
                err.status = 403;
                return next(err);
            }
////////// END FIX 6.2
        } else if (!campsite) {
            const err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 403;
            return next(err);
        } else {
            const err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 403;
            return next(err);
        }
    })
    .catch(err => next(err));
});

module.exports = campsiteRouter;