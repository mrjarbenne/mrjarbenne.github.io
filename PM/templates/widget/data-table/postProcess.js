
var callback = function (context, data, pageNumber) {
	// Store the table we make, so datatable.js doesn't complain
	var table = $("table", context).DataTable({
		"paging": false,
		"info": false,
		"searching": false,
		"ordering": false,

	});
	
    // Listener to detect changes from imported shared data
	SharedData.addListener(data.imports_from, function (values) {
		setRows();
	}, pageNumber);
	
    
    VignetteController.addPageFlipListener(function (event) {
		if (event.type === "flip") {
            updateContents();
		} else if (event.type === "load") {
			setRows();
            if(SharedData.getter(data.exports_to) != null) loadContents();
      	}
		return true;
	});
    
    
    var loadContents = function() {
        var dimensions = SharedData.getter(data.exports_to+"_dimensions")[0];
        var contents = SharedData.getter(data.exports_to)[0];
        var rowNum = 0;
        var columnNum = 0;
        
        //SharedData.clear(data.exports_to+"_dimensions");
        //SharedData.clear(data.exports_to);
        
        // i = dimensions[1] so that the first row is ignored since its just title headers.
        for(var i=dimensions[1]; i< contents.length; i++) {
            var str = "#"+data.id+"_"+rowNum+"_"+columnNum;
            if(columnNum < (dimensions[1] - 1) ) ++columnNum;
            else { ++rowNum; columnNum = 0;}
            $(str).val(contents[i]);
        }
    };
    
    // update contents of the shared data
    var updateContents = function() {
        var rowContents = [];
		var columnNum = data.columns.length;
		var rowNum = data.rows;
        var yContent = [];
        var xContent = [];
        
        $("#"+data.id+" thead th").each(function(index) {
            rowContents.push($(this).html());
        });
        
        $("#"+data.id+" .dataTableInput").each(function(index){
            if($(this).is("input")) rowContents.push($(this).val());
            else rowContents.push($(this).html());
        });
        var dimensions = [rowNum, columnNum];
        
        SharedData.setter(data.exports_to+"_dimensions",dimensions,pageNumber);
        SharedData.setter(data.exports_to,rowContents,pageNumber);
        // console.log(rowContents);
    };
   
    
	// Add rows as needed
	var setRows = function () {
		table.clear();
		// Get data
		var rowEntries = [];
		var tableText;
		var inputText;
		var counter;
		var rowNum = data.rows;
		
		if(data.imports_from) {
			var imports_from = SharedData.getter(data.imports_from);
			var rowContent = imports_from[0];
		}


		// check if the column has teh type "imports"
		// If yes, we need to set the importData.
		$.each(data.columns, function(index, group){
			if (group.type === "imports") {

				var columnX;	
				var tempDimensions = SharedData.getter(group.imports_from+"_dimensions")[0]; // gives the number of rows & columns
				allData = SharedData.getter(group.imports_from)[0];							 // get all data for importing table	

				// find the index of the matching column header
            	for(var i=0; i< tempDimensions[1]; i++) {
                	if(allData[i] === group.imports_column){
                		columnX = i;
                	} 	
            	}
            
            	increments = columnX + tempDimensions[1];
            	importingData = [];
            
            
            	// store all the x-axis labels in xLabelTicks
            	for(var i= 0; i < tempDimensions[0]; i++) {
                	importingData.push(allData[increments]);
                	increments += tempDimensions[1];
           		}

           		group.importData = importingData; // set import data

			}
	});

		
		//first row
		for(i=0; i<rowNum; i++) {
			rowEntries = [];
			counter = 0;
			$.each(data.columns, function(index, group){
				switch(group.type){
					case "ID"	 : inputText = "<div id='"+data.id+"_"+i+"_"+counter+"' class='dataTableInput'>"+(1+i)+"</div>";
									break;
					case "text"	 : inputText = "<input id='"+data.id+"_"+i+"_"+counter+
									"' class='dataTableInput' type='text' rowindex='"+i+"' columnIndex='"+counter+"'></input>"; 
									break;
					case "number": inputText = "<input id='"+data.id+"_"+i+"_"+counter+
									"' class='dataTableInput' type='text' onkeypress='return isFloatNumber(event)' rowindex='"+
									i+"' columnIndex='"+counter+"'></input>"; 
									break;
					case "custom": inputText = "<div id='"+data.id+"_"+i+"_"+counter+"' class='dataTableInput'>"+group.data[i]+
									"</div>";
									break;
					case "imports": inputText = "<div id='"+data.id+"_"+i+"_"+counter+"' class='dataTableInput'>"+group.importData[i]+
									"</div>";
									break;
					default: inputText = "";
								break;
				}
				rowEntries.push(inputText);
				++counter;
			});
			table.row.add(rowEntries);
		}
		table.columns.adjust();
		table.draw();
		
		$(".dataTableInput").bind('keydown',function(event){
			if(event.keyCode == 13) {
                $(this).blur(); // Remove focus so that focusOut will be fired for last cell when enter is pressed.
                var currentRowIndex = $(this).attr("rowIndex");
				var currentColumnIndex = $(this).attr("columnIndex");
                if(event.shiftKey) {
					var prevRow = "#"+data.id+"_"+(--currentRowIndex)+"_"+currentColumnIndex;
					if($(prevRow).length != -1) $(prevRow).focus();
				}
				else {
					var nextRow = "#"+data.id+"_"+(++currentRowIndex)+"_"+currentColumnIndex;
					if($(nextRow).length != -1) $(nextRow).focus();
				}
			}
		});
        
        // This function fires updateContents to store data in SharedData so that other widgets can pick it up immediately.
        $("#"+data.id+" input").focusout(function(){
            updateContents();
        });
	};
    
    
    Reporter.addWidgetReporter( function() {
        var oldData = Reporter.getWidgetReportData(pageNumber, data.id);
		var reportDimensions = typeof SharedData.getter(data.exports_to+ "_dimensions") !== "undefined" && SharedData.getter(data.exports_to+ "_dimensions").length > 0
					 ? SharedData.getter(data.exports_to+ "_dimensions")[0]
					 : "Dimensions unavailable";
        var reportData = typeof SharedData.getter(data.exports_to) !== "undefined" && SharedData.getter(data.exports_to).length > 0
					 ? SharedData.getter(data.exports_to)[0]
					 : "Data not available";
        
        return {
            Dimensions_HeightxWidth: reportDimensions,
            Data: reportData
        };
		
	}, pageNumber, data.id );
};

