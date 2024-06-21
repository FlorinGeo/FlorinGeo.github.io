// Initialize the map with the canvas renderer for better performance
var map = L.map('map', {
    center: [47.5, 13.05],
    zoom: 8,
    renderer: L.canvas() // Use canvas renderer
});

// Add OpenStreetMap as a base layer
var osmap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a scale bar to the map, positioned at the bottom right, with metric units only
L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

// Create a marker cluster group
var markers = L.markerClusterGroup();

// Variable to store the Chart.js instance
var chart;

// Input range sliders for filtering data
var minFilterSlider = document.getElementById('minFilterSlider');
var maxFilterSlider = document.getElementById('maxFilterSlider');
var minFilterValue = document.getElementById('minFilterValue');
var maxFilterValue = document.getElementById('maxFilterValue');

// Initialize filter values and slider positions
var currentMinFilterValue = -1;
var currentMaxFilterValue = 1;

// Event listeners for input sliders
minFilterSlider.addEventListener('input', function() {
    currentMinFilterValue = parseFloat(minFilterSlider.value);
    minFilterValue.textContent = currentMinFilterValue;

    // Update both the map and the scatter plot based on new filter values
    updateFilteredData();
});

maxFilterSlider.addEventListener('input', function() {
    currentMaxFilterValue = parseFloat(maxFilterSlider.value);
    maxFilterValue.textContent = currentMaxFilterValue;

    // Update both the map and the scatter plot based on new filter values
    updateFilteredData();
});

// Function to update both the map and the scatter plot with filtered markers
function updateFilteredData() {
    // Clear existing markers from the cluster group
    markers.clearLayers();

    // Get current map bounds
    var bounds = map.getBounds();

    // Filtered data array based on map bounds and slider values
    var filteredData = [];

    // Iterate over each layer in geoJsonLayer
    geoJsonLayer.eachLayer(function (layer) {
        // Check if the layer is within the map bounds and within the filter range
        var normalizedData = layer.feature.properties.trendline_slope_minmmax_normalized_data;
        if (bounds.contains(layer.getLatLng()) &&
            normalizedData >= currentMinFilterValue &&
            normalizedData <= currentMaxFilterValue) {
            // Add layer back to the marker cluster group
            markers.addLayer(layer);

            // Add data to the filteredData array for scatter plot
            filteredData.push(normalizedData);
        }
    });

    // Log filtered data for debugging
    console.log('Filtered Data:', filteredData);

    // Create the scatter plot with the filtered data
    createScatterPlot(filteredData);

    // Add updated marker cluster group back to the map
    map.addLayer(markers);
}

// Function to create scatter plot using Chart.js
function createScatterPlot(data) {
    var ctx = document.getElementById('scatterPlot').getContext('2d');

    // Destroy previous chart instance if it exists
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Normalized Data',
                data: data.map((value, index) => ({ x: index, y: value })),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                },
                y: {
                    type: 'linear',
                    beginAtZero: true
                    // Add other scale options as needed
                }
            }
        }
    });

    // Log the chart instance for debugging
    console.log('Chart Instance:', chart);
}

// Check if the COUNT variable is defined and contains features
if (COUNT && COUNT.features && COUNT.features.length > 0) {
    try {
        // Create GeoJSON layer and add it to the marker cluster group
        var geoJsonLayer = L.geoJson(COUNT, {
            style: { color: "#FF0000", weight: 5 },
            onEachFeature: function (feature, layer) {
                // Bind popup or any other interaction here if needed
                layer.bindPopup('Feature: ' + feature.properties.trendline_slope_minmmax_normalized_data);
            }
        });
        markers.addLayer(geoJsonLayer);

        // Add marker cluster group to the map
        map.addLayer(markers);

        // Update both the map and the scatter plot when map view changes
        map.on('moveend', updateFilteredData);

        // Initial update of the map and scatter plot
        updateFilteredData();
    } catch (error) {
        console.error('Error adding GeoJSON layer:', error);
    }
} else {
    console.error('No features found in the COUNT variable');
}
