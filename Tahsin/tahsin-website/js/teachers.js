import {
  loadJSON,
  setActiveNav,
  readSelectedClass,
  matchesSearch,
  getMatchScore,
  sortTeachers,
  teacherCardHTML,
  getClassName
} from './common.js';

let elements = {
  selectedClassTitle: document.querySelector('#selected-class'),
  searchInput: document.querySelector('#search'),
  modeInput: document.querySelector('#mode'),
  levelInput: document.querySelector('#level'),
  budgetInput: document.querySelector('#budget'),
  sortInput: document.querySelector('#sort'),
  filterForm: document.querySelector('#finder-form'),
  teacherList: document.querySelector('#teacher-list'),
  teacherStatus: document.querySelector('#teacher-status'),
  recommendationBox: document.querySelector('#recommendation-box'),
  comparisonTable: document.querySelector('#comparison-body'),
  resetFiltersButton: document.querySelector('#reset-filters'),
  resetComparisonButton: document.querySelector('#reset-compare')
};

let teachers = [];
let classes = [];
let selectedTeacherIds = JSON.parse(localStorage.getItem('tahsinCompare') || '[]');


setActiveNav(); // Highlight the active navigation link based on the current page.
setupPageEvents(); // Set up event listeners for filter inputs and buttons.
initializePage(); // Load teacher and class data, then display the teachers based on filters and show recommendations and comparison table.

async function initializePage() {
  try {
    teachers = await loadJSON('data/teachers.json');
    classes = await loadJSON('data/classes.json');

    showSelectedClassTitle();
    showTeachers();
    showComparisonTable();
  } catch (error) {
    if (elements.teacherList) {
      elements.teacherList.innerHTML = '<div class="empty-state">Unable to load teacher data.</div>';
    }

    if (elements.teacherStatus) {
      elements.teacherStatus.textContent = 'Data loading failed.';
    }
  }
}

function setupPageEvents() {
  if (elements.filterForm) {
    elements.filterForm.addEventListener('input', showTeachers);
    elements.filterForm.addEventListener('change', showTeachers);
  }

  if (elements.resetFiltersButton) {
    elements.resetFiltersButton.addEventListener('click', resetFilters);
  }

  if (elements.resetComparisonButton) {
    elements.resetComparisonButton.addEventListener('click', resetComparison);
  }
}

//save selected class
function showSelectedClassTitle() {
  if (!elements.selectedClassTitle) {
    return;
  }

  let selectedClassId = readSelectedClass();

  if (selectedClassId) {
    elements.selectedClassTitle.textContent = getClassName(selectedClassId, classes);
  } else {
    elements.selectedClassTitle.textContent = 'Teacher Finder';
  }
}

//get user choices
//called by showTeachers()
function getCurrentFilters() {
  let filters = {
    classId: '',
    search: '',
    mode: '',
    level: '',
    budget: ''
  };

  filters.classId = readSelectedClass();

  if (elements.searchInput) {
    filters.search = elements.searchInput.value;
  }

  if (elements.modeInput) {
    filters.mode = elements.modeInput.value;
  }

  if (elements.levelInput) {
    filters.level = elements.levelInput.value;
  }

  if (elements.budgetInput) {
    filters.budget = elements.budgetInput.value;
  }

  return filters;
}

//check if teacher matches filters. Returns true if teacher passes all filters, false if any filter is not passed.
//called by getFilteredTeachers(currentTeacher,filters)
//argument:teacher come from the teachers array
//argument:filters come from getCurrentFilters()
function teacherPassesFilters(teacher, filters) {
  if (filters.classId) {
    if (!teacher.specialties.includes(filters.classId)) {
      return false;
    }
  }

  if (filters.search) {
    if (!matchesSearch(teacher, filters.search)) {
      return false;
    }
  }

  if (filters.mode) {
    if (teacher.mode !== filters.mode) {
      return false;
    }
  }

  if (filters.level) {
    if (teacher.level !== filters.level) {
      return false;
    }
  }

  if (filters.budget) {
    let budget = Number(filters.budget);
    let teacherPrice = Number(teacher.price);

    if (teacherPrice > budget) {
      return false;
    }
  }

  return true;
}

