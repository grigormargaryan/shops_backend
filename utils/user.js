import bcrypt from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import {getEnv} from './util';

const jwtSecret = getEnv('jwtSecret', 'kudoopassport');

module.exports = {
    generatePassword:function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    },

    validPassword:function(password, hashedPassword) {
        return bcrypt.compareSync(password, hashedPassword)
    },

    generateJwt:function(user) {
        return jwt.sign({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        }, jwtSecret);
    },
};