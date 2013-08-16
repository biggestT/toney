/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global singleton object
var app = app || {};


// MODEL FOR BASIC SOUND - e.g sound effects and such
// -----------------------------------------

(function () {

	var resetSoundfile = function () {
			this._audio.pause();
			this._audio.currentTime = 0;
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
				console.log(arguments[0]);

			try {
				this.set({ source: src });
				this._audio = new Audio(src);
				this._audio.preload = true;
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

				this._audio.addEventListener('ended', resetSoundfile.bind(this));

				// Catch audiofile errors and send to the applications event aggregator

				this._audio.addEventListener('error', function (err) {
					app.eventAgg('error:soundfile', event.srcElement.error);
				}.bind(this));
			}
			catch (err) {
				app.eventAgg.trigger('error:soundfile', err + src);
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
		pause: function () {
			this._audio.pause();
		},
		getAudioElement: function () {
			return this._audio;
		}

	});
})();

// MODEL FOR SEGMENTED SOUNDS - e.g reference soundfile and such
// -----------------------------------------------------------

(function () {

	// Private member function to store data
	var readJSON= function (data) {

		this._samples = [];
		var prevStop = 0.0;

		$.each(data.samples, function (key, value) {
			this[key] = {
				name: (value.name) ? value.name : '',
				help: (value.help) ? value.help : '',
				start:  (value.start) ? value.start : prevStop,
				stop: value.stop
			};
			prevStop = value.stop;
		}.bind(this._samples))
		this.set({title: data.title});
	};

	app.SegmentedSound = app.Sound.extend({

		defaults: {
			title: 'no title',
			format: '.json',
			currentSample: null
		},

		initialize: function() {

			// Run superconstructor, i.e create a normal sound instance first
			app.Sound.prototype.initialize.apply(this, arguments);

			this._sampleCount = 0;

			// READ METADATA AND SET UP SOUNDFILE ACCORDINGLY ONCE THE AUDIO IS LOADED:

			this._audio.addEventListener('canplay', function () {

				var jsonPath = this.get('source').replace(/(.mp3|.ogg|.wav)/, '') + this.get('format');
				console.log(jsonPath);

				$.getJSON(jsonPath, readJSON.bind(this) )
				.done( function () {
					var startSample = this._samples[this._sampleCount];
					this.set({ currentSample: startSample });
					this._audio.currentTime = startSample.start;
					app.eventAgg.trigger('metaData:loaded');

					// Add an event listener that pauses the audio if the end of the current sample is reached
					this._audio.addEventListener('timeupdate', function () {
						var current =  this.get('currentSample');
						console.log(this._audio.currentTime);
						if (this._audio.currentTime > current.stop) {
							this.pause();
							// this._audio.currentTime = current.start;
						}
					}.bind(this));

				}.bind(this))
				.fail( function (jqxhr, textStatus, error) {
					app.eventAgg.trigger('error', 'error loading json metadata' + error);
				});

				this.set({ data: jsonPath });

			}.bind(this));
			

		},
		next: function () {
			this._sampleCount++;
			var newTime = this._samples[this_sampleCount].start;
			this._audio.currentTime = newTime;
			this.set({ currentSample: this._samples[this._sampleCount] });
		}

	});


})(jQuery);

