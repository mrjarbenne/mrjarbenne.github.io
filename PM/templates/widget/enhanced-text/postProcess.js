
var callback = function (context, data, pageNumber) {
	var container = $("#" + data.id, context);


    Reporter.addWidgetReporter( function() {
        var oldData = Reporter.getWidgetReportData(pageNumber, data.id);
		var ettime = typeof SharedData.getter(data.exports_to+ "-time") !== "undefined" && SharedData.getter(data.exports_to+ "-time").length > 0 ?
					SharedData.getter(data.exports_to+ "-time")[0]
					 : "Time information not stored";
        var etInfo = typeof SharedData.getter(data.exports_to) !== "undefined" && SharedData.getter(data.exports_to).length > 0 ?
        			 SharedData.getter(data.exports_to)[0]
					 : "Information not available";
        
        return {
            Info: etInfo,
            time: ettime
		};
		
	}, pageNumber, data.id );

    // Process the custom html file to replace displays fields with
    // their values.
	function processDisplayFieldsCustom() {
		var endDate;
		var DATE_REPLACE_STRING = "#time\\.date";
		var HOURS_REPLACE_STRING = "#time\\.hours";
		var MINUTES_REPLACE_STRING = "#time\\.minutes";
		var SECONDS_REPLACE_STRING = "#time\\.seconds";
		var MILLI_REPLACE_STRING = "#time\\.milliseconds";
		var START_REPLACE_STRING = "#time\\.startTime";
		var END_REPLACE_STRING = "#time\\.endTime";

		var list_imports_from = getImports();

		$.each(list_imports_from, function(index, imports_from) {
			SharedData.addListener(imports_from, function () { updateValues(); }, pageNumber);
		});

		// Build a list of enhanced text widgets to import display field values from.
		function getImports() {
			var imports = [];
			$.each(data.fields, function (index, field) {
				if (typeof field.type !== "undefined" && field.type.toLowerCase() == "display") {
					var fieldParts = field.name.split("\.");
					var importName = fieldParts[0];
					// Add the import name to the list if it's not there
					if (!_.contains(imports, importName))
						imports.push(importName);
				}
			});
			return imports;
		}

		// Replaces any time fields with their values.
		function updateTimeFields(imports_from) {
			var startDate = SharedData.getter(imports_from + "-time");
	        if (typeof startDate === "undefined") {
	        	return; // next imports_from
	        }
	        startDate = startDate[0];
	        endDate = new Date();
			var startTime = startDate.getTime();
			var endTime = endDate.getTime();
			var elapsedTime = endTime - startTime;

			//Hours
			var elapsedTimeHours = Math.floor(elapsedTime/3600000);
			elapsedTime -= (elapsedTimeHours * 3600000);
			//Minutes
			var elapsedTimeMinutes = Math.floor(elapsedTime/60000);
			elapsedTime -= (elapsedTimeMinutes * 60000);
			//Seconds
			var elapsedTimeSeconds = Math.floor((elapsedTime)/1000);
			elapsedTime -= (elapsedTimeSeconds * 1000);
			//milliseconds
			var elapsedTimeMilliseconds = elapsedTime;
			//Get the Date
			var date = new Date();
			var dateNow = (date.getMonth() +1) + "/" + date.getDate() + "/" + date.getFullYear();

			var startTimeString = startDate.getHours() + ":" + startDate.getMinutes() + ":" + startDate.getSeconds() + ":" + startDate.getMilliseconds();
			var endTimeString = endDate.getHours() + ":" + endDate.getMinutes() + ":" + endDate.getSeconds() + ":" + endDate.getMilliseconds();

			// Replace the references with the actual values
			$(HOURS_REPLACE_STRING, context).html(elapsedTimeHours);
			$(MINUTES_REPLACE_STRING, context).html(elapsedTimeMinutes);
			$(SECONDS_REPLACE_STRING, context).html(elapsedTimeSeconds);
			$(MILLI_REPLACE_STRING, context).html(elapsedTimeMilliseconds);
			$(START_REPLACE_STRING, context).html(startTimeString);
			$(END_REPLACE_STRING, context).html(endTimeString);
			$(DATE_REPLACE_STRING, context).html(dateNow);
		}

		function updateValues() {
		    
	    	$.each(list_imports_from, function(index, imports_from) {
				// If nothing has been set in SharedData for this import
				// yet, remove the fields and continue to next import
				if (!SharedData.checkHasData(imports_from)) {
					blankFields(imports_from);
					return;
				}
		        var fieldData = SharedData.getter(imports_from)[0];
		        // fieldData is an array of objects, each containing info about a field
		        // [ { name: "name1",
		    	//     type: "radio",
		    	//	   value: "value1" }, ... ]
		    	
		    	var fieldDataReplaceStrings = [];
		        $.each(fieldData, function (index, field) {
		        	// Use a literal backslash before the dot to prevent
		        	// it from being used as a jquery class selector
		            fieldDataReplaceStrings.push(imports_from + "\\." + field.name);
		        });
		        $.each(fieldDataReplaceStrings, function (index, value) {
		            $("#" + value).html(fieldData[index].value);
		        });
	    	
	        updateTimeFields(imports_from);
			});
		}

		function blankFields(imports_from) {
			var replaceStrings = [];
			$.each(data.fields, function (index, field) {
				var fieldImport = field.name.split("\.")[0];
				if (fieldImport == imports_from) {
					replaceStrings.push("\\" + field.name);
				}
	        });
	        $.each(replaceStrings, function (index, value) {
	        	var fieldID = value.substring(1);
	        	$("#" + fieldID, context).html("");
	        });
		}

		updateValues();

	}
    
    
	$.get("resources/Text/" + data.id + ".html", function(text) {
		container.find(".enhanced_text_intro").append(text);
	});

	attachIDs();

	var inputData = [];
	// Once the user has submitted an answer, indicate & export
	function attemptSubmit() {
		if (typeof data.fields === "undefined") {
			return true;
		}
		inputData = [];
		var responded = true; // Check if the user has input an answer before moving forward

		$.each( data.fields, function( index, field ) {
			if (typeof field.name === "undefined" || field.name === "" ||
				field.type === "display")
				return;
			//if the designer decides to write their own HTML file
			if( data.custom_formatting ) {
				responded = processFieldCustom(index, field);
			} else { //the designer decides to use the predefined input types rather than 
					 //writing their own html file
				responded = processFieldPreset(index, field);
			}
		});
		
		SharedData.setter(data.exports_to, inputData, pageNumber);
	 	if(typeof SharedData.getter(data.exports_to+ "-time") === "undefined") {
			//Get the start time
			var date = new Date();
			SharedData.setter(data.exports_to+ "-time", date, pageNumber);
		}
		return responded;
	}

	// Process a single field in a custom enhanced text html file
	function processFieldCustom(index, field) {
		//flags to check if all the fields are filled
		var tableFilled = true;
		var radioSelected = true;
		var boxChecked = true;
		var textAreaFilled = true;
		var textFilled = true;

		var tempFlag1 = false;
		var tempFlag2 = false;

		var currentValueId = '#enhanced_text-' + data.id + '-' + index;
		var values = [];
		var responded = false;
		$(currentValueId).children().each(function(i, val){
			//if the type is checkbox 
			if ($(this).attr('type') === "checkbox") {
				
				if ($(this).is(":checked")) {
					values.push($(this).val());
					tempFlag1 = true;
				}
				boxChecked = tempFlag1;
				
				//push the value to shared data
				inputData.push(
					{
						'name': field.name,
						'type': 'checkbox',
						'value': values
					}
				);
			} else if ($(this).attr('type') === "radio") { //if the type is radio button 
				
				if ($(this).is(":checked")) {
					values.push($(this).val());
					tempFlag2 = true;
				}
				radioSelected = tempFlag2;
				//push the value to shared data
				inputData.push(
					{
						'name': field.name,
						'type': 'radio',
						'value': values.length === 0 ? undefined : values
					}
				);

			} else if ($(this).attr('type') === "text" || $(this).attr('type') === undefined) {
				if ($(this).val() === '') {
					textFilled = false;
				} else {
					textFilled = true;
				}
				values.push($(this).val());
				inputData.push(
					{
						'name': field.name,
						'type': 'text',
						'value': values
					}
				);
			} else if ($(this).prop('tagName') === 'TABLE') { //if the type is a table
				
				$(this).find('tr').each(function(){
					var rows = []; //store each row as an array
					$('input', $(this)).each(function(){	
						if ($(this).val() === '') {
							tableFilled = false;
						} else {
							tableFilled = true;
						}				
						rows.push($(this).val());
					});
					if (rows.length !== 0){
						values.push(rows); //2D array to store table data
					}
				});
				$.each(values, function(index, value) {
					$.each(value, function(sub_index, cell) {
						//spreadsheet notation, eg. "A2", "B4"
						var col_num = String.fromCharCode(65+sub_index); 
						var row_num = index+1;

						//push each individual cell to Shared Data
						inputData.push(
							{
								'name': field.name+col_num+row_num,
								'jsonLabel': field.name,
								'type': 'table',
								'value': cell
							}
						);
					});
				});

			} else if ($(this).prop('tagName') === 'TEXTAREA') { //if the type is textarea
				if ($(this).val() === '') {
					textAreaFilled = false;
				} else {
					textAreaFilled = true;
				}
				values.push($(this).val());
				inputData.push(
					{
						'name': field.name,
						'type': 'textarea',
						'value': values
					}
				);

			} else if ($(this).prop('tagName') === 'SELECT') { //if the type is a dropdown list
				$(this).find('option').each(function() {
					if ($(this).is(":selected")) values.push($(this).val());
					inputData.push(
						{
							'name': field.name,
							'type': 'dropdown',
							'value': values
						}
					);
				});						
			}

			responded = radioSelected && boxChecked && textAreaFilled && tableFilled && textFilled;
		});
		return responded;
	}

	// Process a single field for a preset enhanced text
	function processFieldPreset(index, field) {
		var selected = false;
		var responded = false;
		if (field.type === "textarea") {
			var currentValueId = '#enhanced_text-' + data.id + '-' + index + '-text';
			responded = responded && $(currentValueId, context).val() !== '';
			inputData.push(
				{
					'name': field.name,
					'type': 'textarea',
					'value': $(currentValueId, context).val()
				}
			);
		} else if (field.type === "checkbox") {
			var checked = [];
			selected = false;
			$.each( field.values, function( sub_index, value ) {
				var currentValueId = '#enhanced_text-' + data.id + '-' + index + '-' + sub_index;								
				if ($(currentValueId, context).is(":checked")) {
					checked.push(value);
					selected = true;
				}
				
			});
			inputData.push(
				{
					'name': field.name,
					'type': 'checkbox',
					'value': checked
				}
			);
			responded = responded && selected;
		} else if (field.type === "radio") {
			selected = false;
			$.each( field.values, function( sub_index, value ) {
				var currentValueId = '#enhanced_text-' + data.id + '-' + index + '-' + sub_index;
				
				if ($(currentValueId, context).is(":checked")) {
					selected = true;
					inputData.push(
						{
							'name': field.name,
							'type': 'radio',
							'value': value
						}
					);
				}
			});	
			responded = responded && selected;
		}
		return responded;	
	}
	
	// Attach focus handlers to the inputs
	function updateFields() {
		if (typeof data.fields === "undefined")
			return;
		$.each( data.fields, function( index, field ) {
			var currentValueId = 'enhanced_text-' + data.id + '-' + index;
			$("#"+currentValueId, context).focusout( function() {
			    attemptSubmit();
			});
		});
	}

	updateFields();

	function reloadData() {
		// If the question has been answered before but it is now being reloaded,
		// put the previous answer from SharedData back into the input
		var currentData = SharedData.getter(data.exports_to);
		if (typeof currentData !== "undefined")
			currentData = currentData[0];
		if (typeof currentData !== "undefined") {
			if (data.custom_formatting) {
				$.each( currentData, function( index, element) {
					if (typeof element.value === "undefined")
						return;
					if( element.type === "checkbox") {
						$.each( element.value, function(index) {
							$("input[value="+element.value[index]+"]", context).prop("checked",true);
						});

					} else if( element.type === "radio" ) {
						$("input[value="+element.value+"]", context).prop("checked",true);

					} else if( element.type === "table" ) {
						var currentTable = $("table[id="+element.jsonLabel+"]", context);
						$('input', currentTable).each(function() {
							if( $(this).val() === '') {
								$(this).val(element.value);
								return false;
							}
						});
					} else if( element.type === 'textarea') {
						var currentTextarea = $("textarea[id="+element.name+"]", context);
						currentTextarea.val(element.value);

	 				} else if( element.type === 'dropdown' ) {
	 					$("option[value="+element.value+"]", context).prop("selected", true);
	 				} else if ( element.type === 'text' || element.type === '') {
	 					var currentTextField = $("input[id="+element.name+"]", context);
	 					currentTextField.val(element.value);
	 				}
				}); 
			} else {
				$.each( currentData, function( index, element ) {
					if (typeof element.data === "undefined")
						return;
					if( element.type === "textarea" ) {
						$("textarea[name=enhanced_text-"+element.name+"]", context).val(element.value);
					} else if( element.type === "checkbox" ) {
						$.each( element.value, function(index) {
							$("input[value="+element.value[index]+"]", context).prop("checked",true);
						});
					} else if( element.type === "radio" ) {
						$("input[value="+element.value+"]", context).prop("checked",true);
					}
				});
			}
			// Mark the question as completed
			container.addClass("completed");
		}
		attachIDs();
		updateFields();
	}

	// Attach sequential IDs to the field so they can be accessed
	function attachIDs() {
		if( data.custom_formatting && typeof data.fields !== "undefined")
		{
			$.each( data.fields, function( index, field ) {
				var currentElement = $('[name=enhanced_text-' + index + ']', context);
				var currentValueId = 'enhanced_text-' + data.id + '-' + index;
				currentElement.attr({
					'id': currentValueId,
					'class': 'enhanced_text',
					'name': 'enhanced_text-' + index
				});
			});
		}
	}
	
	VignetteController.addPageFlipListener(function (event) {
		
		if (event.type === "flip") {
			if (event.direction === "forward") {

				var submitResult = attemptSubmit();
				if (submitResult) {
					container.addClass("completed");
				}
				else {
					container.removeClass("completed");
				}
				

				var isCompleted = container.hasClass("completed");
				if (isCompleted) {
					container.removeClass("error");
				} else {
					container.addClass("error");
				}
				
				return isCompleted;
			} 
		} else if (event.type === "load") {
			processDisplayFieldsCustom();
			reloadData();
		}
		return true;
	});



};

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/enhanced-text", callback);
};
