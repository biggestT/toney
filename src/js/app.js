var app = app || {};

(function ($) {
	'use strict';

	app.AppView = Backbone.View.extend({

		// Bind app to existing HTML div
		el: '#toneyApp',

		initialize: function() {

			this.$loadingImage = $('<img>', { src: 'images/processing.gif', id: 'loadingImage'} );
			this.$gameWindow = $('<canvas>', { id: 'gamewindow' });
			this.$gameWindow[0].width = $(window).width();
			this.$gameWindow[0].height = $(window).height();
			this.$controls = $('<menu>', { class: 'controls' });
			this.$score = $('<div>', { class: 'scoreboard' });
			// Set new gamewindow size each time the window is resized
			// Not working ATM since the change needs to be propagated downwards through all
			// effected game components!

			// $(window).resize( function () {
			// 	this.$gameWindow[0].width = $(window).width();
			// 	this.$gameWindow[0].height = $(window).height();
			// });

			// The Applications event aggregator
			// ---------------------------------
			app.eventAgg = _.extend({}, Backbone.Events);

			this.$el.append( this.$gameWindow , [ this.$controls, this.$score ]);
			this.$el.parent().append( this.$loadingImage );

			// Initially only show the loading image
			this.$loadingImage.show();
			this.$el.hide();

			// MODEL FOR HANDLING INPUT AND OUTPUTTING SPECTROGRAM TO TONELINES
			//---------------------------------------------------

			app.spectrogram = new app.SpectrogramModel();

			// INITIALIZE GLOBAL GAME COMPONENTS
			//----------------------------------

			app.game = new app.GameModel();
			app.game.ctx = this.$gameWindow[0].getContext('2d'); // global context for drawing game related things
			
			app.gameView = new app.GameView();

			app.controlsView = new app.ControlsView(this.$controls);

			app.scoreView = new app.ScoreView(this.$score);

			app.gameSounds = new app.SoundFX();


			// RENDER THE GAME WINDOW ONCE SPECTROGRAM HAS GONE THROUGH ITS INITIAL SETUP
			this.listenToOnce( app.eventAgg, 'spectrogram:ready', function () {
				this.$loadingImage.hide();
				this.$el.show();
			} );
		}
	});
})(jQuery);