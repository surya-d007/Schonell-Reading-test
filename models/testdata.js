const mongoose = require('mongoose');

const testDataSchema = new mongoose.Schema({
  testno:{
    type:Number,
    unique: true,
  },
    
  words:[
        {
            type: String,
        }
    ],
  },
);

const testDataModel = mongoose.model('testData', testDataSchema);

module.exports = testDataModel;
