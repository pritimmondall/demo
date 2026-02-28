// ========== Venue Location Checker ==========

let venue = null; // { name, lat, lng, radius }

// --- DOM Elements ---
const venueNameInput = document.getElementById("venueName");
const venueLatInput = document.getElementById("venueLat");
const venueLngInput = document.getElementById("venueLng");
const radiusInput = document.getElementById("radiusMeters");
const setVenueBtn = document.getElementById("setVenueBtn");
const venueStatus = document.getElementById("venueStatus");

const checkLocationBtn = document.getElementById("checkLocationBtn");
const currentLocDisplay = document.getElementById("currentLocDisplay");
const currentLocText = document.getElementById("currentLocText");

const resultContainer = document.getElementById("resultContainer");
const resultPlaceholder = document.getElementById("resultPlaceholder");
const statusBadge = document.getElementById("statusBadge");
const resultVenueName = document.getElementById("resultVenueName");
const resultVenueCoords = document.getElementById("resultVenueCoords");
const resultYourCoords = document.getElementById("resultYourCoords");
const resultDistance = document.getElementById("resultDistance");
const resultRadius = document.getElementById("resultRadius");

// --- Set Venue ---
setVenueBtn.addEventListener("click", () => {
  const name = venueNameInput.value.trim();
  const lat = parseFloat(venueLatInput.value);
  const lng = parseFloat(venueLngInput.value);
  const radius = parseFloat(radiusInput.value);

  if (!name) {
    showVenueStatus("Please enter a venue name.", "error");
    return;
  }
  if (isNaN(lat) || lat < -90 || lat > 90) {
    showVenueStatus("Please enter a valid latitude (-90 to 90).", "error");
    return;
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    showVenueStatus("Please enter a valid longitude (-180 to 180).", "error");
    return;
  }
  if (isNaN(radius) || radius <= 0) {
    showVenueStatus("Please enter a positive radius in meters.", "error");
    return;
  }

  venue = { name, lat, lng, radius };
  showVenueStatus(`Venue "${name}" set at (${lat.toFixed(4)}, ${lng.toFixed(4)}) with ${radius}m radius.`, "success");
  checkLocationBtn.disabled = false;

  // Reset comparison
  resultContainer.classList.add("hidden");
  resultPlaceholder.classList.remove("hidden");
  currentLocDisplay.classList.add("hidden");
});

function showVenueStatus(msg, type) {
  venueStatus.textContent = msg;
  venueStatus.className = `status-msg ${type}`;
  venueStatus.classList.remove("hidden");
}

// --- Check Current Location ---
checkLocationBtn.addEventListener("click", () => {
  if (!venue) {
    alert("Please set a venue location first.");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  checkLocationBtn.disabled = true;
  checkLocationBtn.textContent = "Fetching location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Show current location
      currentLocText.textContent = `Your location: (${userLat.toFixed(6)}, ${userLng.toFixed(6)})`;
      currentLocDisplay.classList.remove("hidden");

      // Compare
      compareLocations(userLat, userLng);

      checkLocationBtn.disabled = false;
      checkLocationBtn.textContent = "Check My Location";
    },
    (error) => {
      let msg = "Unable to retrieve your location.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = "Location permission denied. Please allow location access.";
          break;
        case error.POSITION_UNAVAILABLE:
          msg = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          msg = "Location request timed out. Try again.";
          break;
      }
      alert(msg);
      checkLocationBtn.disabled = false;
      checkLocationBtn.textContent = "Check My Location";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

// --- Haversine Distance (meters) ---
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// --- Compare Locations & Show Status ---
function compareLocations(userLat, userLng) {
  const distance = haversineDistance(userLat, userLng, venue.lat, venue.lng);
  const isWithin = distance <= venue.radius;

  // Determine status tier
  let statusText, statusClass;
  if (isWithin) {
    statusText = "✅ AT VENUE — You are within the allowed radius!";
    statusClass = "badge-success";
  } else if (distance <= venue.radius * 3) {
    statusText = "⚠️ NEARBY — You are close but outside the allowed radius.";
    statusClass = "badge-warning";
  } else {
    statusText = "❌ FAR AWAY — You are not near the venue.";
    statusClass = "badge-danger";
  }

  // Populate results
  statusBadge.textContent = statusText;
  statusBadge.className = `status-badge ${statusClass}`;
  resultVenueName.textContent = venue.name;
  resultVenueCoords.textContent = `(${venue.lat.toFixed(6)}, ${venue.lng.toFixed(6)})`;
  resultYourCoords.textContent = `(${userLat.toFixed(6)}, ${userLng.toFixed(6)})`;
  resultRadius.textContent = `${venue.radius} meters`;

  // Format distance nicely
  if (distance < 1000) {
    resultDistance.textContent = `${distance.toFixed(1)} meters`;
  } else {
    resultDistance.textContent = `${(distance / 1000).toFixed(2)} km`;
  }

  // Show result, hide placeholder
  resultPlaceholder.classList.add("hidden");
  resultContainer.classList.remove("hidden");
}