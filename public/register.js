const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const togglePasswordBtn = document.getElementById("togglePassword");

togglePasswordBtn.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordBtn.textContent = "Hide";
  } else {
    passwordInput.type = "password";
    togglePasswordBtn.textContent = "Show";
  }
});

registerBtn.addEventListener("click", async () => {
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value.trim();

  if (!fullName || !email || !phone || !password) {
    alert("Please fill all fields");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Registering...";

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullName, email, phone, password })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Registration failed");
      registerBtn.disabled = false;
      registerBtn.textContent = "Register";
      return;
    }

    alert("Registration successful. Now login.");
    window.location.href = "login.html";
  } catch (error) {
    console.error("Register error:", error);
    alert("Server not running or API error");
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  }
});