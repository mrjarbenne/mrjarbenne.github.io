
var callback = function (context, data, pageNumber) {


	VignetteController.addPageFlipListener(function (event) {

		var targetPage = $('#dropdown_branching :selected', context).val();
		
		VignetteController.setTargetBranch(targetPage);
		VignetteController.setPageNode(data.exports_to);


		//send the value that were checked to the shared data
		SharedData.setter(data.exports_to, targetPage, pageNumber);
		

		// And ignore other events
		return true;
	});

	// If this question has been answered before but it is now being reloaded,
	// reselect the old answer choice(s) from SharedData
	var currentAnswer = SharedData.getter(data.exports_to);
	if (typeof currentAnswer !== "undefined") {
		$("#dropdown_branching").val(currentAnswer);
	}	
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/dropdown-branch", callback);
};
