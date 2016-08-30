var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	
	var lines = data.content.split("\n");
	console.log(lines);
	$(lines).each(function (index, line) {
		container.append("<p class=\"end_para\">" + line + "</p>");
	});

	var now = new Date();
	$("#datetime", context).append("<p class=\"end_para\"><strong>Date and Time: </strong>" + now + "</p>");
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/end", callback);
};