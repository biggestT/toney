var app = app || {};

(function ($) {
	'use strict';

	app.AppView = Backbone.View.extend({

		// Bind app to existing HTML div
		el: '#toneyApp',

		// Delegated events for user actions
		events: {
			'click #playPause': 'togglePlayPause'
		},

		// UNDER CONSTRUCTION! 
		initialize: function() {

			this.playPauseButton = this.$('#playPause');
			this.$footer = this.$('#footer');
			this.$main = this.$('#main');
			this.$gameWindow = $('#gameWindow');


			// MODEL FOR HANDLING INPUT AND OUTPUTTING SPECTROGRAM TO TONELINES
			//---------------------------------------------------

			app.spectrogram = new app.SpectrogramModel();

			// TONELINE GAMEPLAY
			//------------------

			app.game = new app.GameModel();
			app.game.ctx = this.$gameWindow[0].getContext('2d'); // global context for drawing game related things
			console.log(app.game.ctx);
			
			app.gameView = new app.GameView({
				game: app.game
			});

			// RE-RENDER THE APP WHEN INPUT CHANGES
			this.listenTo( app.spectrogram, 'stateChanged', this.render );

			this.render();
		},
		// Re-rendering the App when the spectrogram's state changes
		render: function () {
			if (app.spectrogram.get('processing')) {
				$(this.el).hide();
				$('#processingImage').show();
			}
			// if not in processing state:
			else {

				$(this.el).show();
				$('#processingImage').hide();
				if (app.spectrogram.get('playing')) {
							console.log('rendering');
					this.playPauseButton.prop('value', 'Pause');
					this.$footer.html('listening to the soundfile: </br>' + app.spectrogram.get('soundfileSource') );
				}
				else {
					this.playPauseButton.prop('value', 'Play');
					this.$footer.text('please speak into the microphone');
				}
			}
		},
		// swap between playing and paused sound in model
		togglePlayPause: function() {
			app.spectrogram.inputToggle();
			console.log('toggled play pause');
		}
	});
})(jQuery);