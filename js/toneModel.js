/*
Written by Tor Nilsson Öhrn in February of 2013
Inspired by http://phenomnomnominal.github.com/docs/tuner.html and
http://webaudiodemos.appspot.com/input/index.html
*/

(function() {
  // 'use strict';
  hzToBark = function (Hz) {
      // Traunmüller's conversion
      var bark = 26.81 / ( 1+1960/Hz ) - 0.53;
      return bark;
  };
  var audioContext = null,
      analyser = null,
      microphoneInput = null;
  var hertzUnit = { index: 0, name: 'Hz', min: 400.0, max: 3000.0 };
  var barkUnit = { index: 1, name: 'bark', min: hzToBark(hertzUnit.min), max: hzToBark(hertzUnit.max) };
  var units = {bark: barkUnit, hertz: hertzUnit};

  ToneModel = Backbone.Model.extend({
    defaults: {
      updateRate: 30,
      smoothing: 0.0,
      resolution: 512,
      //  Parameters for clipping of uninteresting audio data
      varThreshold: 700,
      outputUnit: units['hertz'],
      fmin: hertzUnit.min,
      fmax: hertzUnit.max,
      soundfileSource: 'audio/ma_short.wav',
      microphoneInput: null,
      soundFileInput: null,
      analysisInputNode: null,
      inputState: null,
      inputStates: {},
      source: null
    },
    initialize: function() {
      /* cross-browser retrieval of neccessary Web Audio API context providers and the ability to get users microphone input
      */
      var vendors = ['', 'ms', 'moz', 'webkit', 'o'];
      for(var x = 0; x < vendors.length && (!window.AudioContext || !navigator.getUserMedia); ++x) {
          window.AudioContext = window[vendors[x]+'AudioContext'];
          navigator.getUserMedia = navigator[vendors[x]+'GetUserMedia'];
      }
      if (!window.AudioContext || !navigator.getUserMedia) {
        alert('UNFORTUNATELY THIS APPlICATION REQUIRES THE LATEST BUILD OF CHROME WITH "Web Audio Input" ENABLED IN chrome://flags.');
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
      // this.get('audio').controls = true;
      this.get('audio').autoplay = false;

      // private temporary state variables 
      this._peaks = [];
      this._data = new Uint8Array(analyser.frequencyBinCount);

      // @TODO remove this ugly fix:
      // Needs to wait for a little bit before the audio is ready to connect with
      createSoundFileNode = function () { 
        this.set({ soundFileInput: audioContext.createMediaElementSource(this.get('audio')) });
        this.get('soundFileInput').connect(audioContext.destination);
      };
      window.setTimeout(createSoundFileNode.bind(this), 100, true);
      // connect the input node to the destination

      // set up audio analysis routing and create a gateway, analysisInputNode,  to this graph
      this.set({ analysisInputNode: this.setupAudioGraph() });
      // connect microphone
      navigator.getUserMedia( {audio:true}, this.initializeMicrophone.bind(this) , function(err) {console.log(err)} );
      // this.get('analysisInputNode').connect
      // redo soundfile set up if the soundfile source changes 
      this.on('change:soundfileSource', this.setupNewSoundfile());
      this.on('change:outputUnit', function() { 
        console.log('changed outputUnit');
        this.trigger('unitChange', [this.get('outputUnit').min,  this.get('outputUnit').max]); 
      });
      this.on('change:source', function() { 
        console.log('changed source');
        this.trigger('sourceChange'); 
      }); 
    },
    initializeMicrophone: function (stream) {
      this.set({microphoneInput: audioContext.createMediaStreamSource( stream ) });
      // Set microphone state
      this.changeState(this.get('inputStates')['microphone']);
    },
    setupNewSoundfile: function() {
      console.log("audiofilesource changed");
      this.get('audio').src = this.get('soundfileSource');
    },
    enableSoundAnalysis: function() {
      var that = this;
      if (!this._intervalId) {
        this._intervalId = window.setInterval(
            function() { that.update(); }, this.get('updateRate'));
      }
      return this;
    },
    disableSoundAnalysis: function() {
      if (this._intervalId) {
        window.clearInterval(this._intervalId);
        this._intervalId = undefined;
      }
      return this;
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
        this.set({ inputState: state });
        this.get('inputState').execute();
      }
    },
    playSound: function() {
      this.get('audio').play();
      this.changeState(this.get('inputStates')['soundfile']);
      console.log("playing sound function");
    },
    pauseSound: function() {
      this.get('audio').pause();
      if (this.get('microphoneInput')) {
        this.changeState(this.get('inputStates')['microphone']);
        console.log("pausing sound function");
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
    update: function() {
      var data = this._data;
      analyser.getByteFrequencyData(data);
      // var speechData = data.subarray(this.fstartIndex, this.fstopIndex);
      var n = data.length;
      var s = 0; // normal sum
      var s2 = 0; // quadratic sum
      var maxP = 0; // amplitude of highest peak
      var i;

      // reuse old array in order to avoid unnecessary instantiation
      var peaks = this._peaks.slice(0);
      // Calculate variance for speech detection 
      for (i = 0; i < n; i++) {
        s += data[i];
        s2 += data[i] * data[i];
        // store index of potential peaks in an array
        if ((data[i] > data[i-1]) && (data[i] > data[i+1])) {
          peaks.unshift(i);
          if (data[i] > maxP) {
            maxP = data[i];
          }
        }
      }
      var variance = (s2 - (s*s) / n) / n;
      // Remove peaks that are too small
      for (i = peaks.length - 1; i >= 0; i--) {
        if (data[peaks[i]] < 0.2 * maxP) {
          peaks.splice(i,1);
        }
      }
      peaks.sort();
      var numPeaksLimit = 4;
      // Return the frequency point that has the highest amplitude in the array
      if (( variance > this.get('varThreshold') ) && ( peaks.length >  numPeaksLimit) ) {
        s = 0;
        var sLength = 0;
        // calculate the average frequency of the first peaks
        for (i = 0; i < numPeaksLimit; i++) {
          // get frequency of certain dataindex
          if (peaks[i]) {
             s += ( peaks[i] ) / ( data.length-1 ) * (this.get('fmax') - this.get('fmin') ) + this.get('fmin');
             sLength++;
          }
        }
        var avgFreq = s/sLength;
        // var avgFreq = ( peaks[testHighest] ) / ( data.length-1 ) * (this.get('fmax') - this.get('fmin') ) + this.get('fmin');

        switch (this.get('outputUnit').index) {
          case 0: // Hz
            this.set({tone: avgFreq});
            break;
          case 1: // Bark
            var avgBark = hzToBark( avgFreq );
            this.set({tone: avgBark});
            break;
        }
      }
      else {
        this.set({tone: 0});
      }
      // console.log(this.get('tone'));
      this.trigger('toneChange', this.get('tone'));
    }
  });
})();



