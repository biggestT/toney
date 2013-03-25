/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

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
				console.log(this.tone);
		}
  }
});
var microphoneSource = BaseState.extend({
  draw: function() {
    // this.owner.drawLine(this.owner.colors['red']);
    this.owner.drawGradientLine(this.owner.colors['redGradient']);
  },
  nextState: function () {
  	this.owner.changeState( this.owner.sourceStates.soundfile );
  }
 });
var soundfileSource = BaseState.extend({
  draw: function() {
    // this.owner.drawLine(this.owner.colors['green']);
    this.owner.drawGradientLine(this.owner.colors['greenGradient']);
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
	lineWidth: 3,
	count: 0,
	colors: {
		red: '#B0171F',
		green: '#008B00',
		redGradient: ['#BB0805', '#FF4D2E'],
		greenGradient: ['#0BB400', '#2EFE3E']
	}
});

// Concrete Viewer that outputs the toneline which is characteristic to Toney

app.ToneLineView = ToneView.extend({
	
	initialize: function() {
				
		this.sourceStates = {};
		this.sourceStates.microphone = new microphoneSource(this);
		this.sourceStates.soundfile = new soundfileSource(this);

		this.sourceState = this.sourceStates.microphone;

		this.setAxis()
		this.ctx = this.options.ctx;

		this.listenTo(this.model, "toneChange", this.update);
		this.listenTo(this.model, "playToggled", this.nextState);
		this.listenTo(this.model, "unitChange", this.setAxis);
		this.sourceState.update();
	},
	draw: function () {
		this.sourceState.draw();
	},
	drawLine: function(color) {
		var ctx = this.ctx;
		var c = ctx.canvas;
		var n = this.n;
		var i = this.sourceState.count;

		ctx.strokeStyle = color;
		ctx.beginPath();
	  ctx.moveTo(c.width/n*i, c.height - 10 - this.sourceState.prevTone*c.height  );
	  ctx.lineTo(c.width/n*(i+1), c.height - 10 - this.sourceState.tone*c.height  );
	  ctx.stroke();
	},
	drawGradientLine: function(colors) {
		var ctx = this.ctx;
		var c = ctx.canvas;
		var n = this.n;
		var i = this.sourceState.count;

		// Path to draw in x and y dimensions with index 0 being start and 1 being stop
		var xPath = [c.width/n*i, c.width/n*(i+1)];
		var yPath = [c.height - 10 - this.sourceState.prevTone*c.height , c.height - 10 - this.sourceState.tone*c.height];

		var grad= this.ctx.createLinearGradient(xPath[0], xPath[1], yPath[0], yPath[1]);
		grad.addColorStop(0, colors[0]);
		grad.addColorStop(1, colors[1]);

		ctx.lineWidth = this.lineWidth;
		ctx.strokeStyle = grad
		ctx.beginPath();
	  ctx.moveTo(xPath[0], yPath[0]);
	  ctx.lineTo(xPath[1], yPath[1]);
	  ctx.stroke();
	},
	setAxis: function() {
		this.min = this.model.get('outputUnit').min;
		this.max = this.model.get('outputUnit').max;
		console.log("min: " + this.min + "max: " + this.max);
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

