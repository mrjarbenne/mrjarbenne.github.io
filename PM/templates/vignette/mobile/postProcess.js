var callback = function (context, data, pageNumber) {
	var totalWidgets;
	var currentWidget;
	var currentPageWidget = 0;
	var allWidgets = [];

	// Set up resize functionality
	VignetteController.addResizeFunction(function () {
		// Obtain window measurements
		// Calculate width available to actual vignette,
		// subtracting space taken by navigation buttons
		var currWidth = $(this).width() - 160;
		var currHeight = $(this).height();
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
		// Set the new width and height on the containers
		// Widget Container (smaller than vignette due to nav buttons)
		$("#widget-container", context).width(newWidth);
		$("#widget-container", context).height(newHeight);
		// Whole Vignette
		$(context).width(newWidth + 160);
		$(context).height(newHeight);
		// Fix widget counter
		$(".widgetnum", context)
			.height(currHeight - newHeight)
			.css('line-height', (currHeight - newHeight) + "px");
	});

	/* Set up mobile template */
	// Hide page container
	$("#page-container", context).hide();

	// Process widgets for report sending
	$(".page", context).each(function (page_index, page) {
		// Get all widgets of this page, except normal-only widgets
		var pageWidgets = $(".widget", page).not(".normal-only");
		// Iterate over the widgets
		$(pageWidgets).each(function (widget_index, widget) {
			if (widget_index === pageWidgets.length-1) {
				$(widget).addClass("send-reports");
			}
			allWidgets.push(widget);
		});
	});

	// Process page listeners
	VignetteController.flattenPageFlipListeners();

	// Insert widgets as pages into widget-container
	$(allWidgets).each(function (index, widget) {
		var pageContainer = document.createElement("div");
		var page = document.createElement("div");
		var sector = document.createElement("div");
		$(pageContainer)
			.addClass("page")
			.append(page);
		$(page)
			.addClass("fill")
			.attr('id', "page-" + index)
			.append(sector);
		$(sector)
			.addClass("sector fill")
			.append(widget);
		$(widget)
			.addClass("fill");
		// Mark the last page with a class
		if($(widget).hasClass('last'))
			$(pageContainer).addClass('last');
		// Mark report sending pages
		if($(widget).hasClass('send-reports'))
			$(pageContainer).addClass('send-reports');
		$("#widget-container", context).append(pageContainer);
	});

	// Help text to put in bottom widgetnum container
	var showHelpText = function (widgetStr) {
		var help = $(widgetStr + " .help_text", context);
		if (typeof help !== "undefined" && help.length === 1) {
			$(".widgetnum", context).html(help.html());
		} else {
			$(".widgetnum", context).html("Help text will appear" +
				" here when available.");
		}
	};

	// Activate next button
	$(".widgetnav.right", context).click(function (event) {
		if($(".page:visible", context).hasClass('send-reports'))
			VignetteController.nextPage(event, true);
		else
			VignetteController.nextPage(event, false);
		VignetteController.setCurrentWidget(getCurrentWidget());
		markLastPage();
	});
	// Activate prev button
	$(".widgetnav.left", context).click(function (event) {	
		if( VignetteController.currentPage > 0 )
		{
			VignetteController.prevPage(event, false);
			VignetteController.setCurrentWidget(getCurrentWidget());
			markLastPage();
		}
	});
	
	// Function to obtain the currently visible widget's ID
	var getCurrentWidget = function () {
		return $(".widget:visible div:first", context).attr("id");
	};
	
	// Function to mark vignette when on last page
	var markLastPage = function () {
		$(context).removeClass("last");
		if($("#widget-container .page:last", context).css('display') == "block"){
			$(context).addClass("last");
		}
	};
	
	// Prepare at the start
	VignetteController
		.setCurrentWidget($(".widget:first div", context).attr("id"));
	markLastPage();
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("vignette/mobile", callback);
};
