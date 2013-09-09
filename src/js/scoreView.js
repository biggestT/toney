/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

(function () {

	app.ScoreView = Backbone.View.extend({
		
		scale: 20,
		margin: 20,
		drawingDelay: 180,
		colors: ['#FFFF33', '#DDD'],

		initialize: function() {
			
			if( !(arguments[0] instanceof jQuery) ) {
				app.eventAgg.trigger('error', 'no jQuery element passed to score view');
				return;
			}

			this.$el = arguments[0];

			this.stars = [];
			for (var i = 0; i < app.game.get('maxStars'); i++) {
				this.stars.push($('<i>', { class: 'icon-star' }));
				console.log('added star icon');
			}
			
			this.$el.append(this.stars);

			// Listen to the corresponding game model 
			this.listenTo(app.eventAgg, 'game:newScore game:startStop', this.render);
			
		},
		render: function (starScore) {
			

			var dt = this.drawingDelay;
			var N = app.game.get('maxStars');

			// Empty all current star icons
			for (var i = 0; i < N; i++) {
				this.stars[i].css('color', 'transparent');
			}
			// Recursively show stars with a certain delay in between each
			var current = 0;

			setTimeout(showNextStar.bind(this), dt);

			function showNextStar() {

				var filled = (current < starScore ) ? true : false;
				if (filled) {
					this.stars[current].css('color', this.colors[0]);
					app.eventAgg.trigger('game:drawingStar');
					current++;
					setTimeout(showNextStar.bind(this), dt);
				} 
				else {
					for (var i = current; i < N; i++) {
						this.stars[i].css('color', this.colors[1]);
					}
					app.eventAgg.trigger('game:doneDrawingStars');
				}

			}
		}
		
	});
})();

