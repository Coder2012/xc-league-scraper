import mongoose from 'mongoose';

const pwd = encodeURIComponent(process.env.MONGODB_ATLAS_PWD);

mongoose.connect(
	`mongodb://nebrown:${pwd}@paragliding-nodejs-shard-00-00-ocmr9.mongodb.net:27017,paragliding-nodejs-shard-00-01-ocmr9.mongodb.net:27017,paragliding-nodejs-shard-00-02-ocmr9.mongodb.net:27017/test?ssl=true&replicaSet=paragliding-nodejs-shard-0&authSource=admin&retryWrites=true`
);

mongoose.connection.on('error', function(err) {
  console.error('MongoDB Connection Error: ', err);
});

const FlightSchema = new mongoose.Schema({
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

export default mongoose.model('flights', FlightSchema);
