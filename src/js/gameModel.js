var app = app || {};

(function () {
	'use strict';

	app.GameModel = Backbone.Model.extend({

		// DEFAULT PARAMETERS
		// ------------------

		defaults: {
			player: null,
			reference: null,
			maxLength: 40,
			maxAmplitude: 5,
			maxStars: 1,
			soundFX: true,
			active: false,
			level: 1,
			passedLevels: 0,
			currLevelPassed: false
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
			this.listenTo(app.eventAgg, 'controls:startGame', function () {
				this.set({ active: true });
			});
			this.listenTo(app.eventAgg, 'controls:nextLevel', function () {
				this.set({ active: false });
			});
			this.listenTo(app.eventAgg, 'game:newLevel', function (sample) {
				this.set({ level: sample.level });
			});

			this.on('change:passedLevels', this.update);
			this.on('change:active', function () {
				if (this.get('active') == true ){
					this.start();
				}
				else {
					this.stop();
				}
			});
			
		},
		update: function () {
			var currPassed = ( this.get('passedLevels') <= this.get('level') );
			this.set({ currLevelPassed: currPassed });
		},
		stop: function () {
			app.spectrogram.standby();
		},
		start: function () {
			app.spectrogram.start();
		},
		getPlayerScore: function (line) {
			if (typeof this._referenceLine !== 'undefined') {

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

				app.eventAgg.trigger('game:newScore', starScore);

				// The player has passed this level if she or he gets at least one star
				if (starScore >= 1) {

					var currLevel = this.get('level');
					var passedLevels = this.get('passedLevels');

					if ( currLevel >= passedLevels ) {
						passedLevels++
						this.set({ passedLevels: passedLevels });
						app.eventAgg.trigger('game:levelPassed', currLevel);
					}
				}
			}
		},
		updateReferenceLine: function (line) {
			this._referenceLine = line.clone();
			app.eventAgg.trigger('reference:reset');
			console.log('new reference toneline: ' + line);
		}

	});
		
})();