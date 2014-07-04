var city2 = undefined,
		pos1 = '',
		pos2 = '',
		offsetId,
		markers = [],
		planes = [];
		flightPath = 0,
		findCenter = undefined,
		map = undefined;

function initialize() {

	mapOptions = {
		center: new google.maps.LatLng(49, -124.45),
		disableDoubleClickZoom: true,
		draggable: false,
		minZoom: 5,
		zoom: 7,
		maxZoom: 9,
		zoomControl: false,
		panControl: false,
		scrollwheel: false,
		streetViewControl: false,
		mapTypeControl: false,
		mapTypeControlOptions: {
			mapTypeIds: [google.maps.MapTypeId.TERRAIN, 'map_style']
		}

	};

	var styles = [
		{
			"featureType": "water",
			"stylers": [
				{ "visibility": "simplified" },
				// Water
				{ "color" : "#BAE3F7" }
			]
		},{
			"featureType": "landscape",
			"stylers": [
				{ "visibility": "on" },
				// Land
				{ "color": "#86CC7F" }
			]
		},{
			"featureType": "road",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
		},{
			"featureType": "administrative",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "transit",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "poi",
			"stylers": [
				{ "visibility": "off" }
			]
		}
	];

	var styledMap = new google.maps.StyledMapType(styles, {name: 'Styled Map'});

	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	// Create different map positions depending on screen size.
	map.smallLatLng = new google.maps.LatLng(49.2, -124.39);
	map.medLatLng = new google.maps.LatLng(49, -124.4);
	map.largeLatLng = new google.maps.LatLng(49, -124.45);

	map.mapTypes.set('map_style', styledMap);
	map.setMapTypeId('map_style');
	// Add listener to expand the map when clicking on the map or '+' symbol on the map.
	google.maps.event.addListener(map, 'click', expandMap);
	$('#map-open-icon').on('click', expandMap);
	// Add listener to size and position the map depending on the window size.
	google.maps.event.addDomListener(window, 'resize', initialMap);
	// Size the map, on load, to specified settings based on window size.
	google.maps.event.addDomListenerOnce(map, 'tilesloaded', initialMap);

	function setMarkers(loc){
			// Create position for new marker
			var myLatLng = new google.maps.LatLng(loc.latitude, loc.longitude);
			var image = 'img/markers/marker_' + loc.name + '.png';

			// Set marker's options
			var marker = new google.maps.Marker({
				animation: google.maps.Animation.DROP,
				map: map,
				icon: image.toLowerCase(),
				position: myLatLng,
				title: loc.name,
				zIndex: 100000
			});
			// Add marker to the marker array. 
			// Created array in order to search through markers later.
			markers[markers.length] = marker;
			var icon = loc.name.toLowerCase();

			var dpcity = $('input.depart-city').val();
			var rtcity = $('input.return-city').val();
			// Check if the value in the 'Depart City' field matches this marker's title.
			// If it does, change the icon and set the position for the flight path.
			if ( dpcity === loc.name ) {
				pos1 = marker['position'];
				marker.setIcon('img/markers/marker_' + icon + '_selected.png');
			// Check if the value in the 'Return City' field matches this marker's title. 
			} else if ( rtcity === loc.name ) {
				marker.setIcon('img/markers/marker_' + icon + '_selected.png');
			}

			// Create marker 'click' event to set the markers back to their defaults on the first click.
			if ( dpcity ) {
				google.maps.event.addDomListenerOnce(marker, 'click', clearMarkers);
			}
			// Create event to change marker icon on click.
			google.maps.event.addListener(marker, 'click', markerOpt);
				
	};
	// On first marker click, reset all marker icons.
	function clearMarkers() {
		for ( var i in markers ) {
			var title = markers[i].title.toLowerCase();
			var dpcity = $('input.depart-city').val();
			var rtcity = $('input.return-city').val();
			// Check if a marker's title does not match a saved city.
			if ( markers[i].title !== dpcity ) {
				// If the marker's icon is a 'selected' icon, set it back to it's default.
				if ( markers[i].getIcon() === 'img/markers/marker_' + title + '_selected.png' ) {
					markers[i].setIcon('img/markers/marker_' + title + '.png');
				}
			// Check if a marker's title matches a saved city.
			} else if ( this.title === dpcity ) {
				// Set marker's icon back to default.
				markers[i].setIcon('img/markers/marker_' + title + '.png');
			} 
		}
		
	}
	// Function that returns location information from deployd to a function.
	function getCities(func) {
		dpd.locations.get(function (result, err) {
			result.forEach(function (loc) {
				func(loc);
			});
		});
	};
	// Function to setup the 'SIMFLIGHTS' database. This only creates flights for the map and does not
	// create searchable flights. Requires a numbered parameter.
	function logNewFlights(n) {
		if ( n === undefined ) { n = 1}
		// Check the number of flights wanted.
		for (var i = 1; i <= n; i += 1) {
			var cityList = ['Nanaimo', 'Tofino', 'Sechelt', 'Vancouver', 'Victoria'];
			// Create a random flight number.
			var fnum = Math.floor(Math.random()*1500+1);
			// Create a random hour on a 24-hour clock.
			var hour = Math.floor(Math.random()*24).toString();
			// Create random minutes.
			var minutes = Math.floor(Math.random()*59).toString();
			// Create 2 random numbers that will choose city names.
			var num1 = Math.floor(Math.random()*5);
			var num2 = Math.floor(Math.random()*5);
			// Create a number that will determine if a flight is late or not.
			var late = Math.floor(Math.random()*100+1);
			// If the 'minutes' is a single digit, prepend a second digit.
			while ( minutes.length !== 2 ) {
				minutes = '0' + minutes;
			}

			var time = hour + minutes;
			// If the 'hour' is three digits, prepend a fourth digit.
			while ( time.length !== 4 ) {
				time = '0' + time;
			}
			// If the random 'late' number is 6 or under, set the flight to 'late'.
			// 6% of flights will (should) be late.
			if ( late <= 6 ) {
				late = true;
			} else {
				late = false;
			}
			// If the 2 random city numbers are the same, change the second number.
			while (num2 === num1) {
				num2 = Math.floor(Math.random()*4);
			}

			var cityone = cityList[num1];
			var citytwo = cityList[num2];
			var flighttime = 0;
			// Find a flight time based on 2 random city names.
			function getFlightTime(cityone, citytwo) {
				var CityList = {
					Nanaimo: {
						Sechelt: 25,
						Tofino: 50,
						Vancouver: 25,
						Victoria: 40
					},
					Sechelt: {
						Nanaimo: 25,
						Tofino: 55,
						Vancouver: 25,
						Victoria: 55
					},
					Tofino: {
						Nanaimo: 45,
						Sechelt: 65,
						Vancouver: 65,
						Victoria: 65
					},
					Vancouver: {
						Nanaimo: 25,
						Sechelt: 25,
						Tofino: 65,
						Victoria: 45
					},
					Victoria: {
						Nanaimo: 40,
						Sechelt: 55,
						Tofino: 65,
						Vancouver: 45
					}
				}
				flighttime = CityList[cityone][citytwo];
				flighttime = flighttime.toString();
			}
			getFlightTime(cityone, citytwo);
			// Create new flight information based on the random variables.
			var newPost = {departcity: cityone, arrivalcity: citytwo, flighttime: flighttime, departtime: time, flightnumber: fnum, late: late}
			// Post the flight information the deployd.
			dpd.simflights.post(newPost);
		}
	}

	// Running this function will log n number of flights to the 'SIMFLIGHTS' collection.
	// If no number, will add 1 new, random flight.
	// logNewFlights(150);

	// Delete all entries in the 'SIMFLIGHTS' collection.
	// dpd.flights.get(function (flight) {
	// 	flight.forEach(function (f) {
	// 		dpd.flights.del({id: f.id});
	// 	})
	// })

	// Run function to display the current flights on the map.
	showCurrentFlights();

	// Set markers based on the location information in the database.
	getCities(setMarkers);

}

