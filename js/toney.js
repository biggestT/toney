ToneLine = function(r) {
	this.init(r);
}

ToneLine.prototype.init = function(r) {
	
	// cross-browser retrieval of neccessary Web Audio API context and the ability to get users microphone input
	var vendors = ['', 'ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.AudioContext; ++x) {
      window.AudioContext = window[vendors[x]+'AudioContext'];
      navigator.getUserMedia = navigator[vendors[x]+'GetUserMedia'];
  }
  if (!window.AudioContext || !navigator.getUserMedia) {
		alert('UNFORTUNATELY THIS APPlICATION REQUIRES THE LATEST BUILD OF CHROME CANARY WITH "Web Audio Input" ENABLED IN chrome://flags.');
	};

	

	var ac = window.AudioContext;
  console.log(ac);
  console.log(navigator.getUserMedia);
  console.log("yeye");


}
