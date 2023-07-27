const express = require('express');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  getReviewById,
  setTourUserIds,
} = require('../controllers/reviewController');

const { protect, restrictTo } = require('../controllers/authController');
//in order to get access to tourId in reviewController
const reviewRouter = express.Router({ mergeParams: true });
reviewRouter.use(protect);
reviewRouter
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user', 'admin'), setTourUserIds, createReview);

reviewRouter
  .route('/:id')
  .get(getReviewById)
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview);
module.exports = reviewRouter;