//returns a list of teachers that pass the filters.(using the teacherPassesFilters function)
//called by showTeachers()
//argument:filters come from getCurrentFilters()
function getFilteredTeachers(filters) {
  let filteredTeachers = [];

  for (let i = 0; i < teachers.length; i++) {
    let currentTeacher = teachers[i];

    let teacherPassed = teacherPassesFilters(currentTeacher,filters);

    if (teacherPassed === true) {
      filteredTeachers.push(currentTeacher);
    }
  }

  return filteredTeachers;
}

//save visible teachers for map page.
function saveTeachersForMap(teacherList) {
  let teacherIds = [];

  for (let i = 0; i < teacherList.length; i++) {
    let currentTeacher = teacherList[i];

    teacherIds.push(currentTeacher.id);
  }

  localStorage.setItem('tahsinMapTeachers',JSON.stringify(teacherIds));
}

//show the best match teacher in the recommendation box. The best match is the teacher with the highest match score based on the filters.
//called by showTeachers()
//argument:teacherList is the sorted teacher result
//argument:filters come from getCurrentFilters()
function showRecommendation(teacherList, filters) {
  if (!elements.recommendationBox) {
    return;
  }

  if (teacherList.length === 0) {
    elements.recommendationBox.innerHTML = '<div class="empty-state">No recommendation found.</div>';
    return;
  }

  let bestTeacher = teacherList[0];
  let classId = '';

  if (filters.classId) {
    classId = filters.classId;
  } else {
    classId = bestTeacher.specialties[0];
  }

  let className = getClassName(classId, classes);
  let score = getMatchScore(bestTeacher, filters);

  let html = '';

  html += '<div class="callout">';
  html += '<strong>Best match:</strong> ' + bestTeacher.name + ' for <strong>' + className + '</strong>.';
  html += '<div class="helper">' + bestTeacher.bio + '</div>';
  html += '<div class="helper">';
  html += 'Score: <strong>' + score + '</strong>';
  html += ' · ' + bestTeacher.mode;
  html += ' · ' + bestTeacher.location;
  html += ' · RM ' + bestTeacher.price;
  html += '</div>';
  html += '</div>';

  elements.recommendationBox.innerHTML = html;
}

//converts selected teacher IDs into full teacher objects for the comparison table
//called by showComparisonTable()
//showComparisonTable() uses this returned array to build rows for price and rating
function getSelectedTeachers() {
  let selectedTeachers = [];

  for (let i = 0; i < teachers.length; i++) {
    let currentTeacher = teachers[i];
    let currentTeacherId = String(currentTeacher.id);

    if (selectedTeacherIds.includes(currentTeacherId)) {
      selectedTeachers.push(currentTeacher);
    }
  }

  return selectedTeachers;
}

//show the comparison table for selected teachers. Shows price and rating for each teacher.
//called by initializePage(),toggleTeacherComparison(),resetComparison()
//call getSelectedTeachers()
function showComparisonTable() {
  if (!elements.comparisonTable) {
    return;
  }

  let selectedTeachers = getSelectedTeachers();

  if (selectedTeachers.length === 0) {
    elements.comparisonTable.innerHTML = '<tr><td colspan="3">No teachers selected.</td></tr>';
    return;
  }

  let html = '';

  html += '<tr>';
  html += '<th>Teacher</th>';

  for (let i = 0; i < selectedTeachers.length; i++) {
    let currentTeacher = selectedTeachers[i];
    html += '<th>' + currentTeacher.name + '</th>';
  }

  html += '</tr>';

  html += '<tr>';
  html += '<th>Price</th>';

  for (let i = 0; i < selectedTeachers.length; i++) {
    let currentTeacher = selectedTeachers[i];
    html += '<td>RM ' + currentTeacher.price + '</td>';
  }

  html += '</tr>';

  html += '<tr>';
  html += '<th>Rating</th>';

  for (let i = 0; i < selectedTeachers.length; i++) {
    let currentTeacher = selectedTeachers[i];
    html += '<td>' + Number(currentTeacher.rating).toFixed(1) + '</td>';
  }

  html += '</tr>';

  elements.comparisonTable.innerHTML = html;
}

