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
			maxAmplitude: 5,
			maxStars: 3
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

			this.listenTo(this.get('reference'), 'tonelineReset', this.updateReferenceLine);
			this.listenTo(this.get('player'), 'tonelineReset', this.getPlayerScore);
			// this.listenTo(app.spectrogram, 'sourceChanged', this.updateReferenceLine);
			
		},
		update: function () {
			this.trigger('renderGame');
		},
		getAverage: function (line) {
			this._sum += line.getLineAmplitude();
			this._numOfLines++;
			this._avg = this._sum/this._numOfLines;
		},
		getPlayerScore: function (line) {
			if (this._referenceLine !== null) {

				var playerSize = line.getSize();
				var referenceSize = this._referenceLine.getSize();

				var longest = Math.max(playerSize[0], referenceSize[0]);
				var highest = Math.max(Math.abs(playerSize[1]), Math.abs(referenceSize[1]));
				
				var ratio = 0.5; // Importance of total line length VS total line slope: [0->1]

				var xDiff = Math.abs(playerSize[0]-referenceSize[0]);
				var yDiff = Math.abs(playerSize[1]-referenceSize[1]);

				var xScore = (longest === 0) ? ratio * 1 : ratio * (1-xDiff/longest);
				var yScore = (highest === 0) ? (1-ratio) * 1 : (1-ratio) * (1-yDiff/highest) ;

				var starScore = Math.round(Math.min(xScore+yScore,1)*this.get('maxStars'));

				console.log('longest: '+ longest + ' highest: ' + highest);
				console.log('xDiff: '+ xDiff + ' yDiff: ' + yDiff);
				console.log('xScore: '+ xScore + ' yScore: ' + yScore);

				this.trigger('game:newScore', starScore);
			}
		},
		updateReferenceLine: function (line) {
			this._referenceLine = line.clone();
			console.log('new reference toneline: ' + line);
		}

	});
		
})();