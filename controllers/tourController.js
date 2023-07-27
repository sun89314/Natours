// Description: tour controller
const { createResponse } = require('../utils/response-data');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');
const multer = require('multer');//for uploading files
const sharp = require('sharp');//image processing library
const catchAsync = require('../utils/catchAsync');

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

exports.uploadTourImages = upload.fields([
  {name: 'imageCover', maxCount: 1},
  {name: 'images', maxCount: 3}
]);

exports.resizeTourImages = catchAsync(
  async (req, res, next) => {
  console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();
  //1) Cover image

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${req.body.imageCover}`);
  //2) Images
  req.body.images = [];
  
  await Promise.all(req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
    await sharp(file.buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${filename}`);
    req.body.images.push(filename);
  }));
  next();
});



//create middleware
exports.getTop5Cheap = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,duration,difficulty';
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }
  next();
};
exports.postAction = (req, res, next) => {
  console.log('post action');
  next();
};
//
exports.getTourById = handlerFactory.getOne(Tour, { path: 'reviews' });
exports.patchTourById = handlerFactory.updateOne(Tour);
exports.createTour = handlerFactory.createOne(Tour);
exports.getAllTours = handlerFactory.getAll(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);
exports.getTourStates = async (req, res) => {
  try {
    const stats = Tour.aggregate([
      {
        //filter the documents
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          // _id:'$difficulty',//group by difficulty
          _id: null, //calculate all documents
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);
    const results = await stats;
    res.status(200).json(createResponse('success', results));
  } catch (err) {
    res.status(500).json(createResponse('error', 'Error writing file'));
  }
};

exports.getToursWithin = async (req, res) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    if (!lat || !lng) {
      return next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng.',
          400,
        ),
      );
    }
    //geospatial query,$geoWithin is a geospatial operator
    //$centerSphere is a geospatial operator
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });
    res.status(200).json(createResponse('success', tours));
  } catch (err) {
    res.status(500).json(createResponse('error', 'Error writing file'));
  }
};
exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          // _id:'$difficulty',//group by difficulty
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);
    const results = await plan;
    res.status(200).json(createResponse('success', results));
  } catch (err) {
    res.status(500).json(createResponse('error', 'Error writing file'));
  }
};
