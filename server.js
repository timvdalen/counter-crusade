/*global require,exports*/
(function () {
	'use strict';
	
	var db = require('db'),
		plugin = require('plugin'),
		timer = require('timer'),
		reset;
	
	reset = function (userId) {
		db.shared.set('counters', userId, {
			user: userId,
			counter: 0,
			money: 0,
			prev: 0
		});
	};
	
	exports.onInstall = function () {
		// Set the counter to 0 for everyone
		var i, users;
		users = plugin.userIds();
		for (i in users) {
			if (users.hasOwnProperty(i)) {
				reset(users[i]);
			}
		}
	};
	
	exports.onJoin = function (userId) {
		// Set the counter for the new person
		reset(userId);
	};
	
	exports.client_increase = function () {
		// Increase the count for the current user
		var counter = db.shared.get('counters', plugin.userId());
		counter.counter += 1;
		db.shared.set('counters', plugin.userId(), counter);
	};
}());
