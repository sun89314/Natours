const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
    },
    email: {
      type: String,
      required: [true, 'A user must have a email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: { 
      type: String,
      default: 'default.jpg'
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'A user must have a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'A user must have a password'],
      validate: {
        //this only works on CREATE and SAVE
        validator: function (el) {
          return el === this.password;
        },
      },
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  },
);
userSchema.pre('save', async function (next) {
  //only run this function if password was actually modified
  //isModified is a method from mongoose to check if the field is modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  this.passwordChangedAt = Date.now();
  next();
});
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    // 如果更新了密码，记录更新时间
    update.passwordChangedAt = Date.now();
    update.password = await bcrypt.hash(update.password, 12);
  }
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    //compute
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.correctPassword = async function (candidatePassword) {
  const theSame = await bcrypt.compare(candidatePassword, this.password);
  if (!theSame) {
    throw new Error('Incorrect email or password');
  }
  return this;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  //encrypt the token, createHash is a method from crypto that can encrypt the token
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 1200 * 60 * 1000; //10分钟后过期
  //send the unencrypted token to the user, save the encrypted token to the database
  //so that we can compare the encrypted token with the token that user send to us
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
