document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const categoryFilter = document.getElementById("category-filter");
  const sortActivities = document.getElementById("sort-activities");
  const searchInput = document.getElementById("search-activities");
  const clearSearchButton = document.getElementById("clear-search");

  // Store fetched activities
  let allActivities = {};

  // Search and sort settings
  let currentSort = "name-asc";
  let currentSearch = "";

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      
      // Clear options in the activity select dropdown
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Display activities with current filters and sorting
      displayActivities();

    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to display activities with current sorting and search
  function displayActivities() {
    // Clear current display
    activitiesList.innerHTML = "";

    // Filter, sort, and search activities
    const filteredActivities = Object.entries(allActivities)
      .filter(([name, details]) => {
        // Search text
        const searchMatch = currentSearch === "" || 
          name.toLowerCase().includes(currentSearch.toLowerCase()) ||
          details.description.toLowerCase().includes(currentSearch.toLowerCase()) ||
          details.schedule.toLowerCase().includes(currentSearch.toLowerCase());
        
        return searchMatch;
      })
      .sort(([nameA, detailsA], [nameB, detailsB]) => {
        // Sort based on current sort option
        switch(currentSort) {
          case "name-asc":
            return nameA.localeCompare(nameB);
          case "name-desc":
            return nameB.localeCompare(nameA);
          case "spots-most": {
            const spotsA = detailsA.max_participants - detailsA.participants.length;
            const spotsB = detailsB.max_participants - detailsB.participants.length;
            return spotsB - spotsA;
          }
          case "spots-least": {
            const spotsA = detailsA.max_participants - detailsA.participants.length;
            const spotsB = detailsB.max_participants - detailsB.participants.length;
            return spotsA - spotsB;
          }
          default:
            return 0;
        }
      });

    // If no matching activities, show message
    if (filteredActivities.length === 0) {
      activitiesList.innerHTML = "<p>No activities match your criteria.</p>";
      return;
    }

    // Populate activities list
    filteredActivities.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft =
        details.max_participants - details.participants.length;

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${details.participants
                .map(
                  (email) =>
                    `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                )
                .join("")}
            </ul>
          </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown if not already there
      if (!Array.from(activitySelect.options).some(option => option.value === name)) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      }
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Event listeners for sorting and search
  sortActivities.addEventListener("change", () => {
    currentSort = sortActivities.value;
    displayActivities();
  });

  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value;
    searchInput.parentElement.classList.toggle("has-text", currentSearch.length > 0);
    displayActivities();
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    currentSearch = "";
    searchInput.parentElement.classList.remove("has-text");
    displayActivities();
  });

  // Initialize app
  fetchActivities();
});
