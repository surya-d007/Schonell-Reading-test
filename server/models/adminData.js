const mongoose = require('mongoose');

const adminDataSchema = new mongoose.Schema({
  Unique_ID: {
    type: String,
    required: true,
    unique: true,
  }
});

const adminDataModel = mongoose.model('adminData', adminDataSchema);

module.exports = adminDataModel;
