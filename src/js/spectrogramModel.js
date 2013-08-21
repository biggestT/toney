var app = app || {};
var audioContext;

(function () {
	'use strict';

	// STATE PATTERN
	// these states are used by the spectrogramModel to keep track of inputsources
	// ---------------------------------------------------------------

	var BaseState = Backbone.Model.extend({
		initialize: function(owner) {
			this._analyser = owner;
		}
	});

	var MicrophoneState = BaseState.extend({
		defaults: {
			index: 0,
			name: "microphone" 
		},
		execute: function() {
			this._analyser.connectMicrophone();
			this._analyser.startSoundAnalysis();
			console.log('executing microphone state');

		},
		exit: function() {
			this._analyser.stopSoundAnalysis();
			this._analyser.disconnectMicrophone();
		},
		update: function () {
			app.eventAgg.trigger('microphone:updated', this._analyser._highpassSpectrogram);
			console.log('updated microphone spectrum');
		}
	});

	var SoundfileState = BaseState.extend({
		defaults: {
			index: 1,
			name: "soundfile" 
		},
		execute: function() {
			this._analyser.connectSoundfile();
			this._analyser.startSoundAnalysis();
			console.log('executing soundfile state');
		},
		exit: function() {
			this._analyser.stopSoundAnalysis();
			this._analyser.disconnectSoundfile();
		},
		update: function () {
			app.eventAgg.trigger('soundfile:updated', this._analyser._highpassSpectrogram);
			// console.log(this._analyser._soundfile.getAudioElement().currentTime);
			// this._analyser.trigger('soundfile:updated', this._analyser._highpassSpectrogram);
		}
	});

	var ProcessingState = BaseState.extend({
		defaults: {
			index: 2,
			name: "processing" 
		},
		execute: function() {
			this._analyser.set({ 'processing': true });
			console.log('processing ...');
		},
		exit: function() {
			this._analyser.set({ 'processing': false });
			console.log('finished processing');
		}
	});
	var StandbyState = BaseState.extend({
		defaults: {
			index: 3,
			name: "standby" 
		},
		execute: function() {
			this._analyser.set({ 'standby': true });
			console.log('spectrogram standby ...');
		},
		exit: function() {
			this._analyser.set({ 'standby': false });
			console.log('spectrogram started again!');
		}
	});
	
	// THE MODEL WHICH OUTPUTS A SPECTROGRAM TO LISTENING VIEWS AND/OR MODELS
	// -----------------------------------------------------------------------

	app.SpectrogramModel = Backbone.Model.extend({

		// DEFAULT PARAMETERS
		// ------------------

		defaults: {
			fftSize: 2048,
			spectrogramSize: 300,
			smoothing: 0.0,
			bandpass: {
				fMin: 160,
				fMax: 3400,
				qFactor: 0.05
			},
			soundfileSource: 'https://dl.dropboxusercontent.com/u/16171042/toney/ma_short.ogg',
			currState: null,
			downsampleRate: 4,
			processing: false,
			standby: false,
			playing: false,
			externalAnalyser: false,
			audioNodes: []
		},

		// INITIALIZE THE WHOLE AUDIO SETUP FOR SPECTROGRAM ANALYSIS
		// ------------------------------- 

		initialize: function() {
			// cross-browser retrieval of neccessary Web Audio API context providers and the ability to get users microphone input
			var vendors = ['', 'ms', 'moz', 'webkit', 'o'];
			for(var x = 0; x < vendors.length && (!window.AudioContext || !navigator.getUserMedia); ++x) {
					window.AudioContext = window[vendors[x]+'AudioContext'];
					navigator.getUserMedia = navigator[vendors[x]+'GetUserMedia'];
			}
			if (!window.AudioContext || !navigator.getUserMedia) {
				alert('THIS APPlICATION REQUIRES "Web Audio Input" ENABLED IN chrome://flags.');
			}

			audioContext = new AudioContext();
			

			this._states = {
					microphone: new MicrophoneState(this),
					soundfile: new SoundfileState(this),
					processing: new ProcessingState(this),
					standby: new StandbyState(this)
			};

			// enter processingstate while waiting for microphone and soundfile
			this.changeState(this._states.processing);
			
			// PREPARE ANALYSEROTPUT, MICROPHONE AND SOUNDFILE, ONE AT THE TIME 
			this._analysisOutputNode = (this.get('externalAnalyser')) ? this.initializeDSP() // External DSP.js analysis 
			: this.initializeAnalyser(); // Web Audio API:s built  in

			// EVENT CHAIN FOR INITIAL SETUP
			this.initializeMicrophone();
			this.once('microphone:ready', this.initializeSoundfile, this);
			this.once('soundfile:ready', this.initializeAudioGraph, this);
			this.once('audiograph:ready', function () {
				this.changeState(this._states.standby);
				// app.eventAgg.trigger('spectrogram:ready'); // Tell the application that the spectrogram is ready
			}.bind(this));

			console.log(this.get('playing'));
			this.listenTo(app.eventAgg, 'controls:playPause', function () {
				if (this._soundfile.get('playing')) {
					this._soundfile.pause();
					console.log('model pause soundfile on behalf of controls');
				}
				else {
					this._soundfile.play();
					console.log('model started soundfile on behalf of controls');
				}
			});
			// this.on('change:playing', this.inputToggle);
			// this.listenTo(app.eventAgg, 'reference:reset', this.inputToggle);
		},

		// MICROPHONE METHODS
		// ------------------------------------

		initializeMicrophone: function () {
			navigator.getUserMedia( {audio:true}, this.createMicrophoneNode.bind(this) , function(err) {console.log(err);} );
		},
		createMicrophoneNode: function (stream) {
			this._microphoneInput = audioContext.createMediaStreamSource( stream );
			console.log('mic node created');
			this.trigger('microphone:ready');
		},
		connectMicrophone: function () {
			this._microphoneInput.connect(this._analysisInputNode);
		},
		disconnectMicrophone: function () {
			this._microphoneInput.disconnect();
		},

		// SOUNDFILE METHODS
		// -----------------

		initializeSoundfile: function () {
			console.log('initializeSoundfile');
			this._soundfile = new app.SegmentedSound(this.get('soundfileSource'), this.createSoundfileNode.bind(this));
			this.listenTo(this._soundfile, 'change:playing', function () {
				var isPlaying = this._soundfile.get('playing');
				app.eventAgg.trigger('reference:playPause');
				this.set({ playing: isPlaying });
				console.log('model heard: ' + isPlaying);
				if (isPlaying) {
					this.changeState(this._states.soundfile);
				}
				else {
					this.changeState(this._states.microphone);
				}
			});
			this.listenTo(this._soundfile, 'reset', function () {

				// console.log(this._soundfile.getAudioElement());
				// this._soundfile = newSoundfile;
				// this._soundfileInput = audioContext.createMediaElementSource(this._soundfile.getAudioElement());
				// this.createSoundfileNode();
			})
		},
		createSoundfileNode: function () {
			this._soundfileInput = audioContext.createMediaElementSource(this._soundfile.getAudioElement());
			this.trigger('soundfile:ready');
		},
		connectSoundfile: function () {
			this._soundfileInput.connect(this._analysisInputNode);
			this._soundfileInput.connect(audioContext.destination);
			this._soundfile.play();
			console.log('tried playing from model');
		},
		disconnectSoundfile: function () {
			this._soundfileInput.disconnect();
			this._soundfile.pause();
			console.log('disconnected soundfile and paused audio');
		},

		// ANALYSER METHODS
		// --------------------------------------

		initializeAnalyser: function () {
			var analyser = audioContext.createAnalyser();
			analyser.fftSize = this.get('fftSize');
			analyser.smoothingTimeConstant = this.smoothing;
			this._data = new Uint8Array(analyser.frequencyBinCount);
			this._spectrogram = new Uint8Array(this.get('spectrogramSize'));
			return analyser;
		},
		startSoundAnalysis: function() {
			this._animationID = (this.get('externalAnalyser')) ? 
			window.requestAnimationFrame(this.updateSpectrogramDSP.bind(this))
			: window.requestAnimationFrame(this.updateSpectrogram.bind(this));
		},
		stopSoundAnalysis: function() {
			if ( this._animationID ) {
				window.cancelAnimationFrame(this._animationID);
			}
			this._animationID = 0;
		},
		updateSpectrogram: function () {
			this._analysisOutputNode.getByteFrequencyData(this._data);
			this._spectrogram = this._data.subarray(0, this.get('spectrogramSize')-1);
			this.updateHighpassSpectrogram();
			this.get('currState').update();
			this._animationID = window.requestAnimationFrame(this.updateSpectrogram.bind(this));
		},
		updateHighpassSpectrogram: function () {
			var sum, filter, i, h, shift;

			// filter = [-1, 3, -1];
			// filter = [ 1];
			filter = [-1, -1, 5, -1, -1];
			shift = Math.floor(filter.length/2);
			this._highpassSpectrogram = [];

			for (i = 0; i < this._spectrogram.length; i++) {
				if (i > shift && i < this._spectrogram.length - shift) {
					sum = 0;
					for (h = 0; h < filter.length; h++) {
						sum += filter[h]*this._spectrogram[i+h-shift];
					}
					sum /= filter.length;
					sum = Math.min(Math.max(sum, 0), 128);
					this._highpassSpectrogram[i] = sum;
				}
				else {
					this._highpassSpectrogram[i] = this._spectrogram[i];
				}
				
			}
		},
		updateSpectrogramDSP: function () {
			if (this.get('playing')) {

				var dsr = this.get('downsampleRate');

				this._fft.forward(this._buffer.data);
				this._data = this._fft.getDbSpectrum();
				this.get('currState').update();
				this._animationID = window.requestAnimationFrame(this.updateSpectrogramDSP.bind(this));
			}
			
		},

		// BUFFER INITIALIZATION FOR ANALYSIS WITH EXTERNAL DSP.JS LIBRARY

		// Following the example at 
		// http://phenomnomnominal.github.io/docs/tuner.html
		// currently not in use

		initializeDSP: function () {
			var fftSize = this.get('fftSize');
			var dsr = this.get('downsampleRate');
			var sampleRate = audioContext.sampleRate;
			console.log(sampleRate);
			this._buffer = {
				fillSize: fftSize / dsr,
				data: new Float32Array(fftSize),
				downsampled: new Float32Array(this.fillSize),
				upsampled: new Float32Array(fftSize)
			};

			this._fft = new RFFT(fftSize, sampleRate / dsr);
			this._gauss = new WindowFunction(DSP.GAUSS);

			for (var i = 0; i < fftSize; i++) {
				this._buffer.data[i] = 0;
			}

			var bufferFillerNode = audioContext.createScriptProcessor(this._buffer.fillSize, 1, 1);

			bufferFillerNode.onaudioprocess = function(e) {
				var input = e.inputBuffer.getChannelData(0);
				for (var i = this.fillSize; i < this.data.length; i++) {
					this.data[i-this.fillSize] = this.data[i];
				}
				for (i = 0; i < input.length; i++) {
					this.data[this.data.length-this.fillSize + i] = input[i];
				}

				console.log('processing and filling buffer');
			}.bind(this._buffer);

			return bufferFillerNode;
		},

		// INITIALIZE THE NODE STRUCTURE IN THE WEB AUDIO GRAPH
		// ---------------------------------------------

		initializeAudioGraph: function() {

			var  fftSize, fmin, fmax, q, bp;

			fftSize = this.get('fftSize');
			bp = this.get('bandpass');
			fmin = bp.fMin;
			fmin = bp.fMax;
			q = bp.qFactor;

			// AUDIO API GRAPH:
			// input -> lowpass -> highpass -> fft analysis node -> spectrogram data

			this._analysisInputNode = audioContext.createGainNode();

			var audioNodes = this.get('audioNodes');

			// Low-pass filter. 
			var lpF = audioContext.createBiquadFilter();
			lpF.type = lpF.LOWPASS; 
			lpF.frequency.value = fmax;
			lpF.Q.value = q;

			// High-pass filter. 
			var hpF = audioContext.createBiquadFilter();
			hpF.type = hpF.HIGHPASS; 
			hpF.frequency.value = fmin;
			hpF.Q.value = q;

			// Notch filter. 
			var pF = audioContext.createBiquadFilter();
			pF.type = hpF.PEAKING; 
			pF.frequency.value = 750;
			pF.Q.value = 0.16;
			pF.gain.value = 3.2;
			console.log(pF.gain);

			// Dynamic compressor node
			var dComp = audioContext.createDynamicsCompressor();
			dComp.threshold.value = -10;
			dComp.release.value = 0.60;
			
			audioNodes.push(lpF);
			audioNodes.push(hpF);
			audioNodes.push(pF);
			// audioNodes.push(dComp);

			console.log(audioNodes);

			// Connect all of the nodes
			this._analysisInputNode.connect(audioNodes[0]);
			for (var i = 0; i < audioNodes.length-1; i++) {
				audioNodes[i].connect(audioNodes[i+1]);
			}
			audioNodes[audioNodes.length-1].connect(this._analysisOutputNode);
			this._analysisOutputNode.connect(audioContext.destination);

			this.trigger('audiograph:ready');
		},

		// STATE PATTERN UTILITY
		// -----------------------------

		changeState: function(state) {
			var inputState = this.get('currState');
			// Make sure the current state wasn't passed in
			if (inputState !== state) {
				// Make sure the current state exists before
				// calling exit() on it
				if (inputState) {
					inputState.exit();
				}
				this.set({ currState: state });
				this.get('currState').execute();
				this.trigger('stateChanged');
			}
		},
		standby: function () {
			this.changeState(this._states.standby);
		},
		start: function () {
			this.changeState(this._states.microphone);
		}
	
	});
})();
