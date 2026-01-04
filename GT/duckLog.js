const scriptURL = 'https://script.google.com/macros/s/AKfycbwhR5sDhRl3hvC10j7etuIOfsBywcwwy1xazXi11it3C3KBpu5AaRA-1h6hN5TCKDGdFA/exec'; // Paste your Deployment URL here
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
  
    fetch(scriptURL, {
      method: "GET",
      redirect: "follow"
    })
    .then(response => response.json())
    .then(data => {
      historyBody.innerHTML = '';
      
      // Variables to track totals
      let totalDucks = 0;
      let totalGeese = 0;
  
      if (!data || data.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hunts logged yet.</td></tr>';
        return;
      }
  
      // Newest hunts at the top
      data.reverse().forEach(row => {
        // Add current row counts to totals
        totalDucks += parseInt(row.ducks || 0);
        totalGeese += parseInt(row.geese || 0);
  
        const tr = document.createElement('tr');
        
        const dateObj = new Date(row.Date);
       const displayDate = isNaN(dateObj) ? row.Date : (dateObj.getMonth() + 1) + '/' + dateObj.getDate() + '/' + dateObj.getFullYear().toString().slice(-2);

  
        tr.innerHTML = `
          <td style="font-weight:bold;">${displayDate}</td>
          <td>${row.blindLocation || 'N/A'}</td>
          <td style="text-align:center;">${row.ducks || 0}</td>
          <td style="text-align:center;">${row.geese || 0}</td>
          <td class="notes-cell">${row.notes || ''}</td>
        `;
        historyBody.appendChild(tr);
      });
  
      // APPEND THE TOTALS ROW AT THE BOTTOM
      const totalRow = document.createElement('tr');
      totalRow.className = 'total-row'; // Style this in CSS
      totalRow.innerHTML = `
        <td colspan="2" style="text-align:right; font-weight:bold;">SEASON TOTALS:</td>
        <td style="text-align:center; font-weight:bold; color:#ff793f;">${totalDucks}</td>
        <td style="text-align:center; font-weight:bold; color:#ff793f;">${totalGeese}</td>
        <td></td>
      `;
      historyBody.appendChild(totalRow);
    })
    .catch(error => {
      console.error('Error loading history:', error);
      historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Failed to load logs.</td></tr>';
    });
  }
  
  
  // Initial load when page opens
  loadHistory();
  
