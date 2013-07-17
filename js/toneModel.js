/*
Written by Tor Nilsson Öhrn in February of 2013
Inspired by Craig Spence's:
http://phenomnomnominal.github.com/docs/tuner.html 
and:
http://webaudiodemos.appspot.com/input/index.html
*/

var app = app || {};
// 'use strict';
var audioContext = null,
    analyser = null,
    microphoneInput = null;

app.ToneModel = Backbone.Model.extend({
  defaults: {
    smoothing: 0.0,
    resolution: 2048,
    length: 100,
    outLimits: [Number.MAX_VALUE, Number.MIN_VALUE],
    //  Parameters for clipping of uninteresting audio data
    varThreshold: 1000,
    iterations: 7, // downsampling factor for HPS algorithm
    fmin: 100, 
    fmax: 3000,
    soundfileSource: 'audio/ma_short.wav',
    microphoneInput: null,
    soundFileInput: null,
    analysisInputNode: null,
    inputState: null,
    inputStates: {},
    playing: false,
    processing: false
  },
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

    // fft analyser instantiation and setup
    analyser = audioContext.createAnalyser();
    analyser.fftSize = this.get('resolution');
    analyser.smoothingTimeConstant = this.smoothing;
    // initialise attributes
    this.set({
      inputStates: {
        microphone: new microphoneState(this),
        soundfile: new soundfileState(this),
        processing: new processingState(this)
      },
      audio: new Audio(this.get('soundfileSource'))
    })
    // set to processing state while waiting for microphone connection
    this.changeState(this.get('inputStates')['processing']);
    
    // set up the models different inputstates
    this.set({ audio: new Audio(this.get('soundfileSource')) });
    this.get('audio').autoplay = false;

    // private temporary state variables 
    this._peaks = [];
    this._data = new Uint8Array(analyser.frequencyBinCount);

    // @TODO remove this ugly fix:
    // Needs to wait for a little bit before the audio is ready to connect with
    createSoundFileNode = function () { 
      this.set({ soundFileInput: audioContext.createMediaElementSource(this.get('audio')) });
    };
    window.setTimeout(createSoundFileNode.bind(this), 100, true);
    // connect the input node to the destination

    // set up audio analysis routing and create a gateway, analysisInputNode,  to this graph
    this.set({ analysisInputNode: this.setupAudioGraph() });
    // connect microphone
    navigator.getUserMedia( {audio:true}, this.initializeMicrophone.bind(this) , function(err) {console.log(err)} );


    // EVENT BINDING

    // redo soundfile set up if the soundfile source changes 
    this.on('change:soundfileSource', this.setupNewSoundfile());
   
    // Toggle play pause when soundfile is finished playing
    $(this.get('audio')).bind('ended', this.audioEnded.bind(this));
  },
  initializeMicrophone: function (stream) {
    this.set({microphoneInput: audioContext.createMediaStreamSource( stream ) });
    // Set to microphone input state
    this.changeState(this.get('inputStates')['microphone']);
  },
  setupNewSoundfile: function() {
    console.log("audiofilesource changed");
  },
  startSoundAnalysis: function() {
    this.animationID = window.requestAnimationFrame(this.update.bind(this));
  },
  stopSoundAnalysis: function() {
    if ( this.animationID ) {
      window.cancelAnimationFrame(this.animationID);
    }
    this.animationID = 0;
  },
  audioEnded: function () {
    this.get('audio').currentTime = 0;
    console.log('audio finished playing');
    this.playToggle();
  },
  changeState: function(state) {
    var inputState = this.get('inputState');
    // Make sure the current state wasn't passed in
    if (inputState !== state) {
      // Make sure the current state exists before
      // calling exit() on it
      if (inputState) {
        inputState.exit();
      }
      this.trigger('stateChanged');
      this.set({ inputState: state });
      this.get('inputState').execute();
      console.log('state changed');
    }
  },
  playToggle: function() {
    var wasPlaying = this.get('playing');
    this.set({ playing: !wasPlaying });
    if ( wasPlaying ) {
      this.changeState(this.get('inputStates')['microphone']);
    }
    else {
      this.changeState(this.get('inputStates')['soundfile']);
      console.log('soundfile state');
    }
  },
  setupAudioGraph: function() {
    // Create the filters for speech clipping
    var analysisInputNode = audioContext.createGainNode(); 
    var lpF = audioContext.createBiquadFilter();
    var hpF = audioContext.createBiquadFilter();

    // Create the audio graph for sound analysis
    analysisInputNode.connect(lpF);
    // this.get('soundFileInput').connect(lpF);
    lpF.connect(hpF);
    hpF.connect( analyser );

    lpF.type = lpF.LOWPASS; // Low-pass filter. 
    hpF.type = hpF.HIGHPASS; // High-pass filter. 

    lpF.frequency.value = this.get('fmax'); // Set cutoff 
    hpF.frequency.value = this.get('fmin'); // Set cutoff 
    console.log("audio analysis graph set up!");
    return(analysisInputNode);
  },
  // Implementation of the HPS algorithm plus simple noise/silence detection
  getPitchHPS: function () {
    var iterations = this.get('iterations');
    var data = this._data; 

    analyser.getByteFrequencyData(data);

    var n = data.length;
    var m = Math.floor(n/iterations);
    var spectrum = new Array(m);
    // Psychoacoustic compensation to increase the importance of higher frequencies with an arbitrary constant
    for (var j = 0; j < m; j++) {
      spectrum[j] = 1 + j*30;
    }
    // Create the harmonic product spectrum with an arbitrary constant
    for (var i = 1; i < iterations; i++) {
      for (var j = 0; j < m; j++) {
        spectrum[j] *= data[j*i] / 50;
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
    // have to pass threshold variance to nto be noise
    if ( variance > this.get('varThreshold') ) {
        var toneInHertz = ( max ) / ( m ) * (this.get('fmax') - this.get('fmin') ) + this.get('fmin');
        return toneInHertz;
    } else {
      return -1;
    }

  },
  // Simple Linear Regression Analysis
  // see http://mathworld.wolfram.com/LeastSquaresFitting.html
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

    
    var corrCoeff = (varXY*varXY)/(varX*varY); // not used ATM

    return [k, n]; //  k value and the length of the straight line
  },
  update: function () {

    var input = this.get('inputState');
    var currPitch = this.getPitchHPS();
    var min = this.get('fmin');
    var max = this.get('fmax');

    // only update line if not silence or noise
    if (currPitch > 0) {
      
      currPitch = ( currPitch - min ) / (max - min); // normalise according to analysis boundaries

      // @TODO needs to be normalised again to plot within an as small frequency range as possible? Do this in view or model?
      // outLimits[0] = (currPitch < outLimits[0]) ? currPitch : outLimits[0];
      // outLimits[1] = (currPitch > outLimits[1]) ? currPitch : outLimits[1];
      
      input.addTone(currPitch);
      var tones = input.getTones();

      var line = this.getLinearApproximation(tones);
      
      
      this.trigger('toneChange', line);
    } 
    else {
      input.clearTones();
    }
    // console.log(this.get('audio').currentTime); // trying to detect playback bug #1
    this.animationID = window.requestAnimationFrame(this.update.bind(this));
  }
  
});



