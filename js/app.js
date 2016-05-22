(function(){

// Location data
var locationData = [
	{
		name: 'Cactus Taqueria #1',
		lat: 34.0882,
		lng: -118.3263,
		description: 'Description'
	},
	{
		name: 'Tatsu Ramen',
		lat: 34.0836,
		lng: -118.3446,
		description: 'Description'
	},
	{
		name: "Flaming Patty's",
		lat: 34.0841,
		lng: -118.3260,
		description: 'Description'
	},
	{
		name: 'Pavilions',
		lat: 34.08457,
		lng: -118.3272,
		description: 'Description'
	},
	{
		name: 'Groundworks',
		lat: 34.0981,
		lng: -118.3297,
		description: 'Description'
	},
	{
		name: 'Sassafras',
		lat: 34.0935,
		lng: -118.3272,
		description: 'Description'
	},
	{
		name: 'Hollywood Forever Cemetery',
		lat: 34.0904,
		lng: -118.3198,
		description: 'Description'
	},
	{
		name: 'Harvard & Stone',
		lat: 34.1019,
		lng: -118.3043,
		description: 'Description'
	},
	{
		name: 'Bardot',
		lat: 34.1027,
		lng: -118.3267,
		description: 'Description'
	},
	{
		name: 'The Virgil',
		lat: 34.0910,
		lng: -118.2870,
		description: 'Description'
	}
];


// Location object
var Location = function(data) {
	this.name = data.name;
	this.lat = data.lat;
	this.lng = data.lng;
	this.description = data.description;
};


// ViewModel
var ViewModel = function() {
	var self = this;
	
	// Variable for requested Foursquare data
	self.foursquareInfo = '';

	// Empty array to hold Locations
	this.locationList = ko.observableArray([]);
	
	// Hold value from search field
	this.search = ko.observable('');

	// Create objects from location data and saves to location list array
	locationData.forEach(function(item){
		this.locationList.push(new Location(item));
	}, this);

	// Define current location as first location in array
	this.currentLocation = ko.observable(this.locationList()[0]);

	// Invoke when list item is clicked
	this.setLocation = function(clickedLocation) {

		// Sets current location to item clicked
		self.currentLocation(clickedLocation);

		// Saves index of location clicked
		var index = self.filteredItems().indexOf(clickedLocation);

		// Activates the selected marker to change icon.
		self.activateMarker(self.markers[index], self, self.infowindow, index)();

		// Calls Foursquare function to update infowindow.
		self.getFoursquareInfo(clickedLocation);

	};

    // Filter location name with value from search field
	this.filteredItems = ko.computed(function() {
	    var searchTerm = self.search().toLowerCase().trim();
		
	    if (!searchTerm) {
	        return self.locationList();
	    } else {
	        return ko.utils.arrayFilter(self.locationList(), function(item) {
	        	// Returns true if location name is found
            	return item.name.toLowerCase().indexOf(searchTerm) !== -1;
	        });
	    }
	});


	// Initialize Google Map
  	this.map = new google.maps.Map(document.getElementById('map'), {
        	center: {lat: 34.0954, lng: -118.3198},
            zoom: 14,
			mapTypeControl: false,
			streetViewControl: false
        });
		
    // Center map on window resize
	google.maps.event.addDomListener(window, "resize", function() {
			var center = self.map.getCenter();
			google.maps.event.trigger(this.map, "resize");
			self.map.setCenter(center);
		});
		
	// Add list to map
	var list = (document.getElementById('list'));
    this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(list);

  	// Array to hold markers
	this.markers = [];

	// Initialize infowindow properties
	this.infowindow = new google.maps.InfoWindow({
		maxWidth: 320
	});

	// Render markers from location array
	this.renderMarkers(self.locationList());

	// Subscribe to changed in search field. If have change, render again with the filtered locations
  	this.filteredItems.subscribe(function(){
		self.renderMarkers(self.filteredItems());
  	});

  	// Event listener for map click event outside of infowindow
	google.maps.event.addListener(self.map, 'click', function(event) {
	    self.infowindow.close();
	});
};


// Clear markers from map
ViewModel.prototype.clearMarkers = function() {
	for (var i = 0; i < this.markers.length; i++) {
		this.markers[i].setMap(null);
	}
		this.markers = [];
};


// Render markers
ViewModel.prototype.renderMarkers = function(locationInfo) {

	// Clear old markers before render
	this.clearMarkers();
	var infowindow = this.infowindow;
	var context = this;
	var locationsToShow = locationInfo;

	// Create new marker and push to markers array
  	for (var i = 0;i < locationsToShow.length; i ++) {
		var location = {lat: locationsToShow[i].lat, lng: locationsToShow[i].lng};
		var marker = new google.maps.Marker({
				position: location,
				map: this.map,
				icon: 'img/red-dot.png',
				animation: google.maps.Animation.DROP
			});

		this.markers.push(marker);

		// Add marker to map
		this.markers[i].setMap(this.map);

		// Add event listener for click on marker
		marker.addListener('click', this.activateMarker(marker, context, infowindow, i));
  	}
};


// Opens marker's infowindow from marker or list click
ViewModel.prototype.activateMarker = function(marker, context, infowindow, index) {

	return function() {

		// Check if there is an index. If there is, request comes from click on the marker event
		if (!isNaN(index)) {
			
			var place = context.filteredItems()[index];
			
			// Updates infowindow content if description not updated
			if (place.description === 'Description') {
				context.updateContent(context, place);
			}			
		}
		// Close open infowindow
		infowindow.close();

		// Wait for Foursquare info and then open targeted infowindow.
		// Set marker animation
		// Add promise/event on API request finish.
		setTimeout(function() {
			infowindow.open(context.map, marker);
			marker.setAnimation(google.maps.Animation.BOUNCE);
		}, 600);

		// Stop marker animation
		setTimeout(function() {
			marker.setAnimation(null);
		}, 1550);
	};
};


// Update content of infowindow
ViewModel.prototype.updateContent = function(context, place){
	
    // Request Foursquare information
	this.getFoursquareInfo(place);

	// Update infowindow when Foursquare request returns
	setTimeout(function() {
      var html = '<div class="info-content">' +
		'<h3>' + place.name + '</h3>' +
		'<p>' + self.foursquareInfo + '</p>' + '</div>';
		
      context.infowindow.setContent(html);
      //infowindow.open(map, marker); 
    }, 300); 		
};


// Foursquare Credentials
var clientID = 'TQCEYCKSV2ZMVODM3ZUKFZG40AYM10YFS1O2S1GTHEP2N5RR';
var clientSecret = '0HNJERN1UEUFI5NL0OLKM3RIQH4PDZQLW2ZRKOCYHHQGJ4YS';


// Request information from Foursquare API
 ViewModel.prototype.getFoursquareInfo = function(point) {
	 
    // Create Foursquare URL from clicked marker
    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientID + '&client_secret=' + 
	clientSecret + '&v=20150321' + '&ll=' +point.lat+ ',' +point.lng+ '&query=\'' +point.name +'\'&limit=1';
	
    $.getJSON(foursquareURL)
      .done(function(response) {
		self.foursquareInfo = '<p>';
        var venue = response.response.venues[0];         
        // Phone Number     
        var phoneNum = venue.contact.formattedPhone;
            if (phoneNum !== null && phoneNum !== undefined) {
                self.foursquareInfo += 'Phone: ' +
                  phoneNum + '<br>';
            } else {
              self.foursquareInfo += 'Phone: Not Found';
            }
		self.foursquareInfo += '<p>Information via the Foursquare API';				
      }).fail(function() {
		  self.foursquareInfo = 'Additional information failed to load';
	  })	
  };  
  


  
// Initialize ViewModel
ko.applyBindings(new ViewModel());

})();