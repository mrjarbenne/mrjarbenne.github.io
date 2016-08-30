var callback = function (context, data, pageNumber) {
	var imPlayer = new ImagePlayer($(".real-image", context), true,
		0, data.step_time);

	// Set image background color
	if (typeof data.bg_color !== "undefined") {
		$(".nostretch", context).css("background-color", data.bg_color);
	}
	
	// Allow circular looping of images, backwards
	$(".left", context).click(imPlayer.back);

	// Allow circular looping of images, forwards
	$(".right", context).click(imPlayer.next);
	
	var play = function()
	{
		imPlayer.startAutoplay();
		$(".play", context).hide();
		$(".pause", context).show();
	}
	
	var pause = function()
	{
		imPlayer.pause();
		$(".play", context).show();
		$(".pause", context).hide();
	}

	// Starts autoplay function
	$(".play", context).click(play);
	$(".play", context).hide();
	
	$(".pause", context).click(pause);
	
	// Create a scrub bar
	var scrubBar = new ScrubBar( ".frame_play_div",
								 ".scrub_bar",
								 data.exports_to,
								 context,
								 imPlayer,
								 pageNumber );
	
	// Allow the scrub bar to keep track of the elements in its div
	// so that everything will fit properly
	scrubBar.addUIElement( ".left" );
	scrubBar.addUIElement( ".right" );
	scrubBar.addUIElement( ".play" );
	
	// Listeners for the image player and scrub bar
	imPlayer.onFlip = scrubBar.updateProgress;
	imPlayer.onReset = pause;
	scrubBar.onMouseDrag = pause;
	
	// Page flip listener, if needed
	VignetteController.addPageFlipListener(function (event) {
		// Have the scrub bar handle a page flip
		scrubBar.onPageFlip( event );
	
		if (event.type === "load") {
			play();
		}
		return true;
	});
	
	VignetteController.addResizeFunction(function () {
		scrubBar.onPageResize();
		var img = new Image();
		img.src = $(".nostretch img").attr("src");
		$(".nostretch img.image").each(function(index){
			img.src = $(this).attr("src");
			if((img.width/img.height) <= (16/9) ) $(this).css("height","100%");
			else $(this).css("width","100%");
		});
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/frame-player", callback);
};