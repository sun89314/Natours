const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { createResponse } = require('../utils/response-data');
const handlerFactory = require('./handlerFactory');
const multer = require('multer');//for uploading files
const sharp = require('sharp');//image processing library
const catchAsync = require('../utils/catchAsync');


// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     //cb accepts error and destination
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     //file.mime type is image/jpg
//     const ext = file.mimetype.split('/')[1];
//     //filename is user-1234567890.jpg
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
//  })
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  //test if file is an image
  if (file.mimetype.startsWith('image')) {
      cb(null, true);
  }
  else{
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }

}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  //photo-1234567890.jpg
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  console.log(req.file.filename);
  //
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});


const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signup instead',
  });
};
exports.getUserById = handlerFactory.getOne(User);
exports.updateMyself = async (req, res, next) => {
  //1. create error if user POSTs password data
  if (req.password || req.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /updatePassword',
        400,
      ),
    );
  }
  if (req.file) {
    req.body.photo = req.file.filename;
  }
  //2. update user document
  const filterBody = filterObj(req.body, 'name', 'email','photo');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true, //new is to return the new updated document
    runValidators: true,
  });
  res.status(200).json(createResponse('success', updatedUser));
};
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteMyselfCheck = (req, res, next) => {
  if (req.user.id === req.params.id) {
    return next(
      new AppError('You cannot delete yourself. Please use /deleteMyself', 400),
    );
  }
  next();
};

exports.deleteUser = handlerFactory.deleteOne(User);
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