function showCurrentFlights() {
	// This is another area where it would have been helpful to know how to set a
	// deployd query to a variable. Instead I had nest the functions which lags the site a little.
	dpd.simflights.get(function (flights) {
		// For every flight in the 'simflights' database, if it's currently flying, show it on the map.
		flights.forEach(function (flight) {
			// The flight's time.
			var ftime = flight.departtime;
			// The current time.
			var now = new Date();
					now.setMinutes(now.getMinutes());
			var minutes = now.getMinutes();
			var hour = now.getHours();
			// The depart time of the flight.
			var dptime = new Date();
					dptime.setHours(parseInt(flight.departtime.substr(0, 2), 10));
					dptime.setMinutes(flight.departtime.substr(2, 2), 10);
			// The landing time of the flight.
			var endMins = parseInt(flight.departtime.substr(2, 2), 10) + flight.flighttime;
			var endtime = new Date();
					endtime.setHours(parseInt(flight.departtime.substr(0, 2), 10));
					endtime.setMinutes(endMins);
			// Check if the current time is between the flights departure and arrival time.
			if ( now > dptime && now < endtime ) {		
				// Run a new query to get the location information for the departing city.
				dpd.locations.get({name: flight.departcity}, function (locsone) {
					locsone.forEach(function (loc_dp) {
						// Run a new query to get the location information for the arrival city.
						dpd.locations.get({name: flight.arrivalcity}, function (locs_two) {
							locs_two.forEach(function (loc_rt) {
								// Send the flight information.
								addSimFlight(flight, loc_dp, loc_rt);
							});
						});
					});
				});
			}
		});
	});
}

