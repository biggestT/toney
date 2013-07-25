var app = app || {};

(function () {
	'use strict';

	// STATE PATTERN
	// these states are used by the spectrogramModel to keep track of inputsources
	// ---------------------------------------------------------------

	var BaseState = Backbone.Model.extend({
	  initialize: function(analyser) {
	    this._analyser = analyser;
	  }
	})

	var MicrophoneState = BaseState.extend({
	  defaults: {
	    index: 0,
	    name: "microphone" 
	  },
	  execute: function() {
	    this._analyser.connectMicrophone();
	    this._analyser.startSoundAnalysis();
	  },
	  exit: function() {
	    this._analyser.stopSoundAnalysis();
	    this._analyser.disconnectMicrophone();
	  },
	  update: function () {
	  	this._analyser.trigger('microphone:updated', this._analyser._data);
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
	  },
	  exit: function() {
	    this._analyser.stopSoundAnalysis();
	    this._analyser.disconnectSoundfile();
	  },
	  update: function () {
	  	this._analyser.trigger('soundfile:updated', this._analyser._data);
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
	
	// ONLY USE ONE AUDIOCONTEXT
	var audioContext = null;

	// THE MODEL WHICH OUTPUTS A SPECTROGRAM TO LISTENING VIEWS AND/OR MODELS
	// -----------------------------------------------------------------------

	app.SpectrogramModel = Backbone.Model.extend({

		// DEFAULT PARAMETERS
		// ------------------

		defaults: {
			fftSize: 2048,
			smoothing: 0.5,
			bandpass: {
				fMin: 160,
				fMax: 3400,
				qFactor: 0.05
			},
			soundfileSource: 'audio/ma_short.mp3',
			currState: null,
			playing: false,
			processing: false,
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
	        processing: new ProcessingState(this)
	    };

	    // enter processingstate while waiting for microphone and soundfile
	    this.changeState(this._states['processing']);
	    
	    // PREPARE ANALYSER, MICROPHONE AND SOUNDFILE, ONE AT THE TIME 
	    this.initializeAnalyser();
	    this.initializeMicrophone();
	    this.once('microphone:ready', this.initializeSoundfile, this);
	    this.once('soundfile:loaded', this.createSoundFileNode, this);
	    this.once('soundfile:ready', this.initializeAudioGraph, this);
	  	this.once('audiograph:ready', this.inputToggle, this);
	   
	    // PERMANENT EVENT BINDINGS
	    // ---------------------------
	    this.on('soundfile:ended', this.soundfileEnded, this);
	  },

	  // MICROPHONE METHODS
	  // ------------------------------------

	  initializeMicrophone: function () {
			navigator.getUserMedia( {audio:true}, this.createMicrophoneNode.bind(this) , function(err) {console.log(err)} );
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
	  // --------------------------------------

	  initializeSoundfile: function () {
	    this._audio = new Audio(this.get('soundfileSource'));
	    this._audio.preload = false;
	    this._audio.addEventListener("canplay", function () {
		  	this.trigger('soundfile:loaded');
		  }.bind(this));
		  this._audio.addEventListener("ended", function () {
		  	this.trigger('soundfile:ended');
		  }.bind(this));
	    this._audio.autoplay = false;
	  },
	  createSoundFileNode: function () {
	    this._soundFileInput = audioContext.createMediaElementSource(this._audio);
	    this.trigger('soundfile:ready');
	  },
	  connectSoundfile: function () {
	  	this._soundFileInput.connect(this._analysisInputNode);
	  	this._soundFileInput.connect(audioContext.destination);
	  	this._audio.play();
	  	this.set({ playing: true });
	  },
	  disconnectSoundfile: function () {
	  	this._soundFileInput.disconnect();
	  	this._audio.pause();
	  	this.set({ playing: false });
	  },
  	soundfileEnded: function () {
  		// reload audio because setting this._audio.currentTime is not working, 
  		// might be because of currently immature Web Audio API?
			this.initializeSoundfile();  
	    this.once('soundfile:loaded', this.createSoundFileNode, this);
	    this.once('soundfile:ready', this.inputToggle, this);
  	},

	  // ANALYSER METHODS
	  // --------------------------------------

	  initializeAnalyser: function () {
	  	this._analyser = audioContext.createAnalyser();
	    this._analyser.fftSize = this.get('fftSize');
	    this._analyser.smoothingTimeConstant = this.smoothing;
	  	this._data = new Uint8Array(this._analyser.frequencyBinCount);
	  },
	  startSoundAnalysis: function() {
	    this._animationID = window.requestAnimationFrame(this.updateSpectrogram.bind(this));
	  },
	  stopSoundAnalysis: function() {
	    if ( this._animationID ) {
	      window.cancelAnimationFrame(this._animationID);
	    }
	    this._animationID = 0;
	  },
		updateSpectrogram: function () {
	    this._analyser.getByteFrequencyData(this._data);
	    this.get('currState').update();
	    this._animationID = window.requestAnimationFrame(this.updateSpectrogram.bind(this));
  	},

	  // INITIALIZE THE NODE STRUCTURE IN THE WEB AUDIO GRAPH
	  // ---------------------------------------------

	  initializeAudioGraph: function() {

	  	var analysisInputNode, lpF, hpF, bufferFiller, fftSize, bufferFillSize
	  	, fmin, fmax, q, bp;

	  	fftSize = this.get('fftSize');
	  	bp = this.get('bandpass');
	  	fmin = bp['fMin'];
	  	fmin = bp['fMax'];
	  	q = bp['qFactor'];


	  	// BUFFER INITIALIZATION 
	  	// @TODO Shifting window buffer

		  // bufferFillSize = fftSize/4;

	  	// this._buffer = [];
	  	// for (var i = 0; i < fftSize; i++) {
	  	// 	this._buffer[i] = 0;
	  	// }

		  // var fillbuffer = function(e) {
		  // 	var input = e.inputBuffer.getChannelData(0);
		  // 	for (var i = bufferFillSize; i < this._buffer.length; i++) {
		  // 		this._buffer[i-bufferFillSize] = this._buffer[i];
		  // 	}
		  // 	for (var i = 0; i < input.length; i++) {
		  // 		this._buffer[this._buffer.length-bufferFillSize + i] = input[i];
		  // 	}
		  // };

		  // bufferFiller = audioContext.createScriptProcessor(bufferFillSize, 1, 1);
		  // bufferFiller.onaudioprocess = fillBuffer.bind(this);

		    
	  	// AUDIO API GRAPH:
	    // input -> lowpass -> highpass -> buffer for analysis -> speaker output

	    this._analysisInputNode = audioContext.createGainNode();

	    // Low-pass filter. 
	    lpF = audioContext.createBiquadFilter();
	    lpF.type = lpF.LOWPASS; 
	    lpF.frequency.value = fmax;
	    lpF.Q = q;

	    // High-pass filter. 
	    hpF = audioContext.createBiquadFilter();
	    hpF.type = hpF.HIGHPASS; 
	    hpF.frequency.value = fmin;
	    hpF.Q = q;

	    // Connect all of the nodes
	    this._analysisInputNode.connect(lpF);
	    lpF.connect(hpF);
	    hpF.connect(this._analyser);
	    
	    this.trigger('audiograph:ready');
	  },

	  // SWAP BETWEEN SOUNDFILE / MICROPHONE
	  // ----------------------------------------------

	  inputToggle: function() {
			if ( this.get('playing') || this.get('processing') ) {
	      this.changeState(this._states['microphone']);
	    }
	    else {
	      this.changeState(this._states['soundfile']);
	    }
	    this.trigger('sourceChanged');
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
	
	});
})();
