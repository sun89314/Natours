/* eslint-disable no-unused-vars */
const { createResponse } = require('../utils/response-data');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');
const handlerFactory = require('./handlerFactory');
// exports.getReviewsByUserId = async (req, res, next) => {
//   let reviews;
//   console.log(req.params);
//   if (req.params.tourId && req.params.userId) {
//     reviews = await Review.find({
//       tour: req.params.tourId,
//       user: req.params.userId,
//     });
//   }
//   if (req.params.tourId) {
//     reviews = await Review.find({ tour: req.params.tourId });
//   } else if (req.params.userId) {
//     reviews = await Review.find({ user: req.params.userId });
//   }
//   if (!reviews) {
//     return next(new AppError('No reviews found', 404));
//   }
//   res.status(200).json(createResponse('success', reviews));

//   next();
// };

exports.getReviewById = handlerFactory.getOne(Review);

exports.getAllReviews = handlerFactory.getAll(Review);
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = handlerFactory.createOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
