var app = app || {};

(function () {
	'use strict';

	// HPS ALGORITHM FOR PITCH DETECTION
	// ------------------

	var getPitchHPS = function (data, spectrum, iterations, varThreshold) {

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
		var variance = (s2 - (s*s) / n) / n;
		// console.log(variance);
		var tone = max;
		// have to pass threshold variance to not be noise
		if ( variance > varThreshold ) {
				return tone;
		} else {
			return -1;
		}

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
		var segment = new Segment (k, n);
		return segment; //	k value and the length of the straight line
	};

	// CLASS REPRESENTING ONE WHOLE TONELINE
	// -----------------------------------

	function Line() {
		this.segments = [];
	}
	Line.prototype.resetLine = function () {
		this.segments.length = 0;
	}
	Line.prototype.clone = function () {
		var copy = new Line();
		copy.segments = this.segments.slice();
		return copy;
	}
	Line.prototype.updateSegment = function (segment) {
		if ( this.segments.length > 0 ) {
			this.segments[this.segments.length-1] = segment;
		}
		else {
			this.segments[0] = segment;
		}
	}
	Line.prototype.getLineAmplitude = function () {
		var aSum = 0;
		for (var i in this.segments) {
			aSum += this.segments[i].k*this.segments[i].n;
		}
		return aSum;
	}
	Line.prototype.getLineLength = function () {
		var n = 0;
		for (var i in this.segments) {
			n += this.segments[i].n;
		}
		return n;
	}
	Line.prototype.getSize = function () {
		var nSum = 0;
		var kSum = 0;
		for (var i in this.segments) {
			nSum += this.segments[i].n;
			kSum += this.segments[i].k*this.segments[i].n;
		}
		kSum /= nSum;
		return [nSum, kSum];
	}
	Line.prototype.addSegment = function (segment) {
		this.segments.push(segment);
	}

	// Class representing part of a toneline, i.e one segment
	function Segment(k,n) {
		this.k = k, // k value
		this.n = n  // length of the segment
	}

	app.TonelineModel = Backbone.Model.extend({

		// DEFAULT PARAMETERS
		// ------------------

		defaults: {
			iterations: 8, // downsampling steps of the HPS-algorithm
			varThreshold: 0.05
		},

		initialize: function () {

			// SUBSCRIBE TO THE SINGLE SPECTROGRAM MODEL 
			this.listenTo(app.spectrogram, this.get('watch') , this.update);
			this.listenTo(app.spectrogram, 'sourceChanged' , this.resetToneline);

			this._tones = [];
			this._line = new Line();
			this._spectrum = [];

		},

		// UPDATE METHOD THAT RUNS APPROX 60 TIMES PER SECOND
		// ----------------------------------------------------

		update: function (spectrogram) {
			this._spectrum.length = 0;
			var currPitch = getPitchHPS(spectrogram, this._spectrum, this.get('iterations'), this.get('varThreshold'));

			// only update line if considered being the same speech sample
			if (this._silenceCount < 30) {
				if (currPitch > 0) {
					this._tones.push(currPitch);
					var segment = getLinearApproximation(this._tones);

					if ( !isNaN(segment.k) && !isNaN(segment.n) ) { 

						// DETECT NEED FOR SEGMENTED REGRESSION ANALYSIS 
						var signChange = segment.k*this._prevK;
						if (signChange < -0.0002 && segment.n > 3) { // only start plotting new line if the flip is great enough and the line long enough
							console.log(signChange);
							this._line.addSegment(segment);
							this._tones.length = 0;
						}
						else {
							this._line.updateSegment(segment);
						}

						this._prevK = segment.k;
						// console.log(this._line);
						this.trigger('tonelineChange', this._line);
					}
				} 
				else {
					this._silenceCount++;
				}
			
			}
			// Reset data for the current input to prepare for the next speech sample
			else {
				this.resetToneline();
			}
			
		},
		resetToneline: function()  {
			if (this._line.segments.length != 0) {
				// this.trigger('tonelineChange', this._line);
				this.trigger('tonelineReset', this._line);
			}
			this._tones.length = 0;
			this._line.resetLine();
			this._silenceCount = 0;
		}
	});
})();