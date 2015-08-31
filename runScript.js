#!/usr/bin/env node

var path = require('path');

if(require.main === module) {
	var args = process.argv.slice(2);

	var runningPath = path.resolve(args[0]);
	require(runningPath);
} else {
	//TODO: Implement for case when required
	console.log('TODO');
	module.exports = {
		runScript: function(scriptPath) {
			return new Promise(function(resolve, reject) {
			});
		}
	};
}
