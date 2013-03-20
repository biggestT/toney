/*
Written by Tor Nilsson Öhrn in February of 2013
Inspired by http://phenomnomnominal.github.com/docs/tuner.html and
http://webaudiodemos.appspot.com/input/index.html
*/

(function() {
  // 'use strict';
  // Variables and functions that are shared among the ToneModel instances
  hzToBark = function (Hz) {
      // Traunmüller's conversion
      var bark = 26.81 / ( 1+1960/Hz ) - 0.53;
      return bark;
  };
  var audioContext = null,
      analyser = null,
      audioInput = null;
  var hertzUnit = { index: 0, name: 'Hz', min: 400.0, max: 3000.0 };
  var barkUnit = { index: 1, name: 'bark', min: hzToBark(hertzUnit.min), max: hzToBark(hertzUnit.max) };
  var units = {bark: barkUnit, hertz: hertzUnit};

  ToneModel = Backbone.Model.extend({
    defaults: {
      updateRate: 50,
      smoothing: 0.0,
      resolution: 512,
      //  Parameters for clipping of uninteresting audio data
      varThreshold: 700,
      outputUnit: units['hertz'],
      fmin: hertzUnit.min,
      fmax: hertzUnit.max,
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

      this.sampleRate = audioContext.sampleRate;
      analyser = audioContext.createAnalyser();

      analyser.fftSize = this.get('resolution');
      analyser.smoothingTimeConstant = this.smoothing;

      this.set({
        observers: new ObserverList(),
        sampleRate: audioContext.sampleRate,
        peaks: [],
        data: new Uint8Array(analyser.frequencyBinCount) 
      })
      // connect microphone
      navigator.getUserMedia( {audio:true}, this.gotStream.bind(this), function(err) {console.log(err)} );
  
    },
    enable: function() {
      var that = this;
      if (!this.intervalId) {
        this.intervalId = window.setInterval(
            function() { that.update(); }, this.get('updateRate'));
      }
      return this;
    },
    disable: function() {
      if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = undefined;
      }
      return this;
    },
    gotStream: function(stream) {
      // Create an AudioNode from the stream.
      var audioInput = audioContext.createMediaStreamSource( stream );

     
      // Create the filters
      // var gain = audioContext.createGainNode(); // not used ATM
      var lpF = audioContext.createBiquadFilter();
      var hpF = audioContext.createBiquadFilter();

      // Create the audio graph.
      audioInput.connect(lpF);
      lpF.connect(hpF);
      hpF.connect( analyser );

      lpF.type = lpF.LOWPASS; // Low-pass filter. 
      hpF.type = hpF.HIGHPASS; // High-pass filter. 

      lpF.frequency.value = this.get('fmax'); // Set cutoff 
      hpF.frequency.value = this.get('fmin'); // Set cutoff 

      console.log("microphone audio graph set up!");
      console.log(analyser);

      this.enable();
    },
    update: function() {
      var data = this.get('data');
      analyser.getByteFrequencyData(data);
      // var speechData = data.subarray(this.fstartIndex, this.fstopIndex);
      var n = data.length;
      var s = 0; // normal sum
      var s2 = 0; // quadratic sum
      var maxP = 0; // amplitude of highest peak
      var i;
      // console.log(data);

      // reuse old array in order to avoid unnecessary instantiation
      var peaks = this.get('peaks').slice(0);
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
        // calculate the average frequency of the first four peaks
        for (i = 0; i < numPeaksLimit; i++) {
          // get frequency of certain dataindex
          if (peaks[i]) {
             s += ( peaks[i] ) / ( data.length-1 ) * (this.get('fmax') - this.get('fmin') ) + this.get('fmin');
             sLength++;
          }
        }
        var avgFreq = s/sLength;

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
      this.trigger('toneChange', this.get('tone'));
    }
  });
})();

// TODO - get input from soundfile:

  // // for playing soundfile
  // audio = new Audio();
  // audio.src = 'audio/ma_short.wav';
  // audio.controls = true;
  // audio.autoplay = false;
  // $('#player').append(audio);
  
  // source = audioContext.createMediaElementSource(audio);
 // Connect nodes for routing
  // source.connect(analyser);
  // source.connect(audioContext.destination);



