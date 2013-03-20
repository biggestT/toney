/*
Written by Tor Nilsson Öhrn in 2013
*/

// Baseclass for all Toney viewers
//
ToneView = Backbone.View.extend({
	
	tagName: 'canvas',
	test: 1,
	min: 400,
	max: 4000,
	n: 100,
	count: 0
});


// Concrete Viewer that outputs the toneline which is characteristic to Toney
//
ToneLineView = ToneView.extend({
	
	initialize: function() {
		
		this.prevTone = 0.0;
		this.tone = 0.0;

		this.listenTo(this.model, "toneChange", this.update);
	},
	draw: function() {
		var ctx = this.options.ctx;
		var c = ctx.canvas;
		var i = this.count;
		var n = this.n;

		ctx.beginPath();
	  ctx.moveTo(c.width/this.n*i, c.height / 2 - this.prevTone*c.height / 2 );
	  ctx.lineTo(c.width/this.n*(i+1), c.height / 2 - this.tone*c.height / 2 );
	  ctx.stroke();

	},
	update: function(t) {
		if (t > 0) {
			// Normalise input value
			this.prevTone = this.tone;
			this.tone = ( t - this.min ) / (this.max - this.min);
			this.count++;
		}
	}

})

