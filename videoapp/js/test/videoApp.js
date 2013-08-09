var app = app || {};

(function ($) {
	'use strict';

	// The Youtube player is easily accessible in this class
	var vPlayer;

	app.VideoAppView = Backbone.View.extend({

		// Bind app to existing HTML div
		el: '#toneyApp',

		events: {
			'click #gameWindow': 'playPauseVideo'
		},

		// UNDER CONSTRUCTION! 
		initialize: function() {

			// Get the size of the whole page
			var width = $(document).width();
			var height = $(document).height();
		
			// MODEL FOR HANDLING INPUT AND OUTPUTTING SPECTROGRAM TO TONELINES
			//---------------------------------------------------

			app.spectrogram = new app.SpectrogramModel();

			// SPECTROGRAM 
			// ---------------------------

			// this.$spectrogramWindow = $('<canvas>', { id: 'spectrogramWindow'} );
			// this.$spectrogramWindow[0].width = width;
			// this.$spectrogramWindow[0].height = height;
			// this.$spectrogramWindow.css( {
			// 	margin: '-8px',
			// 	padding: '0px',
			// 	position: 'absolute',
			// 	width: '100%',
			// 	height: '100%',
			// 	'z-index': '-1'
			// });

			// var spectrogramContext = this.$spectrogramWindow[0].getContext('2d');
			// app.spectrogramView = new app.SpectrogramView({
			// 	model: app.spectrogram,
			// 	ctx: spectrogramContext
			// });
			
			// TONELINE 
			//---------

			app.game = new app.GameModel();
			
			this.$gameWindow = $('<canvas>', { id: 'gamewindow' });
			this.$gameWindow[0].width = width;
			this.$gameWindow[0].height = height;
			this.$gameWindow.css( {
				margin: '-8px',
				padding: '0px',
				position: 'absolute',
				width: '100%',
				height: '100%',
				'z-index': '0'
			});

			app.game.ctx = this.$gameWindow[0].getContext('2d'); // global context for drawing game related things
			app.gameView = new app.GameView({
				game: app.game
			});
			app.gameView.player.lineWidth = 30;
			// app.gameView.reference.lineWidth = 30;

			
			this.$loadingImage = $('<img>', { src: 'images/processing.gif', id: 'loadingImage'} );


			// VIDEO WINDOW SETUP
			this.$player = $('<div>', { id: 'video' });
			this.$player.css( {
				margin: '-8px',
				padding: '0px',
				'-webkit-filter': 'grayscale(100%)',
				position: 'absolute',
				width: '100%',
				height: '100%',
				'z-index': '-2'
			})

			// Add all created elements to the DOM
			this.$el.append(this.$gameWindow , [  this.$player  ]);
			this.$el.parent().append( this.$loadingImage );

			// RE-RENDER THE APP WHEN INPUT CHANGES
			this.listenTo( app.spectrogram, 'stateChanged', this.render );

			this.render();

			// YOUTUBE PLAYER SETUP
			// --------------------

			// 2. This code loads the IFrame Player API code asynchronously.
			var tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			
			// 3. This function creates an <iframe> (and YouTube player)
			//    after the API code downloads.
			window.onYouTubeIframeAPIReady = function()  {
				console.log('api ready');
				vPlayer = new YT.Player('video', {
					height: width,
					width: height,
					videoId: 'Tm37kO4lOJQ',
					playerVars: {
            controls: '0',
            iv_load_policy: '2',
            showinfo: '0',
            loop: '1'
          },
					events: {
						'onReady': onPlayerReady,
						'onStateChange': onPlayerStateChange
					}
				});
				vPlayer.done = false;
				vPlayer.playing = true;
				this.$gameWindow.click(this.playPauseVideo);
			}.bind(this);

			function onPlayerReady(event) {
				event.target.playVideo();
				console.log('starting video first time');
			}
			// 5. The API calls this function when the player's state changes.
			//    The function indicates that when playing a video (state=1),
			//    the player should play for six seconds and then stop.

			
			function onPlayerStateChange(event) {
				if (event.data == YT.PlayerState.PLAYING && !vPlayer.done) {
					// setTimeout(stopVideo, 6000);
					vPlayer.done = true;
				}
			}

			function stopVideo() {
				vPlayer.stopVideo();
			}
		
		},
		// Re-rendering the App when the spectrogram's state changes
		render: function () {
			if (app.spectrogram.get('processing')) {
				$(this.el).hide();
				this.$loadingImage.show();
			}
			// if not in processing state:
			else {
				$(this.el).show();
				this.$loadingImage.hide();
			}
		},
		playPauseVideo: function () {
			if(vPlayer.playing == true) {
				vPlayer.pauseVideo();
				vPlayer.playing = false;
			}
			else {
				vPlayer.playVideo();
				vPlayer.playing = true;
			}
		}
	});
})(jQuery);