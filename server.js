const mongoose = require('mongoose');
const dotenv = require('dotenv');
//read config file and put them into process.env(the environment variables)
dotenv.config({ path: './config.env' });
//顺序问题很重要，必须在读取config文件后才能读取app.js
const app = require('./app');

const port = 3000;

mongoose.connect(process.env.DATABASE).then(() => {
  console.log('DB connection successful');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
//TEST DEBUG
