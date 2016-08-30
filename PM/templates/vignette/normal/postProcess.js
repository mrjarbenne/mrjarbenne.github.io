
var callback = function (context, data, pageNumber) {

	// Set up resize functionality
	VignetteController.addResizeFunction(function () {
		// Obtain window measurements
		var currWidth = $(this).width();
		// Calculate height available to actual vignette,
		// subtracting space taken by header and footer
		var currHeight = $(this).height() - 100;
		// Obtain the aspect ratio from JSON
		var aspect_ratio = data.aspect_ratio;
		// Initialize variables
		var newWidth = currWidth;
		var newHeight = currHeight;
		if (currWidth / currHeight > aspect_ratio) {
			newWidth = newHeight * aspect_ratio;
		} else if (currWidth / currHeight < aspect_ratio) {
			newHeight = newWidth * (1 / aspect_ratio);
		}
		// Adhere to max width and height
		if (typeof data.max_height !== "undefined") {
			if (newHeight > data.max_height) {
				newHeight = data.max_height;
				newWidth = newHeight * aspect_ratio;
			}
		}
		if (typeof data.max_width !== "undefined") {
			if (newWidth > data.max_width) {
				newWidth = data.max_width;
				newHeight = newWidth * (1 / aspect_ratio);
			}
		}
		// Adhere to min width and height
		if (typeof data.min_height !== "undefined") {
			if (newHeight < data.min_height) {
				newHeight = data.min_height;
				newWidth = newHeight * aspect_ratio;
			}
		}
		if (typeof data.min_width !== "undefined") {
			if (newWidth < data.min_width) {
				newWidth = data.min_width;
				newHeight = newWidth * (1 / aspect_ratio);
			}
		}
		// Set the new width and height on the containers
		// Page Container (smaller than vignette due to header and footer)
		$("#page-container", context).width(newWidth);
		$("#page-container", context).height(newHeight);
		// Whole Vignette
		$(context).width(newWidth);
		$(context).height(newHeight + 100);
	});

	// Set up page navigation
	var pageNumberContainer = $("#pagenav .middle", context);
	VignetteController.pageStringElements.push(pageNumberContainer);
	// Activate credits button
	$("#pagenav .credits", context).click(function (event) {
	    VignetteController.targetBranch = 1;
		VignetteController.nextPage(event, true);
	});
	// Activate next button
	$("#pagenav .right", context).click(function (event) {
		VignetteController.nextPage(event, true);
	});
	// Activate prev button
	$("#pagenav .left", context).click(function (event) {
		if( VignetteController.currentPage > 0 )
		{
			VignetteController.prevPage(event, true);
			if( VignetteController.currentPage === 0) {
				$("#pagenav .left", context).hide();
			}
		} 
			
	});
	$("#pagenav .left", context).hide();
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("vignette/normal", callback);
};
