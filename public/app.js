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

function getWeather(place, coords, map) {
  var lat = coords.lat,
      lng = coords.lng;
  axios("http://localhost:9000/getWeather?lat=".concat(lat, "&lng=").concat(lng)).then(function (result) {
    console.log(result.data);
    var data = result.data;
    var icon = data.weather[0].icon;
    var content = "\n        <div class=\"weather\">\n          <h2 class=\"weather-header\">".concat(place, "</h2>\n          <div class=\"weather-content\">\n            <div class=\"weather-content__main\">\n              <div class=\"temp\">").concat(Math.floor(data.main.temp), "\xB0</div>\n              <div class=\"icon-container\">\n                <img src=\"https://openweathermap.org/img/wn/").concat(icon, "@2x.png\" alt=\"weather icon\">\n              </div>\n            </div>\n          <div class=\"weather-description\">").concat(data.weather[0].description, "</div>\n            <div class=\"winds\">\n              Wind Speed: ").concat(Math.floor(data.wind.speed), " m/s\n            </div>\n            <div class=\"winds\">\n              Humidity: ").concat(data.main.humidity, "%\n            </div>\n          </div>\n        </div>\n      ");
    var contentEl = document.getElementById('content');
    contentEl.innerHTML = content;
    var Popup = createPopupClass();
    var popup = new Popup(new google.maps.LatLng(lat, lng), contentEl);
    popup.setMap(map);
    setTimeout(function () {
      return contentEl.classList.add('show');
    }, 200); // Show first info window at staring point
    // const infoWindow = new google.maps.InfoWindow({
    //   content: content,
    //   position: coords
    // });
    // infoWindow.open(map);
  });
}

function createPopupClass() {
  function Popup(position, content) {
    this.position = position;
    content.classList.add('popup-bubble'); // This zero-height div is positioned at the bottom of the bubble.

    var bubbleAnchor = document.createElement('div');
    bubbleAnchor.classList.add('popup-bubble-anchor');
    bubbleAnchor.appendChild(content); // This zero-height div is positioned at the bottom of the tip.

    this.containerDiv = document.createElement('div');
    this.containerDiv.classList.add('popup-container');
    this.containerDiv.appendChild(bubbleAnchor); // Optionally stop clicks, etc., from bubbling up to the map.

    google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.containerDiv);
  } // ES5 magic to extend google.maps.OverlayView.


  Popup.prototype = Object.create(google.maps.OverlayView.prototype);
  /** Called when the popup is added to the map. */

  Popup.prototype.onAdd = function () {
    this.getPanes().floatPane.appendChild(this.containerDiv);
  };
  /** Called when the popup is removed from the map. */


  Popup.prototype.onRemove = function () {
    if (this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv);
    }
  };
  /** Called each frame when the popup needs to draw itself. */


  Popup.prototype.draw = function () {
    var divPosition = this.getProjection().fromLatLngToDivPixel(this.position); // Hide the popup when it is far out of view.

    var display = Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ? 'block' : 'none';

    if (display === 'block') {
      this.containerDiv.style.left = divPosition.x + 'px';
      this.containerDiv.style.top = divPosition.y + 'px';
    }

    if (this.containerDiv.style.display !== display) {
      this.containerDiv.style.display = display;
    }
  };

  return Popup;
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
      };
      map.panTo(location);
      var place = results[0].formatted_address;
      getWeather(place, latLng, map);
    } else {
      console.log('Geocoding was unsuccessful due to the following: ' + status);
    }
  });
} // Append the 'script' element to 'head'


document.head.appendChild(script);