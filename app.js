import express from 'express';
import passport from 'passport';
import expressValidator from 'express-validator';
import mailer from 'express-mailer'
import bodyParser from 'body-parser';
import passportConfig from './config/passport';
import user from './routers/user.js';


const app = express();


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

passportConfig(passport);

let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
};

mailer.extend(app, {
    from: 'no-reply@example.com',
    host: 'smtp.gmail.com',
    secureConnection: true,
    port: 465,
    transportMethod: 'SMTP',
    auth: {
        user: 'lusinetonoian@gmail.com',
        pass: 'lusine20172017'
    }
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(allowCrossDomain);
app.use(passport.initialize());
app.use(expressValidator());

user(app,passport);

app.listen(3000);