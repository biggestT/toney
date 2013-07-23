 /*
  Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

var testState = Backbone.Model.extend({

  initialize: function(owner, name) {
    this.owner = owner;
    this.set({name: name});
    this._testData = [];
    this._testCount = 0;
    this._maxCount = 500;   
  },
  storeTestData: function (data) {
    if (this._testCount < this._maxCount) {
      if (this._testData.length == 0) {
        this._testStart = new Date().getTime();
      }
      this._testData[this._testCount] = Array.apply( [], data );
      this._testCount++;  
    }
    else {
      this.owner.exportTestData();
    }
    
  },
  clearTestData: function () {
    this._testData = [];
    this._testCount = 0;   
  },
  getTestData: function () {
    return this._testData;  
  },
  getTestTime: function () {
    var time = new Date().getTime() - this._testStart;
    return time;
  }
  
});

 app.TestView = Backbone.View.extend({

  initialize: function() {
        
    this.sourceStates = {};
    this.sourceStates.microphone = new testState(this, 'microphone');
    this.sourceStates.soundfile = new testState(this, 'soundfile');

    this.sourceState = this.sourceStates.soundfile;

    this.listenTo(this.model, "stateChanged", this.nextState);
    this.listenTo(this.model, "spectrogramChange", this.update);
  },

  // FOR MATLAB/OCTAVE EXPORT
  // ---------------------------

  exportTestData: function () {
    var source = this.sourceState;
    var name = source.get('name');
    var fLimits = this.model.get('fLimits');
    if (name != 'processing') {
      var data = source.getTestData();
      var testTime = source.getTestTime();
      var output = 'tTest = ' + testTime + ';'; // String to store all data
      output += 'res = ' + this.model.get('resolution') + ';';
      output += 'fLimits = [' + fLimits['fMin'] + ' ' + fLimits['fMax'] + ' ];';
      output += name + ' = [';
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
          output +=  data[i][j] + ' ';
        };
        if (i != data.length-1) { output += ';'; }
      };
      output += '];';
      output = [output];
      window.URL = window.webkitURL || window.URL;
      var file = new Blob(output, { 'type' : 'text\/plain' });
      var a = document.getElementById('downloadFile');
      a.hidden = '';
      a.href = window.URL.createObjectURL(file);
      a.download = name + this.model.get('resolution') + fLimits['fMin'] + fLimits['fMax'] +'.m';
      a.textContent = 'Download spectogram of latest recorded ' + name + ' data as an m-file!';

      source.clearTestData();
    }
  },
  nextState: function () {
    this.exportTestData();
    this.sourceState = (this.sourceState == this.sourceStates.microphone) ? 
      this.sourceStates.soundfile : this.sourceStates.microphone;  
  },
  update: function (data) {
    this.sourceState.storeTestData(data);
  },
});