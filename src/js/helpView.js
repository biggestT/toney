/*
Written by Tor Nilsson Öhrn in 2013
*/
// reference to global app object
var app = app || {};

(function () {

	var startGame = function () {
		app.eventAgg.trigger('controls:startGame');
	};

	var isStarted = function () {
		return app.game.get('active');
	};

	app.HelpView = Backbone.View.extend({
		
		title: '',
		text: '',
		visible: true,

		initialize: function() {
			
			if( !(arguments[0] instanceof jQuery) ) {
				app.eventAgg.trigger('error', 'no jQuery element passed to help text view');
				return;
			};

			this.$el = arguments[0];

			// PANDA HELP!
			// --------------

			this.$title = $('<p>', { class: 'help help-title' });
			this.$help = $('<p>', { class: 'help help-text' });

			// PANDA !
			// --------------

			this.$panda = $('<div>', { src: 'images/toneypanda.svg', class: 'panda' } );
			this.$pandaImg = $('<img>', { src: 'images/toneypanda.svg' } );
			this.$panda.append(this.$pandaImg);

			// BUTTON TO START THE GAME
			// -------------------

			this.$start = $('<input>', { type: 'button', value: 'start' });
			this.$start.click(startGame);
			
			// Add the elements of the help menu in the correct order
			this.elements = [];
			this.elements.push(this.$title);
			this.elements.push(this.$help);
			this.elements.push(this.$panda);
			this.elements.push(this.$start);

			// ADD EVERERYTHING TO OUTER DIV
			// -----------------------------

			this.$el.append(this.elements);

			// Listen to the corresponding game model 
			this.listenTo(app.eventAgg, 'game:newLevel', this.update);
			this.render();
		},
		render: function () {
			if (this.visible) {
				this.$title.text(this.title);
				this.$help.text(this.text);
			}
		},
		update: function (newSample) {
			console.log(newSample);
			this.text = newSample.help;
			this.title =  newSample.name;
			this.render();
		}
		
	});
})();

