const express = require('express');
const validate = require('express-validation');
const expressJwt = require('express-jwt');
const paramValidation = require('../../config/param-validation');
const importCtrl = require('./import.controller');
const config = require('../../config/config');

const router = express.Router(); // eslint-disable-line new-cap

/** POST /api/import/mal/anime - Protected route, import anime list from MAL
 * needs token returned by the above as header. Authorization: Bearer {token}*/
router.route('/mal/anime')
  .post(expressJwt({ secret: config.jwtSecret }), importCtrl.malAnime);

/** POST /api/import/mal/manga - Protected route, import manga list from MAL
 * needs token returned by the above as header. Authorization: Bearer {token}*/
router.route('/mal/manga')
  .post(expressJwt({ secret: config.jwtSecret }), importCtrl.malManga);

/** POST /api/import/steam/games - Protected route, import game library from Steam
 * needs token returned by the above as header. Authorization: Bearer {token} */
router.route('/steam/games')
  .post(expressJwt({ secret: config.jwtSecret }), importCtrl.steamGames);

module.exports = router;
