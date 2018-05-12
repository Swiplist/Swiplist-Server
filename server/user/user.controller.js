const User = require('./user.model');

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
  user.username = req.body.username;
  user.mobileNumber = req.body.mobileNumber;

  user.save()
    .then(savedUser => res.json(savedUser))
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

module.exports = { load, get, create, update, list, remove, me, search };
