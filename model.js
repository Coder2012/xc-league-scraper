var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/scraper');
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var ListingsSchema = new mongoose.Schema({
  pilot: String,
  club: String,
  glider: String,
  total: Number,
  flightUrls: Array
});
module.exports = mongoose.model('pilots', ListingsSchema);