
var callback = function (context, data, pageNumber) {

	var container = $("#" + data.id, context);

	var endDate;
	var DATE_REPLACE_STRING = "\\date";
	var HOURS_REPLACE_STRING = "\\hours";
	var MINUTES_REPLACE_STRING = "\\minutes";
	var SECONDS_REPLACE_STRING = "\\seconds";
	var MILLI_REPLACE_STRING = "\\milliseconds";
	var START_REPLACE_STRING = "\\startTime";
	var END_REPLACE_STRING = "\\endTime";
	

	var displayText = "";


	function getImports() {
		var imports = [];
		$.each(data.fields, function (index, field) {
			var labelParts = field.label.split("\.");
			var importName = labelParts[0];
			imports.push(importName);
		});
		return imports;
	}

	function updateTimeLabels(imports_from) {
		var startDate = SharedData.getter(imports_from + "-time");
        if (typeof startDate === "undefined") {
        	return; // next imports_from
        }
        startDate = startDate[0];
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

		var startTimeString = startDate.getHours() + ":" + startDate.getMinutes() + ":" + startDate.getSeconds() + ":" + startDate.getMilliseconds();
		var endTimeString = endDate.getHours() + ":" + endDate.getMinutes() + ":" + endDate.getSeconds() + ":" + endDate.getMilliseconds();

		// Replace the references with the actual values
		displayText = displayText.replace(HOURS_REPLACE_STRING, elapsedTimeHours);
		displayText = displayText.replace(MINUTES_REPLACE_STRING, elapsedTimeMinutes);
		displayText = displayText.replace(SECONDS_REPLACE_STRING, elapsedTimeSeconds);
		displayText = displayText.replace(MILLI_REPLACE_STRING, elapsedTimeMilliseconds);
		displayText = displayText.replace(START_REPLACE_STRING, startTimeString);
		displayText = displayText.replace(END_REPLACE_STRING, endTimeString);
		displayText = displayText.replace(DATE_REPLACE_STRING, dateNow);
	}

	// Updates the widget's text based on the user's answer to the associated
	// question
	function updateValues() {
	    container.empty();
    	displayText = "<div class='userInput'>";
	    // If there is a default message show it.. there should be
	    $.get("resources/Text/" + data.id + ".html", function (text) {
	        displayText += text;
	    });
	    displayText += "</div>";
    	$.each(list_imports_from, function(index, imports_from) {
			// If nothing has been set in SharedData for this import
			// yet, remove the labels and continue to next import
			if (!SharedData.checkHasData(imports_from)) {
				blankLabels(imports_from);
				return;
			}
	        var labelData = SharedData.getter(imports_from)[0];
	        // labelData is an array of objects, each containing info about a label
	        // [ { label: "label1",
	    	//     type: "radio",
	    	//	   value: "value1" }, ... ]
	    	
	    	var labelDataReplaceStrings = [];
	        $.each(labelData, function (index, field) {
	            labelDataReplaceStrings.push("\\" + imports_from + "." + field.label);
	        });
	        $.each(labelDataReplaceStrings, function (index, value) {
	            displayText = displayText.replace(value, labelData[index].value);
	        });
    	
        updateTimeLabels(imports_from);
		});


		container.append(displayText);
		
	}

	function updateValuesOld() {
		container.empty();
    	displayText = "<div class='userInput'>";
	    // If there is a default message show it.. there should be
	    $.get("resources/Text/" + data.id + ".html", function (text) {
	        displayText += text;
	    });
	    displayText += "</div>";
	    if (!SharedData.checkHasData(data.imports_from)) {
	    	blankLabelsOld();
	    	return;
	    }
	    var userData = SharedData.getter(data.imports_from)[0];
	    var userDataReplaceStrings = [];
        $.each(userData, function (index, obj) {
            userDataReplaceStrings[index] = "\\" + obj.label;
        });
        $.each(userDataReplaceStrings, function (index, value) {
            displayText = displayText.replace(value, userData[index].value);
        });
        updateTimeLabels(data.imports_from);
        container.append(displayText);
	}

	var blankLabels = function(imports_from) {
		var replaceStrings = [];
		$.each(data.fields, function (index, field) {
			var labelImport = field.label.split("\.")[0];
			if (labelImport == imports_from) {
				replaceStrings.push("\\" + field.label);
			}
        });
        $.each(replaceStrings, function (index, value) {
            displayText = displayText.replace(value, "");
        });
	};

	function blankLabelsOld() {
		var userDataReplaceStrings = [];
		$.each(data.fields, function (index, field) {
            userDataReplaceStrings[index] = "\\" + field.label;
        });
        $.each(userDataReplaceStrings, function (index, value) {
            displayText = displayText.replace(value, "");
        });
	}

	VignetteController.addPageFlipListener(function (event) {
		// Hide previous page if desired
		if( VignetteController.currentPage === pageNumber ) {
			if( data.prevent_back === true ) {
				$("#pagenav .left").hide();
			}
		}

		if(typeof SharedData.getter(data.id + "-end-time") === "undefined") {
			endDate = new Date();
			SharedData.setter(data.id + "-end-time", endDate, pageNumber);
		} else { 
			endDate = SharedData.getter(data.id + "-end-time")[0];
		}
		if (data.old_label_system) {
			updateValuesOld();
		} else {
			updateValues();
		}
	    

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

	if (data.old_label_system) {
		updateValuesOld();
		SharedData.addListener(data.imports_from, function () { updateValuesOld(); }, pageNumber);
	} else {
		var list_imports_from = getImports();
		updateValues();
		// add shared data listener to each imports_from
		$.each(list_imports_from, function(index, imports_from) {
			SharedData.addListener(imports_from, function () { updateValues(); }, pageNumber);
		});
	}
	

};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/show-enhanced-text", callback);
};
