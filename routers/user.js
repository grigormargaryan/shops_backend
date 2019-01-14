import {generateJwt, generateToken} from '../utils/user';
import knex from '../config/database';
import {generatePassword} from '../utils/user';
import bcrypt from 'bcrypt-nodejs';
import async from 'async';

// file upload
import multer from 'multer';
import storage from "../utils/upload";

var multerupload = multer({storage: storage});

module.exports = function (app, passport) {

  app.post('/users/auth/login/', function (req, res) {
    if (!req.body.email || !req.body.password) {
      res.status(400).json({
        "message": "All fields required"
      });
      return;
    }

    passport.authenticate('local', function (err, user, info) {
      if (err) {
        return res.status(404).json(err);
      }
      if (user) {
        let access_token = generateJwt(user);
        let refresh_token = generateToken(user);
        res.status(200).json({
          access_token: access_token,
          refresh_token: refresh_token,
          data: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        });
      } else {
        res.status(400).json(info);
      }
    })(req, res);
  });

  app.post('/users/auth/sign-up/', function (req, res) {
    const inputData = req.body.data;
    // req.checkBody('first_name', 'firstName is required').notEmpty();
    // req.checkBody('email', 'Email is required').notEmpty();
    // req.checkBody('email', 'Email is not valid').isEmail();
    // req.checkBody('last_name', 'firstName is required').notEmpty();
    // var errors = req.validationErrors();
    //
    // if (errors) {
    //   return res.status(400).json({
    //     'message': errors
    //   });
    // }
    if (!req.body.data.email) {
      return res.status(400).json({
        "message": "All fields required"
      });
    }

    const data = {
      firstName: inputData.firstName,
      lastName: inputData.lastName,
      email: inputData.email,
      socialId: inputData.id,
      profilePicURL: inputData.profilePicURL,
    };
    knex.select('*').from('users').where('email', inputData.email).first().then((response) => {
      if (response) {
        if (inputData.id && response.confirmuser === '1') {
          knex('users')
            .where('email', '=', response.email)
            .update(data)
            .returning('*')
            .then((response) => {

              let token = generateJwt(response[0]);
              return res.status(200).json({
                "token": token,
                "success": true,
                'data': {
                  email: response[0].email,
                  firstName: response[0].firstName,
                  lastName: response[0].lastName,
                  profilePicURL: response[0].profilePicURL
                }
              });
            })
        } else {
          if (inputData.id && response.confirmuser === '0') {
            let access_token = generateJwt(response);
            let refresh_token = generateToken(response);
            return res.status(200).json({
              "access_token": access_token,
              "refresh_token": refresh_token,
              'data': {
                access_token: access_token,
                refresh_token: refresh_token,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                profilePicURL: response.profilePicURL
              }
            });
          }
          return res.status(400).json({
            "message": "email already exist"
          });
        }

      } else {
        if (!inputData.id) {
          data.password = generatePassword(req.body.data.password);
          data.confirmuser = '0';
          data.confirmcode = Math.ceil(Math.random() * 100000) + req.body.data.firstName;
        } else {
          data.confirmuser = '0';
        }
        knex('users').insert(data).returning('*').then((response) => {
          let access_token = generateJwt(response[0]);
          let refresh_token = generateToken(response[0]);
          let response_data = {};
          if (!inputData.id) {
            response_data.msg = 'nayi maild';
            app.mailer.send('confirm', {
              to: req.body.data.email,
              subject: 'Test Email',
              confirm_code: data.confirmcode
            }, (err) => {
              if (err) {
                console.log(err);
              }
            });
          } else {
            response_data.access_token = access_token;
            response_data.refresh_token = refresh_token;
            response_data.data = {
              email: response[0].email,
              firstName: response[0].firstName,
              lastName: response[0].lastName,
              confirmcode: response[0].confirmcode,
              socialId: response[0].socialId,
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


  app.post('/users/create-shop/', function (req, res) {
    const inputData = req.body.shop_data;
    let user = knex.select('*').from('users').where('confirmcode', inputData.confirmcode);
    user.first().then((response) => {
      if (response) {
        const data = {
          shop_name: inputData.shop_name,
          organization_name: inputData.organization_name,
          city: inputData.city,
          street: inputData.street,
          contact_email: inputData.contact_email,
          phone: inputData.phone,
          country: inputData.country,
          description: inputData.description,
          users_id: response.id,
        };
        knex('shops').insert(data).returning('*').then((result) => {
          if (result) {
            user.update({
              confirmcode: null,
              confirmuser: '1',
            }).then((user) => {
              if (user) {
                let response_data = {
                  access_token: generateJwt(response),
                  refresh_token: generateToken(response),
                  email: response.email,
                  firstName: response.firstName,
                  lastName: response.lastName

                };
                return res.status(200).json(response_data);
              }
            }).catch(err => {
              console.log(err)
            });
          }
        });
      }else{
        return res.status(400).json({
          "message": "sxal hxum"
        });
      }
    })
  });

  app.post('/profile', passport.authenticate('jwt', {session: false}), function (req, res) {
    console.log(req.user.id);
  });


  app.post('/user/password/forgot', function (req, res) {
    if (!req.body.email) {
      return res.status(200).json({
        "message": "Email Address is Required"
      });
    }

    knex.select('*').from('users').where('email', req.body.email).first().then((response) => {
      if (response) {
        bcrypt.genSalt(32, function (ex, buf) {
          var resets = buf.toString('hex').replace(/\./g, 'wd');
          knex('users')
            .where('email', '=', response.email)
            .update({
              resetcode: resets
            }).then(() => {
            app.mailer.send('forgot', {
              to: req.body.email,
              subject: 'Test Email',
              reset_code: resets
            }, (err) => {
              if (err) {
                console.log(err);
              }
              return res.status(200).json({
                "success": true,
              });
            });
          })
        });
      } else {
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
      if (response) {
        knex('users')
          .where('email', '=', response.email)
          .update({
            resetcode: null,
            password: generatePassword(req.body.password)
          }).then(() => {
          return res.status(200).json({
            "success": true
          });
        })
      } else {
        return res.status(200).json({
          "message": "Error"
        });
      }
    }).catch(err => {
      console.log(err)
    });
  });

  app.post('/users/auth/confirm-email/', function (req, res) {
    knex.select('*').from('users').where('confirmcode', req.body.token).first().then((response) => {
      if (response) {
        return res.status(200).json({
          "success": true
        });
      } else {
        return res.status(400).json({
          "message": "Duq sxal hasceyeq mutqagrel"
        });
      }
    }).catch(err => {
      console.log(err)
    });
  });

  app.post('/create-list', multerupload.any(), (req, res) => {
    let formData = req.files;
    async.each(formData, function (file, eachcallback) {
    }, function (err) {
      if (err) {
        console.log("error ocurred in each", err);
      }
      else {
        console.log("finished prcessing");
      }
    });
  });
  app.post('/users/auth/refresh-token/', passport.authenticate('jwt', {session: false}), function (req, res) {
    const postData = req.body;
    // if((postData.refreshToken) && (postData.refreshToken in tokenList)) {
    //   const user = {
    //     "email": postData.email,
    //     "name": postData.name
    //   };
    //   const token = jwt.sign(user, config.secret, { expiresIn: config.tokenLife})
    //   const response = {
    //     "token": token,
    //   };
    //   // update the token in the list
    //   tokenList[postData.refreshToken].token = token
    //   res.status(200).json(response);
    // } else {
    //   res.status(404).send('Invalid request')
    // }
  })



};
