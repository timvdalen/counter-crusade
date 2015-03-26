/*global require,exports*/
(function () {
	'use strict';
	
	var dom = require('dom'),
		ui = require('ui'),
		plugin = require('plugin'),
		obs = require('obs'),
		db = require('db'),
		server = require('server');

	exports.render = function () {
		var progress = obs.create(-10);

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
				dom.style({marginTop: '20px'});
				// Show the top 3, including you if you're lower
				for (i = 1; i < scores.length; i += 1) {
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
		ui.bigButton("Charge!", function () {
			server.send('increase');

			// progress ranges from -10 to 110
			progress.set((((progress.get() + 10) + 1) % 110) - 10);
		});

		// Store
		dom.section(function () {
			var money = db.shared.ref('counters').get(plugin.userId()).money,
				renderStoreItem = function (id, name, description) {
					return function () {
						dom.style({Box: 'middle'});

						dom.div(function () {
							dom.style({Box: 'vertical', Flex: 1});
							dom.b(name);
							dom.div(description);
						});
						dom.div(function () {
							ui.button("Koop!", function () {
								//server.call koop id
							});
						});
					};
				};

			dom.h2("De winkel");
			dom.p("Je hebt op dit moment " + money + " geld!");
			ui.list(function () {
				ui.item(renderStoreItem('multiplier', 'Multiplier', 'Kost ongeveer 3 vijftig ofzo'));
				ui.item(renderStoreItem('idle', 'Idle', 'Ramon klikt af en toe voor je'));
			});
		});
	};
}());
