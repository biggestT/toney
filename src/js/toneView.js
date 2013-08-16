/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

(function () {

	var clone = function (obj) {
		var target = {};
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				target[i] = obj[i];
			}
		}
		return target;
	};

	app.TonelineView = Backbone.View.extend({
		
		tagName: 'canvas',
		lineWidth: 40,

		initialize: function() {
			
			this.ctx = app.game.ctx;
			
			this.drawingColor = this.options.color;
			this.listenTo(this.model, "tonelineChange", this.update);

		},
		draw: function () {
			if (this.line) {

				var line = this.line;
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
				var grad = ctx.createLinearGradient(0, 0, n*xScale, 0);
				grad.addColorStop(0, colors[0]);
				grad.addColorStop(1, colors[1]);

				ctx.lineWidth = this.lineWidth;
				ctx.strokeStyle = grad;
				ctx.lineCap="round";

				var xStart = c.width/2-n/2*xScale;
				var yStart = c.height/2+a/2*yScale;
				var segments = line.segments;
				for (var i in segments) {

					var k = segments[i].k;
					var x = segments[i].n;
					var dy = -k*yScale;
					var dx = x*xScale;
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
			}


		},
		update: function(line) {
			this.line = line.clone();
		}
	});
})();

