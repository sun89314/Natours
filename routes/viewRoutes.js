const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();
const viewController = require('../controllers/viewController');

const { isLoggedIn } = require('../controllers/authController');

router.use(isLoggedIn);

router.get('/', viewController.getOverview);
router.get('/tours/:id', viewController.getTour);
router.get('/login', viewController.getLoginForm);
router
  .route('/login')
  .get(viewController.getLoginForm)
  .post(authController.login);
router.get('/me', viewController.getAccount);
module.exports = router;