//add/remove teacher from comparison
//called by the click listener inside addCompareButtonEvents()
function toggleTeacherComparison(teacherId) {
  let teacherIndex = selectedTeacherIds.indexOf(teacherId);

  if (teacherIndex !== -1) {
    selectedTeacherIds.splice(teacherIndex, 1);
  } else {
    if (selectedTeacherIds.length >= 2) {
      alert('You can compare up to two teachers at a time.');
      return;
    }

    selectedTeacherIds.push(teacherId);
  }

  localStorage.setItem(
    'tahsinCompare',
    JSON.stringify(selectedTeacherIds)
  );

  showComparisonTable();
}

//Make compare buttons clickable
//called by showTeachers() after teacherList.innerHTML is updated
//calls toggleTeacherComparison(teacherId) when a button is clicked
function addCompareButtonEvents() {
  let compareButtons = document.querySelectorAll('[data-compare]');

  for (let i = 0; i < compareButtons.length; i++) {
    let currentButton = compareButtons[i];

    currentButton.addEventListener('click', function () {
      let teacherId = String(currentButton.dataset.compare);

      toggleTeacherComparison(teacherId);
    });
  }
}

//booking button for payment n stuff
document.addEventListener('click', function(event){

    const bookButton =
    event.target.closest('[data-book]');

    if(bookButton){

        document.getElementById(
        "paymentOverlay"
        ).style.display = "flex";

    }

});


function closePayment(){

    document.getElementById(
    "paymentOverlay"
    ).style.display = "none";

}


function showQR(type){

    let qr =
    document.getElementById("qrImage");

    if(type === "bank"){

        qr.src = "images/bank.png";

    }
    else{

        qr.src = "images/tng.png";

    }

}


function completePayment(){

    /* CLOSE PAYMENT BOX */
    document.getElementById(
    "paymentOverlay"
    ).style.display = "none";


    /* OPEN SUCCESS BOX */
    document.getElementById(
    "successBox"
    ).style.display = "flex";

}


function closeSuccess(){

    document.getElementById(
    "successBox"
    ).style.display = "none";

}

document.getElementById("bankBtn")
.addEventListener("click", function(){

    showQR("bank");

});


document.getElementById("tngBtn")
.addEventListener("click", function(){

    showQR("tng");

});


document.getElementById("completeBtn")
.addEventListener("click", function(){

    completePayment();

});


document.getElementById("successBtn")
.addEventListener("click", function(){

    closeSuccess();

});

//show teachers cards
//This main function to display teachers
//called by initializePage(), setupPageEvents() through input/change events, and resetFilters()
//calls getCurrentFilters(),getFilteredTeachers(), sortTeachers(), saveTeachersForMap(), getMatchScore(),teacherCardHTML(), showRecommendation(), and addCompareButtonEvents()
function showTeachers() {
  if (!elements.teacherList || !elements.teacherStatus || !elements.sortInput) {
    return;
  }

  let filters = getCurrentFilters();
  let filteredTeachers = getFilteredTeachers(filters);
  let sortedTeachers = sortTeachers(filteredTeachers,elements.sortInput.value,filters);

  saveTeachersForMap(sortedTeachers);

  if (sortedTeachers.length === 0) {
    elements.teacherList.innerHTML = '<div class="empty-state">No teachers found.</div>';
    elements.teacherStatus.textContent = '0 teachers found.';

    showRecommendation([], filters);

    return;
  }

  let html = '';

  for (let i = 0; i < sortedTeachers.length; i++) {
    let currentTeacher = sortedTeachers[i];
    let score = getMatchScore(currentTeacher,filters);

    html += teacherCardHTML(currentTeacher,score);
  }

  elements.teacherList.innerHTML = html;

  let sortLabel = elements.sortInput.options[elements.sortInput.selectedIndex].text;

  elements.teacherStatus.textContent = sortedTeachers.length + ' teachers found. Sorted by ' + sortLabel + '.';

  showRecommendation(sortedTeachers,filters);

  addCompareButtonEvents();
}

//reset filters
//called by click listener attached in setupPageEvents()
//calls showTeachers() after resetting the form
function resetFilters() {
  if (elements.filterForm) {
    elements.filterForm.reset();
  }

  showTeachers();
}

//reset teacher comparison
//called by click listener attached in setupPageEvents()
//calls showComparisonTable() after clearing data
function resetComparison() {
  selectedTeacherIds = [];

  localStorage.removeItem('tahsinCompare');

  showComparisonTable();
}
