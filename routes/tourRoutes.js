const express = require('express');
const reviewRouter = require('./reviewRoutes');

const {
  getAllTours,
  createTour,
  getTourById,
  patchTourById,
  deleteTour,
  getTop5Cheap,
  getTourStates,
  getToursWithin,
  resizeTourImages,
  uploadTourImages,
} = require('../controllers/tourController');

const router = express.Router();
const { protect, restrictTo } = require('../controllers/authController');

//常用与参数校验,中间件
// router.param('id', checkId);
//create middleware

router
  .route('/stats')
  .get(protect, restrictTo('admin', 'lead-guide'), getTourStates);
router.route('/top-5-cheap').get(getTop5Cheap, getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTourById)
  .patch(protect, restrictTo('admin', 'lead-guide'),uploadTourImages,resizeTourImages, patchTourById)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

router.use('/:tourId/reviews', reviewRouter);
// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user', 'admin'), createReview);

module.exports = router;
