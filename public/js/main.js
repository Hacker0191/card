// Populate template options
fetch('/templates')
  .then(response => response.json())
  .then(templates => {
    const templateSelect = document.getElementById('templatePath');
    Object.entries(templates).forEach(([category, paths]) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = category;
      paths.forEach(path => {
        const option = document.createElement('option');
        option.value = path;
        option.textContent = path.split('/').pop();
        optgroup.appendChild(option);
      });
      templateSelect.appendChild(optgroup);
    });
  });

// Auto-save functionality
const form = document.getElementById('greetingForm');
const formFields = form.elements;

// Load saved data on page load
window.addEventListener('load', () => {
  for (let i = 0; i < formFields.length; i++) {
    const field = formFields[i];
    const savedValue = localStorage.getItem(field.name);
    if (savedValue !== null) {
      field.value = savedValue;
    }
  }
});

// Save form data on input change
form.addEventListener('input', () => {
  for (let i = 0; i < formFields.length; i++) {
    const field = formFields[i];
    localStorage.setItem(field.name, field.value);
  }
});

// Song Search Script
const songSearch = document.getElementById('songSearch');
const songResults = document.getElementById('songResults');
const selectedSong = document.getElementById('selectedSong');

songSearch.addEventListener('input', async (e) => {
  const query = e.target.value;
  if (query.length > 2) {
    const response = await fetch(`/search-song?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    displaySongResults(data.results.trackmatches.track);
  }
});

function displaySongResults(tracks) {
  songResults.innerHTML = '';
  tracks.forEach(track => {
    const div = document.createElement('div');
    div.classList.add('song-item');
    div.textContent = `${track.name} - ${track.artist}`;
    div.addEventListener('click', () => {
      selectedSong.value = JSON.stringify(track);
      songSearch.value = `${track.name} - ${track.artist}`;
      songResults.innerHTML = '';
    });
    songResults.appendChild(div);
  });
}

// Submit button delay
form.addEventListener('submit', function (e) {
  e.preventDefault();  
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;  
  setTimeout(() => {
    form.submit(); 
  }, 7500); 
});