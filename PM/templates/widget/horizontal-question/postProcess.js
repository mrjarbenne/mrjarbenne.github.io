
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);

	// Once the user has selected an answer, indicate & export
	$('.question_answer_button', context).click(function (event) {
		container.addClass("completed");
		SharedData.setter(data.exports_to, event.target.title, pageNumber);
	});

	VignetteController.addPageFlipListener(function (event) {
		// Check answers before moving forward
		if (event.type === "flip") {
			if (event.direction === "forward") {
				var isCompleted = container.hasClass("completed");
				if (isCompleted) {
					container.removeClass("error");
				} else {
					container.addClass("error");
				}
				return isCompleted;
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

	// If this question has been answered before but it is now being reloaded,
	// reselect the old answer choice from SharedData
	var currentAnswer = SharedData.getter(data.exports_to);
	if (currentAnswer !== undefined) {
		// Get the radio button for the user's old answer choice and check it
		$('.question_answer_button', context).eq(currentAnswer).attr('checked', 'checked');
		// Mark the question as completed
		container.addClass("completed");
	}
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/horizontal-question", callback);
};
