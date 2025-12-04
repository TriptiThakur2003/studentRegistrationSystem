//   Query DOM elements
const studentForm = document.getElementById("studentForm");
const nameInput = document.getElementById("studentName");
const idInput = document.getElementById("studentID");
const emailInput = document.getElementById("email");
const contactInput = document.getElementById("contact");

const tableBody = document.getElementById("tableBody");
const tableContainer = document.getElementById("tableContainer");

//   Constants & state
const STORAGE_KEY = "students"; // localStorage key
let students = []; // array of student objects: {name, id, email, contact}
let editIndex = -1; // index of student being edited; -1 means add mode

//   Validation patterns
// Name: letters and spaces only, 2-50 characters
const nameRegex = /^[A-Za-z\s]{2,50}$/;
// ID: digits only
const idRegex = /^\d+$/;
// Contact: digits only and at least 10 digits
const contactRegex = /^\d{10,}$/;
// Basic email validation (simple but effective for forms)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//   Utility functions

// Load students from localStorage
function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    students = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load students from storage:", err);
    students = [];
  }
}

// Save students array to localStorage
function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// Escape HTML to avoid injection when injecting text into table
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

// Show a short temporary message (you can enhance this into a UI message area)
function flashMessage(msg, duration = 1800) {
  // Create small floating message and remove after duration
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.position = "fixed";
  el.style.right = "20px";
  el.style.bottom = "20px";
  el.style.background = "rgba(0,0,0,0.6)";
  el.style.color = "#fff";
  el.style.padding = "10px 14px";
  el.style.borderRadius = "10px";
  el.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
  el.style.zIndex = 9999;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity 300ms";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

//   Rendering functions

// Render the students table body
function renderTable() {
  tableBody.innerHTML = "";

  if (!students.length) {
    // show a single row telling it's empty
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="text-align:center;opacity:0.9;padding:18px">No students registered yet.</td>`;
    tableBody.appendChild(tr);
    return;
  }

  students.forEach((s, idx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.id)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.contact)}</td>
      <td>
        <button class="action-btn edit-btn" data-action="edit" data-index="${idx}">Edit</button>
        <button class="action-btn delete-btn" data-action="delete" data-index="${idx}">Delete</button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

//  Table actions (Edit / Delete) Using event delegation on tableBody

tableBody.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const index = parseInt(btn.dataset.index, 10);

  if (action === "edit") {
    startEdit(index);
  } else if (action === "delete") {
    deleteStudent(index);
  }
});

function startEdit(index) {
  if (index < 0 || index >= students.length) return;
  const s = students[index];
  nameInput.value = s.name;
  idInput.value = s.id;
  emailInput.value = s.email;
  contactInput.value = s.contact;

  editIndex = index;
  // Change submit button label visually
  const submitBtn = studentForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Update Student";
  flashMessage('Editing mode: update values and press "Update Student"');
}

function deleteStudent(index) {
  if (index < 0 || index >= students.length) return;
  const confirmDel = confirm("Are you sure you want to delete this student?");
  if (!confirmDel) return;

  students.splice(index, 1);
  saveStudents();
  renderTable();

  // If we deleted the record we were editing, reset form
  if (editIndex === index) {
    resetForm();
  } else if (editIndex > index) {
    // adjust editIndex because array shifted
    editIndex -= 1;
  }

  flashMessage("Student deleted");
}

//    Form handling: Add / Update

studentForm.addEventListener("submit", (ev) => {
  ev.preventDefault();

  const name = nameInput.value.trim();
  const id = idInput.value.trim();
  const email = emailInput.value.trim();
  const contact = contactInput.value.trim();

  // Basic empty check
  if (!name || !id || !email || !contact) {
    flashMessage("Please fill in all fields.");
    return;
  }

  // Validations
  if (!nameRegex.test(name)) {
    flashMessage("Name must be letters and spaces only (2-50 chars).");
    return;
  }
  if (!idRegex.test(id)) {
    flashMessage("Student ID must contain digits only.");
    return;
  }
  if (!emailRegex.test(email)) {
    flashMessage("Please enter a valid email address.");
    return;
  }
  if (!contactRegex.test(contact)) {
    flashMessage("Contact number must be digits only and at least 10 digits.");
    return;
  }

  // Duplicate ID prevention:
  const existingIndex = students.findIndex((s) => s.id === id);

  if (editIndex === -1) {
    // Adding mode
    if (existingIndex !== -1) {
      flashMessage("A student with this Student ID already exists.");
      return;
    }

    students.push({ name, id, email, contact });
    saveStudents();
    renderTable();
    studentForm.reset();
    flashMessage("Student added successfully.");
  } else {
    // Updating mode
    // If changing ID to one that belongs to another record, block
    if (existingIndex !== -1 && existingIndex !== editIndex) {
      flashMessage("Another student with this Student ID already exists.");
      return;
    }

    students[editIndex] = { name, id, email, contact };
    saveStudents();
    renderTable();
    studentForm.reset();
    editIndex = -1;
    const submitBtn = studentForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Add Student";
    flashMessage("Student updated successfully.");
  }

  // readjust table scrollbar because content changed
  adjustTableContainerHeight();
});

//    Reset form helper
function resetForm() {
  studentForm.reset();
  editIndex = -1;
  const submitBtn = studentForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Add Student";
}

//    Dynamic vertical scrollbar:
//    Set tableContainer max-height based on viewport minus header/form space
//    so a vertical scrollbar appears when content exceeds that height
function adjustTableContainerHeight() {
  // Calculate available height: viewport minus top/bottom paddings and some margins
  // We'll attempt to leave room for header and form; this is approximate and works across sizes.
  const viewportH = window.innerHeight;

  // Estimate heights of top/bottom areas by querying DOM where possible
  const headerEl = document.querySelector(".header");
  const headerH = headerEl ? headerEl.getBoundingClientRect().height : 120;

  const formSection = document.querySelector(".form-section");
  const formH = formSection ? formSection.getBoundingClientRect().height : 320;

  // Reserve some extra space for margins/padding (tweakable)
  const reserved = 140;

  // Compute target max height for the table area
  let target = viewportH - (headerH + formH + reserved);
  // clamp it to reasonable bounds
  if (target < 150) target = 150;
  if (target > 900) target = 900;

  // Apply max-height and enable vertical scroll
  tableContainer.style.maxHeight = `${target}px`;
  tableContainer.style.overflowY = "auto";
}

// Recompute on resize and when DOM content loads
window.addEventListener("resize", adjustTableContainerHeight);
window.addEventListener("orientationchange", adjustTableContainerHeight);

//    Initialization
(function init() {
  loadStudents();
  renderTable();
  adjustTableContainerHeight();

  // Accessibility: focus name input on page load
  if (nameInput) nameInput.focus();
})();
