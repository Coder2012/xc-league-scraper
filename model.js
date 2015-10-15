var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/reactor');
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var FlightSchema = new mongoose.Schema({
	_id: String,
	pilot: String,
	title: String,
	club: String,
	glider: String,
	date: Object,
	start: String,
	finish: String,
	duration: String,
	takeoff: String,
	landing: String,
	total: String,
	multiplier: String,
	score: String,
	maxHeight: String,
	lowHeight: String,
	takeoffHeight: String,
	maxClimb: String,
	minClimb: String,
	maxSpeed: String,
	avgSpeedCourse: String,
	avgSpeedTrack: String
});

module.exports = {
	flights: mongoose.model('flights', FlightSchema),
	schema: FlightSchema
}