function isFloatNumber(evt) {
  	var charCode = (evt.which) ? evt.which : evt.keyCode;
  	var existing = evt.currentTarget.value;
  	
    //console.log(charCode);
    
    // 39 and 37 are for left and right arrows, return true to enable movement from arrow keys. Better to keep false due to validity issues with minus,dot and E signs.
    // if(charCode == 37 || charCode == 39) return true;
    
    // 45 is for minus sign. Incldue it if its first in string, or right after an e.
    if(charCode == 45 && (existing.length == 0 || ((existing.length-1) == existing.toLowerCase().indexOf('e')))) return true;
    
    // 69 and 101 represents e and E. if no 'e' was present earlier, return true.
    if((charCode == 69 || charCode == 101) && existing.toLowerCase().indexOf('e') == -1) return true;
    
    // 46 represents '.'. If it was present earlier or if an e is there in the string don't push it.
    if(charCode == 46 && (existing.indexOf('.') != -1 || existing.toLowerCase().indexOf('e') != -1)) return false;
    
    // for every other character other than numbers return false
    if(charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)) return false;
    
	return true;
}

var handler = function () {
	// Standard syntax for registration
	// Always use layout.type/layout.template
	// And just layout.type for generic postProcessors
	Registry.register("widget/data-table", callback);
};