var expandMap = function () {
	// Check if mobile.
	if ( document.body.clientWidth <= 500 ) {

		var content = $('#page1 div[data-role="content"]'),
				mc = $('#map-canvas'),
				mcDiv = $('#map-canvas > div'), // Mmm, edible <div>s
				offset = $('#map-canvas').offset()['top'],
				button = $('#map-canvas + div, .dates + .ui-btn'),
				cHeight = window.innerHeight,
				findCenter = map.getCenter();
		// Check if the map canvas is in its default state.
		if ( mc.css('height') === '120px' ) {

			content.css('position', 'static');
			// To allow the fullscreen map to smoothly expand, I had to set the map and "map window"
			// to the full size of the screen, refresh the map to identify those changes, reset the
			// map, and then animate it to the full screen size.
			mcDiv.css({
				top: '0px',
				height: cHeight
			}); 

			mc.css({
				position: 'absolute',
				'z-index': '2000',
				top: '0px',
				'background-color': '',
				height: cHeight,
				margin: '0px',
				width: window.innerWidth
			});

			google.maps.event.trigger(map, 'resize');
			// Get the current center of the map.
			map.panTo(findCenter);
			map.setOptions({draggable: true, scrollwheel: true});

			setTimeout(function() {
				map.setZoom(7)
			}, 1000);
			// Inner "map window".
			mcDiv.animate({
				top: '0px',
				height: cHeight
			}, 1000);
			// Map canvas.
			mc.css({'height': '120px', top: offset}).animate({
				top: '0px',
				height: cHeight,
				width: document.body.clientWidth
			}, 1000);
			// Display the 'Select Cities' button.
			button.delay(1500).animate({
				top: '1%'
			}, 400).animate({
				top: '0%'
			}, 300)

		}

	}
}
		
var drawLine = function (pos1, pos2) {
	var line = [pos1, pos2];
	var lineSymbol = {
				path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
			};
			// If current flight path exists, remove it.
			if ( flightPath ) {
				flightPath.setMap(null)
			}
			// New flight path settings.
			flightPath = new google.maps.Polyline({
				path: line,
				geodesic: true,
				strokeOpacity: 0.8,
				strokeColor: '#FAFAFA',
				strokeWeight: 3,
				icons: [{
					icon: lineSymbol,
					offset: '50%',
					repeat: '50px',
					zIndex: 1
				}]
			});

		function animateSymbol() {
			// Check if an interval already exists and if it does, clear it.
			if ( offsetId ) { window.clearInterval(offsetId) }
			var count = 0;
			// Set timer to move line icon at 60 frames a second.
			offsetId = window.setInterval(function () {
				count = (count + 1) % 200;
				var icons = flightPath.get('icons');
				// Log the icons new position at a half percentage of the count.
				icons[0].offset = (count / 2) + '%';
				// Set the new icons position.
				flightPath.set('icons', icons);
			}, 100);
		}
		animateSymbol();
		// Set new flight path with new settings.
		flightPath.setMap(map);
};

