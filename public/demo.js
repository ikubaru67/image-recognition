var inputx = document.getElementById('inputx')
var cropx = document.getElementById('cropx')
var input_overlay = document.getElementById('input-overlay')
var ioctx = input_overlay.getContext('2d')
var output_text = document.getElementById('log')

var demo_instructions = document.getElementById('demo-instructions')

var drop_instructions = [].slice.call(document.querySelectorAll('.drop-instructions'))
var options = [].slice.call(document.querySelectorAll('.option'))

var language = 'ind'
var demoStarted = false
var lang_demo_images = {
	ind: 'img/contoh.jpeg',
}

var lang_drop_instructions = {
	ind: 'foto KTP',
}

var worker = new Tesseract.createWorker({
  logger: progressUpdate,
  lang : 'ind',
  oem : 3,
  psm: 6,
});

function setUp(){
	input_overlay.width = inputx.naturalWidth
	input_overlay.height = inputx.naturalHeight


	output_text.style.height = inputx.height + 'px'
}

setUp()
inputx.onload = setUp


function isOutputVisible(){
	return output_text.getBoundingClientRect().top < dimensions.height
}

function startDemoIfVisible(argument) {
	if(isOutputVisible() && !demoStarted) startDemo();
	document.getElementById("start").disabled = false;
	document.getElementById("switchcam").disabled = false;
	document.getElementById("recap").disabled = false;
}

function startDemo(){
	demoStarted = true

	async function start(){
    await worker.load();
    await worker.loadLanguage('ind');
    await worker.initialize('ind');
    const { data } = await worker.recognize(inputx);
    result(data);

		inputx.removeEventListener('load', start)
	}

	if(inputx.complete) start();
	else inputx.addEventListener('load', start)
}


function progressUpdate(packet){
	var log = document.getElementById('log');

	if(log.firstChild && log.firstChild.status === packet.status){
		if('progress' in packet){
			var progress = log.firstChild.querySelector('progress')
			progress.value = packet.progress
		}
	}else{
		var line = document.createElement('div');
		line.status = packet.status;
		var status = document.createElement('div')
		status.className = 'status'
		status.appendChild(document.createTextNode(packet.status))
		line.appendChild(status)

		if('progress' in packet){
			var progress = document.createElement('progress')
			progress.value = packet.progress
			progress.max = 1
			line.appendChild(progress)
		}


		if(packet.status == 'done'){
			var pre = document.createElement('pre')
			pre.appendChild(document.createTextNode(packet.data.text))
			line.innerHTML = ''
			line.appendChild(pre)

		}

		log.insertBefore(line, log.firstChild)
	}
}

function result(res){

	console.log('result was:', res)

	progressUpdate({ status: 'done', data: res })

	res.words.forEach(function(w){
		var b = w.bbox;

		ioctx.strokeWidth = 2

		ioctx.strokeStyle = 'red'
		ioctx.strokeRect(b.x0, b.y0, b.x1-b.x0, b.y1-b.y0)
		ioctx.beginPath()
		ioctx.moveTo(w.baseline.x0, w.baseline.y0)
		ioctx.lineTo(w.baseline.x1, w.baseline.y1)
		ioctx.strokeStyle = 'orange'
		ioctx.stroke()

	})
}


document.addEventListener('afterprint', startDemoIfVisible)
startDemoIfVisible()


function clearOverLayAndOutput(){
	ioctx.clearRect(0,0, input_overlay.width, input_overlay.height)

	output_text.style.display = 'none'

	demo_instructions.style.display = 'block'
	
}

async function play(){

	demo_instructions.style.display = 'none'
	output_text.style.display = 'block'
	output_text.innerHTML = ''	

  await worker.load();
  await worker.loadLanguage(language);
  await worker.initialize(language);
  const { data } = await worker.recognize(inputx);
  result(data);
}

options.forEach(function(option){
	option.addEventListener('click', function(){

		clearOverLayAndOutput()

		
		drop_instructions.forEach(function(di){
			di.innerHTML = lang_drop_instructions[option.lang]
		})

		language = option.lang

		options.forEach(function(option){option.className = 'option'})
		option.className = 'option selected'
		if(option.lang in lang_demo_images){
			inputx.src = lang_demo_images[option.lang]			
		}
	})
})


document.body.addEventListener('drop', async function(e){
	e.stopPropagation();
    e.preventDefault();
    var file = e.dataTransfer.files[0]
	var reader = new FileReader();
	reader.onload = function(e){
		inputx.src = e.target.result;
		inputx.onload = function(){

			setUp();

		}
	};
	reader.readAsDataURL(file);
	await worker.load();
	await worker.loadLanguage(language);
	await worker.initialize(language);
	const { data } = await worker.recognize(file);
	result(data);
})

