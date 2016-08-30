
var callback = function (context, data, pageNumber) {
	// Defaults for the analysis-dev widget
	data.tracks = "any";
	data.step_time = 0;
	data.exports_to = "";

	// Frame variables
	var line_width = 2;
	var clicks = 0;
	var warnings = 0;
	var colorData = [];
	// canvases
	var TheCanvas = $(".the_canvas", context);

	// image player
	if (SharedData.getter(data.exports_to+"_frame") !== undefined){
		var imPlayer = new ImagePlayer($(".real-image", context), false, 
				SharedData.getter(data.exports_to+"_frame")[0]);
	}else{
		var imPlayer = new ImagePlayer($(".real-image", context), false, 0);
	}
	
	// controls
	var LeftArrowControl	= $(".left", context);
	var RightArrowControl	= $(".right", context);
	var ClearDataControl	= $(".clear_data", context);
	var AnalysisMessage		= $(".analysis_message", context);
	var CurrentTime			= $(".current_time", context);
	var Hint				= $(".hint", context);
	var InstructionMessage	= $(".instruction_message", context);
	var UserValue			= $("#user_value", context);
	var UserEnter			= $(".userval", context);

	// Create co-ordinate fetching function to resolve canvas-relative coords
	HTMLCanvasElement.prototype.relMouseCoords = function (event) {
		var totalOffsetX = 0;
		var totalOffsetY = 0;
		var canvasX = 0;
		var canvasY = 0;
		var currentElement = this;

		do {
			totalOffsetX += currentElement.offsetLeft;
			totalOffsetY += currentElement.offsetTop;
		} while (currentElement = currentElement.offsetParent);

		canvasX = event.pageX - totalOffsetX;
		canvasY = event.pageY - totalOffsetY;

		// Fix for variable canvas width
		canvasX = canvasX * (this.width / this.offsetWidth);
		canvasY = canvasY * (this.height / this.offsetHeight);
		
		if( data.round_pixel_coordinates === true )
		{
			canvasX = Math.round( canvasX );
			canvasY = Math.round( canvasY );
		}

		// Revert inverted Y-axis (TODO: make option?)
		canvasY = this.height - canvasY;
		
		canvasX = 800 * canvasX / $(this).width();
		canvasY = 450 * canvasY / $(this).height();

		return {x: canvasX, y: canvasY};
	};
	
	//Converts Coordinates on one canvas element to their relative position on another canvas element
	HTMLCanvasElement.prototype.convertCoords = function ( xOther, yOther, otherCanvas) {
	
		var canvasX = 0;
		var canvasY = 0;
		var currentElement = this;

		canvasX = xOther;
		canvasY = yOther;
		
		// Fix for variable canvas width
		canvasX = canvasX * (this.width / otherCanvas.width);
		canvasY = canvasY * (this.height / otherCanvas.height);

		if( data.round_pixel_coordinates === true )
		{
			canvasX = Math.round( canvasX );
			canvasY = Math.round( canvasY );
		}
		
		canvasY = this.height - canvasY;
		
		canvasX = 800 * canvasX / otherCanvas.width;
		canvasY = 450 * canvasY / otherCanvas.height;
		
		return {x: canvasX, y: canvasY};
	}

	var getUnscaledCoordinates = function( coords )
	{
		var newCoords = { x: 0, y: 0 };
		newCoords.x = TheCanvas[0].width * coords.x / 800;
		newCoords.y = TheCanvas[0].height * coords.y / 450;
		return newCoords;
	};

//  Remove all previous listeners

//	SharedData.listeners[data.exports_to] = []
//	SharedData.listeners[data.exports_to + "_frame"] = [];
//	SharedData.listeners[data.exports_to + "_error"] = [];
	
	
	// initially hide analysis message, caches display type
	AnalysisMessage.hide();

	// initially show instruction message
	if (_.has(data, "instructions")) {
		InstructionMessage.show();
	} else {
		InstructionMessage.hide();
	}

	
//	var updateTime = function (frame) {
//		CurrentTime.html("t = " + (frame * data.step_time).toFixed(2) + "s");
//	};
	
	// initialize canvas control and set the time on frame
	var CEControl = new CanvasEngine(TheCanvas[0], Hint[0],
		InstructionMessage, data, pageNumber);
//	updateTime(imPlayer.index);

	// Setup basic hint for the user
	if (_.has(data, "hint")) {
		$(Hint[0]).html(data.hint);
	} else if (typeof data.hint === "null") {
		$(Hint[0]).hide();
	}

	// Set up canvas control click listener
	TheCanvas.click(function (event) {
		InstructionMessage.hide();
		var coords = TheCanvas[0].relMouseCoords(event);
		var goodClick = CEControl.checkClick(coords.x, coords.y);
		if (goodClick) {
			clicks += 1;
			
			updateColorData(getUnscaledCoordinates(coords));
			CEControl.click(coords.x, coords.y);
			//console.log(coords.x+" "+coords.y);
		}
	});

	UserEnter.click(function (ev) {
		CEControl.value($(UserValue[0]).val());
		//console.log(value($(UserValue[0]).val()));
	});

	UserValue.keyup(function (ev) {
		if (ev.keyCode === 13) {
			CEControl.value($(UserValue[0]).val());
			ev.preventDefault();
		}
	});


	// Frame change listener
	SharedData.addListener(data.exports_to + "_frame", function (frame) {
		imPlayer.flipTo(frame);
		CurrentTime.html("t = " + (frame * data.step_time).toFixed(2) + "s");
		}, pageNumber);
		
	// Error listener
	SharedData.addListener(data.exports_to + "_error", function (error) {
		if (typeof error[2] !== "undefined") {
			AnalysisMessage.html(data.error_message);
		} else {
			// Default error message
			AnalysisMessage.html("Please click closer to the target yo.");
		}
		AnalysisMessage.show();
		AnalysisMessage.fadeOut(2000);
		warnings += 1;
		}, pageNumber);
		
	
	/**
	 * Sets variables that keep track of current frames for
	 * analysis widgets for this page and neighboring pages
	 */
	var setFrame = function( frameNumber ) {
		// Don't let the frame go past its limits
		if( frameNumber < 0 || frameNumber > imPlayer.selector.length - 1 ) {
			return;
		}
		
		if( pageNumber > 0 ) {
			SharedData.setter(data.exports_to + "_frame", frameNumber, pageNumber - 1);
		}
		if( pageNumber < VignetteEngine.totalPages ) {
			SharedData.setter(data.exports_to + "_frame", frameNumber, pageNumber + 1);
		}
		SharedData.setter(data.exports_to + "_frame", frameNumber, pageNumber);
		CEControl.tracker.flipTo( frameNumber );
	}
	
	/**
	 * Create a scrub bar
	 */
	var scrubBar = new ScrubBar( ".analysis_dev_div",
								 ".scrub_bar",
								 data.exports_to,
								 context,
								 imPlayer,
								 pageNumber );
	
	// Allow the scrub bar to keep track of the elements in its div
	// so that everything will fit properly
	scrubBar.addUIElement( ".left" );
	scrubBar.addUIElement( ".right" );
	scrubBar.addUIElement( ".clear_data" );
	scrubBar.addUIElement( ".userval" );
	scrubBar.addUIElement( "#user_value" );
	
	// Listeners for the image player and scrub bar
	imPlayer.onFlip = scrubBar.resize;
	scrubBar.onMouseDrag = setFrame;
	
	var updateColorData = function(coords) {
		//Create a tempCanvas to hold the image and sample its color
		var tempCanvas = document.createElement('canvas');
		var images = $(".real-image", context);
		var tempContext = tempCanvas.getContext('2d');
		
		
		//Set the size to be the same as the canvas
		tempCanvas.width = TheCanvas[0].width;
		tempCanvas.height = TheCanvas[0].height;
		
		//Draw the correct frame needed to sample the color
		tempContext.drawImage(images[imPlayer.index], 0, 0, TheCanvas[0].width , TheCanvas[0].height );
		
		
		//Convert the coords from the blank canvas to the coords on the tempCanvas
		var tempCoords = getUnscaledCoordinates( tempCanvas.convertCoords(coords.x, coords.y, TheCanvas[0]) );
		//Get the image data at the correct coords
		var imgData = tempContext.getImageData(tempCoords.x, tempCoords.y, 2, 2).data;
		
		//Get the intensity of red green and blue at the specified area of the picture
		var red = 0;
		var green = 0;
		var blue = 0;
		for(var i = 0; i < imgData.length/4; i++) {
			red += parseInt(imgData[0 + 4*i]);
			green += parseInt(imgData[1 + 4*i]);
			blue += parseInt(imgData[2 + 4*i]);
		}
		red = Math.round(red/(imgData.length/4));
		green = Math.round(green/(imgData.length/4));
		blue = Math.round(blue/(imgData.length/4));
		
		//Set the colorData object
		colorData[imPlayer.index] = [red, green, blue];
		
		SharedData.setter(data.exports_to + "_rgb", colorData, "", pageNumber);
	}
	
	/**
	 * Updates the frame for the analysis widget to its current frame
	 */
	var updateFrame = function() {
		var frame = SharedData.getter(data.exports_to + "_frame");
		setFrame( parseInt(frame) );
	}

	// Set up control listeners
	LeftArrowControl.click(function () {

		InstructionMessage.hide();
		
		var frame = SharedData.getter(data.exports_to + "_frame");
		setFrame( parseInt(frame) - 1 );
	});

	RightArrowControl.click(function () {

		InstructionMessage.hide();
		
		var frame = SharedData.getter(data.exports_to + "_frame");
		setFrame( parseInt(frame) + 1 );
	});

	
	ClearDataControl.click(function () {


		//clear color data
		colorData = [];
		
		InstructionMessage.hide();
		setFrame(0);
		CEControl.clear();
	});

	AnalysisMessage.click(function (event) {
		AnalysisMessage.stop(true, true);
		AnalysisMessage.hide();
		var coords = TheCanvas[0].relMouseCoords(event);
		var goodClick = CEControl.checkClick(coords.x, coords.y);
		if (goodClick) {
			clicks += 1;
			
			updateColorData(getUnscaledCoordinates(coords));
			CEControl.click(coords.x, coords.y);
		}
	});

	
	InstructionMessage.click(function (event) {
		InstructionMessage.hide();
	});
	
	// Resize the canvas to properly account for the scale factor
	// between the widget's size and the actual size of the canvas
	var resizeCanvas = function()
	{
		if( TheCanvas.width() === 0 )
		{
			window.setTimeout( resizeCanvas, 40 );
		}
		else
		{
			CEControl.setCanvas( TheCanvas[0] );
			CEControl.tracker.redraw();
			window.setTimeout( resizeCanvas, 500 );
		}
	}

	// Page flip listener to fill in data
	VignetteController.addPageFlipListener(function (event) {
		// Have the scrub bar handle a page flip
		scrubBar.onPageFlip( event );
	
		if (event.type === "flip") {
			CEControl.clearError();
		} else if (event.type === "load") {
			clicks = 0;
			colorData = SharedData.getter(data.exports_to + "_rgb") ? SharedData.getter(data.exports_to + "_rgb")[0] : [];
			updateFrame();
		
			AnalysisMessage.hide();

			// Set the tracker's colors to the ones defined in the JSON for this
			// widget, using default values if they are not set
			CEControl.tracker.normalColor  = data.color || "black";
			CEControl.tracker.currentColor = data.click_color || "pink";
			//CEControl.tracker.warningColor = data.error_color || "yellow";

			
			// Set the size of the plotted points if changed in the JSON
			CEControl.tracker.drawSize = data.point_size || 1.5;
			
			// Set the size of the line width if changed in the JSON
			CEControl.tracker.lineWidth = data.line_width || 1.5;
			
			// Set the size of the horizontal line length if changed in the JSON
			CEControl.tracker.horizLineLength = data.horiz_line_length || 50;
			
			CEControl.onUpdate();
			
			window.setTimeout( resizeCanvas, 40 );
		}
		return true;
	});
	VignetteController.addResizeFunction(function () {
		scrubBar.onPageResize();
		window.setTimeout( resizeCanvas, 40 );
	});

//	VignetteController.addReportListener(function () {
//		var report = Report.format(data, {
//			lines: clicks,
//			warnings: warnings
//		});
//		clicks = 0;
//		warnings = 0;
//		return report;
//	});

	// Hover event handler

	TheCanvas.mousemove(function (event) {
		var coords = TheCanvas[0].relMouseCoords(event);
		CEControl.hover(coords.x, coords.y);
		CurrentTime.html("X = " + coords.x + "<br />Y = " + coords.y);
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/analysis-dev", callback);
};
