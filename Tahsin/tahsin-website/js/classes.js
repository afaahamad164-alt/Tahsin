import {
  loadJSON,
  setActiveNav,
  storeSelectedClass
} from './common.js';

let classList = document.querySelector('#class-list');
let classStatus = document.querySelector('#class-status');

setActiveNav();
initializePage();

//starts the class page. It loads class data from JSON and displays it
//called by the top-level startup line initializePage()
//calls showStatus(), loadJSON(), and showClasses(). loadJSON comes from common.js
async function initializePage() {
  try {
    showStatus('Loading classes...');

    let classes = await loadJSON('data/classes.json');

    showClasses(classes);
  } catch (error) {
    if (classList) {
      classList.innerHTML = '<div class="empty-state">Unable to load classes right now.</div>';
    }

    showStatus('Class data loading failed.');
    alert('Failed to load class data. Please check the JSON file.');
  }
}

//changes the text inside the class status element
//called by initializePage() and showClasses()
//argument:message string from the caller
function showStatus(message) {
  if (classStatus) {
    classStatus.textContent = message;
  }
}

//receives the classes array and builds one class card for each class
//called by initializePage()
//calls addClassButtonEvents() after innerHTML because the buttons only exist after the HTML is inserted
//arguments:classes array from the JSON file
function showClasses(classes) {
  if (!classList) {
    return;
  }

  let html = '';

  for (let i = 0; i < classes.length; i++) {
    let currentClass = classes[i];

    html += '<article class="class-card card">';
    html += '<div class="class-icon" aria-hidden="true">' + currentClass.icon + '</div>';

    html += '<div>';
    html += '<h3>' + currentClass.name + '</h3>';
    html += '<p>' + currentClass.summary + '</p>';
    html += '</div>';

    html += '<div class="small-note">Suitable for: ' + currentClass.audience + '</div>';

    html += '<button class="btn btn-primary" data-select-class="' + currentClass.id + '">';
    html += 'Choose Class';
    html += '</button>';

    html += '</article>';
  }

  classList.innerHTML = html;

  addClassButtonEvents();

  showStatus(classes.length + ' classes loaded from JSON.');
}

//makes every Choose Class button clickable
//called by showClasses()
//calls storeSelectedClass(classId) from common.js and connects classes.js to teachers.js
function addClassButtonEvents() {
  let buttons = document.querySelectorAll('[data-select-class]');

  for (let i = 0; i < buttons.length; i++) {
    let currentButton = buttons[i];

    currentButton.addEventListener('click', function () {
      let classId = currentButton.dataset.selectClass;

      storeSelectedClass(classId);

      alert('Class selected. Now choose a suitable teacher.');

      window.location.href = 'teachers.html?class=' + encodeURIComponent(classId);
    });
  }
}
