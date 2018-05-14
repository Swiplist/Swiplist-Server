const User = require('./user.model');
const akin = require('@asymmetrik/akin');
const httpStatus = require('http-status');

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id)
    .then((user) => {
      req.user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  return res.json(req.user);
}

/**
 * Get  user by token
 * @returns {User}
 */
function me(req, res, next) {
  return User.get(req.user.id)
    .then(user => res.json(user))
    .catch(e => next(e));
}

/**
 * Add friend
 * @returns {User}
 */
function addFriend(req, res, next) {
  return User.findOne({ _id: req.user.id })
    .then((user) => {
      user.friends.push(req.body.friend);
      user.friends = [...new Set(user.friends)];
      return user.save();
    })
    .then(() => res.sendStatus(httpStatus.OK))
    // .then(user => user.populate('friends')
    //   .execPopulate())
    // .then(user => res.json(user))
    .catch(e => next(e));
}

/**
 * ignore friend
 * @returns {User}
 */
function ignoreSuggestedFriend(req, res, next) {
  return User.findOne({ _id: req.user.id })
    .then((user) => {
      user.ignoredSuggestedFriends.push(req.body.friend);
      user.ignoredSuggestedFriends = [...new Set(user.ignoredSuggestedFriends)];
      return user.save();
    })
    .then(() => res.sendStatus(httpStatus.OK))
    .catch(e => next(e));
}


/**
 * Get friends
 * @returns {User}
 */
function meFriends(req, res, next) {
  return User.findOne({ _id: req.user.id })
    .then(user => user.populate('friends')
      .execPopulate())
    .then(user => res.json(user.friends))
    .catch(e => next(e));
}


/**
 * Get suggested friends
 * @returns {User}
 */
function suggestFriends(req, res, next) {
  return User.findOne({ _id: req.user.id })
    .then(user =>
      akin.model.model.UserSimilarity.find({
        users: user._id
      })
        .exec()
        .then((pairs) => {
          const ignoredSet = new Set(user.friends.concat(user.ignoredSuggestedFriends));
          const suggestedFriendIds = pairs.sort((a, b) => b.similarity - a.similarity)
            .map(sortedPairs => sortedPairs.users.filter(x => x !== String(user._id))[0])
            .filter(id => !ignoredSet.has(id));
          return User.find({
            _id: {
              $in: suggestedFriendIds
            }
          })
            .exec();
        })
        .then(users => res.json(users))
        .catch(e => next(e))
    )
    .catch(e => next(e));
}

/**
 *Like
 * @returns {User}
 */
function like(req, res, next) {
  return User.findOne({ _id: req.user.id })
    .then((user) => {
      if (req.body.like === true) {
        switch (req.body.category) {
          case 'anime': {
            user.anime.push(req.body.item);
            akin.activity.log(String(user._id), String(req.body.item), { type: 'anime' }, 'like');
            user.anime = [...new Set(user.anime)];
            break;
          }
          case 'games': {
            user.games.push(req.body.item);
            akin.activity.log(String(user._id), String(req.body.item), { type: 'games' }, 'like');
            user.games = [...new Set(user.games)];

            break;
          }
          case 'manga': {
            user.manga.push(req.body.item);
            akin.activity.log(String(user._id), String(req.body.item), { type: 'manga' }, 'like');
            user.manga = [...new Set(user.manga)];

            break;
          }
          default: {
            break;
          }
        }
      } else {
        user.dislikedItems.push(req.body.item);
        user.dislikedItems = [...new Set(user.dislikedItems)];
      }
      akin.recommendation.markRecommendationDNR(
        String(user._id), String(req.body.item._id), { type: req.body.category });
      return user.save()
        .then(() => res.sendStatus(httpStatus.OK))
        // .then(savedUser => savedUser
        // .populate('anime')
        // .populate('manga')
        // .populate('games')
        // .execPopulate()
        // .then(populatedUser => res.json(populatedUser))
        // .catch(e => next(e)))
        .catch(e => next(e));
    })
    .catch(e => next(e));
}

/**
 * Search  user by query
 * @returns [User]
 */
function search(req, res, next) {
  return User.find({
    $or: [
      { $text: { $search: req.body.query } },
      // { 'importedGames.name': { $regex: req.body.query, $options: 'i' } },
      // { 'importedAnime.name': { $regex: req.body.query, $options: 'i' } },
      // { 'importedManga.name': { $regex: req.body.query, $options: 'i' } },
    ]
  }, {
    importedGames: 0,
    importedAnime: 0,
    importedManga: 0,
    games: 0,
    anime: 0,
    manga: 0
  })
    .exec()
    .then(docs => res.json(docs))
    .catch(e => next(e));
}


/**
 * Create new user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
function create(req, res, next) {
  const user = new User({
    username: req.body.username,
    mobileNumber: req.body.mobileNumber
  });

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
function update(req, res, next) {
  const user = req.user;
  // user.mobileNumber = req.body.mobileNumber;
  user.anime = req.body.anime;
  user.manga = req.body.manga;
  user.games = req.body.games;

  user.save()
    .then(() => res.sendStatus(httpStatus.OK))
    // .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Update this  user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
function updateMe(req, res, next) {
  // const user = req.user;
  User.findOne({ _id: req.user.id })
    .then((user) => {
      if (req.body.anime) user.anime = req.body.anime;
      if (req.body.manga) user.manga = req.body.manga;
      if (req.body.games) user.games = req.body.games;
      user.save()
        .then(() => res.sendStatus(httpStatus.OK))
        // .then(savedUser => savedUser
        //   .populate('anime')
        //   .populate('manga')
        //   .populate('games')
        //   .execPopulate()
        //   .then(populatedUser => res.json(populatedUser))
        //   .catch(e => next(e)))
        .catch(e => next(e));
    })
    .catch(e => next(e));
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  User.list({ limit, skip })
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Delete user.
 * @returns {User}
 */
function remove(req, res, next) {
  const user = req.user;
  user.remove()
    .then(deletedUser => res.json(deletedUser))
    .catch(e => next(e));
}

module.exports = {
  load,
  get,
  create,
  update,
  updateMe,
  list,
  remove,
  me,
  search,
  like,
  addFriend,
  meFriends,
  suggestFriends,
  ignoreSuggestedFriend
};
