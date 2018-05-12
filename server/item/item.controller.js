const Item = require('./item.model');

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
 * Search  user by query
 * @returns [User]
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

module.exports = { load, get, create, update, list, remove, search };
