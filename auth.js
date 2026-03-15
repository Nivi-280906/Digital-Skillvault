/* ================= FIREBASE AUTH ================= */

const auth = firebase.auth();

/* ===================================================
   PROTECT DASHBOARD PAGE
=================================================== */

auth.onAuthStateChanged(user => {

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


  /* EMAIL SIGNUP */

  signupForm.addEventListener("submit", (e) => {

    e.preventDefault();

    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    auth.createUserWithEmailAndPassword(email, password)

      .then(() => {

        // account created → logout → login page
        auth.signOut();
        window.location.href = "login.html";

      })

      .catch((error) => {

        if (error.code === "auth/email-already-in-use") {

          alert("Account already exists. Please log in.");

        } else {

          alert(error.message);

        }

      });

  });



  /* GOOGLE SIGNUP */

  googleBtn.addEventListener("click", () => {

    const provider = new firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    auth.signInWithPopup(provider)

      .then((result) => {

        const isNewUser = result.additionalUserInfo.isNewUser;

        if (!isNewUser) {

          alert("Account already exists. Please log in.");

          auth.signOut();
          return;

        }

        // new google signup → logout → login page
        auth.signOut();
        window.location.href = "login.html";

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


  /* EMAIL LOGIN */

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



  /* GOOGLE LOGIN */

  googleLogin.addEventListener("click", () => {

    const provider = new firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    auth.signInWithPopup(provider)

      .then((result) => {

        if (result.additionalUserInfo.isNewUser) {

          alert("No account found. Please sign up first.");

          // delete automatically created account
          result.user.delete();

          auth.signOut();
          return;

        }

        // existing user → dashboard
        window.location.href = "dashboard.html";

      })

      .catch((error) => {

        alert(error.message);

      });

  });

}