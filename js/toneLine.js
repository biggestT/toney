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
  
  this.ctx = canvas.getContext('2d'); 
};

ToneLine.prototype.update = function(amplitudes) {
	var ctx = this.ctx;
	var c = this.ctx.canvas;
	this.binWidth = c.width/amplitudes.length;

	ctx.clearRect(0, 0, c.width, c.height);
	for (var i = amplitudes.length - 1; i >= 0; i--) {
		var shade = 50+i/amplitudes.length*200;
		console.log(shade);
		ctx.fillStyle = "rgb(" + shade + "," + shade + "," + shade + ")";
		ctx.fillRect(this.binWidth*i, c.height, this.binWidth, -amplitudes[i]*c.height);
	};
};