var app = app || {};

(function () {


	app.EventAggregator = Backbone.Model.extend({

			initialize: function () {
				console.log('tried to make agg');
				_.extend(this, Backbone.Events);
				console.log(app.game);
				
				this.listenTo(app.game, 'change:passedLevels', function() {
					this.trigger('game:levelPassed', app.game.get('level'));
				})
				this.listenTo(app.game, 'change:referenceLine', function () {
					this.trigger('reference:reset');
					console.log('new reference toneline: ' + app.game.get('referenceLine'));
				})
			}
	});

})();
