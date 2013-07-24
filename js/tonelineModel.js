var app = app || {};

(function () {
	'use strict';

	app.TonelineModel = Backbone.Model.extend({

		// DEFAULT PARAMETERS
		// ------------------

		defaults: {
			iterations: 8, // downsampling steps of the HPS-algorithm
			varThreshold: 1000
		},

		initialize: function () {

			this._spectrogram = this.get('spectrogram');
			// SUBSCRIBE TO THE SPECTROGRAM MODEL PASSED TO THE TONELINE AT CREATION
			this.listenTo(this._spectrogram, this.get('watch') , this.update);

			this.initializeArrays();

	    
		},
		initializeArrays: function () {
			// HPS SPECTRUM ARRAY INITIALIZATION FOR REUSE IN EACH HPS-LOOP
			// -------------------------------------
			this._spectrogramSize = this._spectrogram.get('fftSize')/2;
			var m = Math.floor(this._spectrogramSize/this.get('iterations'));
			this._cleanSpectrum = new Array(m);
			// Psychoacoustic compensation to increase the importance of higher frequencies with an arbitrary constant
	    // @TODO Not necessary?
	    for (var j = 0; j < m; j++) {
	      this._cleanSpectrum[j] = 1 + j;
	    }
	    // store the tones saved
	    this._tones = [];
			// store the current line 
			this._line = [];
			// store each line segment in a typed array
			// this._lines[0] = new Float32Array(2);
		},

		// HPS ALGORITHM FOR PITCH DETECTION
  	// ------------------

	  getPitchHPS: function (data) {
	    var iterations = this.get('iterations');
	    var n = data.length;
	    var m = Math.floor(n/iterations);
	    var spectrum = this._cleanSpectrum;
	    
	    // Create the harmonic product spectrum 
	    for (var i = 1; i < iterations; i++) {
	      for (var j = 0; j < m; j++) {
	        spectrum[j] *= data[j*i];
	      }
	    }

	    m = spectrum.length;
	    // Find the index of the frequency with the highest amplitude in the HPS 
	    var max = 0;
	    var avg = 0;
	    for (var j = 0; j < m; j++) {
	        var v = spectrum[j];
	        avg += v;
	        if (spectrum[j] > spectrum[max]) {
	            max = j;
	        }
	    }
	    avg /= m;

	    var s = 0; // sum for calculating variance
	    var s2 = 0; // sum squared for calculation variance 
	    for (i = 0; i < n; i++) {
	      s += data[i];
	      s2 += data[i] * data[i];
	    }
	    var variance = (s2 - (s*s) / n) / n;
	    var tone = max/m;
	    // have to pass threshold variance to not be noise
	    if ( variance > this.get('varThreshold') ) {
	        return tone;
	    } else {
	      return -1;
	    }

	  },

	  // SIMPLE LINEAR REGRESSION
	  // see http://mathworld.wolfram.com/LeastSquaresFitting.html
	  // -----------------------------------------------------------

	  getLinearApproximation: function(tones) {
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
	    };

	    var avgX = sumX/n;
	    var avgY = sumY/n;
	    var avgXY = sumXY/n;
	    var avgXX = sumXX/n;
	    var avgYY = sumYY/n;

	    var varXY = avgXY - avgX*avgY;
	    var varX = avgXX - avgX*avgX;
	    var varY = avgYY - avgY*avgY;

	    var k = varXY/varX;
	    // No need to use m-value since we are only interested in relative change in pitch over time,
	    // i.e the slope and length of the line
	    // var a = avgY - b*avgX; 

	    // var corrCoeff = (varXY*varXY)/(varX*varY); // not used ATM

	    return [k, n]; //  k value and the length of the straight line
	  },

	  // UPDATE METHOND THAT RUNS APPROX 60 TIMES PER SECOND
	  // ----------------------------------------------------

	  update: function (spectrogram) {
	    var currPitch = this.getPitchHPS(spectrogram);

	    // only update line if not silence or noise
	    if (currPitch > 0) {
	      this._tones.push(currPitch);
	      var line = this.getLinearApproximation(this._tones);
	      this.trigger('toneChange', line);
	    } 
	    // Reset data for the current input to prepare for the next speech sample
	    else {
	      this._tones = [];
	    }
	  }
	});
})();