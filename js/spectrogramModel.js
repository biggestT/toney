var app = app || {};

(function () {
	'use strict';
	
	var audioContext = null;

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
			soundfileSource: 'audio/ma_short.wav',
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

	    
	    this.changeState(this._states['processing']);
	    
	    this.initializeMicrophone();
	    this.initializeSoundfile(this.get('soundfileSource'));
	    this.initializeAnalyser();
	    
	    this._analysisInputNode = this.initializeAudioGraph();
	   
	    // EVENT BINDINGS
	    // ---------------------------

	    this.on('microphoneReady', function () { 
	    	this.changeState(this._states['microphone']);
	  	}.bind(this)); // Fired once after microphone has been set up
	    
	    $(this._audio).bind('ended', this.soundfileEnded.bind(this));
	    this.on('change:soundfileSource', this.setupNewSoundfile());
	  },

	  // MICROPHONE METHODS
	  // ------------------------------------

	  initializeMicrophone: function () {
	    var gotMicrophoneStream = function  (stream) {
	    	this._microphoneInput = audioContext.createMediaStreamSource( stream );
	    	this.trigger('microphoneReady');
	    };
			navigator.getUserMedia( {audio:true}, gotMicrophoneStream.bind(this) , function(err) {console.log(err)} );
	  },
	  connectMicrophone: function () {
	  	this._microphoneInput.connect(this._analysisInputNode);
	  },
	  disconnectMicrophone: function () {
	  	this._microphoneInput.disconnect();
	  },

	  // SOUNDFILE METHODS
	  // --------------------------------------

	  initializeSoundfile: function (soundfile) {
	    this._audio = new Audio(soundfile);
	    this._audio.autoplay = false;
	    this._audio.preload = true;
	    // @TODO remove this ugly fix:
      // Needs to wait for a little bit before the audio is ready to connect with
      var createSoundFileNode = function () { 
        this._soundFileInput = audioContext.createMediaElementSource(this._audio) 
      };
      window.setTimeout(createSoundFileNode.bind(this), 200, true);
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
	  setupNewSoundfile: function() {
	    console.log('audiofilesource changed');
	  },
  	soundfileEnded: function () {
  		// reload audio because setting this._audio.currentTime is not working, 
  		// might be because of currently immature Web Audio API for .wav files?
	    this._audio.src = this._audio.src; 
	    this.inputToggle();
  	},

	  // ANALYSER METHODS
	  // --------------------------------------

	  initializeAnalyser: function () {
	  	this._analyser = audioContext.createAnalyser();
	    this._analyser.fftSize = this.get('fftSize');
	    this._analyser.smoothingTimeConstant = this.smoothing;
	  	this._data = new Uint8Array(this._analyser.frequencyBinCount);
	  	this.trigger('analyserReady');
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
	    this.trigger('spectrogramChange', this._data);
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
		  // bufferFiller.onaudioprocess = fillBuffer(e).bind(this);

		    
	  	// AUDIO API GRAPH:
	    // input -> lowpass -> highpass -> buffer for analysis -> speaker output

	    analysisInputNode = audioContext.createGainNode();

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
	    analysisInputNode.connect(lpF);
	    lpF.connect(hpF);
	    hpF.connect(this._analyser);
	    

	    console.log('audio analysis graph set up!');
	    return(analysisInputNode);
	  },

	  // SWAP BETWEEN SOUNDFILE / MICROPHONE
	  // ----------------------------------------------

	  inputToggle: function() {
	    if ( this.get('playing') ) {
	      this.changeState(this._states['microphone']);
	    }
	    else {
	      this.changeState(this._states['soundfile']);
	    }
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