function changex(){
	var selectx = document.querySelectorAll( '.inputfile' );
	Array.prototype.forEach.call( selectx, function( input )
	{
		var label	 = input.nextElementSibling,
			labelVal = label.innerHTML;

		input.addEventListener( 'change', async function(e)
		{
			e.stopPropagation();
    		e.preventDefault();			
			var fileName = '';
			if( this.files && this.files.length > 1 )
				fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
			else
				fileName = e.target.value.split( '\\' ).pop();

			if( fileName ){
				label.querySelector( 'span' ).innerHTML = fileName;

				var reader = new FileReader();
				reader.onload = function (e) {
					inputx.src = e.target.result;					
					inputx.onload = function(){

						setUp();
			
					}
				}
				var file = this.files[0];
				reader.readAsDataURL(file);								
				await worker.load();
				await worker.loadLanguage(language);
				await worker.initialize(language);
				const { data } = await worker.recognize(file);
				console.log('DATA', data)
  				result(data);
			}
			else{
				label.innerHTML = labelVal;
			}
		});
	});
}

var videoStream;
var video = document.getElementById("video");
var clonesave = document.getElementById("saveclon");
var clonecrop = document.getElementById('start-crop');

document.getElementById("start").addEventListener("click", function() {
	document.getElementById("video").style.display = "block";
	document.getElementById("inputx").style.display = "none";
	document.getElementById("input-overlay").style.display = "none";
	document.getElementById("start").style.display = "none";
	document.getElementById("switchcam").style.display = "inline-block";
	document.getElementById("stop").style.display = "inline-block";
	document.getElementById("snap").style.display = "inline-block";
	navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
	  videoStream = stream;
	  var video = document.getElementById("video");
	  video.srcObject = stream;
	  video.onloadedmetadata = function(e) {
		video.play();
	  };
	});
	clonesave.disabled = true;
	clonesave.style.backgroundColor = "#d0d4cd";
	clonecrop.disabled = true;
	clonecrop.style.backgroundColor = "#d0d4cd";
});

const switchCameraButton = document.getElementById("switchcam");

switchCameraButton.addEventListener("click", async () => {

	document.getElementById("video").style.display = "block";
	document.getElementById("inputx").style.display = "none";
	document.getElementById("input-overlay").style.display = "none";
	document.getElementById("recap").style.display = "none";
	document.getElementById("stop").style.display = "inline-block";
	document.getElementById("snap").style.display = "inline-block";

  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }

  let facingMode = "environment";
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    const track = tracks[0];
    const constraints = track.getConstraints();
    if (constraints.facingMode === "environment") {
      facingMode = "user";
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: facingMode
    }
  });

  video.srcObject = stream;
  videoStream = stream;
});

document.getElementById("stop").addEventListener("click", function() {
	document.getElementById("video").style.display = "none";
	document.getElementById("stop").style.display = "none";	
	document.getElementById("snap").style.display = "none";
	document.getElementById("recap").style.display = "none";
	document.getElementById("input-overlay").style.display = "inline-block";
	document.getElementById("inputx").style.display = "inline-block";
	document.getElementById("switchcam").style.display = "none";
	document.getElementById("start").style.display = "inline-block";
	videoStream.getTracks().forEach(function(track) {
		track.stop();
	});
	clonesave.disabled = false;
	clonesave.style.backgroundColor = "#7cd339";
	clonecrop.disabled = false;
	clonecrop.style.backgroundColor = "#39d3be";
});

document.getElementById("recap").addEventListener("click", function(){
	document.getElementById("snap").style.display = "inline-block";
	document.getElementById("recap").style.display = "none";
	document.getElementById("inputx").style.display = "none";
	document.getElementById("input-overlay").style.display = "none";
	document.getElementById("video").style.display = "inline-block";
	document.getElementById("switchcam").style.display = "inline-block";
	clonesave.disabled = true;
	clonesave.style.backgroundColor = "#d0d4cd";
	clonecrop.disabled = true;
	clonecrop.style.backgroundColor = "#d0d4cd";
});

document.getElementById("snap").addEventListener("click", function() {
	document.getElementById("input-overlay").style.display = "inline-block";
	document.getElementById("inputx").style.display = "inline-block";
	document.getElementById("recap").style.display = "inline-block";
	document.getElementById("video").style.display = "none";
	document.getElementById("snap").style.display = "none";
	document.getElementById("switchcam").style.display = "none";
	clonesave.disabled = false;
	clonesave.style.backgroundColor = "#7cd339";
	clonecrop.disabled = false;
	clonecrop.style.backgroundColor = "#39d3be";
	var video = document.getElementById("video");	
	var canvas = document.createElement("canvas");
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	canvas.getContext("2d").drawImage(video, 0, 0);
	inputx.src = canvas.toDataURL();
	Tesseract.recognize(		
		canvas,
          {
            lang: "ind",
            tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          }
        ).then(function(result) {
          console.log(result);
          var div = document.createElement("div");
          div.innerHTML = result.html;
          document.body.appendChild(div);
        });
	play();
});

