BaseState = Backbone.Model.extend({
  initialize: function(analyser) {
    this._analyser = analyser;
  }
})

MicrophoneState = BaseState.extend({
  defaults: {
    name: "microphone" 
  },
  execute: function() {
    this._analyser.connectMicrophone();
    this._analyser.startSoundAnalysis();
  },
  exit: function() {
    this._analyser.disconnectMicrophone();
    this._analyser.stopSoundAnalysis();
  }
});
SoundfileState = BaseState.extend({
  defaults: {
    name: "soundfile" 
  },
  execute: function() {
    this._analyser.connectSoundfile();
    this._analyser.startSoundAnalysis();
  },
  exit: function() {
    this._analyser.disconnectSoundfile();
    this._analyser.stopSoundAnalysis();
  }
});
ProcessingState = BaseState.extend({
  defaults: {
    name: "processing" 
  },
  execute: function() {
    this._analyser.set({ 'processing': true });
    console.log('processing ...');
  },
  exit: function() {
    this._analyser.set({ 'processing': false });
    console.log('finished processing');
  }
});