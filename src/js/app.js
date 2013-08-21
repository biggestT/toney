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

			this.$loadingPanda = $('<div>', { class: 'loading-panda'} );
			this.$pandaImg = $('<img>', { src: 'images/toneypanda.svg' } );
			this.$loadingPanda.append(this.$pandaImg);

			this.$loadingText = $('<div>', { class: 'loading-text'} );
			this.$loadingText.text('please allow Fat Toney to use your microphone');

			this.$loadingElement.prepend(this.$loadingIcon, [this.$loadingPanda, this.$loadingText ]);

			// jQuery elements for the different visual game components
			this.$toneWindow = $('<canvas>', { id: 'gamewindow' });
			this.$toneWindow[0].width = $(window).width();
			this.$toneWindow[0].height = $(window).height();
			this.$controls = $('<menu>', { class: 'controls' });
			this.$score = $('<div>', { class: 'scoreboard' });

			this.gameComponents = [];
			this.gameComponents.push(this.$toneWindow);
			this.gameComponents.push(this.$controls);
			this.gameComponents.push(this.$score);

			this.$game = $('<div>', {id : 'game'});
			this.$game.append(this.gameComponents);

			// jQuery elements for the help view
			this.$help = $('<div>', { id: 'help' });

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

			this.$el.append(this.$help);
			this.$el.append(this.$game);
			this.$el.parent().append( this.$loadingElement );

			// MODEL FOR HANDLING INPUT AND OUTPUTTING SPECTROGRAM TO TONELINES
			//---------------------------------------------------

			app.spectrogram = new app.SpectrogramModel();

			// INITIALIZE GLOBAL GAME COMPONENTS
			//----------------------------------

			app.game = new app.GameModel();
			app.game.ctx = this.$toneWindow[0].getContext('2d'); // global context for drawing tonelines
			
			app.toneView = new app.GameView();

			app.controlsView = new app.ControlsView(this.$controls);

			app.scoreView = new app.ScoreView(this.$score);

			app.helpView = new app.HelpView(this.$help);

			app.gameSounds = new app.SoundFX();


			// // RENDER THE GAME WINDOW ONCE SPECTROGRAM HAS GONE THROUGH ITS INITIAL SETUP
			// this.listenToOnce( app.eventAgg, 'spectrogram:ready', function () {
			// 	this.$loadingElement.remove();
			// 	this.$help.show();
			// } );
	
			this.listenTo( app.spectrogram, 'change:processing change:standby', this.render)
			
			this.render();
		},
		render: function () {
			this.$loadingElement.hide();
			this.$help.hide();
			this.$game.hide();

			if (app.spectrogram.get('processing')) {
				this.$loadingElement.show();
			}
			else if (app.spectrogram.get('standby')) {
				this.$help.show();
			}
			else {
				this.$game.show();
			}
		}
	});
})(jQuery);