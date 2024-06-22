// Initialize the map with the canvas renderer for better performance
var map = L.map('map', {
    center: [47.5, 13.05],
    zoom: 4,
    renderer: L.canvas() // Use canvas renderer
});

// Add OpenStreetMap as a base layer
var osmap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a scale bar to the map, positioned at the bottom right, with metric units only
L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

// Define colors based on data values (-1 to 1 range)
function getColor(d) {
    return d < 0 ? 'green' :
           d > 0 ? 'red' :
           'white'; // fallback color for values exactly equal to 0
}

// Create linear gradient color scale
function getGradientColor(value) {
    var startColor = [0, 255, 0]; // green
    var endColor = [255, 0, 0]; // red
    var ratio = (value + 1) / 2; // normalize value to range [0, 1]

    var r = Math.round(startColor[0] * (1 - ratio) + endColor[0] * ratio);
    var g = Math.round(startColor[1] * (1 - ratio) + endColor[1] * ratio);
    var b = Math.round(startColor[2] * (1 - ratio) + endColor[2] * ratio);

    return `rgb(${r},${g},${b})`;
}

// Create legend control with linear gradient
var legend = L.control({ position: 'bottomleft' });

legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend');
    var grades = [-1, 0, 1]; // Values to display in legend
    var labels = [-1, -0.5, 0, 0.5, 1]; // Intermediate labels for clarity

    // Add linear gradient color scale bar
    div.innerHTML += '<div class="color-scale"></div>';

    // Add labels in one row
    var labelsDiv = L.DomUtil.create('div', 'labels');
    labels.forEach(function(label) {
        var labelDiv = L.DomUtil.create('span', '', labelsDiv);
        labelDiv.innerHTML = label;
    });
    div.appendChild(labelsDiv);

    return div;
};

// Add legend control to the map
legend.addTo(map);


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
    // Clear existing markers from the map and scatter plot
    geoJsonLayer.clearLayers();

    // Filtered data array based on map bounds and slider values
    var filteredData = [];

    // Get current map bounds
    var bounds = map.getBounds();

    // Iterate over each feature in COUNT GeoJSON data
    COUNT.features.forEach(function (feature) {
        var normalizedData = feature.properties.trendline_slope_minmmax_normalized_data;
        var latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);

        // Check if the feature's value is within the filter range and within map bounds
        if (normalizedData >= currentMinFilterValue && normalizedData <= currentMaxFilterValue && bounds.contains(latlng)) {
            // Create a circle marker with custom color based on the value
            var marker = L.circleMarker(latlng, {
                radius: 6,
                fillColor: getColor(normalizedData),
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.4
            }).bindPopup('Name: ' + feature.properties.NAME + '<br>Value: ' + normalizedData);

            // Add marker to filtered GeoJSON layer
            geoJsonLayer.addLayer(marker);

            // Add value to filtered data array for scatter plot
            filteredData.push(normalizedData);
        }
    });

    // Log filtered data for debugging
    console.log('Filtered Data:', filteredData);

    // Create or update scatter plot with filtered data
    createScatterPlot(filteredData);
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
                backgroundColor: data.map(value => getColor(value)),
                borderColor: 'rgba(0, 0, 0, 1)',
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
            },
            plugins: {
                legend: {
                    display: false // Hide Chart.js legend as we have a separate legend
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
        // Create a GeoJSON layer without using markerClusterGroup
        var geoJsonLayer = L.geoJson(null, {
            pointToLayer: function (feature, latlng) {
                var normalizedData = feature.properties.trendline_slope_minmmax_normalized_data;

                // Create a circle marker with custom color based on the value
                return L.circleMarker(latlng, {
                    radius: 2,
                    fillColor: getColor(normalizedData),
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.2
                }).bindPopup('Name: ' + feature.properties.NAME + '<br>Value: ' + normalizedData);
            }
        });

        // Add each feature to the GeoJSON layer
        COUNT.features.forEach(function (feature) {
            geoJsonLayer.addData(feature);
        });

        // Add GeoJSON layer to the map
        geoJsonLayer.addTo(map);

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
