/* ================= FIREBASE AUTH ================= */

const auth = firebase.auth();

/* ===================================================
   AUTO REDIRECT IF USER ALREADY LOGGED IN
=================================================== */

auth.onAuthStateChanged(user => {

  // Only protect dashboard page
  if (window.location.pathname.includes("dashboard.html")) {

    if (!user) {
      window.location.href = "login.html";
    }

  }

});



/* ===================================================
   SIGNUP PAGE
=================================================== */

if (document.getElementById("signupForm")) {

  const signupForm = document.getElementById("signupForm");
  const googleBtn = document.getElementById("googleBtn");

  // 🔹 Email + Password Signup
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert(error.message);
      });
  });

  // 🔹 Google Signup (Popup Method - Stable)
  googleBtn.addEventListener("click", () => {

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });

    auth.signInWithPopup(provider)
      .then(() => {
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert(error.message);
      });
  });
}


/* ===================================================
   LOGIN PAGE
=================================================== */

if (document.getElementById("loginForm")) {

  const loginForm = document.getElementById("loginForm");
  const googleLogin = document.getElementById("googleLogin");

  // 🔹 Email + Password Login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert(error.message);
      });
  });
auth.onAuthStateChanged(user => {

  if (user) {

    const emailInput = document.getElementById("login-email");

    if (emailInput) {
      emailInput.value = user.email;
    }

  }

});

  // 🔹 Google Login (Popup Method)
  googleLogin.addEventListener("click", () => {

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });

    auth.signInWithPopup(provider)
      .then(() => {
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert(error.message);
      });
  });
}