var markerOpt = function () {

	var rt = $('#return-city'),
			dp = $('#depart-city');
	// Changing the map based on icon click on map.
	// If there is no departing city, log this as the departing city.
	if ( pos1 === '' ) {
		sessionStorage.setItem('city1', this.getTitle());
		this.setIcon('img/markers/marker_' + this.title.toLowerCase() + '_selected.png');
		pos1 = this['position'];
		// Trigger a change the departing city input.
		dp.val(this.getTitle()).trigger('change');
	// If the selected city is the departing city.
	} else if ( this['position'].toString() === pos1.toString() ) {
		// Reset marker.
		this.setIcon('img/markers/marker_' + this.title.toLowerCase() + '.png');
		sessionStorage.removeItem('city1');
		// Reset the position variable.
		pos1 = '';
			// If there is also a city already selected as the arrival city, reset it.
			if ( city2 ) {
				city2.setIcon('img/markers/marker_'+ city2.title.toLowerCase() +'.png'); 
				sessionStorage.removeItem('city2');
			}
		city2 = undefined;
		pos2 = '';
			// If a flight path exists, remove it.
			if ( flightPath ) {	
				flightPath.setMap(null); 
			}
		dp.val('').trigger('change');
		rt.val('').trigger('change');
	// Check if the selected city is the arrival city.
	} else if ( this['position'].toString() === pos2.toString() ) {
		sessionStorage.removeItem('city2');
		this.setIcon('img/markers/marker_'+ this.title.toLowerCase() +'.png');
		city2 = undefined;
		pos2 = '';
		rt.val('').trigger('change');
		flightPath.setMap(null);
	// Check if the selected city isn't the departing city.
	} else if ( this['position'] !== pos1 ) {
			if ( city2 ) { 
				city2.setIcon('img/markers/marker_'+ city2.title.toLowerCase() +'.png'); 
			}
		sessionStorage.setItem('city2', this.getTitle());
		city2 = this;
		pos2 = this['position'];
		// Change the selected cities icon to 'selected'.
		this.setIcon('img/markers/marker_' + this.title.toLowerCase() + '_selected.png');
		// Draw a new flight path.
		drawLine(pos1, pos2);
		// Change the value for the arrival city.
		rt.val(this.getTitle()).trigger('change');
	} else {
		// This should never run.
		console.log('If you can read this, I have done something very, very wrong.');
	}

};

// Options that set the map size and options based on the window width.
function initialMap() {

	if ( document.body.clientWidth > 980 ) {
			map.setZoom(8);
			map.setCenter(map.largeLatLng);
			map.setOptions({'zoomControl': false, 'panControl': false, 'draggable': false, 'maxZoom': 8});
	} else if ( document.body.clientWidth < 980 && document.body.clientWidth > 630 ) {
			map.setZoom(7);
			map.setCenter(map.medLatLng);
			map.setOptions({'zoomControl': false, 'panControl': false, 'draggable': false});
			$('#map-canvas').css('height', '');
	} else if ( document.body.clientWidth > 500 && document.body.clientWidth <= 630 ) {
			map.setCenter(map.smallLatLng);
			map.setOptions({'zoomControl': true, zoomControlOptions: google.maps.ZoomControlStyle.SMALL, 'panControl': false, 'draggable': true});
			map.setZoom(6);
	} else if ( document.body.clientWidth <= 500 ) {
		map.setCenter(map.smallLatLng);
		map.setOptions({'zoomControl': false, 'panControl': false, 'draggable': false});
		map.setZoom(5);
	}

};

