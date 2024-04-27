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
    testno: {
      type : Number,
      unique : true,
    }, 
    testScore: String,
  }],
});

const userDataModel = mongoose.model('userData', userDataSchema);

module.exports = userDataModel;
