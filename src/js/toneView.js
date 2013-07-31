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
			this.xLength = 50;
			this.drawingColor = this.options.color;
			this.lines = [];
			this.listenTo(this.model, "tonelineChange", this.update);
			this.listenTo(this.model, "tonelineReset", this.clearCanvas);

		},
		draw: function () {
			this.clearCanvas();
			this.drawGradientLine();
		},
		drawToneline: function (lines, N, amplitude) {
			var ctx = this.ctx;
			var c = ctx.canvas;
			var l = this.xLength;
			var colors = this.drawingColor;
			var xScale = c.width/l;
			var grad = ctx.createLinearGradient(0, 0, N*xScale, c.height);
			grad.addColorStop(0, colors[0]);
			grad.addColorStop(1, colors[1]);

			ctx.lineWidth = this.lineWidth;
			ctx.strokeStyle = grad;
			ctx.lineCap="round";

			var xStart = c.width/2-N/2*xScale;
			console.log(amplitude);
			var yStart = c.height/2;

			for (var i = 0; i < lines.length; i++) {

				var k = lines[i][0];
				var n = lines[i][1];
				var dy = -k*c.height;
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
		update: function(lines) {
			// ugly fix to test for one line first
			this.clearCanvas();
			this.lines[0] = lines;
			this.drawToneline(this.lines, this.lines[0][1], this.lines[0][1]*this.lines[0][0]);
		}
	});
})();

