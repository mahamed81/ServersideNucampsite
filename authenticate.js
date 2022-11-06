const passport = require('passport');
////////// NOTE: From the lessons, you are missing importing the local passport strategy.
const LocalStrategy = require('passport-local').Strategy;
////////// END NOTE
const User = require('./models/user');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

const config = require('./config');

////////// NOTE: Looks like you are missing to local passport strategy code as well...
exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
////////// END NOTE

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey, {expiresIn: 3600});
};

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(
    new JwtStrategy(
        opts,
        (jwt_payload, done) => {
            console.log('JWT payload:', jwt_payload);
            User.findOne({_id: jwt_payload._id}, (err, user) => {
                if (err) {
                    return done(err, false);
                } else if (user) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        }
    )
);

exports.verifyUser = passport.authenticate('jwt', {session: false});

exports.verifyAdmin = (req, res, next) => {
    if(req.user.admin){
        return next()
    }else{
////////// NOTE: Make sure to declare your variables with "let" or "const"
// OLD CODE:        err = new Error(`You are not authorized to perform this operation!`);
            const err = new Error(`You are not authorized to perform this operation!`);
////////// END NOTE
            err.status = 403;
            return next(err);
    }
}