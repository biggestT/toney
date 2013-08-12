/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global singleton object
var app = app || {};
app.vent = _.extend({}, Backbone.Events);

(function () {

	


	app.Sound = Backbone.Model.extend({
		
		defaults: {
			source: null,
			playing: false
		},

		// pass soundfile path and callback to execute when soundfile is loaded
		initialize: function() {
			
			try {
				this.set({ source: arguments[0] });
				this._audio = new Audio(arguments[0]);
				
				this._audio.preload = false;
				this._audio.autoplay = false;

				// Exeute passed callback function when audio can play
				
				this._audio.addEventListener('canplay', arguments[1]);

				// Reset when finished playing 

				this._audio.addEventListener('ended', this.resetSoundfile);

				// Catch audiofile errors and send to the applications event aggregator

				this._audio.addEventListener('error', function (err) {
					app.vent.trigger('error:soundfile', event.srcElement.error);
				}.bind(this));
			}
			catch (err) {
				app.vent.trigger('error:soundfile', err);
			}

		},
		play: function () {
			this._audio.play();
		},
		play: function (numTimes) {
			var audio = this._audio.cloneNode();
			audio.play();
			audio.count = 0;
			audio.addEventListener('canplay', function () {
				this.currentTime = 0;
				console.log('now can play again');
				if (this.count < numTimes) {
					this.play();
				}
			})
			audio.addEventListener('ended', function () {
				this.count++;
				console.log('now played: ' + this.count + numTimes);
			});
		},
		pause: function () {
			this._audio.pause();
		},
		resetSoundfile: function () {
			this._audio.currentTime = 0;
		},
		getAudioElement: function () {
			return this._audio;
		}

	});


})();

