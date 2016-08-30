
var callback = function (context, data, pageNumber) {
	var lines = data.content.split("\n");
	$(lines).each(function (index, line) {
		$("#" + data.id, context).append("<p class=\"text_half_para\">" + line + "</p>");
	});
};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/text", callback);
};
