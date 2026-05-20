//Load JSON file data
//called by classes.js, teachers.js, map.js, and team.js
//argument: path is the JSON file location, for example 'data/classes.json'
//uses fetch() to load JSON data
//uses await because loading file takes time
//returns the JSON data back to the file that called it
export async function loadJSON(path) {
  let response = await fetch(path);

  if (!response.ok) {
    throw new Error('Cannot load ' + path);
  }

  let data = await response.json();

  return data;
}

//Highlight current navbar page
//called by index.js, classes.js, teachers.js, map.js, and team.js
//checks the current page name from the browser URL
//compares current page with each navbar link href
//adds active class to the correct navbar link
//removes active class from other navbar link
export function setActiveNav() {
  let currentPage = window.location.pathname.split('/').pop();

  if (currentPage === '') {
    currentPage = 'index.html';
  }

  let links = document.querySelectorAll('[data-nav]');

  for (let i = 0; i < links.length; i++) {
    let currentLink = links[i];
    let linkPage = currentLink.getAttribute('href');

    if (linkPage === currentPage) {
      currentLink.classList.add('active');
    } else {
      currentLink.classList.remove('active');
    }
  }
}

//Get selected class from URL/localStorage
//called by teachers.js
//checks if the selected class exists in the URL first
//if not found in URL, it checks localStorage
//returns selected class ID if found
//returns empty string if no class was selected
export function readSelectedClass() {
  let currentUrl = new URL(window.location.href);
  let classFromUrl = currentUrl.searchParams.get('class');
  let classFromStorage = localStorage.getItem('tahsinSelectedClass');

  if (classFromUrl) {
    return classFromUrl;
  }

  if (classFromStorage) {
    return classFromStorage;
  }

  return '';
}

//Save selected class
//called by classes.js when user clicks Choose Class button
//argument: classId comes from data-select-class button dataset
//saves the selected class ID into localStorage
//teachers.js can read this selected class later
export function storeSelectedClass(classId) {
  if (classId) {
    localStorage.setItem('tahsinSelectedClass', classId);
  }
}

//Format price to RM
//called by teacherCardHTML()
//argument: value comes from teacher.price
//converts the price into number using Number()
//returns price format like RM 50
export function currency(value) {
  let numberValue = Number(value);
  return 'RM ' + numberValue.toFixed(0);
}

//Format rating display
//called by teacherCardHTML()
//argument: rating comes from teacher.rating
//converts rating into number
//uses toFixed(1) to show one decimal place
//returns rating format like ⭐ 4.5
export function createStars(rating) {
  let numberRating = Number(rating);
  return '⭐ ' + numberRating.toFixed(1);
}

//Convert text into readable label
//called by getClassName() and teacherCardHTML()
//argument: value is usually class ID or specialty ID
//changes hyphen into space using replaceAll()
//capitalizes the first letter of each word
//returns readable text like Quran Reading
export function labelize(value) {
  let text = String(value);
  text = text.replaceAll('-', ' ');

  let words = text.split(' ');
  let result = '';

  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    if (word.length > 0) {
      result += word[0].toUpperCase() + word.slice(1);
    }

    if (i < words.length - 1) {
      result += ' ';
    }
  }

  return result;
}

//Get class name using class ID
//called by teachers.js and map.js
//argument: classId is the selected class ID or teacher specialty ID
//argument: classes is the classes array from classes.json
//loops through classes array to find matching class ID
//returns the real class name if found
//if not found, returns labelize(classId)
export function getClassName(classId, classes) {
  for (let i = 0; i < classes.length; i++) {
    let currentClass = classes[i];

    if (currentClass.id === classId) {
      return currentClass.name;
    }
  }

  return labelize(classId);
}

//Check if teacher matches search
//called by teacherPassesFilters() in teachers.js
//argument: teacher comes from teachers array
//argument: searchText comes from user search input
//combines teacher name, location, specialties, and languages into one text
//uses toLowerCase() so search is not case-sensitive
//returns true if teacher text includes the search word
//returns false if the teacher does not match the search
export function matchesSearch(teacher, searchText) {
  if (!searchText) {
    return true;
  }

  let search = searchText.toLowerCase().trim();
  let teacherText = '';

  teacherText += teacher.name + ' ';
  teacherText += teacher.location + ' ';
  teacherText += teacher.specialties.join(' ') + ' ';
  teacherText += teacher.languages.join(' ');

  teacherText = teacherText.toLowerCase();

  if (teacherText.includes(search)) {
    return true;
  }

  return false;
}

