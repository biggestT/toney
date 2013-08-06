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

			// SUBSCRIBE TO TONELINE UPDATES
			this.listenTo(this.get('reference'), 'tonelineChange' , this.update);
			this.listenTo(this.get('player'), 'tonelineChange' , this.update);
			// this.listenTo(this.get('reference'), 'tonelineReset' , this.getAverage);
			// this.listenTo(this.get('player'), 'tonelineReset' , this.getAverage);

			this._avg = 0;
			this._sum = 0;
			this._numOfLines = 0;

			this.initializeArrays();

		},
		initializeArrays: function () {
			this._tones = [];
			this._line = [];
			this._spectrum = [];
		},
		update: function () {
			
		},
		getAverage: function (line) {
			this._sum += line.getLineAmplitude();
			this._numOfLines++;
			this._avg = this._sum/this._numOfLines;
		}
	});
		
})();