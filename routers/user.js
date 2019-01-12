import { generateJwt }from '../utils/user';
import knex from '../config/database';
import { generatePassword}from '../utils/user';
import bcrypt from 'bcrypt-nodejs';
import async from 'async';

// file upload
import multer from 'multer';
import storage from "../utils/upload";
var multerupload = multer({ storage: storage });

module.exports = function(app, passport) {

    app.post('/login',function(req, res) {
        if(!req.body.email || !req.body.password) {
            res.status(200).json({
                "message": "All fields required"
            });
            return;
        }

        passport.authenticate('local', function(err, user, info){
            if (err) {
                return res.status(404).json(err);
            }
            if(user){
                let token = generateJwt(user);
                res.status(200).json({
                    token : token,
                    success: true,
                    info:{
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                    }
                });
            } else {
                res.status(200).json(info);
            }
        })(req, res);
    });

    app.post('/users/auth/sign-up/',function(req, res) {
        const inputData = req.body;
        req.checkBody('first_name', 'firstName is required').notEmpty();
        req.checkBody('email', 'Email is required').notEmpty();
        req.checkBody('email', 'Email is not valid').isEmail();
        req.checkBody('last_name', 'firstName is required').notEmpty();

        var errors = req.validationErrors();

        if(errors) {
            return res.status(400).json({
                'message':errors
            });
        }

        if(!req.body.email) {
            return res.status(400).json({
                "message": "All fields required"
            });
        }

        const data = {
            firstName: inputData.first_name,
            lastName: inputData.last_name,
            email:inputData.email,
            socialId:inputData.id,
            profilePicURL:inputData.profilePicURL,
        };
        knex.select('*').from('users').where('email', inputData.email).first().then((response) => {
           if(response){
               if(inputData.socialId){
                   knex('users')
                       .where('email', '=', response.email)
                       .update(data)
                       .returning('*')
                       .then((response) => {

                           let token = generateJwt(response[0]);
                           return res.status(200).json({
                               "token": token,
                               "success":true,
                               'data':{
                                   email: response[0].email,
                                   firstName: response[0].firstName,
                                   lastName: response[0].lastName,
                                   role: response[0].role,
                                   profilePicURL: response[0].profilePicURL
                               }
                           });
                   })
               }else{
                   return res.status(400).json({
                       "message": "email already exist"
                   });
               }

           }else{
                if(!inputData.socialId){
                    data.password = generatePassword(req.body.password);
                    data.confirmuser = '0';
                    data.confirmcode =  data.password.substring(4, 32);
                }else{
                    data.confirmuser='1';
                }
               knex('users').insert(data).returning('*').then((response) => {
                   let token = generateJwt(response[0]);
                   let response_data = {
                       "msg":'nayi maild',
                   };
                   if(!inputData.socialId){
                       app.mailer.send('confirm', {
                           to: req.body.email,
                           subject: 'Test Email',
                           confirm_code: data.confirmcode
                       },(err) => {
                           if (err) {
                               console.log(err);
                           }
                       });
                   }else{
                       response_data.token = token;
                       response_data.data = {
                           email: response[0].email,
                           firstName: response[0].firstName,
                           lastName: response[0].lastName,
                       };
                   }
                   return res.status(200).json(response_data);
               }).catch(err => {
                   console.log(err)
               });
           }
        }).catch(err => {
           console.log(err)
        });
    });

    app.post('/profile', passport.authenticate('jwt', { session: false }), function(req, res) {
        console.log('adas');
            res.send('zcxczx');
    });



    app.post('/user/password/forgot', function (req, res) {
        if(!req.body.email) {
            return res.status(200).json({
                "message": "Email Address is Required"
            });
        }

        knex.select('*').from('users').where('email', req.body.email).first().then((response) => {
            if(response) {
                bcrypt.genSalt(32, function(ex, buf) {
                    var resets = buf.toString('hex').replace(/\./g,'wd');
                    knex('users')
                        .where('email', '=', response.email)
                        .update({
                            resetcode: resets
                        }).then(() => {
                            app.mailer.send('forgot', {
                                to: req.body.email,
                                subject: 'Test Email',
                                reset_code: resets
                            },(err) => {
                                if (err) {
                                    console.log(err);
                                }
                                return res.status(200).json({
                                    "success": true,
                                });
                            });
                        })
                });
            }else{
                return res.status(200).json({
                    "message": "Email does not exist"
                });
            }
        }).catch(err => {
            console.log(err)
        });

    });
    app.post('/password-forgot', function (req, res) {

        knex.select('*').from('users').where('resetcode', req.body.reset_code).first().then((response) => {
            if(response) {
                    knex('users')
                        .where('email', '=', response.email)
                        .update({
                            resetcode: null,
                            password:generatePassword(req.body.password)
                        }).then(() => {
                        return res.status(200).json({
                            "success": true
                        });
                    })
            }else{
                return res.status(200).json({
                    "message": "Error"
                });
            }
        }).catch(err => {
            console.log(err)
        });
    });

    app.post('/confirm-user/', function (req, res) {
        knex.select('*').from('users').where('confirmcode', req.body.confirm_code).first().then((response) => {
            if(response) {
                knex('users')
                    .where('email', '=', response.email)
                    .update({
                        confirmcode: null,
                        confirmuser:'Yes'
                    }).then(() => {
                    return res.status(200).json({
                        "success": true
                    });
                })
            }else{
                return res.status(200).json({
                    "message": "Error"
                });
            }
        }).catch(err => {
            console.log(err)
        });
    });

    app.post('/create-list', multerupload.any(), (req, res) => {
        let formData = req.files;
        async.each(formData,function(file,eachcallback){
        },function(err){
            if(err){
                console.log("error ocurred in each",err);
            }
            else{
                console.log("finished prcessing");
            }
        });
    });


};
