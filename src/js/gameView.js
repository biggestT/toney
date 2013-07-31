/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

(function () {

	
	app.GameView = Backbone.View.extend({
	

		initialize: function() {
			
			this.ctx = app.game.ctx;

			// VIEWS CORRESPONDING TO THE TWO TONELINES
			
			this.player = new app.TonelineView({
				model: app.game.get('player'),
				color: ['#BB0805', '#FF4D2E']
			});	

			this.reference = new app.TonelineView({
				model: app.game.get('reference'),
				color: ['#0BB400', '#2EFE3E']
			});

		}
	});
})();

