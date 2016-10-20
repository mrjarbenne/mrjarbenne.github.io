var vid;

//adds and event listener across major browser versions
function addEvent( obj, type, fn )
{
   if ( obj.addEventListener )
   {
      obj.addEventListener( type, fn, true );
   }
   else if ( obj.attachEvent )
   {
      obj.attachEvent( "on" + type, fn );
   }
   else
   {
      obj["on" + type] = fn;
   }
}

//removes event listeners across major browser versions
function removeEvent( obj, type, fn )
{
   if ( obj.removeEventListener )
   {
      obj.removeEventListener( type, fn, true );	
   }
   else if ( obj.detachEvent )
   {
      obj.detachEvent( "on" + type, fn );
   }
   else
   {
      delete obj["on" + type];	
   }
}
   
function divClickHandler()
{
   var req = swfobject.hasFlashPlayerVersion("9.0.115");
   var id = "video1";
   var node = '<div id="cs_noexpressUpdate">'
            + '<p align="center">The Camtasia Studio video content presented here </p><p align="center"> requires JavaScript to be enabled and the latest version </p><p align="center">of the Adobe Flash Player.  If you are using </p><p align="center">a browser with JavaScript disabled please enable it now.</p><p align="center"> Otherwise, please update your version of the </p><p align="center">free Flash Player by <a href="http://www.adobe.com/go/getflashplayer">downloading here</a>. </p>'
            + '</div>';

   if ( req )
   {
      swfobject.embedSWF( "Report Card_controller.swf", id, "640", "393", "9.0.115", null, {autostart: "true", content: "Report%20Card.mp4", xmp: "Report Card_config.xml", smoothing: "true", fullscreen: "true", tocdoc: "left", basecolor: "272727"}, {quality: "best", allowfullscreen: "false", scale: "noscale", allowscriptaccess: "always"} );
   }
   else
   {
      var n = (typeof id == 'string') ? document.getElementById( id ) : id;
      n.innerHTML = node;
   }

   removeEvent( vid, 'click', divClickHandler );

} 

function pageLoad()
{
      vid = document.getElementById( "video1" );
   addEvent( vid, "click", divClickHandler );
}
