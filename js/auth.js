/*==========================================================
  ShopVerse
  File : auth.js
  Part 1
  Login Authentication
==========================================================*/

import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/*==========================================================
DOM ELEMENTS
==========================================================*/

const loginForm = document.getElementById("loginForm");

const email = document.getElementById("email");
const password = document.getElementById("password");

const rememberMe = document.getElementById("remember");

const loginMessage =
    document.getElementById("loginMessage");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const loginButton =
    document.querySelector(".login-btn-full");

/*==========================================================
PASSWORD TOGGLE
==========================================================*/

document.querySelectorAll(".toggle-password").forEach(button => {

    button.addEventListener("click", () => {

        const input =
            button.parentElement.querySelector("input");

        const icon =
            button.querySelector("i");

        if (input.type === "password") {

            input.type = "text";

            icon.classList.replace(
                "fa-eye",
                "fa-eye-slash"
            );

        } else {

            input.type = "password";

            icon.classList.replace(
                "fa-eye-slash",
                "fa-eye"
            );

        }

    });

});

/*==========================================================
HELPERS
==========================================================*/

function showLoading() {

    if (loadingOverlay)
        loadingOverlay.classList.add("active");

    if (loginButton)
        loginButton.disabled = true;

}

function hideLoading() {

    if (loadingOverlay)
        loadingOverlay.classList.remove("active");

    if (loginButton)
        loginButton.disabled = false;

}

function showMessage(message, type = "success") {

    if (!loginMessage) return;

    loginMessage.className = "login-message";

    loginMessage.classList.add(type);

    loginMessage.textContent = message;

    loginMessage.style.display = "block";

}

function clearMessage() {

    if (!loginMessage) return;

    loginMessage.className = "login-message";

    loginMessage.textContent = "";

    loginMessage.style.display = "none";

}

/*==========================================================
VALIDATION
==========================================================*/

function validEmail(value) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

}

function validateLogin() {

    clearMessage();

    if (!validEmail(email.value.trim())) {

        showMessage(
            "Please enter a valid email address.",
            "error"
        );

        email.focus();

        return false;

    }

    if (password.value.trim().length < 8) {

        showMessage(
            "Password must contain at least 8 characters.",
            "error"
        );

        password.focus();

        return false;

    }

    return true;

}

/*==========================================================
REMEMBER ME
==========================================================*/

async function applyPersistence() {

    if (rememberMe && rememberMe.checked) {

        await setPersistence(
            auth,
            browserLocalPersistence
        );

    } else {

        await setPersistence(
            auth,
            browserSessionPersistence
        );

    }

}

/*==========================================================
PART 2 STARTS WITH

✔ Login
✔ Email Verification
✔ Firestore Role Check
✔ Customer/Seller/Admin Redirect
✔ Error Handling

==========================================================*/
/*==========================================================
  ShopVerse
  File : auth.js
  Part 2
  Login Authentication
==========================================================*/

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        if (!validateLogin()) return;

        showLoading();

        try {

            /* Remember Me */

            await applyPersistence();

            /* Login */

            const credential =
                await signInWithEmailAndPassword(

                    auth,
                    email.value.trim(),
                    password.value

                );

            const user = credential.user;

            /* Email Verification */

            if (!user.emailVerified) {

                await signOut(auth);

                hideLoading();

                showMessage(

                    "Please verify your email before logging in.",

                    "error"

                );

                return;

            }

            /* Firestore User */

            const userRef = doc(db, "users", user.uid);

            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {

                await signOut(auth);

                hideLoading();

                showMessage(

                    "User account not found.",

                    "error"

                );

                return;

            }

            const userData = userSnap.data();

            /* Update Email Verification */

            if (!userData.emailVerified) {

                await updateDoc(userRef, {

                    emailVerified: true

                });

            }

            hideLoading();

            showMessage(

                "Login Successful.",

                "success"

            );

            /* Redirect by Role */

            setTimeout(() => {

                switch (userData.role) {

                    case "customer":

                       window.location.href = "customer/home.html";

                        break;

                    case "seller":

                        window.location.href =
                            "seller/dashboard.html";

                        break;

                    case "admin":

                        window.location.href =
                            "admin/dashboard.html";

                        break;

                    default:

                        window.location.href =
                            "index.html";

                }

            }, 1000);

        }

        catch (error) {

            hideLoading();

            console.error(error);

            let message = "Login failed.";

            switch (error.code) {

                case "auth/invalid-credential":

                    message =
                        "Invalid email or password.";

                    break;

                case "auth/user-disabled":

                    message =
                        "Your account has been disabled.";

                    break;

                case "auth/network-request-failed":

                    message =
                        "Check your internet connection.";

                    break;

                case "auth/too-many-requests":

                    message =
                        "Too many attempts. Try again later.";

                    break;

                default:

                    message = error.message;

            }

            showMessage(message, "error");

        }

    });

}

/*==========================================================
PART 3

✔ Auto Login
✔ Auto Redirect
✔ Logout Function
✔ Auth State Listener

==========================================================*/
/*==========================================================
  ShopVerse
  File : auth.js
  Part 3
==========================================================*/

/*==========================================================
AUTO LOGIN
==========================================================*/

onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    try {

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const userData = userSnap.data();

        /* Keep Firestore Verification Updated */

        if (user.emailVerified && !userData.emailVerified) {

            await updateDoc(userRef, {

                emailVerified: true

            });

        }

        /* Redirect According To Role */

        const currentPage =
            window.location.pathname.toLowerCase();

        if (
            currentPage.includes("login") ||
            currentPage.includes("register")
        ) {

            switch (userData.role) {

                case "customer":

                    window.location.href = "customer/home.html";

                    break;

                case "seller":

                    window.location.href =
                        "seller/dashboard.html";

                    break;

                case "admin":

                    window.location.href =
                        "admin/dashboard.html";

                    break;

            }

        }

    }

    catch (error) {

        console.error(error);

    }

});

/*==========================================================
LOGOUT
==========================================================*/

export async function logoutUser() {

    try {

        await signOut(auth);

        window.location.href = "../login.html";

    }

    catch (error) {

        console.error(error);

    }

}

/*==========================================================
GLOBAL LOGOUT BUTTON
==========================================================*/

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", logoutUser);

}

/*==========================================================
AUTH GUARD
==========================================================*/

export async function requireLogin() {

    return new Promise((resolve) => {

        onAuthStateChanged(auth, (user) => {

            if (user) {

                resolve(user);

            } else {

                window.location.href = "../login.html";

            }

        });

    });

}

/*==========================================================
END OF auth.js
==========================================================*/
