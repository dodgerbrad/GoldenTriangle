const scriptURL = 'https://script.google.com/macros/s/AKfycbw_-GIA33hvuZkHmY-3H3PK8xUGtkQDXZeRnoEny9LpjfvFRFD7GrJLLVEfKcLh3B0/exec'; // Paste your Deployment URL here
const form = document.getElementById('huntForm');
const submitButton = document.querySelector('.btn-submit');

form.addEventListener('submit', e => {
  e.preventDefault();
  
  // Visual feedback: disable button so hunters don't double-tap
  submitButton.disabled = true;
  submitButton.innerText = "Submitting...";

  // Use fetch to send the data as a POST request
  fetch(scriptURL, { method: 'POST', body: new FormData(form)})
    .then(response => {
      alert('Hunt Recorded Successfully!');
      submitButton.disabled = false;
      submitButton.innerText = "Submit Hunt to Log";
      form.reset(); // Clear the form
      
      // Force iPhone to dismiss the keyboard/picker
      if (document.activeElement) {
          document.activeElement.blur();
      }
    })
    .catch(error => {
      alert('Error recording hunt! Check your signal.');
      console.error('Submission Error:', error.message);
      submitButton.disabled = false;
      submitButton.innerText = "Submit Hunt to Log";
    });
    
});

// Function to fetch and display the history
function loadHistory() {
    const historyBody = document.getElementById('historyBody');
  
    // Fetch data from your Google Script
    fetch(scriptURL, {
      method: "GET",
      redirect: "follow"
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      // 1. Clear the "Loading" message
      historyBody.innerHTML = '';
      
      let totalDucks = 0;
      let totalGeese = 0;
  
      if (!data || data.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hunts logged yet.</td></tr>';
        return;
      }
  
      // 2. Reverse to show the most recent hunts at the top
      data.reverse().forEach(row => {
        // Add to running totals
        totalDucks += parseInt(row.ducks || 0);
        totalGeese += parseInt(row.geese || 0);
  
        const tr = document.createElement('tr');
        
        // 3. Robust Date Formatting for huntDate
        let displayDate = "N/A";
        if (row.huntDate) {
          /* 
             The HTML date input saves as "YYYY-MM-DD" (e.g. 2026-01-03).
             We split the string to avoid the iPhone "Day Shift" timezone bug.
          */
          const parts = row.huntDate.toString().split('T')[0].split('-');
          if (parts.length === 3) {
            const y = parts[0].slice(-2); // "26"
            const m = parseInt(parts[1]); // "1"
            const d = parseInt(parts[2]); // "3"
            displayDate = `${m}/${d}/${y}`;
          } else {
            displayDate = row.huntDate;
          }
        }
  
        // 4. Build the Row
        tr.innerHTML = `
          <td style="font-weight:bold; color:#f6f0d7;">${displayDate}</td>
          <td>${row.blindLocation || 'N/A'}</td>
          <td style="text-align:center;">${row.ducks || 0}</td>
          <td style="text-align:center;">${row.geese || 0}</td>
          <td class="notes-cell">${row.weather || ''}</td>
          <td class="notes-cell">${row.notes || ''}</td>
        `;
        historyBody.appendChild(tr);
      });
  
      // 5. Append the 2026 Season Totals Row
      const totalRow = document.createElement('tr');
      totalRow.className = 'total-row'; 
      totalRow.innerHTML = `
        <td colspan="2" style="text-align:right; font-weight:bold; color:var(--camo-accent);">
          2026 SEASON TOTALS:
        </td>
        <td style="text-align:center; font-weight:bold; color:#ff793f;">${totalDucks}</td>
        <td style="text-align:center; font-weight:bold; color:#ff793f;">${totalGeese}</td>
        <td></td>
        <td></td>
      `;
      historyBody.appendChild(totalRow);
    })
    .catch(error => {
      console.error('Error loading history:', error);
      historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ff793f;">Failed to load logs.</td></tr>';
    });
  }
// Automatically refresh data when the app is resumed
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        console.log("App resumed: Refreshing logs...");
        loadHistory(); // Call your function that fetches the table data
    }
});

// Set the date input to 'Today' by default for faster entry
window.onload = () => {
    const dateInput = document.getElementById('huntDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    loadHistory();
};

  
 
  
  
  
  // Initial load when page opens
  loadHistory();
  
