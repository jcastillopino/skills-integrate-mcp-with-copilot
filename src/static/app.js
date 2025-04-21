document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const toolbar = document.getElementById("toolbar");

  // Add toolbar elements
  toolbar.innerHTML = `
    <div class="toolbar">
      <input type="text" id="search-bar" placeholder="Search activities...">
      <select id="category-filter">
        <option value="">All Categories</option>
        <option value="sports">Sports</option>
        <option value="music">Music</option>
        <option value="education">Education</option>
      </select>
      <select id="sort-options">
        <option value="name">Sort by Name</option>
        <option value="time">Sort by Time</option>
      </select>
    </div>
  `;

  const searchBar = document.getElementById("search-bar");
  const categoryFilter = document.getElementById("category-filter");
  const sortOptions = document.getElementById("sort-options");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      renderActivities(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  }

  // Function to render activities
  function renderActivities(activities) {
    activitiesList.innerHTML = "";

    // Apply filters
    const searchQuery = searchBar.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortedActivities = Object.entries(activities)
      .filter(([name, details]) => {
        const matchesSearch = name.toLowerCase().includes(searchQuery);
        const matchesCategory = !selectedCategory || details.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort(([nameA, detailsA], [nameB, detailsB]) => {
        if (sortOptions.value === "name") {
          return nameA.localeCompare(nameB);
        } else if (sortOptions.value === "time") {
          return new Date(detailsA.time) - new Date(detailsB.time);
        }
        return 0;
      });

    // Populate activities list
    sortedActivities.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      activityCard.innerHTML = `
        <h3>${name}</h3>
        <p>${details.description}</p>
        <p>Category: ${details.category}</p>
        <p>Time: ${details.time}</p>
      `;
      activitiesList.appendChild(activityCard);
    });
  }

  // Event listeners for toolbar
  searchBar.addEventListener("input", fetchActivities);
  categoryFilter.addEventListener("change", fetchActivities);
  sortOptions.addEventListener("change", fetchActivities);

  // Initial fetch
  fetchActivities();
});
