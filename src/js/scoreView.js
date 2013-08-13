/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

(function () {

	// Starpower credits to Programming Thomas! 
	// http://programmingthomas.wordpress.com/2012/05/16/drawing-stars-with-html5-canvas/
		
	var drawStar = function (ctx, x, y, r, p, m, filled) {
		// var ctx = this.ctx;
		ctx.save();
		ctx.beginPath();
		ctx.translate(x, y);
		ctx.moveTo(0,0-r);
		for (var i = 0; i < p; i++) {
			ctx.rotate(Math.PI / p);
			ctx.lineTo(0, 0 - (r*m));
			ctx.rotate(Math.PI / p);
			ctx.lineTo(0, 0 - r);
		}
		ctx.closePath();
		if(filled) {
			ctx.fill();
		}
		else {
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'grey';
			ctx.stroke();
		}
		ctx.restore();
	};

	app.ScoreView = Backbone.View.extend({
		
		scale: 20,
		margin: 20,
		drawingDelay: 150,
		colors: ['#FFFF33', '#FFFF66'],

		initialize: function() {
			this.ctx = app.game.ctx;
		},
		draw: function (starScore) {
			var line = this.line;
			var ctx = this.ctx;
			var c = ctx.canvas;
			var s = this.scale;
			var m = this.margin;
			var N = app.game.get('maxStars');
			var dt = this.drawingDelay;
			var n = starScore;
			var w = (s+m)*(N-1)+s;
			var col = this.colors;

			var xStart = (c.width-w)/2;
			var yStart = (c.height-s)*0.90;
			var grad = ctx.createLinearGradient(0, 0, (s+m)*n, 0);
			grad.addColorStop(0, col[0]);
			grad.addColorStop(1, col[1]);
			ctx.fillStyle = grad;

			var dx = s+m;

			for (var i = 0; i < n; i++) {
				window.setTimeout(function () {
					drawStar(ctx, xStart, yStart, s, 5, 0.5, true);
					xStart += dx;
					app.eventAgg.trigger('game:drawingStar');
				}, dt*i);			

			}
			for (i = n; i < N; i++) {
				window.setTimeout( function () {
					drawStar(ctx, xStart, yStart, s, 5, 0.5, false);
					app.eventAgg.trigger('game:drawingBadStar');
					xStart += dx;	
				}, dt*i);
			}
		
		},

		
	});
})();

