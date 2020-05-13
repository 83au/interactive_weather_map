"use strict";

// Create the script tag, set the appropriate attributes
var script = document.createElement('script');
script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyD7clqdFepsrp5BQpJVgIj2vMyQTSUaDPQ&callback=initMap';
script.defer = true;
script.async = true;

function initMap() {
  // Initialize map and set starting point
  var startingCenter = {
    lat: 34.0522,
    lng: -118.2437
  };
  var map = new google.maps.Map(document.getElementById('map'), {
    center: startingCenter,
    zoom: 5
  });
  getWeather('Los Angeles', startingCenter, map); // Initialize geocoder

  var geocoder = new google.maps.Geocoder();
  setListeners(map, geocoder);
}

function setListeners(map, geocoder) {
  // Set click event listener to map
  map.addListener('click', function (e) {
    var latLng = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    map.panTo(latLng);
    geocoder.geocode({
      'location': e.latLng
    }, function (results, status) {
      if (status === 'OK') {
        var place = results[0].formatted_address;
        getWeather(place, latLng, map);
      } else {
        console.log(status);
      }
    });
  }); // Set event listener to form

  document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    geocodeAddress(map, geocoder);
  });
}

function getWeather(place, coords, map) {
  var lat = coords.lat,
      lng = coords.lng;
  var appID = '3f6d3155bc585eeb986f9af8e355a7f9';
  axios("http://api.openweathermap.org/data/2.5/weather?lat=".concat(lat, "&lon=").concat(lng, "&appid=").concat(appID, "&units=imperial")).then(function (result) {
    console.log(result.data);
    var data = result.data;
    var icon = data.weather[0].icon;
    var content = "\n        <div class=\"weather\">\n          <h2 class=\"weather-header\">".concat(place, "</h2>\n          <div class=\"weather-content\">\n            <div class=\"weather-content__main\">\n              <div class=\"temp\">").concat(Math.floor(data.main.temp), "\xB0</div>\n              <div class=\"icon-container\">\n                <img src=\"http://openweathermap.org/img/wn/").concat(icon, "@2x.png\" alt=\"weather icon\">\n              </div>\n            </div>\n          <div class=\"weather-description\">").concat(data.weather[0].description, "</div>\n            <div class=\"winds\">\n              Wind Speed: ").concat(Math.floor(data.wind.speed), " m/s\n            </div>\n            <div class=\"winds\">\n              Humidity: ").concat(data.main.humidity, "%\n            </div>\n          </div>\n        </div>\n      "); // Show first info window at staring point

    var infoWindow = new google.maps.InfoWindow({
      content: content,
      position: coords
    });
    infoWindow.open(map);
  });
}

function geocodeAddress(map, geocoder) {
  var input = document.getElementById('address');
  var address = input.value;
  input.value = '';
  geocoder.geocode({
    'address': address
  }, function (results, status) {
    if (status === 'OK') {
      var location = results[0].geometry.location;
      var latLng = {
        lat: location.lat(),
        lng: location.lng()
      }; // console.log('LOCATION: ' + location);

      map.panTo(location);
      var place = results[0].formatted_address;
      getWeather(place, latLng, map);
    } else {
      console.log('Geocoding was unsuccessful due to the following: ' + status);
    }
  });
} // Append the 'script' element to 'head'


document.head.appendChild(script);