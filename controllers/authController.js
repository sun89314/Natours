const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
// const { createResponse } = require('../utils/response-data.js');
const Email = require('../utils/email');
const catchAsync = require('../utils/catchAsync');
const createResponse = require('../utils/response-data.js');

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000,
  ),
  httpOnly: true, //cookie cannot be accessed or modified in any way by the browser
};
if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
const createSendToken = (user, statusCode, req, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie('jwt', token, cookieOptions);
  //remove the password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

      
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  //1. check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2. check if user exists && password is correct
  User.findOne({ email })
    .select('+password')
    .then((user) => user.correctPassword(password))
    .then((user) => {
      //3. if everything ok, send token to client
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
      res.cookie('jwt', token, cookieOptions);
      res.status(200).json({
        status: 'success',
        token,
      });
      console.log('login success');
    })
    .catch((err) => {
      next(err);
    });
};
exports.isLoggedIn = async (req, res, next) => {
  //1. get token and check if it's there
  try {
    let token;
    //console.log(req.cookies.jwt);
    if(req.cookies.jwt){
      token = req.cookies.jwt;
    }
    //401 means unauthorized
    if (!token) {
      return next();
    }
    //2. check if token is valid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //3. check if user still exists
    const userId = decoded.id;
    const curUser = await User.findById(userId);
    if (!curUser) {
      return next();
    }
    //4. check if user changed password after the token was issued
    if (curUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }
    //grant access to protected route
    res.locals.user = curUser;
    return next();
  } catch (error) {
    return next();
  }
};
exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true, //cookie cannot be accessed or modified in any way by the browser
  });
  res.status(200).json({
    status: 'success',
  });
};


exports.protect = async (req, res, next) => {
  //1. get token and check if it's there
  try {
    let token;
    //console.log(req.cookies.jwt);
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if(req.cookies.jwt){
      token = req.cookies.jwt;
    }
    //401 means unauthorized
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access', 401),
      );
    }
    //2. check if token is valid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //3. check if user still exists
    const userId = decoded.id;
    const curUser = await User.findById(userId);
    if (!curUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist',
          401,
        ),
      );
    }
    //4. check if user changed password after the token was issued
    if (curUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please log in again',
          401,
        ),
      );
    }
    //grant access to protected route
    req.user = curUser;
    next();
  } catch (error) {
    next(error);
  }
};
//in order to pass the parameter to the middleware, we need to return a function
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //roles is an array
    //includes is a method of array, check if the array contains the element
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.forgetPassword = async (req, res, next) => {
  //1. get user based on posted email
  const user = await User.findOne({
    email: req.body.email,
  });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  //2. generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    //3. send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    //if there is an error, we need to set the passwordResetToken and passwordResetExpires to undefined
    console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
};
exports.resetPassword = async (req, res, next) => {
  //1. get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //2. if token has not expired, and there is user, set the new password
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  if (req.body.password !== req.body.passwordConfirm) {
    return next(
      new AppError('Password and passwordConfirm are not the same', 400),
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //3. update changedPasswordAt property for the user
  //4. log the user in, send JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(200).json({
    status: 'success',
    token,
  });
};

exports.updatePassword = async (req, res, next) => {
  //1. get user from collection
  const userId = req.user._id;
  const user = await User.findById(userId).select('+password');
  console.log(req.body)
  const { oldpassword, password, passwordConfirm } = req.body;
  await user.correctPassword(oldpassword);
  if(oldpassword === password){
    return next(
      new AppError('New password cannot be the same as old password', 400),
    );
  }
  if (password !== passwordConfirm) {
    return next(
      new AppError('Password and passwordConfirm are not the same', 400),
    );
  }
  //2. check if posted current password is correct
  //3. if so, update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  //4. log user in, send JWT
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(200).json({
    status: 'success',
    token,
  });
};
