const scriptURL = 'https://script.google.com/macros/s/AKfycbw_-GIA33hvuZkHmY-3H3PK8xUGtkQDXZeRnoEny9LpjfvFRFD7GrJLLVEfKcLh3B0/exec'; // Paste your Deployment URL here
const form = document.getElementById('huntForm');
const submitButton = document.querySelector('.btn-submit');

form.addEventListener('submit', e => {
  e.preventDefault();

  // 1. Capture form data into our unused const
  const formData = new FormData(form);
  const newEntry = Object.fromEntries(formData.entries());

  // 2. Visual feedback
  submitButton.disabled = true;
  submitButton.innerText = "Submitting...";

  // 3. OPTIMISTIC UI: Add the row to the table immediately
  const historyBody = document.getElementById('historyBody');
  const tempRow = document.createElement('tr');
  tempRow.id = "temp-row"; // ID to find/remove it later
  tempRow.style.opacity = '0.5'; // Visual cue that it's "pending"

  // Simple formatting for the immediate display
  const displayDate = newEntry.huntDate.split('-').slice(1).join('/') + '/' + newEntry.huntDate.split('-')[0].slice(-2);

  tempRow.innerHTML = `
      <td style="font-weight:bold; color:#f6f0d7;">${displayDate} (Pending...)</td>
      <td>${newEntry.blindLocation}</td>
      <td style="text-align:center;">${newEntry.ducks}</td>
      <td style="text-align:center;">${newEntry.geese}</td>
      <td class="notes-cell">${newEntry.weather}</td>
      <td class="notes-cell">${newEntry.notes}</td>
  `;

  // Insert at the top of the history
  historyBody.prepend(tempRow);

  // 4. Send to Google Sheets
  fetch(scriptURL, { method: 'POST', body: formData })
    .then(response => {
      alert('Hunt Recorded Successfully!');
      submitButton.disabled = false;
      submitButton.innerText = "Submit Hunt to Log";
      form.reset();

      // Remove the "pending" row and refresh the full table
      if (document.getElementById('temp-row')) {
        document.getElementById('temp-row').remove();
      }
      loadHistory();
    })
    .catch(error => {
      alert('Error! Check signal. Your entry is still in the list for now.');
      console.error('Submission Error:', error.message);
      submitButton.disabled = false;
      submitButton.innerText = "Submit Hunt to Log";
    });
});


// Function to fetch and display the history
let allHunts = []; // Global store so we don't have to fetch every time we filter

// 1. Updated loadHistory: Now only fetches and saves data
function loadHistory() {
    const historyBody = document.getElementById('historyBody');
    const cacheBuster = `?t=${new Date().getTime()}`;
    
    fetch(scriptURL + cacheBuster, { method: "GET", redirect: "follow" })
    .then(response => response.json())
    .then(data => {
      allHunts = data; 
      // Sort Newest to Oldest
      allHunts.sort((a, b) => new Date(b.huntDate) - new Date(a.huntDate));
  
      // DYNAMICALLY BUILD DROPDOWN
      const filter = document.getElementById('seasonFilter');
      const seasons = [...new Set(allHunts.map(h => getSeason(h.huntDate)))];
      
      // Rebuild the menu
      let options = '<option value="all">All Time (Grand Total)</option>';
      seasons.sort().reverse().forEach(s => {
          if(s !== "Invalid Date") {
              options += `<option value="${s}">${s} Season</option>`;
          }
      });
      filter.innerHTML = options;
  
      renderTable(allHunts, filter.value);
  })
    .catch(error => {
        console.error('Error loading history:', error);
        historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Failed to load logs.</td></tr>';
    });
}

function getSeason(dateString) {
  if (!dateString) return "Unknown";
  
  // Replace hyphens with slashes to prevent timezone "day-shift" bugs
  const cleanDate = dateString.toString().split('T')[0].replace(/-/g, '/');
  const date = new Date(cleanDate);
  
  if (isNaN(date.getTime())) return "Invalid Date";

  const month = date.getMonth(); // 0 = Jan, 8 = Sept
  const year = date.getFullYear();
  
  // September (8) to December (11) starts the season
  // January (0) to August (7) is the second half of the previous year's season
  const startYear = (month >= 8) ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}



