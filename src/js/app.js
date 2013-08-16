var app = app || {};

(function ($) {
	'use strict';

	app.AppView = Backbone.View.extend({

		// Bind app to existing HTML div
		el: '#toneyApp',

		initialize: function() {

			// jQuery elements in the inital loading screen
			this.$loadingIcon = $('<i>', { class: 'icon-spinner icon-spin icon-large'} );
			this.$loadingElement = $('<div>', { class: 'loading'} );
			this.$loadingText = $('<div>', { class: 'loading-text'} );
			this.$loadingText.text('please allow Toney to use your microphone');
			this.$loadingElement.prepend(this.$loadingIcon, [this.$loadingText]);

			// jQuery elements for the different visual game components
			this.$gameWindow = $('<canvas>', { id: 'gamewindow' });
			this.$gameWindow[0].width = $(window).width();
			this.$gameWindow[0].height = $(window).height();
			this.$controls = $('<menu>', { class: 'controls' });
			this.$score = $('<div>', { class: 'scoreboard' });

			// Set new gamewindow size each time the window is resized
			// Not working ATM since the change needs to be propagated downwards through all
			// effected game components e.g the tonelines widths in pixels

			// $(window).resize( function () {
			// 	this.$gameWindow[0].width = $(window).width();
			// 	this.$gameWindow[0].height = $(window).height();
			// });
			
			// The Applications global event aggregator
			// ----------------------------------------
			app.eventAgg = _.extend({}, Backbone.Events);

			this.$el.append( this.$gameWindow , [ this.$controls, this.$score ]);
			this.$el.parent().append( this.$loadingElement );

			// Initially only show the loading image
			this.$el.hide();

			// MODEL FOR HANDLING INPUT AND OUTPUTTING SPECTROGRAM TO TONELINES
			//---------------------------------------------------

			app.spectrogram = new app.SpectrogramModel();

			// INITIALIZE GLOBAL GAME COMPONENTS
			//----------------------------------

			app.game = new app.GameModel();
			app.game.ctx = this.$gameWindow[0].getContext('2d'); // global context for drawing tonelines
			
			app.gameView = new app.GameView();

			app.controlsView = new app.ControlsView(this.$controls);

			app.scoreView = new app.ScoreView(this.$score);

			app.gameSounds = new app.SoundFX();


			// RENDER THE GAME WINDOW ONCE SPECTROGRAM HAS GONE THROUGH ITS INITIAL SETUP
			this.listenToOnce( app.eventAgg, 'spectrogram:ready', function () {
				this.$loadingElement.remove();
				this.$el.show();
			} );
		}
	});
})(jQuery);