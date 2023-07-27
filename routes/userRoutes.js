const express = require('express');
const multer = require('multer');
const {
  getAllUsers,
  createUser,
  getUserById,
  deleteUser,
  updateMyself,
  deleteMyselfCheck,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto
} = require('../controllers/userController');
const {
  signup,
  login,
  protect,
  restrictTo,
  forgetPassword,
  resetPassword,
  updatePassword,
  logout
} = require('../controllers/authController');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');

const userRouter = express.Router();
userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.get('/logout',logout);
userRouter.post('/forgetPassword', forgetPassword);
userRouter.route('/resetPassword/:token')
  .get(viewController.getResetPasswordForm)
  .patch(authController.resetPassword);
userRouter.use(protect);
userRouter.patch('/updatePassword', updatePassword);
userRouter.get('/me', getMe, getUserById);
userRouter.route('/').get(getAllUsers).post(createUser)
  .patch(uploadUserPhoto,resizeUserPhoto,updateMyself);

userRouter
  .route('/:id')
  .get(getUserById)
  .delete(restrictTo('admin'), deleteMyselfCheck, deleteUser);

module.exports = userRouter;
