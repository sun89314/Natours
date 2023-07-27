/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //only 100 requests from the same IP in 1 hour
  message: 'Too many requests from this IP, please try again in an hour',
});
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
//set security http headers
// app.use(helmet());
//limiter is for limiting the number of requests from the same IP, only apply to /api route
app.use('/api', limiter);
//hpp is for preventing parameter pollution, such as sort=duration&sort=price
app.use(hpp());
//body parser, reading data from body into req.body
app.use(cookieParser());
// limit the size of the body to 10kb
app.use(express.json({ limit: '10kb' }));

//data sanitization against NoSQL query injection, remove $ and .
app.use(mongoSanitize());
//data sanitization against xss, clean user input from malicious html code,such as <script></script>
app.use(xss());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//catch the unhandled routes, all is a special method to catch all the http methods
//after all the routes, if the request is not handled by any of the routes,
// it will be handled by this middleware
app.all('*', (req, res, next) => {
  //if next() is called with an argument, express will assume that it is an error
  //and it will skip all the middlewares and go to the error handling middleware
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

//error handling middleware,
//express will automatically know it is an error handling middleware since it has 4 arguments
app.use(globalErrorHandler);
module.exports = app;
