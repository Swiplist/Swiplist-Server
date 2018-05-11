const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const Item = require('../item/item.model');
const User = require('../user/user.model');
const config = require('../../config/config');
const steam = require('steam-web');

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
  const s = new steam({
    apiKey: config.steamWebApiKey,
    format: 'json' //optional ['json', 'xml', 'vdf']
  });
  s.resolveVanityURL({
    vanityurl: 'energy0124',
    callback: function (err, data) {
      console.log(data);
    }
  });
  s.getOwnedGames({
    steamid: req.body.steamId,
    include_appinfo: 1,
    include_played_free_games: 1,
    callback: function (err, data) {
      res.json(data);
    }
  });
  // res.send();
}


module.exports = { malAnime, malManga, steamGames };
