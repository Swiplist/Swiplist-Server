const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const Item = require('../item/item.model');
const User = require('../user/user.model');
const config = require('../../config/config');

// const logger = require('../../config/winston');


/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function malAnime(req, res, next) {

}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function malManga(req, res, next) {

}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function steamGames(req, res, next) {

}


module.exports = { malAnime, malManga, steamGames };
