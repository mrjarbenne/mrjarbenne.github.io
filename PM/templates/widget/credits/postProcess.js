
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);
	
	var lines = data.content.split("\n");
	$(lines).each(function (index, line) {
		container.append("<p class=\"credit_para\">" + line + "</p>");
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/text", callback);
};
