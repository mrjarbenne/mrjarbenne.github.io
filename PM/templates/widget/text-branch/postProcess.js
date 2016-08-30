
var callback = function (context, data, pageNumber) {
	var widgetClicks = 0;
	var container = $("#" + data.id, context);
	var selectedAnswer = "";

	// Once the user has submitted an answer, indicate & export
	function attemptSubmit() {
		var selectedAnswer = $('#text-branch-input', context).val();
		SharedData.setter(data.exports_to, selectedAnswer, pageNumber);
			
		// Check if the user has input an answer before moving forward
		if (selectedAnswer !== "") {
			container.removeClass("error");
			container.addClass("completed");
		} else {
			container.addClass("error");
			container.removeClass("completed");
		}
		
		return selectedAnswer !== "";
	}
	
	container.click(function (event) {
		widgetClicks++;
	});
	
	// Once the user has entered an answer, indicate & export
	var TextBranchInput = $("#text-branch-input", context);
	TextBranchInput.focusout(function () {
		var inputVal = TextBranchInput.val();
		if (inputVal !== "") {
			container.addClass("completed");
			if (data.input_mode === "number") {
				inputVal = parseFloat(inputVal);
				inputIndex = data.input_options.map(s => parseFloat(s)).indexOf(inputVal);
			} else {

				if (data.case_sensitive === "No") {
					var newArray = data.input_options.toString().toLowerCase().split(",");
					var inputLower = inputVal.toLowerCase();
					inputIndex = newArray.indexOf(inputLower);
				}
				else{
					inputIndex = data.input_options.indexOf(inputVal);
				}

			}
			if (inputIndex === -1) {
				// Input doesn't match any input option, use default branch (last value
				// in next_page in index.json)
				inputIndex = data.input_options.length;
			}
			SharedData.setter(data.exports_to, inputVal, pageNumber);
			VignetteController.setTargetBranch(inputIndex);
			VignetteController.setPageNode(data.exports_to);
		}
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
		} else if(event.type === "load") {
			widgetClicks = 0;
			updateTargetBranch();
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
		var answer = typeof SharedData.getter(data.exports_to) !== "undefined" && SharedData.getter(data.exports_to).length > 0 ?
			SharedData.getter(data.exports_to)[0]
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

	//Used to set the target branch properly when the page is loaded
	var updateTargetBranch = function () {
		// If this question has been answered before but it is now being reloaded,
		// reselect the old answer choice from SharedData
		var currentAnswer = SharedData.getter(data.exports_to);
		if (typeof currentAnswer !== "undefined") {
			// Get the radio button for the user's old answer choice and check it
			$('#text-branch-input', context).val(currentAnswer);

			var currentAnswerIndex;
			if (data.input_mode === "number") {
				currentAnswer = parseFloat(currentAnswer);
				currentAnswerIndex = data.input_options.map(s => parseFloat(s)).indexOf(currentAnswer);
			} else {
				var currentAnswerIndex = data.input_options.indexOf(currentAnswer);
			}
			if (currentAnswerIndex === -1) {
				// Input doesn't match any input option, use default branch (last value
				// in next_page in index.json)
				currentAnswerIndex = data.input_options.length;
			}
			//set target branch
			SharedData.setter(data.exports_to, currentAnswer, pageNumber);
			VignetteController.setTargetBranch(currentAnswerIndex);
			VignetteController.setPageNode(data.exports_to);
			
			// Mark the question as completed
			container.addClass("completed");
		}
	};
	
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/text-branch", callback);
};
