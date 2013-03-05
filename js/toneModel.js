/*
Written by Tor Nilsson Öhrn in February of 2013
Heavily inspired by http://phenomnomnominal.github.com/docs/tuner.html
*/

ToneModel = function(r, n) {
  this.updateRate = 16;
  this.smoothing = 0.95;
  this.bands = n;

  //  Parameters for clipping of uninteresting audio data
  this.varThreshold = 500; 
  this.fmin = 300;
  this.fmax = 4000; 

  this.amplitudes = new Array();
  this.observers = new ObserverList();
  this.init(r);
}

ToneModel.prototype.init = function(r) {
  
  /* cross-browser retrieval of neccessary Web Audio API context providers and the ability to get users microphone input
  */
  var vendors = ['', 'ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.AudioContext; ++x) {
      window.AudioContext = window[vendors[x]+'AudioContext'];
      navigator.getUserMedia = navigator[vendors[x]+'GetUserMedia'];
  }
  if (!window.AudioContext || !navigator.getUserMedia) {
    alert('UNFORTUNATELY THIS APPlICATION REQUIRES THE LATEST BUILD OF CHROME CANARY WITH "Web Audio Input" ENABLED IN chrome://flags.');
  };

  audioContext = new AudioContext();
  
  this.sampleRate = audioContext.sampleRate;
  analyser = audioContext.createAnalyser();

  analyser.fftSize = r;
  analyser.smoothingTimeConstant = this.smoothing;

  this.data = new Uint8Array(analyser.frequencyBinCount);

  /* Highest voice frequency is roughly 3000Hz so we need Fs to be 6000Hz 
  According to the Nyquist-Shannon sampling theorem
  Microphones sample rate is 44100Hz so we can divide that by 7 without problems
  Set fftSize/bufferlength to a value 2^n
  */

  // Find the indexes of the min and max frequencies in the dataarray 
  this.fstartIndex = Math.round(this.data.length*this.fmin/this.sampleRate+1);
  this.fstopIndex = Math.round(this.data.length*this.fmax/this.sampleRate+1);

  navigator.getUserMedia( {audio:true}, this.gotStream.bind(this), function(err) {console.log(err)} );
  console.log(this);
}

ToneModel.prototype.enable = function() {
  var that = this;
  if (!this.intervalId) {
    this.intervalId = window.setInterval(
        function() { that.notify(); }, this.updateRate);
  }
  return this;
}

ToneModel.prototype.disable = function() {
  if (this.intervalId) {
    window.clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
  return this;
}

ToneModel.prototype.gotStream = function(stream) {
  // Create an AudioNode from the stream.
  var mediaStreamSource = audioContext.createMediaStreamSource( stream );
  // Connect it to the destination to hear yourself (or any other node for processing!)
  mediaStreamSource.connect( analyser );
  console.log("gotStream!");
  this.enable();
  this.notify();
}

ToneModel.prototype.update = function() {
  var data = this.data;
  var length = data.length;
  analyser.getByteFrequencyData(data);
  // Break the samples up into bins
  var binSize = Math.floor( length / this.bands );
  for (var i=0; i < this.bands; ++i) {
    var sum = 0
    for (var j=0; j < binSize; ++j) {
      sum += data[(i * binSize) + j];
    }
    // add the average amplitude to the output array
    this.amplitudes[i] = sum / binSize;
  }
}

// updatemethod with different binsizes
ToneModel.prototype.nlbs = function() {
  var data = this.data;
  var length = data.length;
  analyser.getByteFrequencyData(data);

  var curr = 0;
  var prev;
  var min = Number.MAX_VALUE;
  var max = 0;
  for (var i = 0; i < this.bands; i++) {
    var sum = 0;
    var binSize =  Math.floor(20*(i/this.bands));
    // var binSize = Math.floor( length / this.bands );
    var prev = curr;
    while (curr < prev+binSize && curr < length) {
      sum += data[curr];
      curr++;
    }
    var avg = sum / 20*(this.bands/i);
    // console.log(binSize);
    // add the average amplitude to the output array
    this.amplitudes[i] = avg;
    if (avg < min) {
      min = avg; }
    if (avg > max) {
      max = avg; }
  };
  // Normalise values
  for (var i = this.amplitudes.length - 1; i >= 0; i--) {
    this.amplitudes[i] = (this.amplitudes[i]-min)/(max-min);
  };
}

ToneModel.prototype.getTone = function() {
  var data = this.data;
  analyser.getByteFrequencyData(data);
  // var speechData = data.subarray(this.fstartIndex, this.fstopIndex);
  var n = this.fstopIndex - this.fstartIndex;
  // console.log(data.subarray(this.fstartIndex, this.fstopIndex));
  var s = 0;
  var s2 = 0;
  var maxV = 0;
  var maxI = 0;
  // Calculate variance for speech detection 
  for (var i = this.fstartIndex; i < this.fstopIndex; i++) {
    s += data[i];
    s2 += data[i] * data[i];
    // get index of loudest frequency
    if (data[i] > maxV) {
      maxV = data[i];
      maxI = i;
    };
  };
  var variance = (s2 - (s*s) / n) / n;
  // console.log(variance);

  // Return the frequency point that has the highest amplitude in the array
  if (variance > this.varThreshold ) {
    var loudestFreq = ( maxI - 1 ) * this.sampleRate / data.length;
    var outNormalised = (loudestFreq-this.fmin)/(this.fmax-this.fmin);
    return outNormalised;
  }
  else {
    return 0;
  };
}


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
    this.observers.Get(i).update( this.getTone() );
  }
};
