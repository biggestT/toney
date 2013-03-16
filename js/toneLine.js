ToneLine =  function(cId) {
	this.fMin = 400.0;
	this.fMax = 4000.0;
	this.init(cId);
};

ToneLine.prototype.init = function(cId) {

	// this.amplitudes = new Array();
	/* initialize canvas and make it always retrieve the new dimensions when it's size is changed
  */
  var canvas = $(cId)[0];

  $(window).resize(function() {
    canvas.height = $(cId).height();
    canvas.width = $(cId).width();
  });
  $(window).trigger('resize');

  this.count = 0;
  this.tone = 0;
  this.n = 100;
  this.ctx = canvas.getContext('2d');
  this.smoothing = 0;
  // initialise array with tonehistory
  this.history = [];
};

ToneLine.prototype.draw = function() {
	var ctx = this.ctx;
	var c = this.ctx.canvas;
	var i = this.count
	// ctx.clearRect(0, 0, c.width, c.height);

	ctx.beginPath();
  ctx.moveTo(c.width/this.n*i, c.height / 2 - this.prevTone*c.height / 2 );
  ctx.lineTo(c.width/this.n*(i+1), c.height / 2 - this.tone*c.height / 2 );
  ctx.stroke();
};

ToneLine.prototype.setScale = function(fMin, fMax) {
	this.fMin = fMin;
	this.fMax = fMax;
};

ToneLine.prototype.update = function(t) {
	if (t > 0) {
		var s = 0;
		// Normalise input value
		this.prevTone = this.tone;
		this.tone = ( t - this.fMin ) / (this.fMax - this.fMin);
		this.count++;
	}
	// this.history.push(tone);
	// console.log(s);
	// for (var i = 0; i < this.smoothing; i++) {
	// 	// var histValue = this.history[i];
	// 	s += (isNaN(this.history[i]) ? 0 : this.history[i]);
	// };
	// console.log(typeof this.history[0]);
	// console.log(typeof tone);
	// console.log(typeof (tone+this.history[0]));
	// console.log(this.history);
	// console.log("place 0: " + this.history[0]);


	// for (var i = -this.smoothing; i <= this.smoothing; i++) {
	// 	var x = this.history[this.smoothing+i];
	// 	s += ( isNaN(x) ? 0 : x );
	// 	// console.log(this.history[this.smoothing+i] + "iteration:" + (this.smoothing+i));
	// };
	// this.history[this.smoothing] = s/(2*this.smoothing+1);

	// perform moving average algorithm for smoother line
	// for (var i = this.n-this.smoothing; i > 2*this.smoothing; i--) {
	// 	var s = 0;
	// 	var j = -this.smoothing;
	// 	while (j < this.smoothing) {
	// 		s += this.history[i+j];
	// 		// console.log(i+j);
	// 		j++; 
	// 	};
	// 	this.history[i] = s / (this.smoothing+1);
	// 	// console.log(this.history);
	// };
		
	// }
};