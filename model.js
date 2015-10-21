var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/reactor');
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var FlightSchema = new mongoose.Schema({
	identifier: String,
	pilot: String,
	title: String,
	club: String,
	glider: String,
	date: Object,
	start: String,
	startNum: Number,
	finish: String,
	finishNum: Number,
	duration: String,
	durationNum: Number,
	takeoff: String,
	landing: String,
	total: Number,
	multiplier: String,
	score: Number,
	maxHeight: Number,
	lowHeight: Number,
	takeoffHeight: Number,
	maxClimb: Number,
	minClimb: Number,
	maxSpeed: Number,
	avgSpeedCourse: Number,
	avgSpeedTrack: Number
});

module.exports = mongoose.model('flights', FlightSchema);
