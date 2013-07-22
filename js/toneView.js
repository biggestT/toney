/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

var BaseState = Backbone.Model.extend({

  initialize: function(owner) {
    this.owner = owner;
    this.line = [0,0,0];
  },
  updateLine: function (l) {
		this.line = l;
		this.owner.draw();
	}
	
});
var microphoneSource = BaseState.extend({
	
  draw: function() {
  	this.owner.drawingColors = this.owner.colors['redGradient'];
    this.owner.drawGradientLine(this.line);
  },
  nextState: function () {
  	this.owner.changeState( this.owner.sourceStates.soundfile );
  }
 });
var soundfileSource = BaseState.extend({
  draw: function() {
    this.owner.drawingColors = this.owner.colors['greenGradient'];
    this.owner.drawGradientLine(this.line);
  },
  nextState: function () {
  	this.owner.changeState( this.owner.sourceStates.microphone );
  }
 });
// Concrete Viewer that outputs the toneline which is characteristic to Toney

app.ToneLineView = Backbone.View.extend({
	
	tagName: 'canvas',
	lineWidth: 15,
	min: 1,
	max: 5,
	count: 0,
	smoothing: 0.7,
	colors: {
		redGradient: ['#BB0805', '#FF4D2E'],
		greenGradient: ['#0BB400', '#2EFE3E']
	},

	initialize: function() {
				
		this.sourceStates = {};
		this.sourceStates.microphone = new microphoneSource(this);
		this.sourceStates.soundfile = new soundfileSource(this);

		this.sourceState = this.sourceStates.soundfile;
		this.ctx = this.options.ctx;

		this.length = this.model.get('length');

		this.listenTo(this.model, "stateChanged", this.nextState);
		this.listenTo(this.model, "toneChange", this.update);
		this.listenTo(this.model, "unitChange", this.setAxis);
		// this.update();
	},
	draw: function () {
		this.clearCanvas();
		this.sourceStates.soundfile.draw();
		if (!this.model.get('playing')) {
			this.sourceStates.microphone.draw();
		} 
	},
  	drawGradientLine: function(line) {
		var ctx = this.ctx;
		var c = ctx.canvas;
		var l = this.length;
		var colors = this.drawingColors;
		var k = line[0];
		var n = line[1];

		var gradientStartX = c.width/2+c.width/l*(0-n/2);
		var gradientStopX = c.width/2+c.width/l*(n-n/2);
		var grad = ctx.createLinearGradient(gradientStartX, 0, gradientStopX, c.height);
		grad.addColorStop(0, colors[0]);
		grad.addColorStop(1, colors[1]);

 		var start = [c.width/2+c.width/l*(0-n/2), c.height/2 + k*(n/2)*c.height];
 		var stop = [c.width/2+c.width/l*(n-n/2), c.height/2 - k*(n/2)*c.height]

		ctx.lineWidth = this.lineWidth;
		ctx.strokeStyle = grad;
		ctx.beginPath();
		ctx.lineCap="round";

		ctx.moveTo(start[0], start[1]);
  	ctx.lineTo(stop[0], stop[1]);
		
		ctx.stroke();
	},
	clearCanvas: function() {
		var c = this.ctx.canvas;
		this.ctx.clearRect(0, 0, c.width, c.height);
	},
	setAxis: function() {
		this.min = this.model.get('outputUnit').min;
		this.max = this.model.get('outputUnit').max;
		console.log("min: " + this.min + "max: " + this.max);
	},
	changeState: function( state ) {
    	this.sourceState = state;
	},
	update: function (line) {
		this.sourceState.updateLine(line);
	},
	nextState: function () {
		this.sourceState.nextState();
	}
})

