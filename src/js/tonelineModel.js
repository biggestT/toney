var app = app || {};

(function () {
	'use strict';

	// HPS ALGORITHM FOR PITCH DETECTION
	// ------------------

	var getPitchHPS = function (data, spectrum, iterations) {

		var n = data.length;
		var m = Math.floor(n/iterations);

		for (var j = 0; j < m; j++) {
				spectrum[j] = 1 + j;
		}

		// Create the harmonic product spectrum 
		for (var i = 1; i < iterations; i++) {
			for (j = 0; j < m; j++) {
				spectrum[j] *= data[j*i];
			}
		}

		// Find the index of the frequency with the highest amplitude in the HPS 
		var max = 0;
		for (j = 0; j < m; j++) {
				if (spectrum[j] > spectrum[max]) {
						max = j;
				}
		}

		var s = 0; // sum for calculating variance
		var s2 = 0; // sum squared for calculation variance 
		for (i = 0; i < n; i++) {
			s += data[i];
			s2 += data[i] * data[i];
		}
		// var variance = (s2 - (s*s) / n) / n;
		var tone = max/m;
		// have to pass threshold variance to not be noise
		// if ( variance > varThreshold ) {
				return tone;
		// } else {
			// return -1;
		// }

	};

	// SIMPLE LINEAR REGRESSION
	// see http://mathworld.wolfram.com/LeastSquaresFitting.html
	// -----------------------------------------------------------

	var getLinearApproximation = function(tones) {
		var n = tones.length;		 
		var sumXY = 0;
		var sumX = 0;
		var sumY = 0;
		var sumXX = 0;
		var sumYY = 0;

		for (var i = 0; i < n; i++) {
			sumX += i;
			sumY += tones[i];
			sumXX += i*i;
			sumYY += tones[i]*tones[i];
			sumXY += tones[i]*i;
		}

		var avgX = sumX/n;
		var avgY = sumY/n;
		var avgXY = sumXY/n;
		var avgXX = sumXX/n;
		var avgYY = sumYY/n;

		var varXY = avgXY - avgX*avgY;
		var varX = avgXX - avgX*avgX;
		// var varY = avgYY - avgY*avgY;

		var k = varXY/varX;
		// No need to use m-value since we are only interested in relative change in pitch over time,
		// i.e the slope and length of the line
		// var a = avgY - b*avgX; 

		// var corrCoeff = (varXY*varXY)/(varX*varY); // not used ATM

		return [k, n]; //	k value and the length of the straight line
	};

	app.TonelineModel = Backbone.Model.extend({

		// DEFAULT PARAMETERS
		// ------------------

		defaults: {
			iterations: 8, // downsampling steps of the HPS-algorithm
			varThreshold: 3,
			maxAmplitude: 0.03
		},

		initialize: function () {

			// SUBSCRIBE TO THE SPECTROGRAM MODEL PASSED TO THE TONELINE AT CREATION
			this.listenTo(app.spectrogram, this.get('watch') , this.update);

			this._tones = [];
			this._line = [];
			this._spectrum = [];

		},

		// UPDATE METHOD THAT RUNS APPROX 60 TIMES PER SECOND
		// ----------------------------------------------------

		update: function (spectrogram) {
			this._spectrum.length = 0;
			var currPitch = getPitchHPS(spectrogram, this._spectrum, this.get('iterations'));

			// only update line if not silence or noise
			if (this._silenceCount < 20) {
				if (currPitch > 0) {
					this._tones.push(currPitch);
					var line = getLinearApproximation(this._tones);
					line[0] = line[0]/this.get('maxAmplitude'); // normalise to dynamic range
					if ( !isNaN(line[0]) && !isNaN(line[1]) ) { this.trigger('tonelineChange', line); }
				} 
				else {
					this._silenceCount++;
				}
			
			}
			// Reset data for the current input to prepare for the next speech sample
			else {
				this._tones.length = 0;
				this._silenceCount = 0;
				// this.trigger('tonelineReset');
			}
			
		}
	});
})();