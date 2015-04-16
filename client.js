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
			rank = obs.create(-1),
			clicks = obs.create(0), // the number of clicks since start
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
				for (i = 0; i < scores.length; i += 1) {
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
					if ((i < 3 || scores[i].user === plugin.userId()) && i !== 0) {
						ui.item(renderItem(scores[i]));
					}
				}
				
				// update the rank
				rank.set(lastRank);
				
				// update the progress bar
				if (lastRank !== -1 && lastRank !== 0) {
					// the rank is defined and the player is not the first
					
					var score, // the score of the user
						scoreUp, // the score of the player ahead of the player
						scoreDown; // the score of the player behind the player
						
					score = scores[lastRank].counter;
					scoreUp = scores[lastRank - 1].counter;
					
					if (lastRank + 1 === scores.length) { // this player is the last
						scoreDown = 0;
					} else { // there is a player behind him
						scoreDown = scores[lastRank + 1].counter;
					}
					
					// update the progress
					progress.set((score - scoreDown) / Math.max(scoreUp - scoreDown, 1));
				}
			});

			//Try to force the observer to refresh
			dom.p(counters.get(plugin.userId()).counter);
			dom.last().style({display: 'none'});
		});
		
		// Progress bar
		obs.observe(function () {
			// whether this player is #1
			var isFirst = rank.get() === 0;
			
			dom.div(function () {
				dom.style({
					height: 18,
					borderRadius: '2px',
					border: '1px solid #ba1a6e',
					overflow: 'hidden',
					background: isFirst? '#d8c929': 'inherit'
				});
	
				dom.div(function () {
					obs.observe(function () {
						var margin;
						if (isFirst) margin = clicks.get() % 110 - 10;
						else margin = 110 * progress.get() - 10;
						
						dom.style({
							width: '10%',
							height: '100%',
							background: '#ba1a6e',
							marginLeft: margin + '%'
						});
					});
				});
			});
			
		});

		// Main button
		obs.observe(function () {
			ui.bigButton("Charge!", function () {
				server.send('increase');
				clicks.modify(function (x) {
					return x + 1;
				});
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
