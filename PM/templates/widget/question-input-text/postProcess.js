
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	// Once the user has submitted an answer, indicate & export
	function attemptSubmit() {
		SharedData.setter(data.exports_to, $('.answer_text', context).val().trim(), pageNumber);
			
		// Check if the user has input an answer before moving forward
		var answeredQuestion = $('.answer_text', context).val().trim() !== '';
		
		if (answeredQuestion) {
			container.removeClass("error");
			container.addClass("completed");
		} else {
			container.addClass("error");
			container.removeClass("completed");
		}
		
		return answeredQuestion;
	};
	
	// Submit the answer if the user presses the enter key while
	// the text field is focused
	$('form', context).submit(function (event) {
		/**
		 * Uncomment if you want the Enter key to also submit the form
		var submitResult = attemptSubmit();
		
		// Force page flip if an answer was typed and the user
		// pressed the Enter key instead of clicking "Next Page"
		if (submitResult === true) {
			VignetteController.nextPage();
		}
		*/
		
		// Prevent submission of form from redirecting and refreshing the page
		return false;
	});

	VignetteController.addPageFlipListener(function (event) {
		
		if (event.type === "flip") {
			if (event.direction === "forward") {
				var submitResult = attemptSubmit();
				return submitResult;
			}
		}

		// And ignore other events
		return true;
	});

	Reporter.addWidgetReporter( function() {
		var answer = typeof SharedData.getter(data.exports_to) !== "undefined" && SharedData.getter(data.exports_to).length > 0
					 ? SharedData.getter(data.exports_to)[0]
					 : "No answer typed";
		return {
			text_answer: answer
		};
	}, pageNumber, data.id );

	// If this question has been answered before but it is now being reloaded,
	// put the previous answer from SharedData back into the input text field
	var currentAnswer = SharedData.getter(data.exports_to)[0];
	if (typeof currentAnswer !== "undefined") {
		// Set the input text field to the previous answer
		$('.answer_text', context).val(currentAnswer);
		// Mark the question as completed
		container.addClass("completed");
	}
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/question-input-text", callback);
};
