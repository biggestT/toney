/*
Written by Tor Nilsson Öhrn in 2013
*/
var BaseState = Backbone.Model.extend({

  initialize: function(owner) {
    this.owner = owner;
    this.prevTone = 0.0;
		this.tone = 0.0;
		this.count = 0.0;
  },
  update: function (t) {
	  if (t > 0) {
				// Normalise input value
				this.prevTone = this.tone;
				this.tone = ( t - this.owner.min ) / (this.owner.max - this.owner.min );
				this.count++;
		}
  }
});
var microphoneSource = BaseState.extend({
  draw: function() {
    this.owner.drawLine(this.owner.colors['red']);
  },
  nextState: function () {
  	this.owner.changeState( this.owner.sourceStates.soundfile );
  }
 });
var soundfileSource = BaseState.extend({
  draw: function() {
    this.owner.drawLine(this.owner.colors['green']);
  },
  nextState: function () {
  	this.owner.changeState( this.owner.sourceStates.microphone );
  }
 });
// Baseclass for all Toney viewers
//
var ToneView = Backbone.View.extend({
	
	tagName: 'canvas',
	test: 1,
	min: 400,
	max: 4000,
	n: 100,
	count: 0,
	colors: {
		red: '#B0171F',
		green: '#008B00'
	}
});

// Concrete Viewer that outputs the toneline which is characteristic to Toney
//
var ToneLineView = ToneView.extend({
	
	initialize: function() {
				
		this.sourceStates = {};
		this.sourceStates.microphone = new microphoneSource(this);
		this.sourceStates.soundfile = new soundfileSource(this);

		this.sourceState = this.sourceStates.microphone;

		this.listenTo(this.model, "toneChange", this.update);
		this.listenTo(this.model, "sourceChange", this.nextState);
		this.listenTo(this.model, "unitChange", this.setAxis);
		this.sourceState.update();
	},
	draw: function () {
		this.sourceState.draw();
	},
	drawLine: function(color) {
		var ctx = this.options.ctx;
		var c = ctx.canvas;
		var n = this.n;
		var i = this.sourceState.count;
		
		ctx.strokeStyle = color;
		ctx.beginPath();
	  ctx.moveTo(c.width/n*i, c.height - 10 - this.sourceState.prevTone*c.height  );
	  ctx.lineTo(c.width/n*(i+1), c.height - 10 - this.sourceState.tone*c.height  );
	  ctx.stroke();
	},
	setAxis: function( minMax ) {
		this.min = minMax[0];
		this.max = minMax[1];
		console.log("min: " + min + "max: " + max);
	},
	changeState: function( state ) {
    this.sourceState = state;
	},
	update: function (t) {
		this.sourceState.update(t);
	},
	nextState: function () {
		this.sourceState.nextState();
	}
})

