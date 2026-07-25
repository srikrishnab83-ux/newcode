/*==========================================================
  ShopVerse
  google-auth.js
==========================================================*/

import { auth, db } from "./firebase-config.js";

import {
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/*==========================================================
GOOGLE PROVIDER
==========================================================*/

const provider = new GoogleAuthProvider();

provider.setCustomParameters({

    prompt: "select_account"

});

/*==========================================================
DOM
==========================================================*/

const googleLogin =
    document.getElementById("googleLogin");

const googleSignup =
    document.getElementById("googleSignup");

const loginMessage =
    document.getElementById("loginMessage");

const registerMessage =
    document.getElementById("registerMessage");

const loadingOverlay =
    document.getElementById("loadingOverlay");

/*==========================================================
HELPERS
==========================================================*/

function showLoading() {

    if (loadingOverlay)
        loadingOverlay.classList.add("active");

}

function hideLoading() {

    if (loadingOverlay)
        loadingOverlay.classList.remove("active");

}

function showMessage(message, type = "success") {

    const box = loginMessage || registerMessage;

    if (!box) return;

    box.className = "login-message";

    box.classList.add(type);

    box.textContent = message;

    box.style.display = "block";

}
/*==========================================================
GOOGLE SIGN-IN
==========================================================*/

async function signInWithGoogle() {

    showLoading();

    try {

        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        /*==========================================
        NEW USER
        ==========================================*/

        if (!userSnap.exists()) {

            await setDoc(userRef, {

                uid: user.uid,

                name: user.displayName || "",

                email: user.email,

                phone: user.phoneNumber || "",

                photoURL: user.photoURL || "",

                role: "customer",

                status: "active",

                emailVerified: true,

                createdAt: serverTimestamp()

            });

        }

        /*==========================================
        EXISTING USER
        ==========================================*/

        else {

            await updateDoc(userRef, {

                emailVerified: true

            });

        }

        hideLoading();

        const data = (await getDoc(userRef)).data();

        switch (data.role) {

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

    }

    catch (error) {

        hideLoading();

        console.error(error);

        let message = "Google Sign-In failed.";

        switch (error.code) {

            case "auth/popup-closed-by-user":

                message = "Google Sign-In was cancelled.";

                break;

            case "auth/popup-blocked":

                message = "Please allow popups and try again.";

                break;

            case "auth/network-request-failed":

                message = "Please check your internet connection.";

                break;

            default:

                message = error.message;

        }

        showMessage(message, "error");

    }

}

/*==========================================================
BUTTON EVENTS
==========================================================*/

if (googleLogin) {

    googleLogin.addEventListener(

        "click",

        signInWithGoogle

    );

}

if (googleSignup) {

    googleSignup.addEventListener(

        "click",

        signInWithGoogle

    );

}

/*==========================================================
END OF google-auth.js
==========================================================*/
