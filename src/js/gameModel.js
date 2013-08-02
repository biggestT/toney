var app = app || {};

(function () {
	'use strict';

	app.GameModel = Backbone.Model.extend({

		// DEFAULT PARAMETERS
		// ------------------

		defaults: {
			player: null,
			reference: null
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

			this.initializeArrays();

		},
		initializeArrays: function () {
			this._tones = [];
			this._line = [];
			this._spectrum = [];
		},
		update: function () {
			
		}
	});
		
})();