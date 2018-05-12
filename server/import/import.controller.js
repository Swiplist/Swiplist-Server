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
  return s.getOwnedGames({
    steamid: req.body.steamId,
    include_appinfo: 1,
    include_played_free_games: 1,
    callback: function (err, data) {
      let games = data.response.games;
      let gameIds = games.map(game => game.appid);
      let gameItems = [];
      return Item.find({
        'metadata.appid': {
          $in: gameIds
        }
      })
        .exec()
        .then(items => {
          gameItems.push(...items);
          let newGames = games.filter(game => !items.find(item => parseInt(game.appid) === item.metadata.appid));
          let itemsToBeSaved = [];
          for (let newGame of newGames) {
            let item = new Item({
              name: newGame.name,
              imageUrl: `http://media.steampowered.com/steamcommunity/public/images/apps/${newGame.appid}/${newGame.img_logo_url}.jpg`,
              metadata: {
                //game
                appid: newGame.appid,
                playtime_forever: newGame.playtime_forever,
                img_icon_url: `http://media.steampowered.com/steamcommunity/public/images/apps/${newGame.appid}/${newGame.img_icon_url}.jpg`
              },
              category: 'game'
            });
            itemsToBeSaved.push(item);
          }
          return Item.create(itemsToBeSaved)
            .then(
              savedItems => {
                if (savedItems) gameItems.push(...savedItems);
                return User.get(req.user.id)
                  .then(user => {
                    let likedGames = user.games;
                    likedGames.push(...gameItems);
                    likedGames.sort((a, b) => b.metadata.playtime_forever - a.metadata.playtime_forever);
                    user.games = [...new Set(likedGames.map(game => String(game._id)))];
                    return user.save()
                      .then(savedUser => {
                        return savedUser.populate('games')
                          .execPopulate()
                          .then(populatedUser => {
                            return res.json(populatedUser);
                          })
                          .catch(err => next(err));
                      })
                      .catch(err => next(err));
                  })
                  .catch(err => next(err));
              })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    }
  });

}


module.exports = { malAnime, malManga, steamGames };
