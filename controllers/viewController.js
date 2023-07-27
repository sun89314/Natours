const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Render that template using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = async (req, res) => {
  //1. get the data for the requested tour(including reviews and guides)
  const tour = await Tour.findById(req.params.id).populate({
    path: 'reviews',
    fields: 'review rating user', //fields in the review model
  });
  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  //2. build the template
  //3. render the template using the data from 1)
  res.status(200).render('tour', {
    title: 'one tour',
    tour,
  });
};

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'login',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
}

exports.getResetPasswordForm = (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Reset your password',
  });
}

