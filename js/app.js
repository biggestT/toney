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
			console.log(this.$toneWindow);

			// turn all button elements into nice jquery UI buttons
			$('button').button();

			// app.spectrogramModel = new app.spectrogramModel();
			app.spectrogramModel = new app.SpectrogramModel();

			var toneLineContext = this.$toneWindow[0].getContext('2d');

			// var line = new app.ToneLineView({
			// 	model: app.spectrogramModel,
			// 	ctx: toneLineContext
			// });

			// Only for testing purposes, not used in production
			var test = new app.TestView({
				model: app.spectrogramModel
			});
			
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
					this.playPauseButton.button('option', 'label', 'Pause');
					this.$footer.html('listening to the soundfile: </br>' + app.spectrogramModel.get('soundfileSource') );
				}
				else {
					this.playPauseButton.button('option', 'label', 'Play');
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