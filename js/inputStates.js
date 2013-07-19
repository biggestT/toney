// Variables and functions that are shared among the ToneModel instances
BaseState = Backbone.Model.extend({
  initialize: function(owner) {
    this._owner = owner;
  }
});
SourceState = Backbone.Model.extend({
  defaults: {
    ampl: 0.0
  },
  initialize: function(owner) {
    this._owner = owner; // not sure how to call superConstructor
    this._tones = [];
    this.ampl = 0.1;
    this._testData = [];
    this._testCount = 0;
    // each sourcestate has its own dynamic range where its toneline is plotted
    // var unit = owner.get(outputUnit);
    // this._lineBounds = [unit.min, unit.max];                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
  },
  storeTestData: function (data) {
    this._testData[this._testCount] = Array.apply( [], data );
    this._testCount++;  
  },
  clearTestData: function () {
    this._testData = [];
    this._testCount = 0;   
  },
  getTestData: function () {
    return this._testData;  
  },
  addTone: function (t) {
    this._tones.push(t);
  },
  clearTones: function () {
    this._tones = [];
  },
  getTones: function () {
    return this._tones;
  }
});
microphoneState = SourceState.extend({
  defaults: {
    name: "microphone" 
  },
  execute: function() {
    this._owner.get('microphoneInput').connect(this._owner.get('analysisInputNode'));
    this._owner.startSoundAnalysis();
    this._owner.get('audio').pause();
  },
  start: function() {
  },
  exit: function() {
    this._owner.get('microphoneInput').disconnect();
    this._owner.stopSoundAnalysis();
  }
});
soundfileState = SourceState.extend({
  defaults: {
    name: "soundfile" 
  },
  execute: function() {
    this._owner.get('soundFileInput').connect(this._owner.get('analysisInputNode'));
    this._owner.get('soundFileInput').connect(audioContext.destination);
    this._owner.startSoundAnalysis();
    var a = this._owner.get('audio');
    a.play();
    // console.log( a); // Trying to detect playback bug
    // console.log(a.data('events'));
    // playAudio = function (e) {
    //   this._owner.get('audio').play();
    //   console.log('audio can now be played');
    // }
    // a.bind('canplay', function () {
    //   console.log('audio canplay fired');
    // });
    // a.oncanplay = playAudio;  
    // a.addEventListener("canplay" , function () {
    // });
    console.log( a); // Trying to detect playback bug
  },
  start: function() {
  },
  exit: function() {
    this._owner.get('soundFileInput').disconnect();
    this._owner.stopSoundAnalysis();
  }
});
processingState = BaseState.extend({
  defaults: {
    name: "processing" 
  },
  execute: function() {
    this._owner.set({ 'processing': true });
    console.log('processing ...');
  },
  exit: function() {
    this._owner.set({ 'processing': false });
    console.log('finished processing');
  }
});


