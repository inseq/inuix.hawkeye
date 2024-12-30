/*!
* inseq natasha is hwakeye best friend
*/
document.addEventListener('DOMContentLoaded',function(){
if(HawkeyeOverlayTool.instance.config.enabled){
	document.querySelector("#call-markup").addEventListener("click", function() {
		var win =  window.open(pluginAttrArr[0]+"natasha/natasha.html?url="+ window.location.protocol + "//" + window.location.host+$("#url-val").val());
	});
}

	let pluginAttr = Array.from(document.querySelectorAll("script")).find((a) => a.src.match(/.*\/plugins\//)).src;
	let pluginAttrArr = pluginAttr.replace(window.location.origin,'').match(/.*\/plugins\//);

});

var fileCall = function(file){
	console.log(file);
	
	const inputFile = document.querySelector("#overlayImageInput");
	
	const dataTransfer = new DataTransfer();
	dataTransfer.items.add(file);
	inputFile.files = dataTransfer.files;
	
	inputFile.dispatchEvent(new Event("change")); // change 이벤트 트리거
}