import { setActiveNav } from './common.js';

let getStartedButton = document.querySelector('[data-get-started]');

setActiveNav();
startPage();

function startPage() {
  if (getStartedButton) {
    getStartedButton.addEventListener('click', goToClassesPage);
  }
}

function goToClassesPage() {
  alert('Welcome to Tahsin. Please choose your Quran class first.');
  window.location.href = 'classes.html';
}
