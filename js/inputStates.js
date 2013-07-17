// Variables and functions that are shared among the ToneModel instances
BaseState = Backbone.Model.extend({
  initialize: function(owner) {
    this._owner = owner;
  }
});
SourceState = Backbone.Model.extend({
  defaults: {
    ampl: 0.0,
    prevK: 0.0,
    lines: []
  },
  initialize: function(owner) {
    this._owner = owner; // not sure how to call superConstructor
    this._tones = []; // tones for currently updated toneline
    this._lines = [[0,0]]; // all tonelines belonging to one speech sample

    // each sourcestate has its own dynamic range where its toneline is plotted
    // var unit = owner.get(outputUnit);
    // this._lineBounds = [unit.min, unit.max];                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
  },
  addTone: function (t) {
    this._tones.push(t);
  },
  setLine: function (line) {
    this._lines[this._lines.length-1] = line;
  },
  clearLines: function () {
    this._lines = [[0,0]];
  },
  addLine: function (line) {
    this._lines.push(line);
  },
  getLines: function () {
    return this._lines;
  },
  clearTones: function () {
    this._tones = [];
  },
  getTones: function () {
    return this._tones;
  }
});
microphoneState = SourceState.extend({
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
  execute: function() {
    this._owner.set({ 'processing': true });
    console.log('processing ...');
  },
  exit: function() {
    this._owner.set({ 'processing': false });
    console.log('finished processing');
  }
});


