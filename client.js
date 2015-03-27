/*global require,exports*/
(function () {
	'use strict';
	
	var dom = require('dom'),
		ui = require('ui'),
		plugin = require('plugin'),
		obs = require('obs'),
		db = require('db'),
		server = require('server'),
		shop = require('shop');

	exports.render = function () {
		var progress = obs.create(-10),
			lastRank = -1;

		// Ranking
		obs.observe(function () {
			var counters, scores, i, renderItem;
			
			renderItem = function (score) {
				return function () {
					dom.div(function () {
						dom.style({marginRight: '10px'});
						dom.h2('#' + (i + 1));
						dom.last().style({borderBottom: 'none', textTransform: 'initial'});
					});
					ui.avatar(plugin.userAvatar(score.user));
					dom.last().style({marginRight: '10px'});
					dom.h2(plugin.userName(score.user));
					dom.last().style({borderBottom: 'none', textTransform: 'initial'});
				};
			};
			
			counters = db.shared.ref('counters');
			scores = [];
			counters.iterate(function (counter) {
				scores.push({
					user: counter.get('user'),
					counter: counter.get('counter')
				});
			});

			scores.sort(function (a, b) {
				return b.counter - a.counter;
			});

			// Show number one
			dom.header(function () {
				dom.style({textAlign: 'center'});
				dom.h1(plugin.userName(scores[0].user));
				ui.avatar(plugin.userAvatar(scores[0].user), {size: 250});
			});
			
			ui.list(function () {
				var renderDots = function () {
					dom.style({
						textAlign: 'center',
						minHeight: 0
					});
					dom.h1("· · ·");
					dom.last().style({
						width: '100%',
						marginTop: -10,
						marginBottom: -10
					});
				};

				dom.style({marginTop: '20px'});
				// Show the top 3, including you if you're lower
				for (i = 1; i < scores.length; i += 1) {
					// Check if rank has changed since last time
					if (scores[i].user === plugin.userId()) {
						if (lastRank !== -1 && i < lastRank) {
							// We went up
							server.send('beat', plugin.userId(), scores[i + 1].user);
						}
						lastRank = i;
					}

					if (i > 3 && scores[i].user === plugin.userId()) {
						// Show dots
						ui.item(renderDots);
					}
					// Only show top 3 and user
					if (i < 3 || scores[i].user === plugin.userId()) {
						ui.item(renderItem(scores[i]));
					}
				}
			});

			//Try to force the observer to refresh
			dom.p(counters.get(plugin.userId()).counter);
			dom.last().style({display: 'none'});
		});
		
		// Progress bar
		dom.div(function () {
			dom.style({
				height: 18,
				borderRadius: '2px',
				border: '1px solid #ba1a6e',
				overflow: 'hidden'
			});

			dom.div(function () {
				obs.observe(function () {
					dom.style({
						width: '10%',
						height: '100%',
						background: '#ba1a6e',
						marginLeft: progress.get() + '%'
					});
				});
			});
		});

		// Main button
		obs.observe(function () {
			var multiplier = db.shared.ref('items').get(plugin.userId()).multiplier;
			ui.bigButton("Charge!", function () {
				server.send('increase');

				// progress ranges from -10 to 110
				progress.set((((progress.get() + 10) + multiplier) % 110) - 10);
			});
		});

		// Store
		dom.section(function () {
			var money = db.shared.ref('counters').get(plugin.userId()).money,
				renderStoreItem = function (shopItem) {
					return function () {
						var items = db.shared.ref('items').get(plugin.userId());

						dom.style({Box: 'middle'});

						dom.div(function () {
							dom.style({Box: 'vertical', Flex: 1});
							dom.b(shopItem.name);
							dom.div(function () {
								dom.em(shopItem.description);
							});
							dom.div("Nu: " + shopItem.amount(items) + ", kost: " + shopItem.price(items));
						});

						if (money >= shopItem.price(items)) {
							dom.div(function () {
								ui.button("Koop!", function () {
									server.call('purchase', shopItem.key);
								});
							});
						}
					};
				},
				items;

			items = shop.items();

			dom.h2("De winkel");
			dom.p("Je hebt op dit moment " + money + " geld!");
			ui.list(function () {
				var key;
				for (key in items) {
					if (items.hasOwnProperty(key)) {
						ui.item(renderStoreItem(items[key]));
					}
				}
			});
		});
	};
}());