//Calculate teacher recommendation score
//called by sortTeachers(), showTeachers(), and showRecommendation()
//argument: teacher comes from filtered teacher list
//argument: filters comes from getCurrentFilters() in teachers.js
//adds score based on class match, mode, level, budget, rating, experience, and availability
//higher score means better match for the user
//returns final score using Math.round()
export function getMatchScore(teacher, filters) {
  let score = 0;

  if (filters.classId) {
    if (teacher.specialties.includes(filters.classId)) {
      score += 40;
    }
  }

  if (filters.mode) {
    if (teacher.mode === filters.mode) {
      score += 15;
    }
  }

  if (filters.level) {
    if (teacher.level === filters.level) {
      score += 15;
    }
  }

  if (filters.budget) {
    let budget = Number(filters.budget);

    if (Number(teacher.price) <= budget) {
      score += 14;
    }
  }

  if (teacher.rating) {
    score += Number(teacher.rating) * 2;
  }

  if (teacher.experience) {
    let experience = Number(teacher.experience);

    if (experience > 12) {
      experience = 12;
    }

    score += experience;
  }

  if (teacher.availableToday) {
    score += 3;
  }

  return Math.round(score);
}

//Sort teachers
//called by showTeachers() in teachers.js
//argument: teachers is the filtered teacher array
//argument: sortBy comes from sort dropdown value
//argument: filters comes from getCurrentFilters()
//uses slice() to copy the teacher array before sorting
//sorts by price, rating, name, or best match score
//returns the sorted teacher array
export function sortTeachers(teachers, sortBy, filters) {
  let sortedTeachers = teachers.slice();

  if (sortBy === 'price-asc') {
    sortedTeachers.sort(function (teacherA, teacherB) {
      return Number(teacherA.price) - Number(teacherB.price);
    });
  } else if (sortBy === 'price-desc') {
    sortedTeachers.sort(function (teacherA, teacherB) {
      return Number(teacherB.price) - Number(teacherA.price);
    });
  } else if (sortBy === 'rating-desc') {
    sortedTeachers.sort(function (teacherA, teacherB) {
      return Number(teacherB.rating) - Number(teacherA.rating);
    });
  } else if (sortBy === 'name-asc') {
    sortedTeachers.sort(function (teacherA, teacherB) {
      return teacherA.name.localeCompare(teacherB.name);
    });
  } else {
    sortedTeachers.sort(function (teacherA, teacherB) {
      return getMatchScore(teacherB, filters) - getMatchScore(teacherA, filters);
    });
  }

  return sortedTeachers;
}

//Create teacher card HTML
//called by showTeachers() in teachers.js
//argument: teacher is one teacher object from sortedTeachers array
//argument: score comes from getMatchScore(currentTeacher, filters)
//builds the teacher card using HTML string
//shows teacher image, name, bio, location, mode, level, rating, specialties, price, experience, certification, and score
//creates Compare button using data-compare
//returns the full HTML card back to showTeachers()
export function teacherCardHTML(teacher, score) {
  let specialtiesHtml = '';

  for (let i = 0; i < teacher.specialties.length; i++) {
    let specialty = teacher.specialties[i];
    specialtiesHtml += '<li>' + labelize(specialty) + '</li>';
  }

  let html = '';

  html += '<article class="teacher-card card">';
  html += '<span class="badge" title="Teacher highlight">' + teacher.badge + '</span>';
  html += '<img class="teacher-image" src="' + teacher.image + '" alt="Profile illustration for ' + teacher.name + '">';

  html += '<div>';
  html += '<h3>' + teacher.name + '</h3>';
  html += '<p>' + teacher.bio + '</p>';
  html += '</div>';

  html += '<div class="teacher-meta" aria-label="Teacher quick details">';
  html += '<span class="meta-chip">📍 ' + teacher.location + '</span>';
  html += '<span class="meta-chip">💻 ' + teacher.mode + '</span>';
  html += '<span class="meta-chip">📚 ' + teacher.level + '</span>';
  html += '<span class="meta-chip">' + createStars(teacher.rating) + '</span>';
  html += '</div>';

  html += '<ul class="inline-list" aria-label="Specialties">';
  html += specialtiesHtml;
  html += '</ul>';

  html += '<div class="teacher-footer">';
  html += '<div>';
  html += '<div class="price-tag">' + currency(teacher.price) + '<span class="small-note"> / session</span></div>';
  html += '<div class="small-note">' + teacher.experience + ' years · ' + teacher.certification + '</div>';
  html += '<div class="small-note">Smart match score: <strong>' + score + '</strong></div>';
  html += '</div>';

  html += '<div class="button-group">';
  html += '<button class="btn btn-secondary" data-book="' + teacher.id + '" aria-label=Book ' + teacher.name + '">';
  html += 'Book';
  html += '</button>'

  html += '<button class="btn btn-secondary" data-compare="' + teacher.id + '" aria-label="Compare ' + teacher.name + '">';
  html += 'Compare';
  html += '</button>';
  html += '</div>';

  html += '</div>';
  html += '</article>';

  return html;
}
