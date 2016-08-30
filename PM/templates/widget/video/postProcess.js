
var callback = function (context, data, pageNumber) {
	var isSafari = navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
	var isOpera = navigator.userAgent.match(/Opera|OPR\//) ? true : false;
	var isWindows = navigator.appVersion.indexOf("Win") !== -1;
	
	// The mediaelement video object
	var video;

	// The internal mediaelement player object
	var player;
	var curTrack;
	var tracks;
	
	// The ID used by mediaelement.js for this video's player
	var mediaElementPlayerId;

	/**
	 * Creates a video in the HTML for the video widget
	 */
	var createVideo = function() {
		var videoContainer = $("#" + data.id, context);
		
		// Create the HTML for the video
		var videoHTML = '<video class="video-media-element" controls="controls">';
		
		// Adds all the sources to the video's HTML tag
		$.each( data.sources, function( index, source ) {
			videoHTML += '<source src="' + data.resource_url + "/" + source.source + '" type="' + source.type +'"></source>';
		});
		
		// Adds all the subtitles to the video's HTML tag
		if( typeof data.subs !== "undefined" ) {
			$.each( data.subs, function( index, sb ) {
				videoHTML += '<track kind="subtitles" src="' + data.resource_url + "/" + sb.source + '" srclang="' + sb.lang +'"></track>';
			});
		}
		
		// End the video tag then set the HTML
		videoHTML += "</video>";
		videoContainer.html( videoHTML );
		
		var mediaElement =  $(".video-media-element", context).mediaelementplayer({
			defaultVideoWidth: "100%",
			defaultVideoHeight: "100%",
			pauseOtherPlayers: false,
			enableAutosize: true,
			features: ['playpause', 'progress', 'current', 'duration', 'tracks',
			'volume', 'fullscreen']
		}).attr({ preload: "none" });
		
		player    = $("video", context)[0].player;
		curTrack  = 0;
		tracks    = [];

		var auto_clicking = false;

		// When the radio button is clicked, make that language the global lang
		$("input[type=radio]", context).click(function (ev) {
			if (!auto_clicking) {
				var lang = ev.target.value;
				SharedData.setter("__lang", lang, pageNumber);
				SharedData.setter("captionsTrack", $.inArray( this, $("input[type=radio]", context) ), pageNumber);
				mejs.players[mediaElementPlayerId].setTrack( lang );
			}
		});
		
		// When the global lang is updated, use that language
		if (!_.contains(SharedData.widgetIds, data.id)){
			SharedData.addListener("__lang", function (value) {
				auto_clicking = true;
				$("input[value=" + value + "]", context).click();
				auto_clicking = false;
			}, pageNumber);
			SharedData.widgetIds.push(data.id);
		}
		
		// Keep a reference to this video's player's ID
		mediaElementPlayerId = "mep_" + ( Object.keys( mejs.players ).length - 1 );

		// TODO
		// player doesn't exist on iPad?
		if (typeof player !== "undefined" && typeof player.tracks !== "undefined") {
			tracks    = player.tracks.length + 1;
				
			// Each time the user clicks on the CC button, loop around the options
			$(".mejs-captions-button button", context).click(function (ev) {
				curTrack = (curTrack + 1) % tracks;
				SharedData.setter("captionsTrack", curTrack, pageNumber);
				var lang = $("input:radio", context)[curTrack].value;
				SharedData.setter("__lang", lang, pageNumber);
					
				$( $("input[type=radio]", context)[curTrack] ).prop( "checked", true );
				$(".mejs-captions-layer", context).attr({
					"lang": lang 
				});
				mejs.players[mediaElementPlayerId].setTrack( lang );
			});
		}
		
		if( !isOpera )
		{
			$(".video-media-element", context).click( togglePlay );
			$(".mejs-overlay-play", context).click( togglePlay );
		}

		if (typeof data.bg_color !== "undefined") {
			mediaElement.css("background-color", data.bg_color);
		}
		
		return mediaElement;
	};
	
	var togglePlay = function(e)
	{
		if( $(e.target).hasClass( "video-media-element" ) ||
			$(e.target).hasClass( "mejs-overlay-button" ) ||
			$(e.target).hasClass( "mejs-captions-layer" ) )
		{
			player.media.paused ? player.play() : player.pause();
		}
	};
	
	/**
	 * Opera fix to allow play/ pause toggle on click of video
	 */
	if( isOpera )
	{
		$(document).click( function(e) {
			if( VignetteController.currentPage === pageNumber )
			{
				if( $(e.target).hasClass( "video-media-element" ) ||
					$(e.target).hasClass( "mejs-overlay-button" ) ||
					$(e.target).hasClass( "mejs-captions-layer" ) )
				{
					player.media.paused ? player.play() : player.pause();
					
					if( $(e.target).hasClass( "mejs-overlay-button" ) )
					{
						player.play();
					}
				}
			}
		});
	}
	
	var getTotalWidthOfElement = function( elementSelector )
	{
		var element = $( elementSelector, context );
		if( element.length === 0 ) return 0;
		return parseInt( element.width() ) + 
			   parseInt( element.css('margin-left') ) +
			   parseInt( element.css('margin-right') ) +
			   parseInt( element.css('padding-left') ) +
			   parseInt( element.css('padding-right') ) +
			   parseInt( element.css('border-left-width') ) +
			   parseInt( element.css('border-right-width') );
	};
	
	var adjustVideoSize = function()
	{
		if( pageNumber === VignetteController.currentPage &&
			typeof video !== "undefined" )
		{
			if( mejs.players[mediaElementPlayerId].isFullScreen )
			{
				if( video.width() !== window.innerWidth )
				{
					video.width( window.innerWidth );
					video.height( window.innerHeight );
				}
			}
			else //if( video.width() !== $(".video_div", context).width() )
			{
				video.width( $(".video_div", context).width() );
				video.height( $(".video_div", context).height() );
			}
		
			// Resize the scrub bar properly
			var scrubBarContainer = $(".mejs-time-rail", context);
			var scrubBar = $(".mejs-time-total", context);
			var remainingWidth = parseInt( video.width() ) -
								 getTotalWidthOfElement( ".mejs-playpause-button" ) -
								 getTotalWidthOfElement( ".mejs-time" ) -
								 getTotalWidthOfElement( ".mejs-captions-button" ) -
								 getTotalWidthOfElement( ".mejs-volume-button" ) -
								 getTotalWidthOfElement( ".mejs-fullscreen-button" ) - 
								 parseInt( scrubBar.css('margin-left') ) -
								 parseInt( scrubBar.css('margin-right') ) -
								 parseInt( scrubBar.css('padding-left') ) -
								 parseInt( scrubBar.css('padding-right') ) -
								 parseInt( scrubBar.css('border-left-width') ) -
								 parseInt( scrubBar.css('border-right-width') );
			if( remainingWidth > 1 )
			{
				scrubBarContainer.width( remainingWidth + 5 );
				scrubBar.width( remainingWidth - 5 );
			}
		}
		
		window.setTimeout( adjustVideoSize, 40 );
	};

	// Setup reporting for videos
	VignetteController.addPageFlipListener(function (event) {
		/**
		 * Create the video for the widget if it hasn't been
		 * created yet
		 *
		 * Safari must create the video every time because of the
		 * issues it has with HTML5 <video>
		 * (Only applies to Safari on Windows since it's so many
		 * versions behind the Mac version)
		 */
		if( typeof video === "undefined" || (isSafari && isWindows) ) {
			video = createVideo();
		}
			
		// Pause video on page flip
		if (event.type === "flip") {
			if (typeof player !== "undefined") {
				player.pause();
			} else {
				$("video", context)[0].pause();
			}
		
		} else if (event.type === "load") {
			// Check the autoplay option to start video
			if (typeof data.autoplay !== "undefined") {
				if (data.autoplay) {
					if (typeof player !== "undefined") {
						player.play();
					} else {
						$("video", context)[0].play();
					}
				}
			}
			
			// Keep Caption settings consistent
			if(typeof SharedData.getter("captionsTrack") !== "undefined") {
				subTrack = SharedData.getter("captionsTrack")[0];
				
				if( subTrack <= tracks ) {
					curTrack = subTrack;
					
					// Prevent videos that don't have captions from attempting to show captions
					if( typeof $("input:radio", context)[curTrack] !== "undefined" )
					{
						var lang = $("input:radio", context)[curTrack].value;
						SharedData.setter("__lang", lang, pageNumber);
						
						$( $("input[type=radio]", context)[subTrack] ).prop( "checked", true );
						$(".mejs-captions-layer", context).attr({
							"lang": lang 
						});
						
						mejs.players[mediaElementPlayerId].setTrack( lang );
					}
				}
			}
			
			// Added to give the vignette creator more control over the videos
			// Unsure of why the autoplay has 2 options...
			
			// Sets the video to repeat after playing through
			if (typeof data.loop !== "undefined") {
				if (data.loop) {
					$("video", context)[0].setAttribute('loop', 'true');
				}
			}
			// Sets the audio of a video to be muted
			if (typeof data.muted !== "undefined") {
				if (data.muted) {
					$("video", context)[0].setMuted(data.muted);
				}
			}
			// Sets the poster image of the video
			// Untested -> The url will require a resources/folder/img path
			if (typeof data.poster !== "undefined") {
				if (data.poster) {
					$("video", context)[0].setPoster(data.poster);
				}
			}
		}
		
		adjustVideoSize();

		// Return true regardless of action
		return true;
	});
	VignetteController.addResizeFunction(function () {
		adjustVideoSize();
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/video", callback);
};
