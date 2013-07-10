/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

var BaseState = Backbone.Model.extend({

  initialize: function(owner) {
    this.owner = owner;
    this.tones = new Array();
  },
  update: function (t) {

	if (t > 0) {
		// Normalise input value (in frequency unit) to fit canvas coordinates
		// this.tone = ( t - this.owner.min ) / (this.owner.max - this.owner.min );
		// @TODO fix smaller dynamic range 
		// than considered in analysis

		var currTone = ( t - 1 ) / (6 - 1 ); // only works for barkscale
		
		this.tones.push(currTone);
		this.owner.draw();
	}
	else  {
		this.tones = [];
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
	n: 100,
	lineWidth: 15,
	count: 0,
	smoothing: 0.7,
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

		this.sourceState = this.sourceStates.soundfile;
		this.ctx = this.options.ctx;

		this.listenTo(this.model, "toneChange", this.update);
		this.listenTo(this.model, "stateChanged", this.nextState);
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
	clearCanvas: function() {
		var c = this.ctx.canvas;
		this.ctx.clearRect(0, 0, c.width, c.height);
	},
	drawGradientLine: function(colors) {
		var ctx = this.ctx;
		var c = ctx.canvas;
		var l = this.n;
		var tones = this.sourceState.tones;
		var n = tones.length;

		this.clearCanvas();

		var gradientStartX = c.width/2+c.width/l*(0-n/2);
		var gradientStopX = c.width/2+c.width/l*(n-n/2);
		var grad = this.ctx.createLinearGradient(gradientStartX, 0, gradientStopX, c.height);
		grad.addColorStop(0, colors[0]);
		grad.addColorStop(1, colors[1]);

		for (var i = 1; i < n; i++) {
			var startX = c.width/2+c.width/l*(i-n/2);
			var endX = c.width/2+c.width/l*((i+1)-n/2);
			var startY = c.height - tones[i-1]*c.height;
			var endY = c.height - tones[i]*c.height;
			var xPath = [startX, endX];
			var yPath = [startY, endY];

			ctx.lineWidth = this.lineWidth;
			ctx.strokeStyle = grad
			ctx.beginPath();
			ctx.lineCap="round";
			
			ctx.moveTo(xPath[0], yPath[0]);
      		ctx.lineTo(xPath[1], yPath[1]);

			ctx.stroke();
		};
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

