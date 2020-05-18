// Create the script tag, set the appropriate attributes
const script = document.createElement('script');
script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyD7clqdFepsrp5BQpJVgIj2vMyQTSUaDPQ&callback=initMap';
script.defer = true;
script.async = true;


function initMap() {
  // Initialize map and set starting point
  const startingCenter = { lat: 34.0522, lng: -118.2437 };
  const map = new google.maps.Map(document.getElementById('map'), {
    center: startingCenter,
    zoom: 5
  });
  getWeather('Los Angeles', startingCenter, map);

  // Initialize geocoder
  const geocoder = new google.maps.Geocoder();

  setListeners(map, geocoder);
}


function getWeather(place, coords, map) {
  const {lat, lng } = coords;

  axios(`http://localhost:9000/getWeather?lat=${lat}&lng=${lng}`)
    .then(result => {
      console.log(result.data);
      const { data } = result;
      const icon = data.weather[0].icon;
      const isNight = icon.match(/n$/);

      setMapStyles(map, isNight);

      let content = `
        <div class="weather">
          <h2 class="weather-header">${place}</h2>
          <div class="weather-content">
            <div class="weather-content__main">
              <div class="temp">${Math.floor(data.main.temp)}°</div>
              <div class="icon-container">
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather icon">
              </div>
            </div>
            <div class="weather-description">${data.weather[0].description}</div>
            <div class="weather-info">
              <div class="winds">
                Wind Speed: ${Math.floor(data.wind.speed)} m/s
              </div>
              <div class="humidity">
                Humidity: ${data.main.humidity}%
              </div>
            </div>
          </div>
          </div>
        </div>
      `;

      const contentEl = document.getElementById('content');
      contentEl.innerHTML = content;

      const Popup = createPopupClass();
      const popup = new Popup(
        new google.maps.LatLng(lat, lng),
        contentEl
      );
      popup.setMap(map);

      // Make Popup popin and check for nightmode
      setTimeout(() => {
        contentEl.classList.add('show');
        if (isNight) {
        contentEl.classList.add('night');
        } else {
          contentEl.classList.remove('night');
        }
      }, 200);
    });
}


function setMapStyles(map, night) {
  if (night) {
    map.setOptions({
      styles: [
        {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
        {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
        {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{color: '#d59563'}]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{color: '#d59563'}]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{color: '#263c3f'}]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{color: '#6b9a76'}]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{color: '#38414e'}]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{color: '#212a37'}]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{color: '#9ca5b3'}]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{color: '#746855'}]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{color: '#1f2835'}]
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{color: '#f3d19c'}]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{color: '#2f3948'}]
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{color: '#d59563'}]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{color: '#17263c'}]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{color: '#515c6d'}]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{color: '#17263c'}]
        }
      ]
    })
  } else {
    map.setOptions({styles: []});
  }
}


function setListeners(map, geocoder) {
  // Set click event listener to map
  map.addListener('click', e => {
    const latLng = {lat: e.latLng.lat(), lng: e.latLng.lng()};
    map.panTo(latLng);
    geocoder.geocode({'location': e.latLng}, (results, status) => {
      if (status === 'OK') {
        const place = results[0].formatted_address;
        getWeather(place, latLng, map);
      } else {
        console.log(status);
      }
    });
  });

  // Set event listener to form
  document.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    geocodeAddress(map, geocoder);
  });
}


function geocodeAddress(map, geocoder) {
  let input = document.getElementById('address');
  let address = input.value;
  input.value = '';

  geocoder.geocode({'address': address}, (results, status) => {
    if (status === 'OK') {
      const location = results[0].geometry.location;
      const latLng = { lat: location.lat(), lng: location.lng() };
      map.panTo(location);
      const place = results[0].formatted_address;
      getWeather(place, latLng, map);

    } else {
      console.log('Geocoding was unsuccessful due to the following: ' + status);
    }
  });
}


function createPopupClass() {
  function Popup(position, content) {
    this.position = position;

    content.classList.add('popup-bubble');

    // This zero-height div is positioned at the bottom of the bubble.
    const bubbleAnchor = document.createElement('div');
    bubbleAnchor.classList.add('popup-bubble-anchor');
    bubbleAnchor.appendChild(content);

    // This zero-height div is positioned at the bottom of the tip.
    this.containerDiv = document.createElement('div');
    this.containerDiv.classList.add('popup-container');
    this.containerDiv.appendChild(bubbleAnchor);

     // Optionally stop clicks, etc., from bubbling up to the map.
    google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.containerDiv);
  }

  // ES5 magic to extend google.maps.OverlayView.
  Popup.prototype = Object.create(google.maps.OverlayView.prototype);

  /** Called when the popup is added to the map. */
  Popup.prototype.onAdd = function() {
    this.getPanes().floatPane.appendChild(this.containerDiv);
  };

  /** Called when the popup is removed from the map. */
  Popup.prototype.onRemove = function() {
    if (this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv);
    }
  };

  /** Called each frame when the popup needs to draw itself. */
  Popup.prototype.draw = function() {
    var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);

    // Hide the popup when it is far out of view.
    var display =
        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
        'block' :
        'none';

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

// Append the 'script' element to 'head'
document.head.appendChild(script);
