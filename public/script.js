const welcomeText = document.getElementById("welcomeText");

const nameInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const courseInput = document.getElementById("course");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const searchInput = document.getElementById("searchInput");

const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");
const clearBtn = document.getElementById("clearBtn");
const searchBtn = document.getElementById("searchBtn");
const showBtn = document.getElementById("showBtn");
const logoutBtn = document.getElementById("logoutBtn");

const studentTable = document.getElementById("studentTable");
const totalStudents = document.getElementById("totalStudents");
const totalCourses = document.getElementById("totalCourses");

let students = [];
let editingId = null;
let currentUserId = null;

window.onload = async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const user = localStorage.getItem("user") || "Admin";
  currentUserId = localStorage.getItem("userId");

  if (isLoggedIn !== "true" || !currentUserId) {
    window.location.href = "login.html";
    return;
  }

  welcomeText.textContent = `Welcome, ${user}`;
  await loadStudents();
};

function validateForm(data) {
  if (!data.name || !data.age || !data.course || !data.phone || !data.email) {
    alert("Please fill all fields");
    return false;
  }

  if (Number(data.age) <= 0) {
    alert("Please enter valid age");
    return false;
  }

  if (!/^\d{10}$/.test(data.phone)) {
    alert("Phone number must be exactly 10 digits");
    return false;
  }

  if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    alert("Please enter a valid email");
    return false;
  }

  return true;
}

function getFormData() {
  return {
    userId: currentUserId,
    name: nameInput.value.trim(),
    age: ageInput.value.trim(),
    course: courseInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim()
  };
}

function clearForm() {
  nameInput.value = "";
  ageInput.value = "";
  courseInput.value = "";
  phoneInput.value = "";
  emailInput.value = "";
  editingId = null;
}

function updateStats(data = students) {
  totalStudents.textContent = data.length;

  const courseSet = new Set(
    data.map((item) => item.course.trim().toLowerCase())
  );
  totalCourses.textContent = courseSet.size;
}

function renderStudents(data = students) {
  if (!data.length) {
    studentTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No students yet</td>
      </tr>
    `;
    updateStats([]);
    return;
  }

  studentTable.innerHTML = data.map((student) => `
    <tr>
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.age}</td>
      <td>${student.course}</td>
      <td>${student.phone}</td>
      <td>${student.email}</td>
      <td>
        <button class="edit-btn" onclick="editStudent(${student.id})">Edit</button>
        <button class="delete-btn" onclick="deleteStudent(${student.id})">Delete</button>
      </td>
    </tr>
  `).join("");

  updateStats(data);
}

async function loadStudents() {
  try {
    const response = await fetch(`/api/students/${currentUserId}`);
    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to load students");
      return;
    }

    students = data;
    renderStudents(students);
  } catch (error) {
    console.error("Load error:", error);
    alert("Failed to load students");
  }
}

async function addStudent() {
  const data = getFormData();

  if (!validateForm(data)) return;

  try {
    const response = await fetch("/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to add student");
      return;
    }

    await loadStudents();
    clearForm();
    alert("Student added successfully");
  } catch (error) {
    console.error("Add error:", error);
    alert("Failed to add student");
  }
}

async function updateStudentData() {
  if (!editingId) {
    alert("Please select a student to update");
    return;
  }

  const data = getFormData();

  if (!validateForm(data)) return;

  try {
    const response = await fetch(`/api/students/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to update student");
      return;
    }

    await loadStudents();
    clearForm();
    alert("Student updated successfully");
  } catch (error) {
    console.error("Update error:", error);
    alert("Failed to update student");
  }
}

window.editStudent = function (id) {
  const student = students.find((item) => item.id === id);

  if (!student) return;

  nameInput.value = student.name;
  ageInput.value = student.age;
  courseInput.value = student.course;
  phoneInput.value = student.phone;
  emailInput.value = student.email;
  editingId = student.id;
};

window.deleteStudent = async function (id) {
  const confirmDelete = confirm("Are you sure you want to delete this student?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/students/${id}/${currentUserId}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to delete student");
      return;
    }

    await loadStudents();
    if (editingId === id) clearForm();
    alert("Student deleted successfully");
  } catch (error) {
    console.error("Delete error:", error);
    alert("Failed to delete student");
  }
};

function searchStudents() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    renderStudents(students);
    return;
  }

  const filtered = students.filter((student) =>
    student.name.toLowerCase().includes(query) ||
    student.course.toLowerCase().includes(query) ||
    student.phone.toLowerCase().includes(query) ||
    student.email.toLowerCase().includes(query)
  );

  renderStudents(filtered);
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userPhone");
  window.location.href = "login.html";
}

addBtn.addEventListener("click", addStudent);
updateBtn.addEventListener("click", updateStudentData);
clearBtn.addEventListener("click", clearForm);
searchBtn.addEventListener("click", searchStudents);
showBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderStudents(students);
});
logoutBtn.addEventListener("click", logout);