
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);

	// Updates the widget's text based on the user's answer to the associated
	// question
	var updateAnswer = function () {
		// Get the answer chosen by the user
		var answer = SharedData.getter(data.imports_from);

		// Update the view for this widget
		container.html("");
		var lines = data.answers[answer].split("\n");
		var imgFile = data.sources[answer];
		var imgPath = data.resource_url;
		$(lines).each(function (index, line) {
			container.append("<p class=\"ans_paragraph\">" + line + "</p>");
		});
		container.append("<img class=\"ans_img\" src=" + imgPath + "/" + imgFile + ">");
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
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/answer-image", callback);
};
