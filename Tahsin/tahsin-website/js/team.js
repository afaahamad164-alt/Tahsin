import {
  loadJSON,
  setActiveNav
} from './common.js';

let teamList = document.querySelector('#team-list');
let teamStatus = document.querySelector('#team-status');

setActiveNav();
initializePage();

//loads the team JSON and starts displaying team members
//called by initializePage()
//calls loadJSON() and showTeam()
async function initializePage() {
  try {
    let teamMembers = await loadJSON('data/team.json');

    showTeam(teamMembers);
  } catch (error) {
    if (teamList) {
      teamList.innerHTML = '<div class="empty-state">Unable to load team details.</div>';
    }

    showStatus('Team data loading failed.');

    alert('Failed to load team data. Please check team.json.');
  }
}

//changes the team status message
//called by initializePage() error handling and showTeam()
//argument:status message string from the caller
function showStatus(message) {
  if (teamStatus) {
    teamStatus.textContent = message;
  }
}

//builds team profile cards from teamMembers array
//called by initializePage(teamMembers)
//calls showStatus() after inserting cards
function showTeam(teamMembers) {
  if (!teamList) {
    return;
  }

  let html = '';

  for (let i = 0; i < teamMembers.length; i++) {
    let currentMember = teamMembers[i];

    html += '<article class="team-card card">';
    html += '<img src="' + currentMember.image + '" alt="Portrait for ' + currentMember.name + '">';
    html += '<h3>' + currentMember.name + '</h3>';
    html += '<p><strong>Matric No:</strong> ' + currentMember.matric + '</p>';
    html += '<p><strong>Role:</strong> ' + currentMember.role + '</p>';
    html += '</article>';
  }

  teamList.innerHTML = html;

  showStatus(teamMembers.length + ' team profiles loaded from JSON.');
}
