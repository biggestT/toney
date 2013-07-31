var app = app || {};

(function ($) {
	'use strict';

	app.TestAppView = app.AppView.extend({

		// UNDER CONSTRUCTION! 
		initialize: function() {

			// Run superconstructor, i.e create a normal application first
			app.AppView.prototype.initialize.apply(this);


			// ADD ADDITIONAL TESTING COMPONENTS TO THE APPLICATION 
			// ######################


			this.$spectrogramWindow = $('#spectrogramWindow');
			this.$sliders = $('#sliders');

			// SPECTROGRAM VIEW FOR TESTING PURPOSES
			// ---------------------------
			var spectrogramContext = this.$spectrogramWindow[0].getContext('2d');
			app.spectrogramView = new app.SpectrogramView({
				model: app.spectrogram,
				ctx: spectrogramContext
			});

			// SLIDERS FOR TESTING PURPOSES
			// ---------------------------
			this.listenTo( app.spectrogram, 'audiograph:ready', this.initializeSliders );
		
			//	TESTING VIEW FOR OUTPUTTING MATLAB FILES
			//	-------------------------------
			//	app.testOutput = new app.TestView({
			//	model: app.spectrogramModel
			// });

		},
		initializeSliders: function () {
				app.slidersViewController = new app.SlidersViewController({
					model: app.spectrogramModel
				});
		}
	});
})(jQuery);