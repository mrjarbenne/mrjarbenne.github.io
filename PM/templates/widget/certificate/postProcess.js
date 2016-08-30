
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	//Do the time
	var endDate;
	
	
	//Set Up replacement string variables
	var DATE_REPLACE_STRING = "\\date";
	var HOURS_REPLACE_STRING = "\\hours";
	var MINUTES_REPLACE_STRING = "\\minutes";
	var SECONDS_REPLACE_STRING = "\\seconds";
	var MILLI_REPLACE_STRING = "\\milliseconds";
	var START_REPLACE_STRING = "\\startTime";
	var END_REPLACE_STRING = "\\endTime";
	var userDataReplaceStrings = [];
	// Updates the widget's text based on the user's answer to the associated
	// question
	var updateCertificate = function () {
		//calculate total time
		var startDate = SharedData.getter(data.imports_from + "-time")[0];
		var startTime = startDate.getTime();
		var endTime = endDate.getTime();
		var elapsedTime = endTime - startTime;
		//Hours
		var elapsedTimeHours = Math.floor(elapsedTime/3600000);
		elapsedTime -= (elapsedTimeHours * 3600000);
		//Minutes
		var elapsedTimeMinutes = Math.floor(elapsedTime/60000);
		elapsedTime -= (elapsedTimeMinutes * 60000);
		//Seconds
		var elapsedTimeSeconds = Math.floor((elapsedTime)/1000);
		elapsedTime -= (elapsedTimeSeconds * 1000);
		//milliseconds
		var elapsedTimeMilliseconds = elapsedTime;
		//Get the Date
		var date = new Date();
		var dateNow = (date.getMonth() +1) + "/" + date.getDate() + "/" + date.getFullYear();
		// CONSTANTS
		container.html("");
		
		var startTimeString = startDate.getHours() + ":" + startDate.getMinutes() + ":" + startDate.getSeconds() + ":" + startDate.getMilliseconds();
		var endTimeString = endDate.getHours() + ":" + endDate.getMinutes() + ":" + endDate.getSeconds() + ":" + endDate.getMilliseconds();
		
		// Get the answer chosen by the user
		var userData = SharedData.getter(data.imports_from)[0];
		
		// Create the display text based on the user's input
		var displayText = "";
		
		// If there is a default message show it.. there should be
		$.get("resources/Text/" + data.id + ".html", function(text) {
			displayText = text;
		});
		displayText += "<div class='userInput'>";
		$.each(userData, function(index, obj) {
			userDataReplaceStrings[index] = "\\" + obj.label;
		});
		displayText += "</div>";
		
		// Replace the references with the actual values
		displayText = displayText.replace(HOURS_REPLACE_STRING, elapsedTimeHours);
		displayText = displayText.replace(MINUTES_REPLACE_STRING, elapsedTimeMinutes);
		displayText = displayText.replace(SECONDS_REPLACE_STRING, elapsedTimeSeconds);
		displayText = displayText.replace(MILLI_REPLACE_STRING, elapsedTimeMilliseconds);
		displayText = displayText.replace(START_REPLACE_STRING, startTimeString);
		displayText = displayText.replace(END_REPLACE_STRING, endTimeString);
		
		displayText = displayText.replace(DATE_REPLACE_STRING, dateNow);
		$.each(userDataReplaceStrings, function(index, value) {
			displayText = displayText.replace(value, userData[index].value);
		});
		
		container.append(displayText);
		
		// Hide previous page if desired
		if( VignetteController.currentPage === pageNumber ) {
			if( data.prevent_back === true ) {
				$("#pagenav .left").hide();
			}
		}
	};

	VignetteController.addPageFlipListener(function (event) {
		if(typeof SharedData.getter(data.id + "-end-time") === "undefined") {
		endDate = new Date();
		
		SharedData.setter(data.id + "-end-time", endDate, pageNumber);
		} else { 
			endDate = SharedData.getter(data.id + "-end-time")[0];
		}
		
		// Update the answer
		updateCertificate();
		if (event.type === "flip") {
			if (event.direction === "forward") {
				// Show previous page link
				if( VignetteController.currentPage === pageNumber ) {
					if( data.prevent_back === true ) {
						$("#pagenav .left").show();
					}
				}
			}
		}
		

		// And ignore other events
		return true;
	});
	

};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/certificate", callback);
};
