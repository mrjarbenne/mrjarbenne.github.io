var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	var sliderValues = []; //% of each slider
	var branchValues = [];
	
	//Set up event handlers for each slider separately
	$.each(data.sliders, function(index, sliderData) {
		//Slider
		var slider = $('.slider-' + index, context);
		//Marker
		var marker = $('.slider-' + index + ' > .slider_marker', context);
		sliderValues[index] = 0;
		//boolean for sliding mouse
		var mouseDown = false;
		//If the mouse is down save that info
		slider.mousedown(function (event) {
			mouseDown = true;
		});
		
		//On mose move adjust slider if mouse is down
		slider.mousemove(function (event) {
			if(mouseDown) {
				var newSliderPercentage;
				//Get the loctaion of the mouse on the slider and update slider values accordingly 
				if(data.orientation !== "vertical") {
					newSliderPercentage = event.offsetX / slider.width() || 
										(event.clientX - $(event.target).offset().left) /slider.width();//This is for firefox
					
				} else {
					newSliderPercentage = 1 - event.offsetY / slider.height() || 
										1 - (event.clientY - $(event.target).offset().top) /slider.height();//This is for firefox
				}
				if( newSliderPercentage > 1) {
					newSliderPercentage = 1;
				}
				
				sliderValues[index] = newSliderPercentage;
				//Update the slider information
				updateSliderLocation( index, newSliderPercentage, slider, sliderData );
				  
			    // Prevent user from being able to highlight elements
			    // in the browser as he drags the mouse to scrub
			    if( event.stopPropagation ) event.stopPropagation();
			    if( event.preventDefault ) event.preventDefault();
			    event.cancelBubble = true;
			    event.returnValue = false;
			    return false;
			}
			
		});
		
		//On mouse up set the slider information(this handles clicks)
		slider.mouseup(function (event) {
			if(mouseDown) {
				var newSliderPercentage;
				//Get the loctaion of the mouse on the slider and update slider values accordingly 
				if(data.orientation !== "vertical") {
					newSliderPercentage = event.offsetX / slider.width() || 
										(event.clientX - $(event.target).offset().left) /slider.width();//This is for firefox
				} else {
					newSliderPercentage = 1- event.offsetY / slider.height() || 
										1 - (event.clientY - $(event.target).offset().top) /slider.height();//This is for firefox
				}
				if( newSliderPercentage > 1) {
					newSliderPercentage = 1;
				}
				sliderValues[index] = newSliderPercentage;
				//Update Slider information
				updateSliderLocation( index, newSliderPercentage, slider, sliderData );
			}
			//Reset Mousedown
			mouseDown = false;
		});
		
		//Prevent the marker from altering slider data
		marker.mousemove(function (event) {
			event.stopPropagation();
			  
		    // Prevent user from being able to highlight elements
		    // in the browser as he drags the mouse to scrub
		    if( event.stopPropagation ) event.stopPropagation();
		    if( event.preventDefault ) event.preventDefault();
		    event.cancelBubble = true;
		    event.returnValue = false;
		    return false;
		});
		//Maker sure mousedown is reset always
		marker.mouseup(function (event) {
			mouseDown = false;
		});
	});
	
	//Calculates the chosen branch based on the information from the sliders
	var calculateChosenBranch = function() {
		//Get the branch equation from the JSON
		var branchEquation = data.branch_equation;
		//Replace strings with proper data from the sliders
		$.each(data.sliders, function(index, sliderData) {
			var replaceString = "slider-" + index;
			branchEquation = branchEquation.replace( replaceString, "branchValues[" + index + "]" );
		});
		var chosenBranch = 0;
		var equationVal = Math.round( eval( branchEquation ) );
		if( isNaN( equationVal ) ) { equationVal = 0; }
		chosenBranch += equationVal;

		//Return the branch data(MUST BE INTEGER)
		if(chosenBranch > data.branches -1) {
			return data.branches -1;
		} else {
			return chosenBranch;
		}
	};
	
	//Updateds the position of the slider based on the percentage passed in
	var updateSliderLocation = function( index, sliderPercent, slider, sliderData ) {
		var rangeVal = sliderData.range[1] - sliderData.range[0];
		var sliderVal = sliderPercent * rangeVal;
		sliderVal += sliderData.range[0];
		
		
		var snapIndex = 0;
		var snapDistance = Math.abs(sliderData.snap_locations[0] - sliderVal);
		
		for( var i = 1; i < sliderData.snap_locations.length; i++ ) {
			var currentDistance = Math.abs( sliderData.snap_locations[i] - sliderVal );
			if(  currentDistance < snapDistance ) {
				snapIndex = i;
				snapDistance = currentDistance;
			}
		}
		
		branchValues[index] = snapIndex;
		
		$('.slider-' + index +'-value', context).html(sliderData.snap_locations[snapIndex] + " "+sliderData.units);
		
		var newSliderPercentage = ( sliderData.snap_locations[snapIndex] - sliderData.range[0] ) / rangeVal;
	
		var marker = $(".slider_marker", slider);
		
		if(data.orientation !== "vertical") {
			var sliderWidth = slider.width();
			var markerWidth = marker.width();
			
			//Set the slider position adjusting for the marker
			if(newSliderPercentage < 1) {
				$(".left_slider", slider).width( sliderWidth * newSliderPercentage - markerWidth);
			} else {
				newSliderPercentage = 1;
				$(".left_slider", slider).width( sliderWidth * newSliderPercentage - (markerWidth + 1));
			}
		} else {
			var sliderHeight = slider.height();
			var markerHeight = marker.height();
			if(newSliderPercentage < 1) {
				$(".left_slider", slider).height( sliderHeight * (1 - newSliderPercentage) - markerHeight);
			} else {
				newSliderPercentage = 1;
				$(".left_slider", slider).height( sliderHeight * (1 - newSliderPercentage) - markerHeight);
			}
		}
		
		//Get chosen Branch
		var chosenBranch = calculateChosenBranch();
		if(isNaN(chosenBranch) || typeof chosenBranch === "undefined") {
			//Update Shared Data and Chosen Branch
			SharedData.setter(data.exports_to, 0, pageNumber);
			SharedData.setter(data.exports_to + '-slider_data', [[0,0], [0,0]], pageNumber);
			VignetteController.setTargetBranch(0);
			VignetteController.setPageNode(data.exports_to);
		} else {
			//Update Shared Data and Chosen Branch
			SharedData.setter(data.exports_to, chosenBranch, pageNumber);
			SharedData.setter(data.exports_to + '-slider_data', sliderValues, pageNumber);
			VignetteController.setTargetBranch(chosenBranch);
			VignetteController.setPageNode(data.exports_to);
		}
	};
	

	VignetteController.addPageFlipListener(function (event) {
		// Check answers before moving forward
		if (event.type === "flip") {
			if (event.direction === "forward") {
			

			}
		} else if(event.type === "load") {
			//On load set up slider Data
			if(typeof SharedData.getter(data.exports_to) !== "undefined") {
				//Load the sliderValues
				sliderValues = SharedData.getter(data.exports_to + '-slider_data')[0];
				$.each(data.sliders, function(index, sliderData) {
					var sliderLoad = $('.slider-'+ index, context);
					updateSliderLocation( index, sliderValues[index], sliderLoad, sliderData );
				});

			} else {
				$.each(data.sliders, function(index, sliderData) {
					$('.slider-' + index +'-value', context).html(0.0 + " " + data.sliders[index].units);
				});
			}
		}

		// And ignore other events
		return true;
	});

	// Setup reporting for questions
	//  Only exports a #
	/*VignetteController.addReportListener(function () {
		var result = {};
		if (typeof SharedData.getter(data.exports_to) !== "undefined") {
			result = Report.format(data, {
				answer: SharedData.getter(data.exports_to)[0]
			});
		}
		return result;
	});*/
	Reporter.addWidgetReporter( function() {
		var answer = typeof SharedData.getter(data.exports_to) !== "undefined" && SharedData.getter(data.exports_to).length > 0
					 ? SharedData.getter(data.exports_to)[0]
					 : "No answer selected";
		return {
			answer: answer
		};
	}, pageNumber, data.id );

	//Used to set the target branch properly when the page is loaded
	var updateTargetBranch = function () {
	
		// If this question has been answered before but it is now being reloaded,
		// reselect the old answer choice from SharedData
		var currentAnswer = parseInt(SharedData.getter(data.exports_to));
		if (typeof currentAnswer !== "undefined" && !isNaN(currentAnswer) && currentAnswer >= 0) {
			//set target branch
			SharedData.setter(data.exports_to, currentAnswer, pageNumber);
			VignetteController.setTargetBranch(currentAnswer);
			VignetteController.setPageNode(data.exports_to);
		}
	};
	
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/slider-branch", callback);
};
