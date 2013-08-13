/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global singleton object
var app = app || {};

(function () {

	var resetSoundfile = function () {
		this.currentTime = 0;
	}

	app.Sound = Backbone.Model.extend({
		
		defaults: {
			source: null,
			playing: false
		},

		// pass soundfile path and callback to execute when soundfile is loaded
		initialize: function() {
			
			var src = arguments[0];
			var callback = arguments[1];

			try {
				this.set({ source: src });
				this._audio = new Audio(src);
				
				this._audio.preload = false;
				this._audio.autoplay = false;

				// Execute passed callback function when audio can play
				
				this._audio.addEventListener('canplay', callback);

				// toggle models playing attribute when audio element starts playing

				this._audio.addEventListener('play', function () {
					this.set({ playing: true });
				}.bind(this));
				this._audio.addEventListener('pause', function () {
					this.set({ playing: false });
				}.bind(this));
				
				// Reset when finished playing 

				this._audio.addEventListener('ended', resetSoundfile.bind(this._audio));

				// Catch audiofile errors and send to the applications event aggregator

				this._audio.addEventListener('error', function (err) {
					this.trigger('error:soundfile', event.srcElement.error);
				}.bind(this));
			}
			catch (err) {
				this.trigger('error:soundfile', err);
			}

		},
		play: function () {
			if (this.get('playing') != true) {
				this._audio.play();
			}
			else {
				var tempAudio = this._audio.cloneNode();
				tempAudio.play();
			}
		},
		playMultipleTimes: function (numTimes) {

			var playAgain = function () {
				this.count++;
				this.currentTime = 0;
				// play audio again if we still have times left to play
				if (this.count < numTimes) {
					this.play();
				}
				else {
					// if audio has played enough times we re-add the ordinary ended-listener
					this.removeEventListener('ended', playAgain);
					this.addEventListener('ended', resetSoundfile.bind(this));
				}
			};

			// temporarily remove the ordinary ended-listener
			this._audio.removeEventListener('ended', this.resetSoundfile);
			this._audio.count = 0;
			this._audio.addEventListener('ended', playAgain.bind(this._audio), false);

			// kick of everything by start playing one first time
			this._audio.play();
		},
		// play: function (numTimes) {
		// 	var audio = this._audio.cloneNode();
		// 	audio.play();
		// 	audio.count = 0;
		// 	audio.addEventListener('canplay', function () {
		// 		this.currentTime = 0;
		// 		console.log('can play again');
		// 		if (this.count < numTimes) {
		// 			this.play();
		// 		}
		// 	})
		// 	audio.addEventListener('ended', function () {
		// 		this.count++;
		// 		console.log('now played: ' + this.count + numTimes);
		// 	});
		// },
		pause: function () {
			this._audio.pause();
		},
		getAudioElement: function () {
			return this._audio;
		}

	});


})();

