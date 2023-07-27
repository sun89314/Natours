const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');
//read config file and put them into process.env(the environment variables)
dotenv.config({ path: './config.env' });
//顺序问题很重要，必须在读取config文件后才能读取app.js

mongoose.connect(process.env.DATABASE).then(() => {
  console.log('DB connection successful');
});

const importData = async () => {
  const user = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
  try {
    await User.create(user);
    console.log('Data successfully loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};
const deleteData = async () => {
  try {
    await User.deleteMany();
    console.log('Data successfully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
console.log(process.argv);
