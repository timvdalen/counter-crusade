/*global require,exports*/
(function () {
	'use strict';

	var plugin = require('plugin'),
		db = require('db');

	// The purchasable items in the store
	// Has a string key, name and functions price and amount, which get a database item
	exports.items = function () { return {
		'multiplier': {
			key: 'multiplier',
			name: 'Multiplier',
			price: function (item) {
				return item.multiplier * item.multiplier * 350;
			},
			amount: function (item) {
				return item.multiplier;
			}
		}
	}; };

	// Make a purchase, only callable by the server
	exports.purchase = function (key) {
		var item, price, userItems, userMain;

		userMain = db.shared.ref('counters').get(plugin.userId());
		userItems = db.shared.ref('items').get(plugin.userId());

		item = exports.items()[key];
		price = item.price(userItems);
		// Needs atomicity!
		if (userMain.money >= price) {
			userMain.money -= price;
			db.shared.set('counters', plugin.userId(), userMain);

			userItems[item.key] += 1;
			db.shared.set('items', plugin.userId(), userItems);
		}
	};
}());
