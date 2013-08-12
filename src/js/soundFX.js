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
			console.log(app.game);
			this.listenTo(app.game, 'game:newScore', this.playStarSound);
		},
		playStarSound: function (starScore) {
			// for (var i in starScore) {
			// 	this._starSound.play();
			// }
		},
	});


	var test = new app.Sound('audio/star.wav', function () {
		test.play(3); 
	});

})();