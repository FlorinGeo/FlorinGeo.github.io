// Using Leaflet for creating the map and adding controls for interacting with the map

//
//--- Part 1: adding base maps ---
//

//creating the map; defining the location in the center of the map (geographic coords) and the zoom level. These are properties of the leaflet map object
//the map window has been given the id 'map' in the .html file
var map = L.map('map', {
	center: [47.5, 13.05],
	zoom: 8
});


//adding base map/s 

// add open street map as base layer
var osmap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	

// for using the two base maps in the layer control, I defined a baseMaps variable
var baseMaps = {
	"Open Street Map": osmap
}

//
//---- Part 2: Adding a scale bar
//
L.control.scale({position:'bottomright',imperial:false}).addTo(map);

//
//---- Part 3: adding GeoJSON line features 
//

L.geoJson(COUNT, {style: {color: "#FF0000", weight: 5}}).addTo(map);
