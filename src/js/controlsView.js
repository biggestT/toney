// reference to global app object
var app = app || {};

(function () {

	var playPause = function () {
		app.eventAgg.trigger('controls:playPause');
	};
	var goNext = function () {
		app.eventAgg.trigger('controls:nextLevel');
	};
	var isPlaying = function () {
		return app.spectrogram.get('playing');
	};
	var levelIsPassed = function () {
		console.log(app.game.get('currLevelPassed'));
		return app.game.get('currLevelPassed');
	}

	app.ControlsView = Backbone.View.extend({
		
		colors: ['#2EFE3E', '#FF4D2E'],

		initialize: function() {
			
			if( !(arguments[0] instanceof jQuery) ) {
				app.eventAgg.trigger('error', 'no jQuery element passed to controls');
				return;
			};

			this.$controls = arguments[0];

			this.$playPause = $('<input>', { type: 'button', value: 'play' });
			this.$playPause.click(playPause);
			this.$nextLevel = $('<input>', { type: 'button', value: 'next tone' });
			this.$nextLevel.click(goNext);
			this.$nextLevel.hide();
			

			this.buttons = [];
			this.buttons.push(this.$playPause);
			this.buttons.push(this.$nextLevel);

			this.$controls.append(this.buttons);

			// Listen to some global events
			this.listenTo(app.eventAgg, 'reference:playPause game:startStop game:levelPassed', this.render);

			// this.render();
		},

		render: function () {
			console.log('rendering controls, isplaying: ' + isPlaying());
			this.$playPause.prop('value', isPlaying() ?  '' :  'play');
			this.$playPause.css('color', isPlaying() ?  this.colors[1]:  this.colors[0]);
			levelIsPassed() ?  this.$nextLevel.show() :  this.$nextLevel.hide();
		},
		clearCanvas: function() {
			var ctx = this.ctx;
			var c = ctx.canvas;
			ctx.clearRect(0, 0, c.width, c.height);
		},
	});
})(jQuery);

