/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

(function () {


	app.TonelineView = Backbone.View.extend({
		
		tagName: 'canvas',
		lineWidth: 15,

		initialize: function() {
			
			this.ctx = app.game.ctx;
			
			this.drawingColor = this.options.color;
			this.lines = [];
			this.listenTo(this.model, "tonelineChange", this.update);
			// this.listenTo(this.model, "tonelineReset", this.clearCanvas);

		},
		draw: function () {
			this.clearCanvas();
			this.drawGradientLine();
		},
		drawToneline: function (line) {
			var ctx = this.ctx;
			var c = ctx.canvas;
			var N = app.game.get('maxLength');
			var A = app.game.get('maxAmplitude');
			var lineSize = line.getSize();
			var n = lineSize[0];
			var a = lineSize[1];
			var colors = this.drawingColor;
			var xScale = c.width/N;
			var yScale = c.height/A;
			var grad = ctx.createLinearGradient(0, 0, n*xScale, c.height);
			grad.addColorStop(0, colors[0]);
			grad.addColorStop(1, colors[1]);

			ctx.lineWidth = this.lineWidth;
			ctx.strokeStyle = grad;
			ctx.lineCap="round";

			var xStart = c.width/2-n/2*xScale;
			var yStart = c.height/2+a/2*yScale;
			console.log(yScale + ' ' + a);
			var segments = line.segments;
			for (var i in segments) {

				var k = segments[i].k;
				var n = segments[i].n;
				var dy = -k*yScale;
				var dx = n*xScale;
				var start = [0, 0];
				var stop = [dx, dy];

				ctx.transform(1,0,0,1,xStart,yStart);
					ctx.beginPath();
					ctx.moveTo(start[0], start[1]);
					ctx.lineTo(stop[0], stop[1]);
					ctx.stroke();				
				ctx.transform(1,0,0,1,-xStart,-yStart);

				yStart += dy;
				xStart += dx;
			}
		},
		clearCanvas: function() {
			var ctx = this.ctx;
			var c = ctx.canvas;
			ctx.clearRect(0, 0, c.width, c.height);
		},
		update: function(line) {
			this.clearCanvas();
			this.drawToneline(line);
		}
	});
})();

