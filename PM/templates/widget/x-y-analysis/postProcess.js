
var callback = function (context, data, pageNumber) {
	// Frame variables
	var line_width = 2;
	var clicks = 0;
	var warnings = 0;
	var colorData = [];
	var canCheckMotion = true;
	var enableHandler = false;
	var timer;
	var latestEvent;
	var numOfInputs;
	var onceWrong = false;
	var firstMotion = true;
	var scale_distance = 0;
	
	// canvases
	var TheCanvas = $(".the_canvas", context);

	// image player
	var imPlayer;
	if (SharedData.getter(data.exports_to+"_frame") !== undefined){
		imPlayer = new ImagePlayer($(".real-image", context), false, 
				SharedData.getter(data.exports_to+"_frame")[0]);
	}else{
		imPlayer = new ImagePlayer($(".real-image", context), false, 0);
	}
	
	// Use all the color data if tracking color segments
	var allRgbData;
	if( data.tracks === "displacement" ) 
	{
		if( typeof SharedData.getter(data.exports_to + "_all_rgb") === "undefined" )
		{
			allRgbData = [];
			SharedData.setter(data.exports_to + "_all_rgb", allRgbData, pageNumber );
		}
		else
		{
			allRgbData = SharedData.getter(data.exports_to + "_all_rgb");
		}
	}

	// controls
	var LeftArrowControl	= $(".left", context);
	var RightArrowControl	= $(".right", context);
	var ClearDataControl	= $(".clear_data", context);
	var AnalysisMessage		= $(".analysis_message", context);
	var CurrentTime			= $(".current_time", context);
	var CurrentTimeValue 	= $(".current_time_value", context);
	var Hint				= $(".hint", context);
	var InstructionMessage	= $(".instruction_message", context);
	var UserValue			= $("#user_value", context);
	var UserEnter			= $(".userval", context);

	// whether the user is setting the origin
	var origin_active = false;

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
	};

	var getUnscaledCoordinates = function( coords )
	{
		var newCoords = { x: 0, y: 0 };
		newCoords.x = TheCanvas[0].width * coords.x / 800;
		newCoords.y = TheCanvas[0].height * coords.y / 450 + TheCanvas[0].height/7.5; // what is this height/7.5 term??
		return newCoords;
	};

//  Remove all previous listeners

