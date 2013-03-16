/*
Written by Tor Nilsson Öhrn in February of 2013
Heavily inspired by http://phenomnomnominal.github.com/docs/tuner.html and
http://webaudiodemos.appspot.com/input/index.html
*/

hzToBark = function (Hz) {
  // Traunmüller's conversion
  var bark = 26.81 / ( 1+1960/Hz ) - 0.53;
  return bark;
};

var audioContext = null,
    analyser = null,
    audioInput = null;

var hertz = { index: 0, name: 'Hz', min: 400.0, max: 3000.0 };
var bark = { index: 1, name: 'bark', min: hzToBark(hertz.min), max: hzToBark(hertz.max) };

var units = {bark: bark, hertz: hertz};


ToneModel = function(r) {
  this.updateRate = 50;
  this.smoothing = 0.85;
  this.resolution = r;

  //  Parameters for clipping of uninteresting audio data
  this.varThreshold = 700;
  this.outputUnit = units['bark'];
  this.fmin = hertz.min;
  this.fmax = hertz.max;
  this.amplitudes = [];
  this.observers = new ObserverList();
  this.init(r);
  console.log(this.outputUnit);
};

ToneModel.prototype.init = function(r) {

  /* cross-browser retrieval of neccessary Web Audio API context providers and the ability to get users microphone input
  */
  var vendors = ['', 'ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.AudioContext; ++x) {
      window.AudioContext = window[vendors[x]+'AudioContext'];
      navigator.getUserMedia = navigator[vendors[x]+'GetUserMedia'];
  }
  if (!window.AudioContext || !navigator.getUserMedia) {
    alert('UNFORTUNATELY THIS APPlICATION REQUIRES THE LATEST BUILD OF CHROME WITH "Web Audio Input" ENABLED IN chrome://flags.');
  }

  audioContext = new AudioContext();

  this.sampleRate = audioContext.sampleRate;
  analyser = audioContext.createAnalyser();

  analyser.fftSize = r;
  analyser.smoothingTimeConstant = this.smoothing;

  this.data = new Uint8Array(analyser.frequencyBinCount);

  // connect microphone
  navigator.getUserMedia( {audio:true}, this.gotStream.bind(this), function(err) {console.log(err)} );
  
  this.peaks = [];
  
  
  console.log(this);
};


ToneModel.prototype.enable = function() {
  var that = this;
  if (!this.intervalId) {
    this.intervalId = window.setInterval(
        function() { that.update(); }, this.updateRate);
  }
  return this;
};

ToneModel.prototype.disable = function() {
  if (this.intervalId) {
    window.clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
  return this;
};

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


ToneModel.prototype.gotStream = function(stream) {
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

  lpF.frequency.value = this.fmax; // Set cutoff 
  hpF.frequency.value = this.fmin; // Set cutoff 

  console.log("microphone audio graph set up!");
  console.log(analyser);

  this.enable();
  this.notify();
};

ToneModel.prototype.update = function() {
  var data = this.data;
  analyser.getByteFrequencyData(data);
  // var speechData = data.subarray(this.fstartIndex, this.fstopIndex);
  var n = data.length;
  var s = 0; // normal sum
  var s2 = 0; // quadratic sum
  var maxP = 0;
  var i;
  // console.log(data);

  // reuse old array in order to avoid unnecessary instantiation
  var peaks = this.peaks.slice(0);
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
  if (( variance > this.varThreshold ) && ( peaks.length >  numPeaksLimit) ) {
    s = 0;
    var sLength = 0;
    // calculate the average frequency of the first four peaks
    for (i = 0; i < numPeaksLimit; i++) {
      // get frequency of certain dataindex
      if (peaks[i]) {
         s += ( peaks[i] ) / ( data.length-1 ) * (this.fmax - this.fmin) + this.fmin;
         sLength++;
      }
    }
    var avgFreq = s/sLength;

    switch (this.outputUnit.index) {
      case 0: // Hz
        this.tone = avgFreq;
        break;
      case 1: // Bark
        var avgBark = hzToBark( avgFreq );
        this.tone = avgBark;
        console.log(this.tone);
        break;
    }
  }
  else {
    this.tone = 0;
  }
  // console.log(this.tone);
  this.notify();
};


// Functions for AvisModel that enables it to work as a subject
// in the observerpattern:
//--------------------------------------------------------------
ToneModel.prototype.addObserver = function( observer ){
  this.observers.Add( observer );
  console.log("added observer");
};

ToneModel.prototype.removeObserver = function( observer ){
  this.observers.RemoveAt( this.observers.IndexOf( observer, 0 ) );
};

ToneModel.prototype.notify = function() {
  var observerCount = this.observers.Count();
  // place the current frequencydata in the array data
  for(var i=0; i < observerCount; i++){
    this.observers.Get(i).update( this.tone );
  }
};
