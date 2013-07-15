// Variables and functions that are shared among the ToneModel instances
BaseState = Backbone.Model.extend({
  initialize: function(owner) {
    this._owner = owner;
  }
});
SourceState = Backbone.Model.extend({

  initialize: function(owner) {
    this._owner = owner; // not sure how to call superConstructor
    this._tones = [];                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
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
    this._owner.get('audio').play();

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