//	SharedData.listeners[data.exports_to] = []
//	SharedData.listeners[data.exports_to + "_frame"] = [];
//	SharedData.listeners[data.exports_to + "_error"] = [];
	
	
	// initially hide analysis message, caches display type
	AnalysisMessage.hide();

	// initially show instruction message
	if (_.has(data, "instructions") && data.instructions !== "") {
		InstructionMessage.show();
	} else {
		InstructionMessage.hide();
	}

	var updateTime = function (frame) {
		CurrentTimeValue.html((frame * data.step_time).toFixed(2));
	};
	
	// initialize canvas control and set the time on frame
	var CEControl = new CanvasEngine(TheCanvas[0], Hint[0],
		InstructionMessage, data, pageNumber);
	updateTime(imPlayer.index);

	// Setup basic hint for the user
	if (_.has(data, "hint")) {
		$(Hint[0]).html(data.hint);
	} else if (typeof data.hint === "undefined") {
		$(Hint[0]).hide();
	}

	// Hide the current time in the upper-right if the hide_time option
	// is set to true.
	if (typeof data.hide_time !== "undefined" && data.hide_time === true) {
		CurrentTime.hide();
	}

	// Set text color of current time
	if (typeof data.time_text_color !== "undefined") {
		CurrentTime.css("color", data.time_text_color);
	}

	// Set background color of current time
	if (typeof data.time_bg_color !== "undefined") {
		CurrentTime.css("background-color", data.time_bg_color);
	}

	// Set image background color
	if (typeof data.bg_color !== "undefined") {
		$(".nostretch", context).css("background-color", data.bg_color);
	}

	// If scrub_bar_location is "below" then add flex to x_y_analysis_div
	if (typeof data.scrub_bar_location !== "undefined" && data.scrub_bar_location == "below") {
		$(".x_y_analysis_div", context).addClass("flex-content");
		// Grab the scrub bar and put it after the analysis div
		var ac = $(".analysis_controls", context).detach();
		ac.insertAfter($(".x_y_analysis_div", context));
	} else {
		$(".analysis_controls", context).css("position", "absolute");
	}

	setupCanvasClickListeners();

	function setupCanvasClickListeners() {
		// Set up canvas control click listener
		if(data.tracks != "motion") {
			TheCanvas.mousedown(function (event) {
				if( event.which === 1 ) // Left click only
				{
					InstructionMessage.hide();
					var coords = TheCanvas[0].relMouseCoords(event);
					CEControl.startDrag(coords.x, coords.y);
				}
			});

			TheCanvas.mouseup(function (event) {
				if( event.which === 1 ) // Left click only
				{
					var coords = TheCanvas[0].relMouseCoords(event);
					var goodClick = CEControl.checkClick(coords.x, coords.y);
					if (goodClick) {
						clicks += 1;
					
						if( data.tracks === "displacement" ) {
							var rgbLineData = getLineColorData( imPlayer.index );
					
							if( typeof rgbLineData !== "undefined" && rgbLineData.length > 0)
							{
								SharedData.setter(data.exports_to + "_rgb", rgbLineData, pageNumber );
								allRgbData[imPlayer.index] = rgbLineData;
							}
						
							CEControl.click(coords.x, coords.y);
						} else {
							updateColorData(getUnscaledCoordinates(coords));
							CEControl.click(coords.x, coords.y);
						}
					}
					if(data.tracks == "motion") {
						TheCanvas.unbind("mouseup");
						TheCanvas.unbind("mousedown");
					}
				}
			});
		}
		else {
			
			TheCanvas.mousemove(function (e) {
				latestEvent = e;
				if(firstMotion) {
					var coords = TheCanvas[0].relMouseCoords(latestEvent);
					var goodClick = CEControl.isCorrectPos(coords.x, coords.y);
					if(goodClick) {
						clicks += 1;
						InstructionMessage.hide();
						updateColorData(getUnscaledCoordinates(coords));
						CEControl.click(coords.x, coords.y);
						numOfInputs = data.track_locations.length;
						timer = window.setInterval(function(){
							motion();
						}, data.update_motion);
						firstMotion = false;
						$("#"+data.id+" .analysis_message").html("Kindly follow the motion of the target object.");
					}
				}        
			});
		}
	}

	function removeCanvasClickListeners() {
		TheCanvas.off("mouseup");
		TheCanvas.off("mousedown");
		TheCanvas.off("mousemove");
	}

	function lineDistance(coords1, coords2) {
		return Math.sqrt( Math.pow(coords2.x - coords1.x, 2) + Math.pow(coords2.y - coords1.y, 2) );
	}

	function setupScaleClickListeners() {
		TheCanvas.mousedown(function (event) {
				if (event.which === 1) {
					scale_start_coords = TheCanvas[0].relMouseCoords(event);
					scale_dragging = true;
				}
			});
		TheCanvas.mouseup(function (event) {
			if (event.which === 1) {
				if (scale_dragging) {
					scale_dragging = false;
					scale_distance = lineDistance(scale_start_coords, scale_end_coords);
					$("#scale_factor_value").val(scale_distance.toFixed(2));
					SharedData.setter(data.exports_to + "_scale_factor", scale_distance, pageNumber);
				}
			}
		});
		TheCanvas.mousemove(function (event) {
			if (scale_dragging) { // user has started dragging
				scale_end_coords = TheCanvas[0].relMouseCoords(event);
				var start_x = scale_start_coords.x;
				var start_y = scale_start_coords.y;
				var end_x = scale_end_coords.x;
				var end_y = scale_end_coords.y;
				SharedData.setter(data.exports_to + "_scale_start_x", start_x, pageNumber);
				SharedData.setter(data.exports_to + "_scale_start_y", start_y, pageNumber);
				SharedData.setter(data.exports_to + "_scale_end_x", end_x, pageNumber);
				SharedData.setter(data.exports_to + "_scale_end_y", end_y, pageNumber);
				CEControl.tracker.drawClear();
				CEControl.tracker.redraw();
				// CEControl.tracker.drawLine(start_x, start_y, end_x, end_y);
			}
		});
	}

	function setupOriginClickListeners() {
		TheCanvas.mousedown(function (event) {
			if (event.which === 1) {
				origin_dragging = true;
				var coords = TheCanvas[0].relMouseCoords(event);
				SharedData.setter(data.exports_to + "_origin_x", coords.x, pageNumber);
				SharedData.setter(data.exports_to + "_origin_y", coords.y, pageNumber);
				CEControl.tracker.drawClear();
				CEControl.tracker.redraw();
			}
		});
		TheCanvas.mouseup(function (event) {
			if (event.which === 1) {
				origin_dragging = false;
				var coords = TheCanvas[0].relMouseCoords(event);
				SharedData.setter(data.exports_to + "_origin_x", coords.x, pageNumber);
				SharedData.setter(data.exports_to + "_origin_y", coords.y, pageNumber);
			}
		});
		TheCanvas.mousemove(function (event) {
			if (event.which === 1) {
				if (origin_dragging) {
					var coords = TheCanvas[0].relMouseCoords(event);
					SharedData.setter(data.exports_to + "_origin_x", coords.x, pageNumber);
					SharedData.setter(data.exports_to + "_origin_y", coords.y, pageNumber);
					CEControl.tracker.drawClear();
					CEControl.tracker.redraw();
				}
			}

		});
	}
		
	function motion(){
		var coords = TheCanvas[0].relMouseCoords(latestEvent);
		var goodClick = CEControl.checkClick(coords.x, coords.y);
		if (goodClick) {
			clicks += 1;
			updateColorData(getUnscaledCoordinates(coords));
			CEControl.click(coords.x, coords.y);
		}
		else onceWrong = true;
		if(onceWrong) { $(".motionCorrect").hide(); $(".motionWrong").fadeIn(); }
		else $(".motionCorrect").fadeIn();
		if(numOfInputs <= clicks) clearInterval(timer);
	}
	
	
	

	UserEnter.click(function (ev) {
		CEControl.value($(UserValue[0]).val());
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
		updateTime(frame);
		}, pageNumber);
		
	// Error listener
	SharedData.addListener(data.exports_to + "_error", function (error) {
		if (typeof error[2] !== "undefined") {
			AnalysisMessage.html(data.error_message);
		} else {
			// Default error message
			AnalysisMessage.html("Please click closer to the target.");
		}
		AnalysisMessage.show();
		AnalysisMessage.fadeOut(2000);
		warnings += 1;
		}, pageNumber);
		
	SharedData.addListener(data.exports_to, function (e) {
		CEControl.tracker.redraw();
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
		
		updateColorSegmentDisplayData();
		
		if( pageNumber > 0 ) {
			SharedData.setter(data.exports_to + "_frame", frameNumber, pageNumber - 1);
		}
		if( pageNumber < VignetteEngine.totalPages ) {
			SharedData.setter(data.exports_to + "_frame", frameNumber, pageNumber + 1);
		}
		SharedData.setter(data.exports_to + "_frame", frameNumber, pageNumber);
		CEControl.tracker.flipTo( frameNumber );
	};

	/**
	 * Make sure the images are stretched to fill the frame
	 * in only one direction
	 */
	
	var sizeImages = function() {
		var img = new Image();
	    img.src = $("#"+data.id+" .image:last").attr("src");
	    
	    $(img).one("load", function(){
	        $(".nostretch img.image").each(function(index){
	            img.src = $(this).attr("src");
	            if((img.width/img.height) <= (16/9) ) $(this).css("height","100%");
	            else $(this).css("width","100%");
	        });
	    });
	};
	
	/**
	 * Updates the graphs if this data is using an
	 * AnyLineTracker and the graph has color_segment_graph
	 * set to true
	 */
	var updateColorSegmentDisplayData = function()
	{
		if( data.tracks === "displacement" )
		{
			var allRgbData = SharedData.getter(data.exports_to + "_all_rgb")[0];
			
			if( imPlayer.index < allRgbData.length && typeof allRgbData[imPlayer.index] !== "undefined" )
			{
				var currentRgbLineData = allRgbData[imPlayer.index];
				SharedData.setter(data.exports_to + "_rgb", currentRgbLineData, pageNumber );
				
				// Update the display data
				var temp = SharedData.getter(data.exports_to);
				SharedData.setter(data.exports_to, temp, pageNumber );
			}
		}
	};
	
	/**
	 * Create a scrub bar
	 */
	var scrubBar = new ScrubBar( ".x_y_analysis_div",
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
	scrubBar.addUIElement( "#scale_show_button" );
	scrubBar.addUIElement( "#origin_toggle_button");
	
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
	};
	
	//For getting the color data over the course of a line
	var getLineColorData = function( frame ) {
		var lineColorData = [];
		
		var startPoint;
		if( typeof SharedData.getter( data.exports_to + "_start" ) !== "undefined" &&
			SharedData.getter( data.exports_to + "_start" ).length > 0 )
		{
			startPoint = SharedData.getter( data.exports_to + "_start" )[frame];
		}
		else
		{
			return;
		}
		
		var endPoint;
		if( typeof SharedData.getter( data.exports_to + "_finish" ) !== "undefined" &&
			SharedData.getter( data.exports_to + "_finish" ).length > 0 )
		{
			endPoint = SharedData.getter( data.exports_to + "_finish" )[frame];
		}
		else
		{
			return;
		}
		
		// Fix when highlighting objects on hover
		if( typeof endPoint === "undefined" )
		{
			return;
		}
		
		//Create a tempCanvas to hold the image and sample its color
		var tempCanvas = document.createElement('canvas');
		var images = $(".real-image", context);
		var tempContext = tempCanvas.getContext('2d');
		
		var allPoints = [];
		var length = Math.floor( Math.sqrt( ( endPoint[1] - startPoint[1] ) * ( endPoint[1] - startPoint[1] ) +
			( endPoint[2] - startPoint[2] ) * ( endPoint[2] - startPoint[2] ) ) );
		var intervalX = ( endPoint[1] - startPoint[1] ) / length;
		var intervalY = ( endPoint[2] - startPoint[2] ) / length;
		
		
		//Set the size to be the same as the canvas
		tempCanvas.width = TheCanvas[0].width;
		tempCanvas.height = TheCanvas[0].height;
		
		//Draw the correct frame needed to sample the color
		tempContext.drawImage(images[imPlayer.index], 0, 0, TheCanvas[0].width , TheCanvas[0].height );
		
		for(var i = 0; i < length; i++) {
			var coords = {
				x: startPoint[1] + ( intervalX * i ),
				y: startPoint[2] + ( intervalY * i )
			};
			lineColorData.push( getPointColorData(coords, tempCanvas, tempContext) );
		}
		
		return lineColorData;
	};
	
	var getPointColorData = function(coords, tempCanvas, tempContext) {
		//Convert the coords from the blank canvas to the coords on the tempCanvas
		var tempCoords = getUnscaledCoordinates( coords );
		
		//Get the image data at the correct coords
		var imgData = tempContext.getImageData(tempCoords.x, tempCoords.y, 1, 1).data;
		
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
		
		return [red, green, blue];
	};
	
	/**
	 * Updates the frame for the analysis widget to its current frame
	 */
	var updateFrame = function() {
		var frame = SharedData.getter(data.exports_to + "_frame");
		setFrame( parseInt(frame) );
	};

	// Set up control listeners
	LeftArrowControl.click(function () {
		InstructionMessage.hide();
		
		var frame = SharedData.getter(data.exports_to + "_frame");
		setFrame( parseInt(frame) - 1 );
		
		updateColorSegmentDisplayData();
	});

	RightArrowControl.click(function () {
		InstructionMessage.hide();
		
		var frame = SharedData.getter(data.exports_to + "_frame");
		setFrame( parseInt(frame) + 1 );
		
		updateColorSegmentDisplayData();
	});
	
	ClearDataControl.click(function () {
		//clear color data
		colorData = [];
		allRgbData = [];
        firstMotion = true;
        clicks = 0;
        $(".motion_result").children().hide();
        clearInterval(timer);
        onceWrong = false;
		SharedData.setter(data.exports_to + "_all_rgb", allRgbData, pageNumber );
		
		InstructionMessage.hide();
		setFrame(0);
		CEControl.clear();

		if (data.scale_data) {
			resetScaleData();
		}

		SharedData.clear(data.exports_to + "_origin_x");
		SharedData.clear(data.exports_to + "_origin_y");

		// turn off origin editing
		origin_active = false;

		// get rid of any scale or origin click handlers
		removeCanvasClickListeners();
		setupCanvasClickListeners();

		
		updateColorSegmentDisplayData();

		CEControl.tracker.drawClear();
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


	// Scale control listeners
	if (data.scale_data) {
		// Scale variables
		var scale_start_coords = -1;
		var scale_end_coords = -1;
		var scale_dragging = false;
		var ScaleShowButton = $("#scale_show_button", context);
		var scale = $(".scale", context);

		var resetScaleData = function() {
			SharedData.clear(data.exports_to + "_scale_factor");
			SharedData.clear(data.exports_to + "_scale_real_value");
			SharedData.clear(data.exports_to + "_scale_start_x");
			SharedData.clear(data.exports_to + "_scale_start_y");
			SharedData.clear(data.exports_to + "_scale_end_x");
			SharedData.clear(data.exports_to + "_scale_end_y");
			CEControl.tracker.drawClear();
			CEControl.tracker.redraw();
			$("#scale_factor_value", context).val("");
			$("#scale_real_value", context).val("");
		};
		var hideScaleWindow = function() {
				removeCanvasClickListeners();
				setupCanvasClickListeners();
				SharedData.setter(data.exports_to + "_scale_active", false, pageNumber);
				CEControl.tracker.drawClear();
				CEControl.tracker.redraw();
		};
		// Scale tray show/hide
		ScaleShowButton.click(function (event) {
			scale.draggable();
			if (scale.is(".active")) { // scale window is already shown, hide it
				// Set up the normal canvas click listeners
				hideScaleWindow();
			} else { // show the scale window
				// Disable the normal click listener functionality while the user sets the scale
				removeCanvasClickListeners();
				// The user will draw a line and we need to get the length of it
				setupScaleClickListeners();
				SharedData.setter(data.exports_to + "_scale_active", true, pageNumber);
				CEControl.tracker.drawClear();
				CEControl.tracker.redraw();
			}
			scale.toggleClass("active");
		});

		var ScaleOkButton = $("#scale_ok", context);
		ScaleOkButton.click(function (event) {
			hideScaleWindow();
			scale.toggleClass("active");
		});

		var ScaleResetButton = $("#scale_reset", context);
		ScaleResetButton.click(function (event) {
			resetScaleData();
		});

		var scale_factor = $("#scale_factor_value", context);
		scale_factor.focusout(function () {
			SharedData.setter(data.exports_to + "_scale_factor", scale_factor.val(), pageNumber);
		});
		var scale_real_value = $("#scale_real_value", context);
		scale_real_value.focusout(function () {
			SharedData.setter(data.exports_to + "_scale_real_value", scale_real_value.val(), pageNumber);
		});
	}

	// Origin button listeners
	if (data.change_origin) {
		var OriginToggleButton = $("#origin_toggle_button", context);
		
		var origin_dragging = false;

		OriginToggleButton.click(function (event) {
			if (!origin_active) { // show origin controls
				origin_active = true;
				SharedData.setter(data.exports_to + "_origin_active", true, pageNumber);
				removeCanvasClickListeners();
				setupOriginClickListeners();
				var origin_x = SharedData.getter(data.exports_to + "_origin_x");
				var origin_y = SharedData.getter(data.exports_to + "_origin_y");
				if (typeof origin_x === "undefined" && typeof origin_y === "undefined") {
					// Set origin at 0,0 if it's not set already
					SharedData.setter(data.exports_to + "_origin_x", 0, pageNumber);
					SharedData.setter(data.exports_to + "_origin_y", 0, pageNumber);
				}
				CEControl.tracker.drawClear();
				CEControl.tracker.redraw();
			} else { // hide origin controls
				origin_active = false;
				SharedData.setter(data.exports_to + "_origin_active", false, pageNumber);
				removeCanvasClickListeners();
				setupCanvasClickListeners();
				CEControl.tracker.drawClear();
				CEControl.tracker.redraw();
			}
			
		});
	}

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
		}
	};

	// Page flip listener to fill in data
	VignetteController.addPageFlipListener(function (event) {
		// Have the scrub bar handle a page flip
		scrubBar.onPageFlip( event );
	
		if (event.type === "flip") {
			CEControl.clearError();
		} else if (event.type === "load") {
			sizeImages();
			colorData = SharedData.getter(data.exports_to + "_rgb") ? SharedData.getter(data.exports_to + "_rgb")[0] : [];
			updateFrame();
		
			AnalysisMessage.hide();

			// Set the tracker's colors to the ones defined in the JSON for this
			// widget, using default values if they are not set
			CEControl.tracker.normalColor  = data.color || "black";
			CEControl.tracker.currentColor = data.click_color || "pink";
			CEControl.tracker.warningColor = data.error_color || "yellow";
			
			// Set the size of the plotted points if changed in the JSON
			CEControl.tracker.drawSize = data.point_size || 1.5;
			
			// Set the size of the line width if changed in the JSON
			CEControl.tracker.lineWidth = data.line_width || 1.5;
			
			// Set the size of the horizontal line length if changed in the JSON
			CEControl.tracker.horizLineLength = data.horiz_line_length || 50;
			
			CEControl.onUpdate();

			// Load scale controls if they're set in shared data
			if (data.scale_data) {
				var scale_factor = SharedData.getter(data.exports_to + "_scale_factor");
				if (scale_factor) {
					$("#scale_factor_value").val(Number(scale_factor).toFixed(2));
				}
				$("#scale_real_value").val(SharedData.getter(data.exports_to + "_scale_real_value"));
			}
			
			window.setTimeout( resizeCanvas, 40 );
		}
		return true;
	});
	VignetteController.addResizeFunction(function () {
		scrubBar.onPageResize();
		window.setTimeout( resizeCanvas, 40 );
	});

	Reporter.addWidgetReporter( function() {
		var oldData = Reporter.getWidgetReportData(pageNumber, data.id);
		var coordinateData = typeof SharedData.getter(data.exports_to) !== "undefined" && SharedData.getter(data.exports_to).length > 0 ?
			SharedData.getter(data.exports_to)
			: "No data collected";
		
		var reportedColorData = "No data collected";
		if(colorData.length > 0) {
			for(var i = 0; i < colorData.length; i++) {
				if(typeof colorData[i] !== "undefined" && colorData[i].length > 0) {
					reportedColorData = colorData;
					break;
				}
			}	
		}
		
		if(typeof oldData !== "undefined") {
			return {
				clicks: oldData.clicks + clicks,
				mouse_coordinates: coordinateData,
				color_data: reportedColorData
			};
		} else {
			return {
				clicks: clicks,
				mouse_coordinates: coordinateData,
				color_data: reportedColorData
			};
		}
	}, pageNumber, data.id );

	// Hover event handler

	TheCanvas.mousemove(function (event) {
		var coords = TheCanvas[0].relMouseCoords(event);
		CEControl.hover(coords.x, coords.y);
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/x-y-analysis", callback);
};
