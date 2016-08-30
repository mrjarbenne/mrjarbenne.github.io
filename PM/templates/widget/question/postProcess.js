
var callback = function (context, data, pageNumber) {
	var widgetClicks = 0;

	var container = $("#" + data.id, context);
	var selectedAnswer = -1;

	// Once the user has submitted an answer, indicate & export
	function attemptSubmit() {
		var selectedAnswer = $('.question_answer_button:checked', context).prop('title');
		SharedData.setter(data.exports_to, selectedAnswer, pageNumber);
			
		// Check if the user has input an answer before moving forward
		if (selectedAnswer >= 0) {
			container.removeClass("error");
			container.addClass("completed");
		} else {
			container.addClass("error");
			container.removeClass("completed");
		}
		
		return selectedAnswer >= 0;
	};
	
	container.click(function (event) {
		widgetClicks++;
	});

	// Once the user has selected an answer, indicate & export
	$('.question_answer_button', context).click(function (event) {
		container.addClass("completed");
		SharedData.setter(data.exports_to, event.target.title, pageNumber);
	});
	
	$('label', context).click( function(event) {
		// 'Cause we get hacked 'round here
		widgetClicks--;
	});

	VignetteController.addPageFlipListener(function (event) {
		// Check answers before moving forward
		if (event.type === "flip") {
			if (event.direction === "forward") {
				var submitResult = attemptSubmit();
				return submitResult;
			}
		} else if( event.type === "load" ) {
			widgetClicks = 0;
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
		var oldData = Reporter.getWidgetReportData(pageNumber, data.id);
		var answer = typeof SharedData.getter(data.exports_to) !== "undefined" && SharedData.getter(data.exports_to).length > 0
					 ? SharedData.getter(data.exports_to)[0]
					 : "No answer selected";
		
		if(typeof oldData !== "undefined") {
			return {
				clicks: oldData.clicks + widgetClicks,
				answer: answer
			};
		} else {
			return {
				clicks: widgetClicks,
				answer: answer
			};
		}
	}, pageNumber, data.id );

	// If this question has been answered before but it is now being reloaded,
	// reselect the old answer choice from SharedData
	var currentAnswer = SharedData.getter(data.exports_to);
	if (typeof currentAnswer !== "undefined" && !isNaN(currentAnswer) && currentAnswer >= 0) {
		// Get the radio button for the user's old answer choice and check it
		$('.question_answer_button[title='+currentAnswer+']', context).attr('checked', 'checked');
		// Mark the question as completed
		container.addClass("completed");
	}
	
	// Randomize order of the questions if randomize option is set
	if (data.randomize) {
		VignetteController.randomizeQuestions(context, data, pageNumber);
	}
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/question", callback);
};
