import knex from './database';
const LocalStrategy   = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
import {validPassword}from '../utils/user';
import {getEnv} from '../utils/util';



module.exports = function(passport) {

    var opts = {}
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = getEnv('jwtSecret', 'kudoopassport');

    passport.use(new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password'
        },
        function(email, password, done) {
            knex.select('*').from('users').where('email', email).first().then((user) => {
                if (!user) {
                    return done(null, false, {message: 'User Not Found'});
                }
                if (!validPassword(password, user.password)) {
                    return done(null, false, {message: 'Wrong password.'});
                }
                if(user.confirmuser === 'No'){
                    return done(null, false, {message: 'User has not confirmed email.'});
                }
                else {
                    return done(null, user);
                }
            }).catch(error => {
                return done(error);
            })
        })
    );

    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        knex.select('*').from('users').where('id', jwt_payload.id).first().then((user) => {
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        }).catch(error => {
            return done(error, false);
        })
    }));


};