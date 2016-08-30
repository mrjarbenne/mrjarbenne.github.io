
var callback = function (context, data, pageNumber) {
	var widgetClicks = 0;

	var container = $("#" + data.id, context);
	
	container.click(function (event) {
		widgetClicks++;
	});
	

	$('label', context).click( function(event) {
		// 'Cause we get hacked 'round here
		widgetClicks--;
	});

	VignetteController.addPageFlipListener(function (event) {
		var boxes = [];
		var selected = [];
		container.find( '.question_answer_button' ).each( function(index,element)
		{
			if(element.checked) {
				boxes.push(element.value);
				selected.push(element.title);
			}
		});
		if (data.is_branched){
			var targetPage;
			$.each(data.combinations, function(index, comb) {
				if (selected.sort().toString() === comb.sort().toString()) {
					targetPage = index;
					return false;
				}
			});
			if (typeof targetPage === "undefined") {
				targetPage = data.combinations.length;
			}
			VignetteController.setTargetBranch(targetPage);
			VignetteController.setPageNode(data.exports_to);
		}


		container.addClass("completed");
		//send the boxes that were checked to the shared data
		SharedData.setter(data.exports_to, boxes, pageNumber);

		// Check answers before moving forward
		if (event.type === "flip") {
		//Check if any of the boxes are checked, if so then they may proceed, if not then alert them that at least one answer must be selected
			completed = false;
			container.find( '.question_answer_button' ).each( function(index,element)
			{
				if(element.checked) {
					completed = true;
				}
				else {
					completed = false;
				}
				if(completed) {
					return false;
				}
			});
			if (completed) {
				container.addClass("completed"); 
			}
			else {
				container.removeClass("completed");
			}
			
			
			if (event.direction === "forward") {
				var isCompleted = container.hasClass("completed");
				if (isCompleted) {
					container.removeClass("error");
				} else {
					container.addClass("error");
				}
				return isCompleted;
			}
		
		} else if(event.type === "load") {
			widgetClicks = 0;
		}

		// And ignore other events
		return true;
	});
	
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
	// reselect the old answer choice(s) from SharedData
	var currentAnswer = SharedData.getter(data.exports_to);
	if (typeof currentAnswer !== "undefined") {
		// For each check box set its value correctly
		for (var i = 0; i < currentAnswer[0].length; i++) {
			container.find( '.question_answer_button' )[currentAnswer[0][i]].checked = true;
		}
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
	Registry.register("widget/question-checkbox", callback);
};
