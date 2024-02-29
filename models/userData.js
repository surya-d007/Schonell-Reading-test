const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  Unique_ID: {
    type: String,
    required: true,
    unique: true,
  },
  userDOB :{
    type : Date,
    format: 'DD-MM-YYYY',
    required : true,
  },
  testScores:[{
    testno: Number,
    testScores:Number,
  }],
});

const userDataModel = mongoose.model('userData', userDataSchema);

module.exports = userDataModel;
