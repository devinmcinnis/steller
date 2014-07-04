$(document).ready(function() {

	var count = 0,
			posCount = 0,
			cityinput = '',
			rightButton = $('div.right-button > button'),
			leftButton = $('div.left-button > button'),
			size = document.body.clientWidth,
			mq = 400,
			body = $('body'),
			content = $('#page1 div[data-role="content"]'),
			mc = $('#map-canvas'),
			mpi = $('#map-open-icon'),
			sb = $('form.search-box'),
			sc = $('.select-cities'),
			findCenter;

	window.onload = function () {
		var size = document.body.clientWidth;
		if ( size <= mq ) {
			// If user is mobile, add styling for mobile site.
			addClasses();
		} else {
			// If user is desktop, add styling for the desktop site.
			// Prepend the map before the search form.
			mc.prependTo(content);
			removeClasses();
			// Size the depart/return citylist menu.
			// On a timer to allow page to be configured. If not, will display at incorrect position.
			setTimeout( function () {
				positionCityList();
			}, 500);
		}
		// Send a query to deployd and return all of the flights to 'drawMap'
		// which creates the content for the Google Map.
		getCities(drawMap);
		// Hide all content on all pages except for the first page.
		$('div[data-role="content"]').not('#page1 div[data-role="content"], #citylist div[data-role="content"]').css('display', 'none');
	}

	window.onresize = function () {
		var size = document.body.clientWidth;
		if ( size <= mq ) {
		// Mobile
			if ( mc.parent().is(content) === true ) {
				// If the map is before the search form, insert it into the search form.
				mc.prependTo(sb).insertAfter(mpi);
				addClasses();
			}
				sizePricebar();
		} else {
			// Desktop
			if ( mc.parent().is(content) === false ) {
				if ( mc.css('height') > '150px' ){
					// If the map is full screen in mobile view, close is before moving the map.
					if ( map ) { closeFullscreen(); }
				}
				mc.prependTo(content);
				removeClasses();
			}
			setTimeout( function () {
				sizePricebar();
				positionCityList();
			}, 500);

		}
	}

	// Add a full site menu to each page on the mobile site.
	// Have the menu icon, in the top left of mobile, toggle the site menu's visibility.
	$('ul.nav').clone().insertAfter($('div[data-role="page"] div[data-role="header"] > a')).hide();
	$('img.menu-icon').on('click', function () {
		$('ul.nav').slideToggle();
	});

	// Change page function for the 'Find Flights' and 'Continue' buttons.
	function changePage(f, e) {
		// Had to create paramters because once I validated the search form and
		// added the 'changePage' function to the bottom of the 'storeSearch' function,
		// $(this) changed to 'window' instead of the 'Find Flights' button.
		// f = 'Find Flights' button
		// e checks if the Find button is calling this function.
		if ( e === 1 || e === 3 ) {
			var page = f.parents('[data-role="page"]').attr('id');
		} else {
			var page = $(this).parents('[data-role="page"]').attr('id');
		}
		var pagenum = parseInt(page.substring(page.length - 1, page.length), 10) + 1;

		$.mobile.changePage('#page' + pagenum );
		// Change bread crumb styling based on page changes.
		$('div.nav > ul > li:nth-child('+(pagenum - 1)+' ) > a, .ui-state-persist').removeClass('ui-state-persist').addClass('ui-state-ready');
		$('div.nav > ul > li:nth-child('+pagenum+') > a').addClass('ui-state-persist');
		$('#page' + pagenum + ' div[data-role="content"]').css('display', 'block');

		// Remove the styling for the citylist and return its speficied spot in the DOM.
		$('#citylist').css('display', 'none');
	}

	$('#page2 div.cntu-button > button, #page3 div.cntu-button, #page4 div.cntu-button').live('click', changePage);

	// Create new prototypes for the 'Date' object. Used to display the pricebar tabs.
	// 'getShortMonthName' displays the first 3 letters of the month.
	Date.prototype.monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
	Date.prototype.getMonthName = function() {
	    return this.monthNames[this.getMonth()];
	};
	Date.prototype.getShortMonthName = function () {
	    return this.getMonthName().substr(0, 3);
	};

	// 'getShortDayName' displays the first 3 letters of the day.
	Date.prototype.dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  	'Friday', 'Saturday'];
	Date.prototype.getDayName = function() {
	    return this.dayNames[this.getDay()];
	};
	Date.prototype.getShortDayName = function () {
	    return this.getDayName().substr(0, 3);
	};

	// Everytime page 1 displays, refresh the map.
	// Has timer to not conflict with initial creation of map.
	$('#page1').on('pageshow', function () {
		setTimeout(function () {
			// Create map.
			initialize();
			// Size map.
			initialMap();
			// Display selected city-to-city flight path.
			getCities(drawMap);
			positionCityList();
			if ( document.body.clientWidth > 500 ) {
				removeClasses();
			}
		}, 5);
	});

	// Grey bread crumbs on mobile site
	$('div.nav > ul > li').live('click', function (e) {
		// Find what button is being clicked.
		var num = $(this).index() + 1;
		var page = '#page' + num;
		// If the bread crumb is for a page before the current page,
		// apply a 'reverse' swipe transition animation
		var direction = $(this).index() + 1 < parseInt($(this).parents('[data-role="page"]').attr('id').substr(4, 1), 10);

		if ( $(this).children('a').hasClass('ui-state-ready') || $(this).index() === 0 ) {
			// Remove the current styling for the current page's button.
			$('.ui-state-persist').removeClass('ui-state-persist').addClass('ui-state-ready');
			// Remove the old styling and apply the new styling for the new page's button.
			$('div.nav > ul > li:nth-child('+num+')').children('a').removeClass('ui-state-ready').addClass('ui-state-persist');
			$.mobile.changePage(page, {
				reverse: direction
			});
		}
	});

	$('.select-cities > .depart input, .select-cities > .arrive input, #tabs-1 #depart-city,	#tabs-1 #return-city').on('vclick', citylist);

	// Positions the 'Depart'/'Return' citylist on desktop behind the 'Departure/Arrival' section.
	function positionCityList() {
			var top = $('div.select-cities').offset().top + 2;
			var width = $('#sidebar').width();
			var size = document.body.clientWidth;
			var cont = $('div.container').width();

			$('#citylist').css({
				top: top,
				left: size - ((size - cont) / 2) - width
			});
	}

	// Display city options
	function citylist() {
		var size = document.body.clientWidth;
		var dpcity = $('#depart-city');
		var rtcity = $('#return-city');
		var width = $('#sidebar').width();
		var cont = $('div.container').width();
				cityinput = $(this);
		// If clicked from mobile, let jQuery Mobile handle events,
		// else slide out from search form.
		if ( size <= mq ) {
			$.mobile.changePage('#citylist');
		} else {
			$('#citylist').css({
				position: 'absolute',
				display: 'block',
				left: size - ((size - cont) / 2) - width
			}).animate({
				left: '-=145px'
			});
		}
	}
	// On selection of city, add it to selected input and slide options back.
	$('#citylist a').on('vclick', function (event) {
		var size = document.body.clientWidth;
		// Desktop
		if ( size >= mq ) {
			var dpcity = $('#depart-city');
			var rtcity = $('#return-city');
			var city = $(this).html();
			var cityname = city.toLowerCase();
			// Get value from the other city input.
			var otherInput = cityinput.parent().siblings().children('input');
			// Add selection to the input that was selected.
			cityinput.val(city).trigger('change');
			// For every created marker, if the selected city matches, update the map.
			for ( var i in markers ) {
				var title = markers[i]['title'];
				var currentIcon = markers[i].getIcon();
				var icon = '/img/markers/marker_' + title + '.png';
				// Yes, I wrote this regexp that takes the Google Map position object
				// and converts it to an array containing 2 strings.
				var position = markers[i]['position'].toString().replace(/[^\w\s.-]/gi, '').split(' ');
				// Create new object from the select city and new position coordinates
				// to send to the 'drawMap' function.
				var loc = {
					name: city,
					latitude: position[0],
					longitude: position[1]
				};
				// If the selected city matches a marker and the 'Departure City'.
				if ( title === city && title === dpcity.val() ) {
					// If the other (Departure/Arrival) input is the same as the selected city,
					// remove it and the flight path.
					if ( city === otherInput.val() ) {
						otherInput.val('').trigger('change');
						flightPath.setMap(null);
					}
					// Update the marker image.
					markers[i].setIcon('/img/markers/marker_' + cityname + '_selected.png');
					// Send selected city and coordinates to 'drawMap' function to create flight path.
					drawMap(loc);
				// If the selected city matches a marker and the 'Arrival City'.
				} else if ( title === city && title === rtcity.val() ) {
					if ( city === otherInput.val() ) {
						otherInput.val('').trigger('change');
						flightPath.setMap(null);
					}
					markers[i].setIcon('/img/markers/marker_' + cityname + '_selected.png');
					drawMap(loc);
				// If a marker is one of the other previously selected cities, do nothing.
				} else if ( title === dpcity.val() || title === rtcity.val() ) {
					continue;
				// If this marker is neither the depart or return city, change it's icon.
				} else if ( title !== dpcity.val() || title !== rtcity.val() && currentIcon !== icon )  {
					var mTitle = markers[i]['title'].toLowerCase();
					markers[i].setIcon('/img/markers/marker_' + mTitle + '.png');
				}
			// Stop the page from immediately changing page on any selection on the desktop.
			event.stopImmediatePropagation();
			}
			// Slide the menu back on desktop.
			$(this).parents('#citylist').animate({
				left: '+=150'
			});
		// Mobile
		// Assign selected city to selected input.
		} else {
			var city = $(this).text();
			cityinput.val(city).trigger('change');
		}

	});

	// sessionStorage
	function setStorage() {
		var date1 = sessionStorage.getItem('d_depart-date1'),
				date1_rt = sessionStorage.getItem('m_return-date1'),
				date2 = sessionStorage.getItem('d_depart-date2'),
				date2_rt = sessionStorage.getItem('m_return-date2');

		function popFields(firstOrLast, oneOrTwo) {
			// If a first sessionStorage query already exists, move it to the second query
			// and add a new query as the first.
			if ( (firstOrLast === 'first' && date1_rt) || (firstOrLast === 'last' && date2_rt) ) {
				$('.recent p:' + firstOrLast + '-of-type').html(
					sessionStorage.getItem('depart-city' + oneOrTwo)
					+ ' to ' +
					sessionStorage.getItem('return-city' + oneOrTwo)
					+ ' - ' +
					sessionStorage.getItem('m_depart-date' + oneOrTwo)
					+ ' to ' +
					sessionStorage.getItem('m_return-date' + oneOrTwo)
				);
			} else {
				$('.recent p:' + firstOrLast + '-of-type').html(
					sessionStorage.getItem('depart-city' + oneOrTwo)
					+ ' to ' +
					sessionStorage.getItem('return-city' + oneOrTwo)
					+ ' - ' +
					sessionStorage.getItem('m_depart-date' + oneOrTwo)
				);
			}
		}

		if ( date1 ) {
			popFields('first', '1');
		}

		if ( date2 ) {
			popFields('last', '2');
		}
	}

	// Update the
	function loadSession() {
		// If there are no recent searches, do not display a section for it under 'Recent Searches'.
		$('.recent p').each(function () {
			if ( $(this).html() === '' ) {
				$(this).css('display', 'none');
			}
		})

		// On change/update of input fields, update the sessionStorage.
		$('.ss').live('keydown change blur', function () {
			sessionStorage[$(this).attr('id')] = $(this).val();
		});

		// sessionStorage repopulate.
		for ( var i = 0, ssLen = sessionStorage.length; i < ssLen; i += 1 ) {
			// Add sessionStorage items to their respective fields.
			$( '#' + sessionStorage.key(i) ).val(sessionStorage.getItem(sessionStorage.key(i))).trigger('change');
		}
	}

	setStorage();
	loadSession();

	// Resizing of the scrolling/swipeable pricebar boxes on page 2.
	function sizePricebar() {
		// Options for how many boxes per swipe to show and their margin.
		var options = {
					body: document.body.clientWidth,
					margin: 2,
					boxes: 3
				},
				check = $('#tabs-1').hasClass('ui-tabs-hide'),
				m = 0,
				desktop = 0;
		// If it's a one-way flight, size the pricebar accordingly.
		if ( !check ) {
			m = 1;
		} else {
			m = 2;
		}

		var ul = $('ol.price-tabs > ul'),
				ol = $('ol.price-tabs'),
				// boxSize is equal to the size of the display divided by the boxes option plus 1 to give space.
				boxSize = parseInt(options.body / (options.boxes + 1), 10);
		// If sizing a desktop pricebar create concrete values.
		if ( options.body > 400 ) {
			boxSize = 58;
			options.margin = 0;
			// desktop is equal to a single pricebar width.
			desktop = ((options.body - ol.parent().width()) /2);
		}

		var ulCss = {
					width: boxSize,
					height: boxSize,
					'margin-left': options.margin,
					'margin-right': options.margin
				};
		// Take the length of all of the pricebar tabs, divide it in half, and multiple it by the size
		// of however many boxes to display. Add the margin value to each box and the length of the
		// number of boxes. Multiply everything depending on if a return or one-way flight was selected.
		var olWidth = (((ul.length / 2) * boxSize) + (options.margin * ul.length) + ul.length) * m;
				swipeSize = (boxSize * 3) + (options.margin * 2 * 3) + 6;

		ul.css(ulCss);
		ol.css({
			position: 'relative',
			width: olWidth,
			left: -1 * olWidth / 2 + (options.body / 2) - desktop
		});
		// Reset swipeCount.
		swipeCount = 0;
		// Reset disabled buttons on desktop.
		$('.left-button > button, .right-button > button').removeClass('ui-disabled, ui-btn-hidden');
	};

	// Changes to site when sizing up to the desktop version.
	function removeClasses() {
			// Change 'Depart/Departure' title.
			$('.depart-city').html('Departure');
			// Remove jQuery Mobile styling.
			$('.depart-stage > legend, .return-stage > legend label').removeClass('ui-bar-c');
			$('.recent p, #tabs label').removeClass('ui-bar-c');
			$('.price-tabs > ul').removeAttr('style');
			// Change the placeholder text of 'Depart/Arrival' city inputs.
			$('#depart-city').attr('placeholder', 'Departing City');
			$('#return-city').attr('placeholder', 'Arrival City');
			// Change the positioning of the 'Depart/Arrival' sections to the sidebar.
			$('.depart-city').appendTo($('.depart'));
			$('.return-city').appendTo($('.arrive'));
			$('.rt-label').appendTo($('.arrive'));
			$('.price-tabs').removeAttr('style');
			$('.price-tabs li').removeAttr('style');
		}

	// Changes to site when sizing down to the mobile version
	function addClasses() {
			// Remove any inline styling from Javascript on the city list.
			$('#citylist').removeAttr('style');
			// Change 'Depart/Departure' title.
			$('.depart-city').html('Depart');
			// Add jQuery Mobile styling.
			$('.depart-stage > legend, .return-stage > legend').addClass('ui-bar-c');
			$('.recent p, #tabs label').addClass('ui-bar-c');
			// Change the placeholder text of 'Depart/Arrival' city inputs.
			$('#depart-city').attr('placeholder', 'From');
			$('#return-city').attr('placeholder', 'To')
			// Change the positioning of the 'Depart/Arrival' sections to the sidebar.
			$('.depart .depart-city').prependTo($('#tabs-1 .depart-stage > fieldset'));
			$('.arrive .return-city').prependTo($('#tabs-1 .return-stage > fieldset'));
			$('.rt-label').prependTo($('#tabs-1 .return-stage > fieldset'));
			// If there are values in 'Depart/Arrival' inputs, style the respective
			// input in order to line up with mobile icon.
			if ( $('#m_depart-date').val().length > 1 ) {
				$('#m_depart-date').css('padding-top', '5px');
			}
			if ( $('#m_return-date').val().length > 1 ) {
				$('#m_return-date').css('padding-top', '5px');
			}
	};
	// // Function that returns location information from deployd to a function.
	function getCities(func) {
		dpd.locations.get(function (result) {
			result.forEach(function (loc) {
				func(loc);
			});
		});
	};
	// // Creates flight path.
	function drawMap(loc) {
		// If there is currently a flight path, remove it.
		if ( flightPath ) {
			flightPath.setMap(null);
		}

		cityOne = $('#depart-city').val();
		cityTwo = $('#return-city').val();
		// If the departing city is equal to the paramter, log it as pos1.
		if ( cityOne === loc.name ) {
			pos1 = new google.maps.LatLng(loc.latitude, loc.longitude);
		// If the returning city is equal to the paramter, log it as pos2.
		} else if ( cityTwo === loc.name ) {
			pos2 = new google.maps.LatLng(loc.latitude, loc.longitude);
		}
		// If there are 2 positions, draw a new flight path.
		if ( pos1 && pos2 ) {
			drawLine(pos1, pos2);
		}
	}

	// On mobile click of 'Select Cities' button, close the full screen map
	// and return it to default settings.
	$('#map-open-icon + .ui-btn, #map-canvas + .ui-btn').live('vclick', closeFullscreen);

	function closeFullscreen() {
		var content = $('#page1 div[data-role="content"]'),
				mc = $('#map-canvas'),
				mcDiv = $('#map-canvas > div'),
				button = $('#map-canvas + div, .dates + .ui-btn');
		// Reset all inline styling from the map canvas to default settings.
		mc.css({
				position: 'relative',
				'z-index': '',
				top: '',
				height: '',
				width: ''
		});
		// Reset window for map canvas to default settings.
		mcDiv.css({
			height: '100%'
		});
		// Return 'Select Cities' button to default position.
		button.css({
			top: '-15%'
		});
		content.css('position', 'static');

		google.maps.event.trigger(map, 'resize');

		map.setOptions({draggable: true, scrollwheel: true});
		// Refresh map to the size of the window.
		initialMap();

	};

	// Populate search box with 'Recent Search' selection
	// First 'Recent Search' option.
	$('.recent > p:first-of-type').on('vclick', function () {
		// Get all sessionStorage items/keys.
		for ( var i = 0, ssLen = sessionStorage.length; i < ssLen; i += 1 ) {
			var n = sessionStorage.key(i).length;
			// If an item is part of the first option, populate the respective field with it's value.
			if ( sessionStorage.key(i).substring(n-1, n) === '1' ) {
				$( '#' + sessionStorage.key(i).substr(0, n-1) ).val( sessionStorage.getItem( sessionStorage.key(i) ) );
			}
		}
	});
	// Second 'Recent Search' option.
	$('.recent > p:last-of-type').on('vclick', function () {
		for ( var i = 0, ssLen = sessionStorage.length; i < ssLen; i += 1 ) {
			var n = sessionStorage.key(i).length;
			if ( sessionStorage.key(i).substring(n-1, n) === '2' ) {
				$( '#' + sessionStorage.key(i).substr(0, n-1) ).val( sessionStorage.getItem( sessionStorage.key(i) ) );
			}
		}
	});

	// Desktop tabs for dates
	$('#tabs').tabs();

	// Mobile Datepickers
	$('#m_depart-date').datepicker({
		// Set the minimum date to today.
		minDate: 0,
		// Set the maximum date 120 days from today.
		maxDate: "+120d",
		// Display a 1 month calendar.
		numberOfMonths: [1, 1],
		// Format date.
		dateFormat: 'M d',
		// Format the alternative date.
		altFormat: 'DD, MM d',
		// Send alternate date to these fields.
		altField: '#d_depart-date, #d_oneway-depart',
		onSelect: function (dateText) {
			// Set date as one-way date value.
			$('#m_oneway-depart').val(dateText);
			// Set variable to a new Date object.
			var time = $(this).datepicker('getDate');
			// Send Date object to the return date calendars
			// which set their minimum dates to the selected date.
			$('#d_return-date, #m_return-date').datepicker('option', 'minDate', time);
			// Trigger changes for sessionStorage
			$(this).add('#d_depart-date, #d_oneway-depart, #m_oneway-depart').trigger('change');
			// Style the input to line up with mobile icon.
			$('#m_depart-date').css('padding-top', '5px');
		}
	});

	$('#m_return-date').datepicker({
		minDate: 0,
		maxDate: "+120d",
		numberOfMonths: [1, 1],
		dateFormat: 'M d',
		altFormat: 'DD, MM d',
		altField: '#d_return-date',
		onSelect: function (dateText) {
			$(this).add('#d_return-date').trigger('change');
			$('#m_return-date').css('padding-top', '5px');
		}
	});

	$('#m_oneway-depart').datepicker({
		minDate: 0,
		maxDate: "+120d",
		numberOfMonths: [1, 1],
		dateFormat: 'M d',
		altFormat: 'DD, MM d',
		altField: '#d_depart-date, #d_oneway-depart',
		onClose: function (dateText) {
			$('#m_depart-date').val(dateText);
			var time = $(this).datepicker('getDate');
			$('#d_return-date, #m_return-date').datepicker('option', 'minDate', time);
			$('#d_return-date, #m_return-date').val('');
			$(this).add('#d_depart-date, #d_return-date, #d_oneway-depart, #m_depart-date, #m_return-date').trigger('change');
		}
	});

	// Desktop Datepickers
	$('#d_depart-date').datepicker({
		minDate: 0,
		maxDate: "+120d",
		dateFormat: 'DD, MM d',
		altFormat: 'M d',
		altField: '#m_depart-date, #m_oneway-depart',
		onSelect: function (dateText) {
			$('#d_oneway-depart').val(dateText);
			var time = $(this).datepicker('getDate');
			$('#d_return-date, #m_return-date').datepicker('option', 'minDate', time);
			$(this).add('#m_depart-date, #m_oneway-depart, #d_oneway-depart').trigger('change');
		}
	});

	$('#d_return-date').datepicker({
		minDate: 0,
		maxDate: "+120d",
		dateFormat: 'DD, MM d',
		altFormat: 'M d',
		altField: '#m_return-date',
		onSelect: function (dateText) {
			$(this).add('#m_return-date').trigger('change');
		}
	});

	$('#d_oneway-depart').datepicker({
		minDate: 0,
		maxDate: "+120d",
		dateFormat: 'DD, MM d',
		altFormat: 'M d',
		altField: '#m_depart-date, #m_oneway-depart',
		onSelect: function (dateText) {
			$('#d_depart-date').val(dateText);
			$('#d_return-date, #m_return-date').val('');
			$(this).add('#d_depart-date, #d_return-date, #m_depart-date, #m_return-date, #m_oneway-depart').trigger('change');
		}
	});

	// On click of 'Find Flights' button, start validation and deployd query.
	$('input.find_button').live('vclick', storeSearch);

	function storeSearch() {
		var dpcity = $('#depart-city'),
				rtcity = $('#return-city'),
				dpdate = $('#d_depart-date'),
				rtdate = $('#d_return-date');

		// Check to make sure all search inputs have values before continue.
		if ( dpcity.val().length > 1 && rtcity.val().length > 1 && dpdate.val().length > 1 && rtdate.val().length > 1 ) {

			// Log search as a 'recent search'.
			// If a saved item exists, make it the second 'Recent Search' option.
			if ( sessionStorage.getItem('d_depart-date1') && $('.ss').val() !== '' ) {
				// Get all sessionStorage items/keys.
				for ( var i = 0, ssLen = sessionStorage.length; i < ssLen; i += 1 ) {
					// Check to make sure the key isn't 'city1' or 'city2'.
					if ( sessionStorage.key(i) !== 'city1' && sessionStorage.key(i) !== 'city2' ) {
						// Get the key.
						var key = sessionStorage.key(i),
								item = sessionStorage.getItem(key),
								// Get the last digit of the key.
								chop = key.slice(key.length - 1, key.length);
						// If the last digit is a '1', replace it with a '2' and set it as a new key.
						if ( chop === "1" ) {
							var newKey = key.replace(/1/g, "2");
							sessionStorage.setItem(newKey, item);
						}
					}
				}
				// Set all options as the first option.
				$('.ss').each(function () {
					sessionStorage[$(this).attr('id') + '1'] = $(this).val();
				});

			// If no saved items exists, save this as the first option.
			} else if ( $('.ss').val() !== '' ) {

				$('.ss').each(function () {
					sessionStorage[$(this).attr('id') + '1'] = $(this).val();
				});

			}
			// Run query to deployd to populate page 2 flight table.
			changePage($(this), 1);
			getQuery();
		}

	};

	function getQuery(dir) {
		var dptcity = $('#depart-city').val(),
			dptdate = $('#d_depart-date').datepicker('getDate'),
			rtncity = $('#return-city').val(),
			rtndate = $('#d_return-date').datepicker('getDate'),
			check = $('#page1 #tabs-1').hasClass('ui-tabs-hide'),
			size = document.body.clientWidth,
			mq = 500;

		// Remove all items from page 2 and return to defaults
		$('#flight-nav, .price-tabs, .price-content').empty();
		$('#page2 div.cntu-button').remove();
		$('.left-button, .right-button').remove()
		$('.depart-flights-table, .return-flights-table').css('display', '');
		$('ol.confirm-flights > ul:not(:first-child)').remove();
		swipeCount = 0;

		// Create the legend and arrow icons for page 2
		for ( var b = 1; b <= 2; b += 1 ) {
			var container = $('#page2 .depart-flights-table > .price-content'),
					buttonParent = $('#page2 .depart-flights-table .price-tabs-controls');
					legendCheck = container.children().is('.flight-info-legend');

			if ( !check && legendCheck ) {
					container = $('#page2 .return-flights-table > .price-content'),
					buttonParent = $('#page2 .return-flights-table .price-tabs-controls');
			}

			$('<ul>')
				.addClass('flight-info-legend')
				.append('<li class="flightnumber">Flight<br>Number</li>')
				.append('<li class="departcity">Departure<br>City</li>')
				.append('<li class="departtime">Departure<br>Time</li>')
				.append('<li class="arrivalcity">Arrival<br>City</li>')
				.append('<li class="arrivaltime">Arrival<br>Time</li>')
				.append('<li class="price">Your<br>Price</li>')
				.append('<li class="pick"></li>')
				.appendTo(container);

			$('<div>')
				.addClass('left-button')
				.append('<button data-corners="false" style="background:' +
					'url(/img/arrow-left.png) no-repeat scroll 50% 50%;' +
					'background-size: 22px;' +
					'width: 50px;' +
					'height: 58px;' +
					'padding: 0px;' +
					'margin-top: 3px;' +
					'border: none;">' +
					'</button>')
				.prependTo(buttonParent);

			$('<div>')
				.addClass('right-button')
				.append('<button data-corners="false" style="background:' +
					'url(/img/arrow-right.png) no-repeat scroll 50% 50%;' +
					'background-size: 22px;' +
					'width: 50px;' +
					'height: 58px;' +
					'padding: 0px;' +
					'margin-top: 3px;' +
					'border: none;">' +
					'</button>')
				.appendTo(buttonParent);
		}

		// Format date to be able to search the database.
		var formatdptDate = dptdate.getDate() + "-" + (dptdate.getMonth() + 1) + "-" + 12,
			formatrtnDate = rtndate.getDate() + "-" + (rtndate.getMonth() + 1) + "-" + 12;

		// Create new queries for departing and returning flights.
		var rtquery = {'departcity': rtncity, 'arrivalcity': dptcity, 'date': formatrtnDate, $limit: 5, $sort: {tfhour: 1}},
			dptquery = {'departcity': dptcity, 'arrivalcity': rtncity, 'date': formatdptDate, $limit: 5, $sort: {tfhour: 1}};

			console.log(dptquery)
		// Send query to deployd and return to 'Depart' flights table.
		dpd.flights.get(dptquery, function (results) {
			results.forEach(function (flight) {
				console.log(flight)
				 addFlights(2, flight);
			});
		});
		// Send query to deployd and return to 'Return' flights table.
		dpd.flights.get(rtquery, function (results) {
			results.forEach(function (flight) {
				console.log(flight)
				 addFlights(2, flight, 'return');
			});
		});

		// Add the date/price boxes to pricebar. Check to make sure they aren't being
		// added to the same section. Add the 'Continue' button to the 'Return Flights' section
		addTabs(dptdate, dptcity, rtncity, rtndate);

		if ( !check ) {
			addTabs(rtndate, rtncity, dptcity, dptdate, 'return');
		}

		setTimeout( function () {
			$('<div>')
				.addClass('cntu-button')
				.append('<button data-role="button" data-corners="false">' +
								'<p>Continue</p>' + '</li>')
				.appendTo($('#page2 .return-flights-table'));
			sizePricebar();
		}, 200)
	}

	function addTabs(dptdate, dptCity, arrCity, rtndate, check) {
		var date = dptdate,
				checkTab = $('#page1 #tabs-1').hasClass('ui-tabs-hide'),
				checkDiv = $('#flight-nav > div'),
				c = '.depart';

		if ( check === 'return' ) {
			c = '.' + check;
			// Send variable to price tab selection function.
			tabSelect(c, 'return');
		} else {
			tabSelect(c);
		}

		// If there are 2 dates selected, add 'Depart' and 'Return' block tabs to page 2.
		// If one-way flight, only add to first page.
		if ( !checkTab && checkDiv.length < 2 ) {
			$('#flight-nav')
				.append('<div class="departing-flight">' +
								'<p>Depart</p>' +
								'<p>From ' + dptCity + ' on ' + dptdate.getShortMonthName() + " " + dptdate.getDate() + '</p>')
				.append('<div class="returning-flight">' +
								'<p>Return</p>' +
								'<p>From ' + arrCity + ' on ' + rtndate.getShortMonthName() + " " + rtndate.getDate() + '</p>');
				$('#flight-nav > div:first-child').addClass('selected');
		} else if ( checkTab ) {
			$('#flight-nav')
				.append('<div class="departing-flight">' +
								'<p>Depart</p>' +
								'<p>From ' + dptCity + ' on ' + dptdate.getShortMonthName() + " " + dptdate.getDate() + '</p>')
		}

		// Add option to change date to the ends of the pricebar.
		$( c + '-flights-table ol:first-child')
			.append('<ul>' +
							'<li>' +
							'<a href="#page1">Change Date</a>');

		// Set current date 16 days back to start.
		date.setDate( date.getDate() - 16);

		// For 31 days, append a new list with all of the relevant information.
		for (var j = 1; j <= 31; j += 1) {

			date.setDate(date.getDate() + 1);
			// Create new variable to search database
			var setDate = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
			// Create new query with new search date
			var query = {'departcity': dptCity, 'arrivalcity': arrCity, 'date': setDate, $sort: {price: 1}, $limit: 1};
			// If in the middle of the pricebar, append a box with the class 'selected'.
			// If not, append regular box with date.
			if ( j === 16 ) {
				$( c + '-flights-table ol')
				.append('<ul data-date=\"' + setDate + '\" class="selected">' +
								'<li>' + date.getShortDayName() + '</li>' +
								'<li>' + date.getShortMonthName() + ' ' + date.getDate() + '</li>');
			} else {
				$( c + '-flights-table ol')
				.append('<ul style="overflow: hidden;" data-date=\"' + setDate + '\">' +
								'<li>' + date.getShortDayName() + '</li>' +
								'<li>' + date.getShortMonthName() + ' ' + date.getDate() + '</li>');
			}

			if ( $(c + '-flights-table .price-tabs > ul:last-child > li').length > 2 ) {
				$(c + '-flights-table .price-tabs > ul:last-child > li:last-child').remove();
			}

			dpd.flights.get(query, function(result) {
				// Add prices to every box.
				// This is where I was having trouble with returning the result to a variable
				// that could be accessed outside of this scope. Not familiar with objects and
				// I'm pretty sure that's the problem.
				if ( result[0] !== undefined ) {
					var date = result[0]['date'];
					var price = result[0]['price'];
					var box = $(c + '-flights-table .price-tabs > ul[data-date='+date+']');
					box.append('<li class="price">$' + price + '</li>');
				}
			});

		}

		$(c + '-flights-table ol:first-child')
			.append('<ul>' +
							'<li>' +
							'<a href="#page1">Change Date</a>');

		var df = $('#page2 .departing-flight'),
				rf = $('#page2 .returning-flight'),
				dft = $('#page2 .depart-flights-table'),
				rft = $('#page2 .return-flights-table');

		// Add click events to the 'Depart' and 'Return' block tabs.
		df.live('vclick', function () {
			rf.css('opacity', '');
			dft.show();
			rft.hide();
			swipeCount = 0;
		});

		rf.live('vclick', function () {
			rft.show();
			dft.hide();
			swipeCount = 0;
		});

		rft.hide();

		// When the user selects a price/date tab, display the results in the price table.
		function tabSelect(c, chk) {
			$(c + '-flights-table .price-tabs > ul:not(:first-child, :last-child)').live('vclick', function () {
				// Get created data assigned to each list.
				var caldate = $(this).data('date');
				var dpquery = {'departcity': dptCity, 'arrivalcity': arrCity, 'date': caldate};
				// Clear current table.
				$(c + '-flights-table > .price-content > ul.flight-info').remove();
				dpd.flights.get(dpquery, function (results) {
					results.forEach(function (flight) {
						// Add flights to page 2
						addFlights(2, flight, chk);
					});
				});
			});
		}

		var size = document.body.clientWidth;
		var mq = 500;
		// If in mobile, size the pricebar appropriately.
		if ( size <= mq ) {
			sizePricebar();
		}

	}

	// Add flights to pricing table
	// 'page' parameter determines the page it's added to.
	// 'flight' parameter is the dpd returned query.
	// 'dir' parameter is applied if a direction 'depart/return' value is implied.
	function addFlights(page, flight, dir) {
		// Determine container based on parameters.
		// If no 'dir' value, append new flights to 'Depart' section on page 2
		// else append new flights to 'Return' section on page 2.
		var container = $('#page' + page + ' .depart-flights-table .price-content');
		var cfdepart = $('ol.confirmed-price li:nth-child(1)');
		var cfreturn = $('ol.confirmed-price li:nth-child(2)');
		if ( dir === 'return' ) {
				container = $('#page' + page + ' .return-flights-table .price-content');
		// If 'page4' is implied, append new flights to the 'Confirm Flights' section on page 4.
		} else if ( page === 4 ) {
			// Check to see what section user is currently in.
			// If there is already a flight option in the respective section on page 4,
			// remove that flight option and add a new flight.
			if ( $('div.departing-flight').hasClass('selected') ) {
				// Assign container to the departing container.
				container = $('ol.confirm-flight-depart > div');
				// Send flight price to the confirmation section.
				cfdepart.text('$' + flight.price);
				// If there is already depart flight information, remove it and append the new information.
				if ( $('ol.confirm-flight-depart > div > ul').length === 2 ) {
					$('ol.confirm-flight-depart > div > ul:last-of-type').remove();
				}
			} else {
				// Assign container to the returning container.
				container = $('ol.confirm-flight-return > div');
				// Assign the flight price to the confirmation section.
				cfreturn.text('$' + flight.price);
				// Calculate the taxes and total from the logged prices on the confirmation page.
				var taxes = parseFloat(cfdepart.text().substr(1,3), 10) + parseFloat(cfreturn.text().substr(1,3),10) * 0.14;
				var total = parseFloat(cfdepart.text().substr(1,3), 10) + parseFloat(cfreturn.text().substr(1,3),10) + taxes;
				// Send the new taxes and totals to the confirmation page.
				$('ol.confirmed-price li:nth-child(3)').text('$' + taxes.toFixed(2));
				$('ol.confirmed-price li:nth-child(4) strong').text('$' + total.toFixed(2));
				// If there is already return flight information, remove it and append the new information.
				if ( $('ol.confirm-flight-return > div > ul').length === 2 ) {
					$('ol.confirm-flight-return > div > ul:last-of-type').remove();
				}
			}
		}

		// Add the flights from the returned deployd query and append them to the 'container'.
		$('<ul>')
			.addClass('flight-info')
			.append('<li class="flightnumber">' + flight.flightnumber + '</li>')
			.append('<li class="flightnumber">' + flight.departcity + '</li>')
			.append('<li class="departtime">' + flight.departtime + '</li>')
			.append('<li class="flightnumber">' + flight.arrivalcity + '</li>')
			.append('<li class="arrivaltime">' + flight.arrivaltime + '</li>')
			.append('<li class="price">$' + flight.price + '</li>')
			.append('<li class="pick"><img src="img/checkmark_icon.png"></li>')
			.appendTo(container);

	};

	$('#page2 div.price-content > ul:not(:first-child)').live('vclick', selectFlight);

	// On click of selected flight option on page 2, send a query to deployd
	// and add the return query to the respective section on page 4.
	function selectFlight() {
		var flight = $(this).find('.flightnumber').html();

		dpd.flights.get({'flightnumber': flight}, function (confirm) {
			confirm.forEach(function (flight) {
				addFlights(4, flight);
			});
		});
	}

	// When clicking on any tab on page 2, add the class 'selected' to the tab,
	// changing it's color.
	function selected() {
		$(this).siblings().removeClass('selected');
		$(this).addClass('selected');
		// If the click was on a flight option in the flight table on page 2,
		// animate the 'Return' block tab to full opacity.
		if ( $(this).hasClass('flight-info') && $('.return-flights-table').is(':visible') ) {
			$('#page2 div.cntu-button').animate({ opacity: 1 }, 400);
		} else if ( $(this).hasClass('flight-info') && !$('.return-flights-table').is(':visible') ) {
			$('.returning-flight').delay(500).queue(function () {
				$(this).addClass('selected').css('background', '');
				return false;
			});
		}
	};

	$('#page2 .price-tabs > ul, #page2 div#flight-nav > div, #page2 div.price-content > ul.flight-info').live('vclick', selected);

	rightButton.live('vclick', tabScroll);
	leftButton.live('vclick', tabScroll);
	// On desktop, pricebar animation function.
	function tabScroll() {
		var tabs = $(this).parents('.price-tabs-controls').find('.price-tabs');
		var checkPar = $(this).parents('.depart-flights-table');
		var checkDir = $(this).not().parent('.left-button');
			// If the left button has been clicked.
			if ( checkDir[0] ) {
				if ( count > -12 ) {
					// Make sure price isn't currently animating and then animate.
					tabs.filter(':not(:animated)')
						.each(function () {
							count -= 1;
						})
						.animate({'left': '+=60px'}, 250)
					// If pricebar has reach the end, disable the left button.
					if ( count === -12 ) {
						$(this).addClass('ui-disabled');
					// If the pricebar is anywhere except the end, enable both buttons.
					} else {
						$(this).removeClass('ui-disabled');
						$(this).parents('.price-tabs-controls').find('div.right-button > button').removeClass('ui-disabled');
					}
				}
			// Check to see if the right button has been clicked.
			} else {
				if ( count < 12 ) {
					// Make sure price isn't currently animating and then animate.
					tabs.filter(':not(:animated)')
							.each(function () {
								count += 1;
							})
							.animate({ 'left': '-=60px' }, 250)
							.end()
					// If pricebar has reach the end, disable the right button.
					if ( count === 12 ) {
						$(this).addClass('ui-disabled');
					// If the pricebar is anywhere except the end, enable both buttons.
					} else {
						$(this).removeClass('ui-disabled');
						$(this).parents('.price-tabs-controls').find('div.left-button > button').removeClass('ui-disabled');
					}
				}
			}
	}

	// I wrote this a couple of weeks ago. I'm sure it's not very good but I used it to populate
	// my 'FLIGHTS' collection (to be able to search for flights). It somewhat works (with bugs)
	// but I've only included it so you wouldn't have to log in a bunch of flights. Uncomment the
	// following function and refresh the page. Don't forget to re-comment this line after or
	// you'll add 10 new flights on every new page refresh.

	// logNewFlights(2);

	function logNewFlights(n) {
		for ( var i = 0; i < n; i += 1 ) {
			var cities = ['Nanaimo', 'Sechelt', 'Tofino', 'Vancouver', 'Victoria'],
				dptcity = Math.floor(Math.random() * 5),
				rtncity = Math.floor(Math.random() * 5),
				newdate = '',
				dptime = '',
				artime = '',
				tfHour = '';

				while ( dptcity === rtncity ) {
					rtncity = Math.floor(Math.random() * 5);
				}

				dptcity = cities[dptcity];
				rtncity = cities[rtncity];

			function newdpTime() {
				var n = Math.floor(Math.random()*2);
				var t = '';
				var dphour = Math.floor( Math.random() * ( 12 - 6 + 1 ) + 6 );
				var dpmin = Math.floor( Math.random() * 59 + 1 );
				dpmin += "";
				if ( n === 0 ) {
					t = 'am';
				} else {
					t = 'pm';
				}
				if (dpmin.length === 1) {
					return dphour + ":0" + dpmin + t;
				} else {
					return dphour + ":" + dpmin + t;
				}
			}

			function newArrTime(t) {
				var n = parseInt(t, 10);
				if ( n === 12 ) {
					return t = "1" + t.slice(2, t.length);
				} else if ( n === 11 ) {
					return t = (n + 1) + t.slice(2, 5) + "pm";
				} else {
					s = n + '';
					if ( s.length === 2) {
						return t = ( n + 1 ) + t.slice(2, t.length);
					} else {
						return t = ( n + 1 ) + t.slice(1, t.length);
					}
				}
			}

			function twentyfour(t) {
				var tf = t.replace(/[^\d.]/g, ""),
						str = tf.toString(),
						clock =  t.slice(-2, t.length),
						num = 0;
				if ( str.length === 3 ) {
						num = '0' + tf;
					if ( t.slice(-2, t.length) === 'am' ) {
						return num;
					} else {
						num = parseInt(num, 10) + 1200;
						num = num.toString();
						return num;
					}
				} else {
					var start = parseInt(tf.toString().substr(0, 2)),
							end = parseInt(tf.toString().substr(2, tf.length));
					if ( clock === 'am' ) {
						if ( start === 12 ) {
							num = '00' + end;
							return num;
						} else {
							tf = tf.toString();
							return tf;
						}
					} else {
						if ( start === 12 ) {
							tf = tf.toString();
							return tf;
						} else {
							num = (parseInt(tf, 10) + 1200).toString();
							return num
						}
					}
				}
			}
			// Creates a full month of flights for given cities
			for ( var i = 1; i <= 31; i += 1 ) {
				for ( var j = 1; j < 6; j += 1 ) {
					var num = Math.floor(Math.random() * 1500 + 1),
							price = Math.floor(Math.random() * ( 119 - 79 + 1 ) + 79);

					function newDay(day) {
						var date = Math.floor(Math.random()*30+1),
								month = Math.floor(Math.random()*12+1);
						return newdate = i + "-" + '12' + "-2012";
					}

					dptime = newdpTime();
					artime = newArrTime(dptime);
					tfTime = twentyfour(dptime);
					newdate = newDay();

					var newData = {
													'flightnumber': num,
													'date': newdate,
													'departcity': 'Tofino',
													'departtime': dptime,
													'tfhour': tfTime,
													'arrivalcity': 'Vancouver',
													'arrivaltime': artime,
													'price': price
												};

					dpd.flights.post(newData);

					};
				}
			}
		}
});
