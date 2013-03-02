/*
Written by Tor Nilsson Öhrn in February of 2013
Heavily inspired by http://phenomnomnominal.github.com/docs/tuner.html
*/

ToneModel = function(r, n, cId) {
  this.updateRate = 100;
  this.smoothing = 0.8;
  bands = n;
	this.init(r, cId);
}

ToneModel.prototype.init = function(r, cId) {
	
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

  /* initialize canvas and make it always retrieve the new dimensions when it's size is changed
  */
  var canvas = $(cId)[0];
  $(window).resize(function() {
    canvas.height = $(cId).height();
    canvas.width = $(cId).width();
  });
  $(window).trigger('resize');
  
  this.context = canvas.getContext('2d'); 
  audioContext = new AudioContext();

  
  /* Highest voice frequency is roughly 3000Hz so we need Fs to be 6000Hz 
  According to the Nyquist-Shannon sampling theorem
  Microphones sample rate is 44100Hz so we can divide that by 7 without problems
  Set fftSize/bufferlength to a value 2^n
  */
  this.sampleRate = audioContext.sampleRate;
  analyser = audioContext.createAnalyser();
  analyser.fftSize = r;
  data = new Uint8Array(analyser.frequencyBinCount);
  analyser.smoothingTimeConstant = this.smoothing;

  // success callback when requesting audio input stream
  function gotStream(stream) {
      // Create an AudioNode from the stream.
      var mediaStreamSource = audioContext.createMediaStreamSource( stream );
      // Connect it to the destination to hear yourself (or any other node for processing!)
      mediaStreamSource.connect( analyser );
      console.log("gotStream!");
      window.setInterval(update, this.updateRate);
  }
  navigator.getUserMedia( {audio:true}, gotStream, function(err) {console.log(err)} );

}

update = function() {
  analyser.getByteFrequencyData(data);
  var length = data.length;
  var amplitudes = new Array();
  // Break the samples up into bins
  var binSize = Math.floor( length / bands );
  for (var i=0; i < this.bands; ++i) {
    var sum = 0
    for (var j=0; j < binSize; ++j) {
      sum += data[(i * binSize) + j];
    }
    // add the average amplitude to the output array
    amplitudes[i] = sum / binSize;
  }
  console.log(amplitudes);
}
