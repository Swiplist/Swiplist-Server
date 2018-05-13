const Item = require('./item.model');
const User = require('../user/user.model');
const akin = require('@asymmetrik/akin');

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  Item.get(id)
    .then((item) => {
      req.item = item; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Search  item by query
 * @returns [Item]
 */
function recommend(req, res, next) {
  return User.get(req.user.id)
    .then(me => akin.run()
      .then(() =>
        akin.recommendation
          .sampleRecommendationsForUser(String(me._id), 20, req.body.categories)
          .then((result) => {
              const ids = result.map(item => item.item);
              return Item.find({
                _id: {
                  $in: ids
                }
              })
                .exec()
                .then(items => res.json(items));
            }
          )
          .catch(e => next(e))))
    .catch(e => next(e));

  // .then(me => User.find({})
  //   .exec()
  //   .then((users) => {
  //     for (const user of users) {
  //       for (const like of user.anime) {
  //         akin.activity.log(String(user._id), String(like), { type: 'anime' }, 'like');
  //         akin.recommendation.markRecommendationDNR(String(user._id), String(like), { type: 'anime' });
  //       }
  //       for (const like of user.manga) {
  //         akin.activity.log(String(user._id), String(like), { type: 'manga' }, 'like');
  //         akin.recommendation.markRecommendationDNR(String(user._id), String(like), { type: 'manga' });
  //       }
  //       for (const like of user.games) {
  //         akin.activity.log(String(user._id), String(like), { type: 'games' }, 'like');
  //         akin.recommendation.markRecommendationDNR(String(user._id), String(like), { type: 'games' });
  //       }
  //     }
  //     const UserActivity = akin.model.model.UserActivity;
  //     const UserItemWeights = akin.model.model.UserItemWeights;
  //     const UserDoNotRecommend = akin.model.model.UserDoNotRecommend;
  //     return UserActivity.remove({})
  //       .exec()
  //       .then(
  //         () => UserItemWeights.remove({})
  //           .exec()
  //           .then(
  //             () => UserDoNotRecommend.remove({})
  //               .exec()
  //               .then(() => {
  //               })
  //           ));
  //   })
  //   .catch(e => next(e))
  // )
}

/**
 * Search  item by query
 * @returns [Item]
 */
function search(req, res, next) {
  return Item.find({
    $text: { $search: req.body.query },
    category: { $in: req.body.categories }
  }, {})
    .exec()
    .then(docs => res.json(docs))
    .catch(e => next(e));
}

/**
 * Search  user by query
 * @returns [Item]
 */
function ranking(req, res, next) {
  return User.find({})
  // .populate('anime')
  // .populate('manga')
  // .populate('games')
    .exec()
    .then((users) => {
      const animeMap = new Map();
      const mangaMap = new Map();
      const gamesMap = new Map();
      for (const user of users) {
        for (const [index, anime] of user.anime.entries()) {
          if (animeMap.has(anime)) {
            animeMap.set(anime, animeMap.get(anime) + (1.0 / (index + 1)));
          } else {
            animeMap.set(anime, 1.0 / (index + 1));
          }
        }
        for (const [index, manga] of user.manga.entries()) {
          if (mangaMap.has(manga)) {
            mangaMap.set(manga, mangaMap.get(manga) + (1.0 / (index + 1)));
          } else {
            mangaMap.set(manga, 1.0 / (index + 1));
          }
        }
        for (const [index, game] of user.games.entries()) {
          if (gamesMap.has(game)) {
            gamesMap.set(game, gamesMap.get(game) + (1.0 / (index + 1)));
          } else {
            gamesMap.set(game, 1.0 / (index + 1));
          }
        }
      }
      return Item.find({ category: { $in: req.body.categories } })
        .exec()
        .then((items) => {
          const rankedItems = items.map(
            (item1) => {
              if (animeMap.has(String(item1._id))) {
                item1.rankedScore =
                  animeMap.get(String(item1._id));
              } else if (mangaMap.has(String(item1._id))) {
                item1.rankedScore =
                  mangaMap.get(String(item1._id));
              } else if (gamesMap.has(String(item1._id))) {
                item1.rankedScore =
                  gamesMap.get(String(item1._id));
              }
              return item1;
            }
          );
          return Promise.all(rankedItems.map(item => item.save()))
            .then(() => Item.find({ category: { $in: req.body.categories } })
              .sort({
                rankedScore: -1
              })
              .exec()
              .then(sortedItems => res.json(sortedItems))
              .catch(e => next(e))
            )
            .catch(e => next(e));
        })
        .catch(e => next(e));
    })
    .catch(e => next(e));
}

/**
 * Get item
 * @returns {Item}
 */
function get(req, res) {
  return res.json(req.item);
}

/**
 * Create new user
 * @property {string} req.body.username - The username of user.
 * @returns {Item}
 */
function create(req, res, next) {
  const item = new Item({
    name: req.body.name,

  });

  item.save()
    .then(savedItem => res.json(savedItem))
    .catch(e => next(e));
}

/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {Item}
 */
function update(req, res, next) {
  const item = req.item;
  item.name = req.body.name;
  item.description = req.body.description;
  item.imageUrl = req.body.imageUrl;
  item.category = req.body.category;
  item.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Item[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Item.list({ limit, skip })
    .then(items => res.json(items))
    .catch(e => next(e));
}

/**
 * Delete user.
 * @returns {Item}
 */
function remove(req, res, next) {
  const item = req.item;
  item.remove()
    .then(deletedItem => res.json(deletedItem))
    .catch(e => next(e));
}

module.exports = { load, get, create, update, list, remove, search, ranking, recommend };
