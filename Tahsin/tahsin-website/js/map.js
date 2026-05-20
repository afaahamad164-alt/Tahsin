import {
  loadJSON,
  setActiveNav,
  getClassName
} from './common.js';

let statusElement = document.querySelector('#map-status');
let map = null;

setActiveNav();
initializeMap();

//creates the whole map page. It checks Leaflet, loads data, creates the map, adds markers, adds the location button,and updates status
//called by initializeMap()
//calls loadJSON(), chooseMapTeachers(), addTeacherMarkers(), addMyLocationButton(), and showStatus()
async function initializeMap() {
  try {
    if (typeof L === 'undefined') {
      throw new Error('Leaflet API is not loaded.');
    }

    let teachers = await loadJSON('data/teachers.json');
    let classes = await loadJSON('data/classes.json');

    let mapTeachers = chooseMapTeachers(teachers);

    map = L.map('map').setView([3.139, 101.6869], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    addTeacherMarkers(mapTeachers, classes);
    addMyLocationButton();

    showStatus(mapTeachers.length + ' teacher locations loaded onto the map using API data.');
  } catch (error) {
    showStatus('Unable to load map data.');
    alert('Map data could not be loaded. Please check your internet connection.');
  }
}

//writes a message into the map status element
//called by initializeMap(), showUserLocation(), and error handling
function showStatus(message) {
  if (statusElement) {
    statusElement.textContent = message;
  }
}

//reads teacher IDs saved by teachers.js for the map page
//called by initializeMap(teachers)
function getSavedTeacherIds() {
  let savedText = localStorage.getItem('tahsinMapTeachers');

  if (savedText) {
    return JSON.parse(savedText);
  }

  return [];
}

//decides whether to show all teachers or only the teachers saved from the teacher finder page
//called by initializeMap(teachers)
function chooseMapTeachers(teachers) {
  let savedTeacherIds = getSavedTeacherIds();

  if (savedTeacherIds.length === 0) {
    return teachers;
  }

  let result = [];

  for (let i = 0; i < teachers.length; i++) {
    let currentTeacher = teachers[i];

    if (savedTeacherIds.includes(currentTeacher.id)) {
      result.push(currentTeacher);
    }
  }

  return result;
}

//changes teacher specialty IDs into readable class names for the popup
//called by addTeacherMarkers(currentTeacher, classes)
//uses getClassName() from common.js
function getClassNames(teacher, classes) {
  let classNames = [];

  for (let i = 0; i < teacher.specialties.length; i++) {
    let classId = teacher.specialties[i];
    let className = getClassName(classId, classes);

    classNames.push(className);
  }

  return classNames.join(', ');
}

//add teacher markers to map
//called by initializeMap(mapTeachers, classes)
//uses getClassNames() and the global map variable
//arguments:mapTeachers comes from chooseMapTeachers()
//arguments:classes comes from classes JSON
function addTeacherMarkers(mapTeachers, classes) {
  for (let i = 0; i < mapTeachers.length; i++) {
    let currentTeacher = mapTeachers[i];

    let offset = i * 0.003;
    let latitude = Number(currentTeacher.lat) + offset;
    let longitude = Number(currentTeacher.lng) + offset;
    let classNames = getClassNames(currentTeacher, classes);

    let marker = L.marker([latitude, longitude]).addTo(map);

    let popupHtml = '';

    popupHtml += '<strong>' + currentTeacher.name + '</strong><br>';
    popupHtml += currentTeacher.location + ' · ' + currentTeacher.mode + '<br>';
    popupHtml += 'RM ' + currentTeacher.price + ' / session<br>';
    popupHtml += 'Level: ' + currentTeacher.level + '<br>';
    popupHtml += 'Focus: ' + classNames;

    marker.bindPopup(popupHtml);
  }
}

//add my location button
//called by initializeMap()
//button click event calls showUserLocation()
function addMyLocationButton() {
  if (!statusElement) {
    return;
  }

  let button = document.createElement('button');

  button.type = 'button';
  button.className = 'btn btn-secondary';
  button.textContent = 'Use My Location';
  button.style.marginBottom = '1rem';

  statusElement.insertAdjacentElement('afterend', button);

  button.addEventListener('click', showUserLocation);
}

//asks the browser for the user location and adds it to the map if allowed
//called by the click listener in addMyLocationButton()
//uses Leaflet L.marker and global map
//calls showStatus for feedback
function showUserLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.');
    return;
  }

  showStatus('Finding your location...');

  navigator.geolocation.getCurrentPosition(
    function (position) {
      let latitude = position.coords.latitude;
      let longitude = position.coords.longitude;

      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup('You are here')
        .openPopup();

      map.setView([latitude, longitude], 12);

      showStatus('Your location has been added to the map.');

      alert('Your location was added to the map.');
    },
    function () {
      showStatus('Location permission was not allowed. Teacher map is still available.');

      alert('Location permission was not allowed.');
    }
  );
}
