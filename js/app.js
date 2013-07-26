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
			this.$toneWindow = $('#toneWindow');
			this.$spectrogramWindow = $('#spectrogramWindow');

			// MODEL FOR HANDLING INPUT AND OUTPUTTING SPECTROGRAM TO TONELINES
			//---------------------------------------------------

			app.spectrogramModel = new app.SpectrogramModel();

			// TONELINES
			// --------------------------

			// TWO LINE MODELS FOR CALCULATING TONELINES
			app.userToneModel = new app.TonelineModel( {
				spectrogram: app.spectrogramModel,
				watch: 'microphone:updated'
			});
			app.referenceToneModel = new app.TonelineModel( {
				spectrogram: app.spectrogramModel,
				watch: 'soundfile:updated',
			});

			// VIEWS CORRESPONDING TO THE TWO TONELINES
			var toneLineContext = this.$toneWindow[0].getContext('2d');
			
			app.userToneline = new app.TonelineView({
				model: app.userToneModel,
				color: ['#BB0805', '#FF4D2E'],
				ctx: toneLineContext
			});	

			app.referenceToneline = new app.TonelineView({
				model: app.referenceToneModel,
				color: ['#0BB400', '#2EFE3E'],
				ctx: toneLineContext
			});

			
			// SPECTROGRAM VIEW FOR TESTING PURPOSES
			// ---------------------------
			var spectrogramContext = this.$spectrogramWindow[0].getContext('2d');
			app.spectrogramView = new app.SpectrogramView({
				model: app.spectrogramModel,
				ctx: spectrogramContext
			});

			//	TESTING VIEW FOR OUTPUTTING MATLAB FILES
			//	-------------------------------
			//	app.testOutput = new app.TestView({
			//	model: app.spectrogramModel
			// });
			
			// RE-RENDER THE APP WHEN INPUT CHANGES
			this.listenTo( app.spectrogramModel, 'stateChanged', this.render );
			
			this.render();
		},
		// Re-rendering the App when the model's state changes
		render: function () {
			if (app.spectrogramModel.get('processing')) {
				$(this.el).hide();
				$('#processingImage').show();
			}
			// if not in processing state:
			else {

				$(this.el).show();
				$('#processingImage').hide();
				if (app.spectrogramModel.get('playing')) {
							console.log('rendering');
					this.playPauseButton.prop('value', 'Pause');
					this.$footer.html('listening to the soundfile: </br>' + app.spectrogramModel.get('soundfileSource') );
				}
				else {
					this.playPauseButton.prop('value', 'Play');
					this.$footer.text('please speak into the microphone');
				}
			}
		},
		// swap between playing and paused sound in model
		togglePlayPause: function() {
			app.spectrogramModel.inputToggle();
			console.log('toggled play pause');
		}
	});
})(jQuery);