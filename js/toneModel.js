/*
Written by Tor Nilsson Öhrn in February of 2013
Inspired by Craig Spence's:
http://phenomnomnominal.github.com/docs/tuner.html 
and:
http://webaudiodemos.appspot.com/input/index.html
*/

var app = app || {};
// 'use strict';
hzToBark = function (Hz) {
    // Traunmüller's conversion
    var bark = 26.81 / ( 1+1960/Hz ) - 0.53;
    return bark;
};
var audioContext = null,
    analyser = null,
    microphoneInput = null;
var hertzUnit = { index: 0, name: 'Hz', min: 100.0, max: 3000.0 };
var barkUnit = { index: 1, name: 'bark', min: hzToBark(hertzUnit.min), max: hzToBark(hertzUnit.max) };
var units = {bark: barkUnit, hertz: hertzUnit};

app.ToneModel = Backbone.Model.extend({
  defaults: {
    updateRate: 30,
    smoothing: 0.0,
    resolution: 2048,
    //  Parameters for clipping of uninteresting audio data
    varThreshold: 1000,
    outputUnit: units['Hz'],
    fmin: hertzUnit.min,
    fmax: hertzUnit.max,
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


    // EVENT NOTIFICATION

    // redo soundfile set up if the soundfile source changes 
    this.on('change:soundfileSource', this.setupNewSoundfile());
   
    console.log(this.get('audio'));
    // Toggle play pause when soundfile is finished playing
    $(this.get('audio')).bind('ended', this.playToggle.bind(this));
  },
  initializeMicrophone: function (stream) {
    this.set({microphoneInput: audioContext.createMediaStreamSource( stream ) });
    // Set to microphone input state
    this.changeState(this.get('inputStates')['microphone']);
  },
  setupNewSoundfile: function() {
    console.log("audiofilesource changed");
    this.get('audio').src = this.get('soundfileSource');
  },
  startSoundAnalysis: function() {
    this.animationID = window.requestAnimationFrame(this.update.bind(this));
    // this.update();
    console.log("started sound analysis")
    // this.update();
  },
  stopSoundAnalysis: function() {
    if ( this.animationID ) {
      window.cancelAnimationFrame(this.animationID);
      console.log("cancelled animationframe");
    }
    this.animationID = 0;
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
    }
    console.log(this.get('playing'));    
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
  setOutputUnit: function( unitName ) {
    if ( $.inArray(unitName, units) ) {
     this.set({ outputUnit: units[unitName] });
     this.trigger('unitChange', [this.get('outputUnit').min,  this.get('outputUnit').max]); 
     console.log('changed outputUnit to: ' + unitName);
    }
  },
  // Implementation of the HPS algorithm
  update: function () {


    var iterations = 7; // downsampling factor
    var data = this._data; 
    analyser.getByteFrequencyData(data);

    var n = data.length;
    var m = Math.floor(n/iterations);
    var spectrum = new Array(m);
    // Psychoacoustic compensation to increase the importance of higher frequencies?
    // 10 is an arbitrary constant
    // I would assume the opposite relationship :S
    for (var j = 0; j < m; j++) {
      spectrum[j] = 1 + j*30;
      // spectrum[j] = 1 ;
    }
    // Create the harmonic product spectrum with 50 being an arbitrary constant
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
        var tone = ( max ) / ( m ) * (this.get('fmax') - this.get('fmin') ) + this.get('fmin');
        switch (this.get('outputUnit').index) {
          case 0: // Hz
            this.set({tone: tone});
            break;
          case 1: // Bark
            var toneInBark = hzToBark( tone );
            this.set({tone: toneInBark});
            break;
        }
    } else {
      this.set({tone: 0});
    }

    // console.log("updated model loop with tone:" + this.get('tone'));
    this.trigger('toneChange', this.get('tone'));
    this.animationID = window.requestAnimationFrame(this.update.bind(this));
  }
    
  
  

  
});


