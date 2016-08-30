
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);

	// Updates the widget's text based on the user's answer to the associated
	// question
	var updateAnswer = function () {
		// CONSTANTS
		// References to strings in the corresponding widget's JSON that
		// will be replaced by the correct answer or the user's answer
		var CORRECT_ANS_REPLACEMENT_STRING = "\\ans";
		var ALL_CORRECT_ANS_REPLACEMENT_STRING = "\\all";
		var USER_ANS_REPLACEMENT_STRING = "\\in";
		
		container.html("");
		
		// Get the answer chosen by the user
		var userAnswer = SharedData.getter(data.imports_from)[0].trim().truncate(5000, true);
		
		// Get all the acceptable answers
		var correctAnswers = data.correct.slice();
		for( var i = 0; i < correctAnswers.length; i++ ) {
			correctAnswers[i] = correctAnswers[i].trim();
		}
		
		// If not looking for an exact answer and both answers are numbers,
		// adjust the values. Allows for user input to be accepted for cases
		// such as the correct answer being 0.5 and the user types .5
		if( data.exact_value !== false ) {
			if( isNaN(userAnswer) !== true ) {
				userAnswer = parseFloat(userAnswer);
			}
			
			for( var i = 0; i < correctAnswers.length; i++ ) {
				if( isNaN(correctAnswers[i]) !== true ) {
					correctAnswers[i] = parseFloat(correctAnswers[i]);
				}
			}
		}
		
		// The answer that the user selected from the acceptable answers
		// (if any)
		// The default selected answer is the first acceptable answer in the list
		var selectedAnswer = correctAnswers[0];
		
		// Create the display text based on the user's input
		var displayText = "";
		
		// If there is a default display answer, show that instead
		// of a correct or incorrect response to the user's answer
		if( typeof data.response.default !== "undefined" ) {
			displayText = data.response.default;
		} else {
			// Adjust input based on case-sensitivity
			// Assume input is incorrect until proven otherwise
			var correctInput = false;
			
			for( var i = 0; i < correctAnswers.length; i++ ) {
				if( data.case_sensitive === true || data.exact_value === true ) {
					correctInput = userAnswer.valueOf() === correctAnswers[i].valueOf();
				} else {
					userAnswer += "";
					correctAnswers[i] += "";
					correctInput = userAnswer.toLowerCase().valueOf() === correctAnswers[i].toLowerCase().valueOf();
				}
				
				if( correctInput === true ) {
					selectedAnswer = correctAnswers[i];
					break;
				}
			}
		
			// Select the correct display text based on the user's
			// input
			if( correctInput ) {
				displayText = data.response.correct;
			} else {
				displayText = data.response.incorrect;
			}
		}
		
		// Create a string that shows all answers to replace in the
		// display text (if required)
		var allAnswers = "";
		if( correctAnswers.length <= 2 ) {
			allAnswers = correctAnswers.join(" and ");
		} else {
			allAnswers = correctAnswers.join(", ");
			allAnswers = allAnswers.substring( 0, allAnswers.lastIndexOf(",") ) + ", and" +
						 allAnswers.substring( allAnswers.lastIndexOf(",") + 1, allAnswers.length );
		}
		
		// Replace the references with the actual values
		displayText = displayText.replace(CORRECT_ANS_REPLACEMENT_STRING, selectedAnswer);
		displayText = displayText.replace(ALL_CORRECT_ANS_REPLACEMENT_STRING, allAnswers);
		displayText = displayText.replace(USER_ANS_REPLACEMENT_STRING, userAnswer);
		
		container.append("<p class=\"ans_paragraph\">" + displayText + "</p>");
	};

	// Update the displayed answer when a page flip occurs
	VignetteController.addPageFlipListener(function (event) {
		// Update the answer
		updateAnswer();

		// And ignore other events
		return true;
	});

	// Update the displayed answer initially
	updateAnswer();

	// Display the newest value from SharedData using the old listener
	//SharedData.addListener(data.imports_from, updateAnswer);

	// Uncomment this if the answer needs to be force updated every second
	//setInterval(updateAnswer(), 1000);
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/answer-input-text", callback);
};