function saveImage() {
	// Get selected resolution from dropdown menu
	const selectedResolution = parseFloat(document.getElementById("resolution").value);
	
	// Create canvas with the desired size
	const canvas = document.createElement("canvas");
	canvas.width = inputx.width * selectedResolution;
	canvas.height = inputx.height * selectedResolution;
	
	// Draw captured image on the canvas with the desired size
	const context = canvas.getContext("2d");
	context.drawImage(inputx, 0, 0, canvas.width, canvas.height);
	
	// Save the image as a PNG file
	const link = document.createElement("a");
	link.download = "captured-image.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
}

var select = document.getElementById("resolution");
var saveButton = document.getElementById("save");

select.addEventListener("change", function() {
	var selectedOption = this.options[this.selectedIndex];
	switch(selectedOption.value) {
	  case "0.5":
		this.style.backgroundColor = "#7939d3";
		break;
	  case "1":
		this.style.backgroundColor = "#be39d3";
		break;
	  case "1.5":
		this.style.backgroundColor = "#d3399a";
		break;
	  case "2":
		this.style.backgroundColor = "#d3395d";
		break;
	  case "3":
		this.style.backgroundColor = "#d33939";
		break;
	  default:
		this.style.backgroundColor = "#be39d3";
		break;
	}
	if (this.value === "") {
		saveButton.disabled = true;
		saveButton.style.backgroundColor = "#d0d4cd";
	} else {
		saveButton.disabled = false;
		saveButton.style.backgroundColor = "#7cd339";
	}
	  
	if (saveButton.disabled) {
		saveButton.style.backgroundColor = "#d0d4cd";
	}
});

document.getElementById("saveclon").addEventListener("click", function(){
	document.getElementById("save").style.display = "inline-block";
	document.getElementById('start-crop').style.display = 'none';
	document.getElementById("cancelsave").style.display = "inline-block";
	document.getElementById("resolution").style.display = "inline-block";
	document.getElementById("saveclon").style.display = "none";
	document.getElementById("start").disabled = true;
	document.getElementById("start").style.backgroundColor = "#d0d4cd";
	document.getElementById("recap").disabled = true;
	document.getElementById("recap").style.backgroundColor = "#d0d4cd";
});

document.getElementById("cancelsave").addEventListener("click", function(){
	document.getElementById("save").style.display = "none";
	document.getElementById('start-crop').style.display = 'inline-block';
	document.getElementById("cancelsave").style.display = "none";
	document.getElementById("resolution").style.display = "none";
	document.getElementById("saveclon").style.display = "inline-block";
	document.getElementById("start").disabled = false;
	document.getElementById("start").style.backgroundColor = "#d38339";
	document.getElementById("recap").disabled = false;
	document.getElementById("recap").style.backgroundColor = "#d3394c";
});

let cropper = null;

function startCrop() {
	if (cropper) {
		// if the instance already exists, destroy it first
		cropper.destroy();
		}

	// create a new instance of Cropper JS
	cropper = new Cropper(document.getElementById('inputx'));
}

// function to stop the crop
function stopCrop() {
	if (cropper) {
		// destroy the instance of Cropper JS
		cropper.destroy();
		cropper = null;
	}
}

function saveCrop() {
	if (cropper) {
		// get the cropped image data
		const croppedImageData = cropper.getCroppedCanvas().toDataURL('image/jpeg');

		// create a new image element to display the cropped image
		const croppedImage = new Image();
		croppedImage.src = croppedImageData;

		// replace the original image with the cropped image
		const originalImage = document.getElementById('inputx');
		// originalImage.parentNode.replaceChild(croppedImage, originalImage.src);
		originalImage.src = croppedImage.src;

		// stop the crop
		stopCrop();

		play();
	}
}

// attach event listeners to the buttons
document.getElementById('start-crop').addEventListener('click', startCrop);
document.getElementById('stop-crop').addEventListener('click', stopCrop);
document.getElementById('save-crop').addEventListener('click', saveCrop);

document.getElementById('start-crop').addEventListener('click', function(){
	document.getElementById('start-crop').style.display = 'none';
	document.getElementById('saveclon').style.display = 'none';
	document.getElementById('stop-crop').style.display = 'inline-block';
	document.getElementById('save-crop').style.display = 'inline-block';
	document.getElementById("start").disabled = true;
	document.getElementById("start").style.backgroundColor = "#d0d4cd";
	document.getElementById("recap").disabled = true;
	document.getElementById("recap").style.backgroundColor = "#d0d4cd";
});

document.getElementById('stop-crop').addEventListener('click', function(){
	document.getElementById('start-crop').style.display = 'inline-block';
	document.getElementById('saveclon').style.display = 'inline-block';
	document.getElementById('stop-crop').style.display = 'none';
	document.getElementById('save-crop').style.display = 'none';
	document.getElementById("start").disabled = false;
	document.getElementById("start").style.backgroundColor = "#d38339";
	document.getElementById("recap").disabled = false;
	document.getElementById("recap").style.backgroundColor = "#d3394c";
});
