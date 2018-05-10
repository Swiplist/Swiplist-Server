const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const uniqueValidator = require('mongoose-unique-validator');

/**
 * User Schema
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    index: true,
    unique: true,
    required: true
  },
  email: {
    type: String,
    index: true,
    unique: true,
    required: true

  },
  passwordHash: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  friends: [{ type: String }],
  items: [{ type: String }],
  iconUrl: {
    type: String
  },

  mobileNumber: {
    type: String,
    match: [/^[0-9]{8}$/, 'The value of path {PATH} ({VALUE}) is not a valid HK mobile number.']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.plugin(uniqueValidator);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
UserSchema.method({});

/**
 * Statics
 */
UserSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};


/**
 * @typedef User
 */
module.exports = mongoose.model('User', UserSchema);
