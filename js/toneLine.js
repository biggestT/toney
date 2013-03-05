Equaliser =  function(cId) {
	this.init(cId);
}

Equaliser.prototype.init = function(cId) {

	// this.amplitudes = new Array();
	/* initialize canvas and make it always retrieve the new dimensions when it's size is changed
  */
  var canvas = $(cId)[0];

  $(window).resize(function() {
    canvas.height = $(cId).height();
    canvas.width = $(cId).width();
  });
  $(window).trigger('resize');
  
  this.ctx = canvas.getContext('2d'); 
};

Equaliser.prototype.update = function(amplitudes) {
	var ctx = this.ctx;
	var c = this.ctx.canvas;
	this.binWidth = c.width/amplitudes.length;

	ctx.clearRect(0, 0, c.width, c.height);
	for (var i = 0; i < amplitudes.length; i++) {
		var shade = 50+i/amplitudes.length*200;
		// console.log(shade);
		ctx.fillStyle = "rgb(" + shade + "," + (shade-200) + "," + (shade-200) + ")";
		ctx.fillRect(this.binWidth*i, c.height, this.binWidth, -amplitudes[i]*c.height);
	};
};

ToneLine =  function(cId) {
	this.init(cId);
}

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
  
  this.n = 20;
  this.ctx = canvas.getContext('2d'); 

  this.history = new Array(this.n);
};

ToneLine.prototype.draw = function() {

	var ctx = this.ctx;
	var c = this.ctx.canvas;

	ctx.clearRect(0, 0, c.width, c.height);

	for (var i = 0; i < this.n-1; i++) {
		ctx.beginPath();
	  ctx.moveTo(c.width/this.n*i, c.height/2 + this.history[i]*c.height/2);
	  ctx.lineTo(c.width/this.n*(i+1), c.height/2 + this.history[i+1]*c.height/2);
	  ctx.stroke();
	};
};

ToneLine.prototype.update = function(tone) {
	this.history.unshift(tone);
	this.history.pop();
};