// Add new simulated flight to the map.
function addSimFlight(flight, loc_dp, loc_rt, chk) {
	// Departing coordinates.
	var dep = new google.maps.LatLng(loc_dp.latitude, loc_dp.longitude);
	// Arrival coordinates.
	var ret = new google.maps.LatLng(loc_rt.latitude, loc_rt.longitude);
	// Speed set to update plane icon once per minute.
	var speed = 60000;
	// Move icon length depending on how many minutes the flight lasts.
	var moveLat = ((loc_dp.latitude - loc_rt.latitude) / flight.flighttime) * -1;
	var moveLng = ((loc_dp.longitude - loc_rt.longitude) / flight.flighttime) * -1;
	var now = new Date();
	var minutes = now.getMinutes();
	var hour = now.getHours();
	var dptime = parseInt(flight.departtime, 10);
	var start = 0;
	var rotation = 0;
	var randomLate = Math.floor(Math.random()*100+1);
	// For every hour, add 100 minutes to 'minutes'. 
	// Changes 12-hour time into 24-hour time.
	while ( hour !== 0 ) {
		minutes += 100;
		hour -= 1;
	}
	// For every minute the current time is away from the departing time,
	// add a single movement increment to the starting position.
	while ( minutes != dptime ) {
		minutes -= 1;
		start += 1;
		if ( minutes.toString().substr(-2, 2) === '99' ) {
			minutes -= 40;
		}
	}
	minutes = minutes.toString()
	while ( minutes.length < 4 ) {
		minutes = '0' + minutes;
	}

	function getRotation(loc_dp, loc_rt) {
		var CityList = {
			Nanaimo: {
				Sechelt: 15,
				Tofino: 270,
				Vancouver: 65,
				Victoria: 150
			},
			Sechelt: {
				Nanaimo: 195,
				Tofino: 240,
				Vancouver: 145,
				Victoria: 165
			},
			Tofino: {
				Nanaimo: 90,
				Sechelt: 50,
				Vancouver: 75,
				Victoria: 120
			},
			Vancouver: {
				Nanaimo: 245,
				Sechelt: 305,
				Tofino: 265,
				Victoria: 200
			},
			Victoria: {
				Nanaimo: 330,
				Sechelt: 345,
				Tofino: 300,
				Vancouver: 35
			}
		}
		rotation = CityList[loc_dp][loc_rt];
	}
	getRotation(loc_dp.name, loc_rt.name);
	// Create array of planes to acces later.
	planes[planes.length] = plane;

	// Content element of a Rich Marker.
	var planeDiv = document.createElement('div');

	// Plane image.
	var planePic = new Image();
	planePic.src = 'img/plane.svg';

	// Create a container for the plane.
	var rotationElement = document.createElement('div');
	var rotationStyles = 'display:block;' +
	                     '-ms-transform: rotate(%rotationdeg);' +
	                     '-o-transform: rotate(%rotationdeg);' +
	                     '-moz-transform: rotate(%rotationdeg);' +
	                     '-webkit-transform: rotate(%rotationdeg);';

	// Replace %rotation with the value of the return rotation.
	rotationStyles = rotationStyles.split('%rotation').join(rotation);
	rotationElement.setAttribute('style', rotationStyles);

	// Append image to the rotation element.
	rotationElement.appendChild(planePic);

	// Append rotation container into the  Rich Marker element.
	planeDiv.appendChild(rotationElement);

	// Create a Rich Marker.
	var plane = new RichMarker(
	    {
	        position: dep,
	        map: map,
	        draggable: false,
	        flat: false,
	        shadow: false,
	        anchor: RichMarkerPosition.MIDDLE,
	        content: planeDiv.innerHTML,
	        visible: false
	    }
	);

	// Set the visibility of of the planes to show that they are separate elements.
	setTimeout(function () {
		plane.setVisible(true);
	}, (flight.flighttime * 15));

	// Create flight information InfoWindow when clicking on plane.
	var boxText = document.createElement("div");
			boxText.className = 'markerlabel';

	// Check if the plane is late.
	if ( flight.late === false ) {
		boxText.innerHTML = '<p class="title">Depart: ' + flight.departcity + '<br>Arrive: ' + flight.arrivalcity + '</p>' + '<p class="text">Flight ' + flight.flightnumber + '<br>Departure: ' + flight.departtime + '<br>Flight Time: ' + flight.flighttime + 'm</p>';
	} else {
		boxText.innerHTML = '<p class="title">Depart: ' + flight.departcity + '<br>Arrive: ' + flight.arrivalcity + '</p>' + '<p class="text">Flight ' + flight.flightnumber + '<br>Departure: ' + flight.departtime + '<br>Flight Delayed: ' + randomLate + 'm<br>Flight Time: ' + ( flight.flighttime + randomLate ) + 'm</p>';
	}

	// Append all information to the InfoWindow.
	var info = new google.maps.InfoWindow({
		content: boxText,
		disableAutoPan: true,
		pixelOffset: new google.maps.Size(30,30)
	});

	// On click of plane, display its information and close all other open windows.
	google.maps.event.addListener(plane, 'click', function () {
		$('.markerlabel').on('click', function () {
			info.close();	
		}).trigger('click');
		info.open(map, plane);
	});
	// On click of InfoWindow, close all open windows.
	$('.markerlabel').live('click', function () {
			info.close();	
	});

	function animateCircle(start, speed, moveLat, moveLng) {
		// Set the number of minutes into the flight the plane is.
		var count = start;
		// Get the planes starting position.
		var planePos = dep.toString().replace(/[^\w\s.-]/gi, '').split(' ');
		// Start plane at flight's current coordinates.
		var newLat = parseFloat(planePos[0], 10) + (moveLat * start);
		var newLng = parseFloat(planePos[1], 10) + (moveLng * start);
		var newPos = new google.maps.LatLng(newLat, newLng);
		plane.setPosition(newPos);
		// Create offset timer to move the plane.
		var offset = flight.flightnumber;
		offset = window.setInterval(function() {
			if ( count < (flight.flighttime - 1) && count >= 0 ) {
				newLat += moveLat;
				newLng += moveLng;
				newPos = new google.maps.LatLng(newLat, newLng);
				plane.setPosition(newPos);
			} else if ( count === flight.flighttime ) {
				// If plane reaches destination, stop timer, close its InfoWindow, log its activity to deployd,
				// and clear the offset.
				plane.setVisible(false);
				info.close();
				dpd.simflights.put(flight.id, {'live': false});
				clearInterval(offset);
			}
			count = (count + 1);			
		}, speed);
	}
	animateCircle(start, speed, moveLat, moveLng);
}

google.maps.event.addDomListener(window, 'load', initialize);