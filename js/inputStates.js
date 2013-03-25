// Variables and functions that are shared among the ToneModel instances
  BaseState = Backbone.Model.extend({
    initialize: function(owner) {
      this._owner = owner;
    }
  });
  microphoneState = BaseState.extend({
    execute: function() {
      this._owner.get('microphoneInput').connect(this._owner.get('analysisInputNode'));
      console.log(this._owner.get('microphoneInput'));
      console.log('listening to microphoneInput');
      // this._owner.set({ playing: false });
      this._owner.enableSoundAnalysis();
      this._owner.get('audio').pause();
    },
    start: function() {
    },
    exit: function() {
      this._owner.get('microphoneInput').disconnect();
      this._owner.disableSoundAnalysis();
      console.log('stopped listening to microphoneInput');
    }
  });
  soundfileState = BaseState.extend({
    execute: function() {
      console.log('listening to soundfile');
      console.log(this._owner.get('soundFileInput'));
      this._owner.get('soundFileInput').connect(this._owner.get('analysisInputNode'));
      this._owner.get('soundFileInput').connect(audioContext.destination);
      console.log(this._owner.get('analysisInputNode'));
      // this._owner.set({ playing: true });
      this._owner.enableSoundAnalysis();
      this._owner.get('audio').play();
    },
    start: function() {
    },
    exit: function() {
      this._owner.get('soundFileInput').disconnect();
      this._owner.disableSoundAnalysis();
      console.log('stopped listening to soundfile');
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


