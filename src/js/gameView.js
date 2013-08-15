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

			// View for showing starpowerscore
			this.score = new app.ScoreView();

			// View for showing interactive gameplay buttons
			this.controls = new app.ControlsView();

			// Listen to the corresponding game model 
			this.listenTo(app.game.get('reference'), 'tonelineChange', this.render);
			this.listenTo(app.game.get('player'), 'tonelineChange', this.render);
			this.listenTo(app.game, 'game:newScore', this.drawScore);
		},
		render: function () {
			this.clearCanvas();
			this.reference.draw();
			this.player.draw();
		},
		drawScore: function (score) {
			this.score.draw(score);
		},
		clearCanvas: function() {
			var ctx = this.ctx;
			var c = ctx.canvas;
			ctx.clearRect(0, 0, c.width, c.height);
		},
	});
})();

