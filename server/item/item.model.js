const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

/**
 * Item Schema
 */
const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: false
  },
  dataUrl: { // type specific url, can be video, youtube, or music url
    type: String,
    required: false
  },
  category: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
ItemSchema.method({});

/**
 * Statics
 */
ItemSchema.statics = {
  /**
   * Get item
   * @param {ObjectId} id - The objectId of item.
   * @returns {Promise<Item, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((item) => {
        if (item) {
          return item;
        }
        const err = new APIError('No such item exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List items in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of items to be skipped.
   * @param {number} limit - Limit number of items to be returned.
   * @returns {Promise<Item[]>}
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
 * @typedef Item
 */
module.exports = mongoose.model('Item', ItemSchema);