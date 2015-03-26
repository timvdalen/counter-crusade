/*global require,exports*/
(function () {
	'use strict';
	
	var db = require('db'),
		plugin = require('plugin'),
		timer = require('timer'),
		shop = require('shop'),
		reset,
		setMoneyTimer;
	
	reset = function (userId) {
		// I probably need to rethink the schema before I really release anything...
		db.shared.set('counters', userId, {
			user: userId,
			counter: 0,
			money: 0,
			prev: 0
		});
		db.shared.set('items', userId, {
			user: userId,
			multiplier: 0
		});
	};
	
	setMoneyTimer = function () {
		timer.set(600000, 'handout_money');
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
	
	exports.onUpgrade = function () {
		// Set the timer
		setMoneyTimer();
	};

	exports.client_increase = function () {
		// Increase the count for the current user
		var counter = db.shared.get('counters', plugin.userId());
		counter.counter += 1;
		db.shared.set('counters', plugin.userId(), counter);
	};

	exports.client_purchase = function (key) {
		shop.purchase(key);
	};

	exports.handout_money = function () {
		var i, users, counter;
		users = plugin.userIds();
		for (i in users) {
			if (users.hasOwnProperty(i)) {
				counter = db.shared.get('counters', users[i]);
				counter.money += Math.floor((counter.counter - counter.prev) * 0.10);
				counter.prev = counter.counter;
				db.shared.set('counters', users[i], counter);
			}
		}
		
		setMoneyTimer();
	};
}());
