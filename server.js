/*global require,exports*/
(function () {
	'use strict';
	
	var db = require('db'),
		plugin = require('plugin'),
		timer = require('timer'),
		shop = require('shop'),
		event = require('event'),
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
			user: userId
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
		counter.counter += db.shared.get('items', plugin.userId()).multiplier;
		db.shared.set('counters', plugin.userId(), counter);
	};

	exports.client_purchase = function (key) {
		shop.purchase(key);
	};

	exports.client_beat = function (userwin, userlose) {
		// Message to all other users
		event.create({
			unit: 'beat',
			text: plugin.userName(userwin) + " heeft " + plugin.userName(userlose) + " ingemaakt",
			exclude: [userwin, userlose]
		});
		// Message to loser
		event.create({
			unit: 'beat',
			text: plugin.userName(userwin) + " heeft je echt belachelijk hard geshamed...",
			include: [userlose]
		});
	};

	exports.handout_money = function () {
		var i, users, counter;
		users = plugin.userIds();
		for (i in users) {
			if (users.hasOwnProperty(i)) {
				counter = db.shared.get('counters', users[i]);

				// Increase money based on difference in count sinds last tick and the money multiplier
				counter.money += Math.floor((counter.counter - counter.prev)
											* (0.05 + (0.05 * shop.getItemValue(db.shared.get('items', users[i]), 'money'))));

				counter.prev = counter.counter;
				db.shared.set('counters', users[i], counter);
			}
		}
		
		setMoneyTimer();
	};
}());
