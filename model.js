var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/scraper');
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var FlightSchema = new mongoose.Schema({
	pilot: String,
	title: String,
	club: String,
	glider: String,
	date: String,
	start: String,
	finish: String,
	duration: String,
	takeoff: String,
	landing: String,
	distance: String,
	total: String,
	multiplier: String,
	score: String
});

module.exports = mongoose.model('flights', FlightSchema);