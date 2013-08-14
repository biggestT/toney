/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global singleton object
var app = app || {};

(function () {

	app.SoundFX = Backbone.Model.extend({
		

		defaults: {
			starPath: 'audio/star.wav'
		},

		// pass soundfile path and callback to execute when soundfile is loaded
		initialize: function() {

			this._starSound = new app.Sound(this.get('starPath'));
			this.listenTo(app.eventAgg, 'game:drawingStar', this.playStarSound);
			this.listenTo(app.eventAgg, 'game:drawingBadStar', this.playBadStarSound);
		},
		playStarSound: function () {
			this._starSound.play();
		},
		playBadStarSound: function () {
			// maybe just use the old star sound but with some web audio api-filter to
			// make it sound more depressing :(
		}
	});

})();