var app = app || {};

(function () {
	'use strict';

	app.GameModel = Backbone.Model.extend({

		// DEFAULT PARAMETERS
		// ------------------

		defaults: {
			player: null,
			reference: null,
			maxLength: 50,
			maxAmplitude: 5
		},

		initialize: function () {

			// TONELINES
			// --------------------------

			// TWO LINE MODELS FOR CALCULATING TONELINES
			this.set({
				reference: new app.TonelineModel( {
					watch: 'soundfile:updated',
				})
			});
			this.set({
				player: new app.TonelineModel( {
					watch: 'microphone:updated',
				})
			});

		
		},
		update: function () {
			this.trigger('renderGame');
		},
		getAverage: function (line) {
			this._sum += line.getLineAmplitude();
			this._numOfLines++;
			this._avg = this._sum/this._numOfLines;
		}
	});
		
})();