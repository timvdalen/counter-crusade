/*global require,exports*/
(function () {
	'use strict';

	var plugin = require('plugin'),
		db = require('db'),
		getItemValue,
		increaseItemValue;

	getItemValue = function (item, key) {
		if (item.hasOwnProperty(key)) {
			return item[key];
		} else {
			return 1;
		}
	};

	increaseItemValue = function (items, key) {
		if (!items.hasOwnProperty(key)) {
			items[key] = 1;
		}

		items[key] += 1;

		return items;
	};

	// The purchasable items in the store
	// Has a string key, name and functions price and amount, which get a database item
	exports.items = function () { return {
		'multiplier': {
			key: 'multiplier',
			name: 'Multiplier',
			price: function (item) {
				return getItemValue(item, 'multiplier') * getItemValue(item, 'multiplier') * 350;
			},
			amount: function (item) {
				return getItemValue(item, 'multiplier');
			}
		},
		'money': {
			key: 'money',
			name: 'Geld.',
			price: function (item) {
				return getItemValue(item, 'money') * getItemValue(item, 'money') * 1000;
			},
			amount: function (item) {
				return getItemValue(item, 'money');
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

			userItems = increaseItemValue(userItems, item.key);

			db.shared.set('items', plugin.userId(), userItems);
		}
	};

	exports.getItemValue = getItemValue;
}());
