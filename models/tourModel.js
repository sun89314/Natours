const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
      trim: true,
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
      trim: true,
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      trim: true,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      trim: true,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
      trim: true,
    },
    priceDiscount: {
      type: Number,
      trim: true,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price', //{VALUE}是mongoose的一个占位符
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      trim: true,
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      trim: true,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON is a special format for defining geospatial data
      type: {
        //type of the startLocation
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        //how to reference another model
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true }, //toJSON is a method from mongoose to convert the document to a json object
    toObject: { virtuals: true }, // toObject is a method from mongoose to convert the document to a plain javascript object
  },
);

tourSchema.index({ price: 1, ratingsAverage: -1 }); //1 means ascending order, -1 means descending order
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); //2dsphere is a special index for geospatial data
//虚拟属性，不会被存储到数据库中，但是可以用来计算
tourSchema.virtual('durationWeeks').get(function () {
  //在这里用function，因为要用到this，而arrow function没有this
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //in review, the tour field is the reference to the tour
  localField: '_id', //in tour, the _id field is the reference to the tour
});
tourSchema.virtual('slug').get(function () {
  return this.name.toLowerCase().replace(/ /g, '-');
});

//for all find queries, populate the guides field
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.pre('aggregate', (next) => {
  // console.log(this.pipeline);//this指向当前的aggregate
  next();
});

module.exports = mongoose.model('Tour', tourSchema);