function updateSeasonDropdown(hunts) {
  const filter = document.getElementById('seasonFilter');
  const existingValue = filter.value; // Save what the user already picked
  
  // Find all unique seasons in the data
  const seasons = [...new Set(hunts.map(h => getSeason(h.huntDate)))];
  seasons.sort().reverse(); // Show newest seasons at the top

  // Clear and rebuild the dropdown
  filter.innerHTML = '<option value="all">All Time (Grand Total)</option>';
  seasons.forEach(s => {
      const option = document.createElement('option');
      option.value = s;
      option.textContent = `${s} Season`;
      filter.appendChild(option);
  });

  // Restore the user's previous selection if it still exists
  filter.value = existingValue || "all";
}


// 3. New renderTable: Handles filtering and totals
function renderTable(hunts, filterValue) {
  const historyBody = document.getElementById('historyBody');
  
  // 1. CLEAR: Wipe the table
  historyBody.innerHTML = '';
  
  // 2. FILTER: Get the subset of data
  const filteredData = (filterValue === 'all') 
      ? hunts 
      : hunts.filter(h => getSeason(h.huntDate) === filterValue);

  if (filteredData.length === 0) {
      historyBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hunts found.</td></tr>';
      return;
  }

  // 3. FRAGMENT: Create a "virtual" container (2026 Best Practice)
  const fragment = document.createDocumentFragment();
  let totalDucks = 0;
  let totalGeese = 0;

  filteredData.forEach(row => {
      totalDucks += parseInt(row.ducks || 0);
      totalGeese += parseInt(row.geese || 0);

      const tr = document.createElement('tr');
      
      // Ensure robust date display
      const displayDate = formatDateForDisplay(row.huntDate);

      tr.innerHTML = `
        <td style="font-weight:bold; color:#f6f0d7;">${displayDate}</td>
        <td>${row.blindLocation || 'N/A'}</td>
        <td style="text-align:center;">${row.ducks || 0}</td>
        <td style="text-align:center;">${row.geese || 0}</td>
        <td class="notes-cell">${row.weather || ''}</td>
        <td class="notes-cell">${row.notes || ''}</td>
      `;
// Add the 2026 "Tap to Expand" logic for phones
tr.querySelectorAll('.expandable-cell').forEach(cell => {
    cell.addEventListener('click', function() {
        this.classList.toggle('expanded');
    });
});

      fragment.appendChild(tr);
  });

  // 4. TOTALS: Add the season summary row
  const totalRow = document.createElement('tr');
  totalRow.className = 'total-row'; 
  totalRow.innerHTML = `
      <td colspan="2" style="text-align:right; font-weight:bold; color:var(--camo-accent);">
        ${filterValue === 'all' ? "GRAND TOTAL" : filterValue + " TOTALS"}:
      </td>
      <td style="text-align:center; font-weight:bold; color:#ff793f;">${totalDucks}</td>
      <td style="text-align:center; font-weight:bold; color:#ff793f;">${totalGeese}</td>
      <td></td><td></td>
  `;
  fragment.appendChild(totalRow);

  // 5. INJECT: Add everything to the screen in ONE go (Fastest)
  historyBody.appendChild(fragment);
}

// Separate helper for clean code
function formatDateForDisplay(dateString) {
  const parts = dateString.toString().split('T')[0].split('-');
  return parts.length === 3 ? `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0].slice(-2)}` : dateString;
}


// 5. Listener for when the user changes the dropdown
document.getElementById('seasonFilter').addEventListener('change', (e) => {
    renderTable(allHunts, e.target.value);
});



// Automatically refresh data when the app is resumed
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("App resumed: Refreshing logs...");

    // 1. Give the phone 300ms to reconnect to the cell tower
    setTimeout(() => {
      // 2. Call loadHistory which fetches fresh data and 
      // re-renders the table with the current filter applied.
      loadHistory();
    }, 300);
  }
});

// Set the date input to 'Today' by default for faster entry
document.addEventListener('DOMContentLoaded', () => {
  // 1. Set the date input to 'Today'
  const dateInput = document.getElementById('huntDate');
  if (dateInput) {
    // Correctly handles the YYYY-MM-DD format for 2026
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // 2. Force numeric keypad for bird counts (Big UX improvement for mobile)
  const ducksInput = document.getElementById('ducks');
  const geeseInput = document.getElementById('geese');

  if (ducksInput) ducksInput.setAttribute('inputmode', 'numeric');
  if (geeseInput) geeseInput.setAttribute('inputmode', 'numeric');

  // 3. Initial load of the history table
  loadHistory();
});



// Initial load when page opens
loadHistory();
