const loginIdInput = document.getElementById("loginId");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const togglePasswordBtn = document.getElementById("togglePassword");

window.onload = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userId = localStorage.getItem("userId");

  if (isLoggedIn === "true" && userId) {
    window.location.href = "index.html";
  }
};

togglePasswordBtn.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordBtn.textContent = "Hide";
  } else {
    passwordInput.type = "password";
    togglePasswordBtn.textContent = "Show";
  }
});

loginBtn.addEventListener("click", async () => {
  const loginId = loginIdInput.value.trim();
  const password = passwordInput.value.trim();

  if (!loginId || !password) {
    alert("Please enter email/phone and password");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ loginId, password })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Login failed");
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userId", String(result.user.id));
    localStorage.setItem("user", result.user.full_name);
    localStorage.setItem("userEmail", result.user.email);
    localStorage.setItem("userPhone", result.user.phone);

    alert("Login successful");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Login error:", error);
    alert("Server not running or API error");
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});