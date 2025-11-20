document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // top portion of the card
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="badge">${spotsLeft} spots left</span></p>
        `;

        // Create participants toggle button (spoiler)
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "participants-toggle";
        toggleBtn.textContent = `Participants (${details.participants.length})`;
        toggleBtn.setAttribute("aria-expanded", "false");

        // participants section (hidden by default)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants hidden";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Registered participants:";
        participantsDiv.appendChild(participantsTitle);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (details.participants && details.participants.length) {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // create avatar with initials
            const avatar = document.createElement("span");
            avatar.className = "avatar";
            const namePart = email.split("@")[0] || email;
            const initials = namePart
              .split(/[.\-_]/)
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            avatar.textContent = initials;

            const label = document.createElement("span");
            label.className = "participant-label";
            label.textContent = email;

            li.appendChild(avatar);
            li.appendChild(label);
            // delete button
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "delete-btn";
            delBtn.setAttribute("aria-label", `Remove ${email}`);
            delBtn.textContent = "✖";

            // When delete clicked: visually mark deleting, remove bullets, call API, then reload
            delBtn.addEventListener("click", async (e) => {
              e.stopPropagation();

              // visually hide bullets for the list and mark item as deleting
              ul.classList.add("no-bullets");
              li.classList.add("deleting");

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participant?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                if (resp.ok) {
                  // reload to refresh activities/participants
                  window.location.reload();
                } else {
                  const err = await resp.json().catch(() => ({}));
                  messageDiv.textContent = err.detail || err.message || "Failed to remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                  // remove visual deleting state
                  li.classList.remove("deleting");
                  ul.classList.remove("no-bullets");
                }
              } catch (error) {
                console.error("Error removing participant:", error);
                messageDiv.textContent = "Failed to remove participant. Try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                li.classList.remove("deleting");
                ul.classList.remove("no-bullets");
              }
            });

            li.appendChild(delBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participant-item no-one";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        participantsDiv.appendChild(ul);

        // Toggle behavior: show/hide participants
        toggleBtn.addEventListener("click", () => {
          const nowHidden = participantsDiv.classList.toggle("hidden");
          toggleBtn.setAttribute("aria-expanded", String(!nowHidden));
          toggleBtn.textContent = nowHidden
            ? `Participants (${details.participants.length})`
            : `Hide participants (${details.participants.length})`;
        });

        // append toggle and participants section to card
        activityCard.appendChild(toggleBtn);
        activityCard.appendChild(participantsDiv);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        activitiesList.appendChild(activityCard);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so participant lists and availability update
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

  // Initialize app
  fetchActivities();
});
