// const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const Item = require('../item/item.model');
const User = require('../user/user.model');
const config = require('../../config/config');
const Steam = require('steam-web');
// const malScraper = require('mal-scraper');
const axios = require('axios');
const { parseString } = require('xml2js');

// const logger = require('../../config/winston');


/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function malAnime(req, res, next) {
  return User.get(req.user.id)
    .then((user) => {
      const username = req.body.username;
      return axios.get('https://myanimelist.net/malappinfo.php', {
        params: {
          u: username,
          status: 'all',
          type: 'anime' // This can be changed to 'manga' too to retrieve manga lists.
        }
      })
        .then(({ data }) => {
          parseString(data, { explicitArray: false, emptyTag: null }, (err, list) => {
            if (err) next(err);
            const mal = list.myanimelist;
            if (!mal) {
              next(new APIError('User does not exist.', httpStatus.NOT_FOUND));
            }
            // return res.json(mal);
            const animes = mal.anime;
            const animeIds = animes.map(anime => anime.series_animedb_id);
            const animeItems = [];
            return Item.find({
              'metadata.series_animedb_id': {
                $in: animeIds
              }
            })
              .exec()
              .then((items) => {
                animeItems.push(...items);
                const newAnimes = animes.filter(anime => !items.find(
                  item => String(anime.series_animedb_id)
                    === String(item.metadata.series_animedb_id))
                );
                const itemsToBeSaved = [];
                for (const newAnime of newAnimes) {
                  const item = new Item({
                    name: newAnime.series_title,
                    imageUrl: newAnime.series_image,
                    metadata: JSON.parse(JSON.stringify(newAnime)),
                    category: 'anime',
                    src: 'mal',
                    createdBy: user._id
                  });
                  delete item.metadata.my_id;
                  delete item.metadata.my_watched_episodes;
                  delete item.metadata.my_start_date;
                  delete item.metadata.my_finish_date;
                  delete item.metadata.my_score;
                  delete item.metadata.my_status;
                  delete item.metadata.my_rewatching;
                  delete item.metadata.my_rewatching_ep;
                  delete item.metadata.my_last_updated;
                  delete item.metadata.my_tags;
                  item.markModified('metadata');
                  itemsToBeSaved.push(item);
                }
                return Item.create(itemsToBeSaved)
                  .then(
                    (savedItems) => {
                      if (savedItems) animeItems.push(...savedItems);
                      const likedAnime = user.anime;
                      const animeItemsWithScore = animeItems.map(
                        (item1) => {
                          item1.metadata =
                            animes.find(
                              item2 =>
                                item2 && String(item1.metadata.series_animedb_id)
                                === String(item2.series_animedb_id)
                            );
                          return item1;
                        }
                      );
                      animeItemsWithScore.sort(
                        (a, b) => b.metadata.my_score - a.metadata.my_score
                      );
                      likedAnime.push(...animeItemsWithScore);
                      user.importedAnime = animeItemsWithScore;
                      user.markModified('importedAnime');
                      user.anime = [...new Set(likedAnime.map(anime => String(anime._id)))];
                      return user.save()
                        .then(savedUser => savedUser.populate('anime')
                          .execPopulate()
                          .then(populatedUser => res.json(populatedUser))
                          .catch(e => next(e)))
                        .catch(e => next(e));
                    })
                  .catch(e => next(e));
              })
              .catch(e => next(e));
          });
        })
        .catch(err => next(err));
    })
    .catch(e => next(e));
  // return malScraper.getWatchListFromUser(username)
  //   .then(data => res.json(data))
  //   .catch(err => next(err));
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function malManga(req, res, next) {
  return User.get(req.user.id)
    .then((user) => {
      const username = req.body.username;
      return axios.get('https://myanimelist.net/malappinfo.php', {
        params: {
          u: username,
          status: 'all',
          type: 'manga' // This can be changed to 'manga' too to retrieve manga lists.
        }
      })
        .then(({ data }) => {
          parseString(data, { explicitArray: false, emptyTag: null }, (err, list) => {
            if (err) next(err);
            const mal = list.myanimelist;
            if (!mal) {
              next(new APIError('User does not exist.', httpStatus.NOT_FOUND));
            }
            // return res.json(mal);
            const mangaList = mal.manga;
            const mangaIds = mangaList.map(manga => manga.series_mangadb_id);
            const mangaItems = [];
            return Item.find({
              'metadata.series_mangadb_id': {
                $in: mangaIds
              }
            })
              .exec()
              .then((items) => {
                mangaItems.push(...items);
                const newMangaList = mangaList.filter(manga => !items.find(
                  item => String(manga.series_mangadb_id)
                    === String(item.metadata.series_mangadb_id))
                );
                const itemsToBeSaved = [];
                for (const newManga of newMangaList) {
                  const item = new Item({
                    name: newManga.series_title,
                    imageUrl: newManga.series_image,
                    metadata: JSON.parse(JSON.stringify(newManga)),
                    category: 'manga',
                    src: 'mal',
                    createdBy: user._id
                  });
                  delete item.metadata.my_id;
                  delete item.metadata.my_read_chapters;
                  delete item.metadata.my_read_volumes;
                  delete item.metadata.my_start_date;
                  delete item.metadata.my_finish_date;
                  delete item.metadata.my_score;
                  delete item.metadata.my_status;
                  delete item.metadata.my_rereadingg;
                  delete item.metadata.my_rereading_chap;
                  delete item.metadata.my_last_updated;
                  delete item.metadata.my_tags;
                  item.markModified('metadata');
                  itemsToBeSaved.push(item);
                }
                return Item.create(itemsToBeSaved)
                  .then(
                    (savedItems) => {
                      if (savedItems) mangaItems.push(...savedItems);
                      const likedManga = user.manga;
                      const mangaItemsWithScore = mangaItems.map(
                        (item1) => {
                          item1.metadata =
                            mangaList.find(
                              item2 =>
                                item2 && String(item1.metadata.series_mangadb_id)
                                === String(item2.series_mangadb_id)
                            );
                          return item1;
                        }
                      );
                      mangaItemsWithScore.sort(
                        (a, b) => b.metadata.my_score - a.metadata.my_score
                      );
                      likedManga.push(...mangaItemsWithScore);
                      user.importedManga = mangaItemsWithScore;
                      user.markModified('importedManga');
                      user.manga = [...new Set(likedManga.map(manga => String(manga._id)))];
                      return user.save()
                        .then(savedUser => savedUser.populate('manga')
                          .execPopulate()
                          .then(populatedUser => res.json(populatedUser))
                          .catch(e => next(e)))
                        .catch(e => next(e));
                    })
                  .catch(e => next(e));
              })
              .catch(e => next(e));
          });
        })
        .catch(err => next(err));
    })
    .catch(e => next(e));
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function steamGames(req, res, next) {
  return User.get(req.user.id)
    .then((user) => {
      const s = new Steam({
        apiKey: config.steamWebApiKey,
        format: 'json' // optional ['json', 'xml', 'vdf']
      });
      // s.resolveVanityURL({
      //   vanityurl: 'energy0124',
      //   callback: function (err, data) {
      //     console.log(data);
      //   }
      // });
      return s.getOwnedGames({
        steamid: req.body.steamId,
        include_appinfo: 1,
        include_played_free_games: 1,
        callback(err, data) {
          if (err) return next(new APIError('User does not exist.', httpStatus.NOT_FOUND));
          const games = data.response.games;
          const gameIds = games.map(game => game.appid);
          const gameItems = [];
          return Item.find({
            'metadata.appid': {
              $in: gameIds
            }
          })
            .exec()
            .then((items) => {
              gameItems.push(...items);
              const newGames = games.filter(game => !items.find(
                item => parseInt(game.appid, 10) === item.metadata.appid)
              );
              const itemsToBeSaved = [];
              for (const newGame of newGames) {
                const item = new Item({
                  name: newGame.name,
                  imageUrl: `http://media.steampowered.com/steamcommunity/public/images/apps/${newGame.appid}/${newGame.img_logo_url}.jpg`,
                  metadata: JSON.parse(JSON.stringify(newGame)),
                  // metadata: {
                  //   // game
                  //   appid: newGame.appid,
                  //   playtime_forever: newGame.playtime_forever,
                  //   img_icon_url: `http://media.steampowered.com/steamcommunity/public/images/apps/${newGame.appid}/${newGame.img_icon_url}.jpg`
                  // },
                  category: 'game',
                  src: 'steam',
                  createdBy: user._id
                });
                item.metadata.img_icon_url = `http://media.steampowered.com/steamcommunity/public/images/apps/${newGame.appid}/${newGame.img_icon_url}.jpg`;
                delete item.metadata.playtime_forever;
                delete item.metadata.playtime_2weeks;
                item.markModified('metadata');
                itemsToBeSaved.push(item);
              }
              return Item.create(itemsToBeSaved)
                .then(
                  (savedItems) => {
                    if (savedItems) gameItems.push(...savedItems);
                    const likedGames = user.games;
                    const gameItemsWithPlayTime = gameItems.map(
                      (item1) => {
                        item1.metadata =
                          games.find(
                            item2 => item2 && String(item1.metadata.appid) === String(item2.appid)
                          );
                        return item1;
                      }
                    );
                    // const likedGamesWithPlayTime = likedGames.map(
                    //   item1 => Object.assign(item1,
                    //     gameItemsWithPlayTime.find(
                    //       item2 => item2 && String(item1._id) === String(item2._id)
                    //     )
                    //   )
                    // );
                    gameItemsWithPlayTime.sort(
                      (a, b) => b.metadata.playtime_forever - a.metadata.playtime_forever
                    );
                    likedGames.push(...gameItemsWithPlayTime);
                    user.importedGames = gameItemsWithPlayTime;
                    user.markModified('importedGames');
                    user.games = [...new Set(likedGames.map(game => String(game._id)))];
                    return user.save()
                      .then(savedUser => savedUser.populate('games')
                        .execPopulate()
                        .then(populatedUser => res.json(populatedUser))
                        .catch(e => next(e)))
                      .catch(e => next(e));
                  })
                .catch(e => next(e));
            })
            .catch(e => next(e));
        }
      });
    })
    .catch(e => next(e));
}


module.exports = { malAnime, malManga, steamGames };
