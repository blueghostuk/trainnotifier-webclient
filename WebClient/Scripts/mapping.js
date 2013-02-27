/// <reference path="jquery-1.8.2.min.js" />

var mapOptions;
var map;
var transitLayer;

function preLoadMap() {
    if (map)
        return;

    mapOptions = {
        center: new google.maps.LatLng(52.8382, -2.327815),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    // only really TFL areas for now
    //transitLayer = new google.maps.TransitLayer();
    //transitLayer.setMap(map);

    var styleArray = [
      {
          featureType: "all",
          stylers: [
            { visibility: "off" }
          ]
      },
      {
          featureType: "landscape",
          stylers: [
              { visibility: "on" },
          ]
      },
      {
          featureType: "administrative",
          stylers: [
              { visibility: "on" },
          ]
      },
      {
          featureType: "water",
          stylers: [
              { visibility: "on" },
          ]
      },
      {
          featureType: "transit.line",
          stylers: [
              { visibility: "on" },
              { lightness: -65 },
              { saturation: 100 },
              { gamma: 1.8 },
              { hue: "#FF7B00" }
          ]
      },
      {
          featureType: "transit.station.rail",
          stylers: [
              { visibility: "on" },
              { lightness: -65 },
              { saturation: 100 },
              { gamma: 1.8 },
              { hue: "#FF7B00" }
          ]
      }
    ];

    map.setOptions({ styles: styleArray });
}

var markersArray = [];

function clearMarkers() {
    if (markersArray) {
        for (i in markersArray) {
            markersArray[i].setMap(null);
        }
        markersArray.length = 0;
    }
}

function centreMap() {
    if (!map)
        return;

    var latlngbounds = new google.maps.LatLngBounds();
    for (i in markersArray)
        latlngbounds.extend(markersArray[i].position);
    map.setCenter(latlngbounds.getCenter());
    map.fitBounds(latlngbounds);

    console.log("markersArray.length:" + markersArray.length);
    console.log("latlngbounds.getCenter():" + latlngbounds.getCenter());
}