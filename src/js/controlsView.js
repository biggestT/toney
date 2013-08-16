// reference to global app object
var app = app || {};

(function () {

	var playPause = function () {
		app.eventAgg.trigger('controls:playPause');
	};
	var isPlaying = function () {
		return app.spectrogram.get('playing');
	}

	app.ControlsView = Backbone.View.extend({
		

		initialize: function() {
			
			if( !(arguments[0] instanceof jQuery) ) {
				app.eventAgg.trigger('error', 'no jQuery element passed to controls');
				return;
			};

			this.$controls = arguments[0];

			this.$playPause = $('<input>', { type: 'button', value: 'start' });
			this.$playPause.click(playPause);

			this.$controls.append(this.$playPause);

			// Listen to the corresponding game model 
			this.listenTo(app.eventAgg, 'reference:playPause', this.render);
			
		},

		render: function () {
			this.$playPause.prop('value', isPlaying() ?  'replay':  'pause');
			this.$playPause.css('color', isPlaying() ?  '#2EFE3E':  '#FF4D2E');
		},
		clearCanvas: function() {
			var ctx = this.ctx;
			var c = ctx.canvas;
			ctx.clearRect(0, 0, c.width, c.height);
		},
	});
})(jQuery);

