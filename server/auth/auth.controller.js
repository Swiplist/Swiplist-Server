const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const User = require('../user/user.model');
const config = require('../../config/config');
const bcrypt = require('bcrypt');

const saltRounds = 10;

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
  // With a JSON doc
  User.findOne({
    username: req.body.username
  })
    .exec()
    .then((user) => {
      // logger.log('info', user);
      if (!user) {
        const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
        return next(error);
      }
      return bcrypt.compare(req.body.password, user.passwordHash)
        .then((result) => {
          if (result === true) {
            const token = jwt.sign({
              username: user.username
            }, config.jwtSecret);
            return res.json({
              token,
              username: user.username
            });
          }
          const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
          return next(error);
        })
        .catch(error => next(error));
    })
    .catch(e => next(e));
}

/**
 * Register new user account
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function register(req, res, next) {
  bcrypt.hash(req.body.password, saltRounds)
    .then((hash) => {
      // Store hash in your password DB.
      const user = new User({
        username: req.body.username,
        email: req.body.email,
        passwordHash: hash
      });
      user.save()
        .then((savedUser) => {
          const token = jwt.sign({
            username: savedUser.username
          }, config.jwtSecret);
          return res.json({
            token,
            username: savedUser.username
          });
        })
        .catch(e => next(e));
    })
    .catch(e => next(e));
}

/**
 * This is a protected route. Will return random number only if jwt token is provided in header.
 * @param req
 * @param res
 * @returns {*}
 */
function getRandomNumber(req, res) {
  // req.user is assigned by jwt middleware if valid token is provided
  return res.json({
    user: req.user,
    num: Math.random() * 100
  });
}

module.exports = { login, register, getRandomNumber };
