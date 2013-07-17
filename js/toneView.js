/*
Tor Nilsson Öhrn 2013
*/
// reference to global app object
var app = app || {};

var BaseState = Backbone.Model.extend({
  initialize: function(o) {
    this.owner = o;
    this.lines = [];
    this.N = 0;
    console.log(this.get('color'));
  },
  updateLines: function (l) {
		this.lines = l;

		this.N = 0;
		for (var i = 0; i < this.lines.length; i++) {
			this.N += this.lines[i][1]; // sum up length of all lines
		}
		this.owner.draw();
	},
	draw: function() {
  	this.owner.drawingColors = this.get('color');
  	this.owner.drawToneline(this.lines, this.N);
	}
	
});
var microphoneSource = BaseState.extend({
	defaults: {
		test: 0,
		color: ['#BB0805', '#FF4D2E']
	},
  nextState: function () {
  	this.owner.changeState( this.owner.sourceStates.soundfile );
  }
 });
var soundfileSource = BaseState.extend({
	defaults: {
		color: ['#0BB400', '#2EFE3E']
	},
  nextState: function () {
  	this.owner.changeState( this.owner.sourceStates.microphone );
  }
 });
// Baseclass for all Toney viewers
//
var ToneView = Backbone.View.extend({
	
	tagName: 'canvas',
	lineWidth: 15,
	min: 1,
	max: 5,
	count: 0,
	smoothing: 0.7
});

// Concrete Viewer that outputs the toneline which is characteristic to Toney

app.ToneLineView = ToneView.extend({
	
	initialize: function() {
				
		this.sourceStates = {};
		this.sourceStates.microphone = new microphoneSource(this);
		this.sourceStates.soundfile = new soundfileSource(this);

		this.sourceState = this.sourceStates.soundfile;
		this.ctx = this.options.ctx;

		this.xLength = this.model.get('length');

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
	drawToneline: function (lines, N) {
		var ctx = this.ctx;
		var c = ctx.canvas;
		var l = this.xLength;
		var colors = this.drawingColors;
		var xScale = c.width/l;

		var grad = ctx.createLinearGradient(0, 0, N*xScale, c.height);
		grad.addColorStop(0, colors[0]);
		grad.addColorStop(1, colors[1]);

		ctx.lineWidth = this.lineWidth;
		ctx.strokeStyle = grad;
		ctx.lineCap="round";

		var xStart = c.width/2-N/2*xScale;
		var yStart = c.height/2;
		for (var i = 0; i < lines.length; i++) {

			var k = lines[i][0];
			var n = lines[i][1];
			var dy = -k*c.height;
			var dx = n*xScale;
			var start = [0, 0];
	 		var stop = [dx, dy];

	 		ctx.transform(1,0,0,1,xStart,yStart)
				ctx.beginPath();
				ctx.moveTo(start[0], start[1]);
		  	ctx.lineTo(stop[0], stop[1]);
				ctx.stroke();				
	 		ctx.transform(1,0,0,1,-xStart,-yStart)
			
			yStart += dy;
			xStart += dx;
		};

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
	update: function (lines) {
		this.sourceState.updateLines(lines);
	},
	nextState: function () {
		this.sourceState.nextState();
	}
})

