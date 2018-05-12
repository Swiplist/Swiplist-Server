const express = require('express');
// const validate = require('express-validation');
// const paramValidation = require('../../config/param-validation');
const itemCtrl = require('./item.controller');
// const expressJwt = require('express-jwt');
// const config = require('../../config/config');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
/** GET /api/items - Get list of items */
  .get(itemCtrl.list)

  /** POST /api/items - Create new item */
  .post(itemCtrl.create);

router.route('/search')
  .post(itemCtrl.search);
/** POST /api/items/search - Full text search on query*/

router.route('/:itemId')
/** GET /api/items/:itemId - Get item */
  .get(itemCtrl.get)

  /** PUT /api/items/:itemId - Update item */
  .put(itemCtrl.update)

  /** DELETE /api/items/:itemId - Delete item */
  .delete(itemCtrl.remove);


/** Load user when API with userId route parameter is hit */
router.param('itemId', itemCtrl.load);

module.exports = router;
