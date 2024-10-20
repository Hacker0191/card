const orderButton = document.querySelector(".order");

const addRemoveClass = () => {
  if (!orderButton.classList.contains("animate")) {
    orderButton.classList.add("animate");
    setTimeout(() => {
      orderButton.classList.remove("animate");
    }, 100000);
  }
};

orderButton.addEventListener("click", addRemoveClass);

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('greetingForm');
    
    // Save form data to localStorage
    function saveFormData() {
      const formData = {
        senderName: document.getElementById('senderName').value,
        senderCountry: document.getElementById('senderCountry').value,
        receiverName: document.getElementById('receiverName').value,
        receiverCountry: document.getElementById('receiverCountry').value,
        deliveryDate: document.getElementById('deliveryDate').value,
        message: document.getElementById('message').value,
        theme: document.getElementById('theme').value,
        selectedSong: document.getElementById('selectedSong').value
      };
      
      localStorage.setItem('greetingFormDraft', JSON.stringify(formData));
    }

    // Load saved form data from localStorage
    function loadFormData() {
      const savedData = localStorage.getItem('greetingFormDraft');
      if (savedData) {
        const formData = JSON.parse(savedData);
        document.getElementById('senderName').value = formData.senderName || '';
        document.getElementById('senderCountry').value = formData.senderCountry || '';
        document.getElementById('receiverName').value = formData.receiverName || '';
        document.getElementById('receiverCountry').value = formData.receiverCountry || '';
        document.getElementById('deliveryDate').value = formData.deliveryDate || '';
        document.getElementById('message').value = formData.message || '';
        document.getElementById('theme').value = formData.theme || 'default';
        document.getElementById('selectedSong').value = formData.selectedSong || '';
      }
    }

    // Clear saved form data when form is submitted
    form.addEventListener('submit', function () {
      localStorage.removeItem('greetingFormDraft');
    });

    // Save data when any input changes
    form.addEventListener('input', saveFormData);

    // Load the saved data when the page loads
    loadFormData();
  });


  // List of all country names
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", 
  "Antigua and Barbuda", "Argentina", "Armenia", "Australia", 
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", 
  "Barbados", "Belarus", "Belgium", "Belize", "Benin", 
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", 
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", 
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", 
  "Chad", "Chile", "China", "Colombia", "Comoros", 
  "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", 
  "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", 
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", 
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", 
  "Fiji", "Finland", "France", "Gabon", "Gambia", 
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", 
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", 
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", 
  "Iran", "Iraq", "Ireland", "Israel", "Italy", 
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", 
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", 
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", 
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", 
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", 
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", 
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", 
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", 
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", 
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", 
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", 
  "Poland", "Portugal", "Qatar", "Romania", "Russia", 
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", 
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", 
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", 
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", 
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", 
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", 
  "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", 
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", 
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", 
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", 
  "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const inputFields = ['senderCountry', 'receiverCountry'];
inputFields.forEach(fieldId => {
  const inputField = document.getElementById(fieldId);
  const resultsContainer = document.createElement('div'); // Container to show suggestions
  resultsContainer.classList.add('autocomplete-results');
  inputField.parentNode.appendChild(resultsContainer);

  // Event listener for user typing
  inputField.addEventListener('input', function() {
    const input = this.value.toLowerCase();
    resultsContainer.innerHTML = ''; // Clear previous suggestions

    if (input.length > 0) {
      const filteredCountries = countries.filter(country => 
        country.toLowerCase().includes(input)
      );

      filteredCountries.forEach(country => {
        const resultItem = document.createElement('div');
        resultItem.textContent = country;
        resultItem.classList.add('autocomplete-item');

        // Handle clicking on suggestion
        resultItem.addEventListener('click', function() {
          inputField.value = country; // Set the clicked suggestion as the input value
          resultsContainer.innerHTML = ''; // Clear the suggestions
        });

        resultsContainer.appendChild(resultItem);
      });
    }
  });

  // Hide suggestions when clicking outside the input field
  document.addEventListener('click', function(e) {
    if (!inputField.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.innerHTML = ''; // Clear suggestions when clicking outside
    }
  });
});

