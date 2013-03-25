var app = app || {};

app.AppView = Backbone.View.extend({

	// Bind app to existing HTML div
	el: '#toneyApp',

	// Delegated events for user actions
	events: {
		'click #playPause': 'togglePlayPause'
	},


	// UNDER CONSTRUCTION! 

	initialize: function() {

		this.playPauseButton = this.$('#playPause');
		this.$footer = this.$('#footer');
		this.$main = this.$('#main');
		this.$toneWindow = $('#toneWindow');
		console.log(this.$toneWindow);

		// turn all button elements into nice jquery UI buttons
		$('button').button();

		app.toneModel = new app.ToneModel();
		app.toneModel.setOutputUnit('bark');

		var toneLineContext = this.$toneWindow[0].getContext('2d');

		var line = new app.ToneLineView({
			model: app.toneModel,
			ctx: toneLineContext
		});

		// start drawing everyting that needs to be drawn in approx 60 fps
		function tick() {
			requestAnimFrame(tick);
			line.draw();
		}
		tick();
		
		this.listenTo( app.toneModel, 'playToggled', this.render );
		this.listenTo( app.toneModel, 'processingToggled', this.render );
		
		this.render();
	},
	// Re-rendering the App currently just switches between play/pause
	render: function () {
		if (app.toneModel.get('processing')) {
			$(this.el).hide();
			$('#processingImage').show();
		}
		// if not in processing state:
		else {
			$(this.el).show();
			$('#processingImage').hide();
			if (app.toneModel.get('playing')) {
				this.playPauseButton.button('option', 'label', 'Pause');
				this.$footer.html('listening to the soundfile: </br>' + app.toneModel.get('soundfileSource') );
			}
			else {
				this.playPauseButton.button('option', 'label', 'Play');
				this.$footer.text('please speak into the microphone');
			}
		}
	},
	// swap between playing and paused sound in model
	togglePlayPause: function() {
		app.toneModel.set({ playing: !app.toneModel.get('playing') });
		console.log('toggled play pause');
	}
});