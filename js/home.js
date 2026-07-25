// ================================
// ShopVerse Customer Home
// home.js
// ================================

import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// DOM Elements
// ==========================================

const customerName = document.getElementById("customerName");
const customerDistrict = document.getElementById("customerDistrict");

const profileImage = document.getElementById("profileImage");

const logoutBtn = document.getElementById("logoutBtn");

const cartBadge = document.getElementById("cartBadge");

const wishlistBadge = document.getElementById("wishlistBadge");

const notificationBadge = document.getElementById("notificationBadge");


// ==========================================
// Authentication
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";
        return;

    }

    loadCustomer(user.uid);

});


// ==========================================
// Load Customer Information
// ==========================================

async function loadCustomer(uid) {

    try {

        const docRef = doc(db, "customers", uid);

        const snap = await getDoc(docRef);

        if (!snap.exists()) return;

        const data = snap.data();

        // Name

        if (customerName) {

            customerName.textContent = data.fullName || "Customer";

        }

        // District

        if (customerDistrict) {

            customerDistrict.textContent =
                data.district || "Kerala";

        }

        // Profile

        if (profileImage) {

            profileImage.src =
                data.photoURL ||
                "../assets/images/avatar.png";

        }

        // Cart Badge

        if (cartBadge) {

            cartBadge.textContent =
                data.cartCount || 0;

        }

        // Wishlist Badge

        if (wishlistBadge) {

            wishlistBadge.textContent =
                data.wishlistCount || 0;

        }

        // Notifications

        if (notificationBadge) {

            notificationBadge.textContent =
                data.notifications || 0;

        }

    }

    catch (error) {

        console.error(error);

    }

}


// ==========================================
// Logout
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        if (!confirm("Logout from ShopVerse?"))
            return;

        await signOut(auth);

        window.location.href = "../login.html";

    });

}
// ==========================================
// Search Products
// ==========================================

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

if (searchBtn) {

    searchBtn.addEventListener("click", () => {

        const keyword = searchInput.value.trim();

        if (keyword === "") {

            alert("Please enter a product name.");

            return;

        }

        window.location.href =
            `../products.html?search=${encodeURIComponent(keyword)}`;

    });

}

if (searchInput) {

    searchInput.addEventListener("keypress", (e) => {

        if (e.key === "Enter") {

            searchBtn.click();

        }

    });

}


// ==========================================
// Category Click
// ==========================================

document.querySelectorAll(".category-card").forEach(card => {

    card.addEventListener("click", () => {

        const category = card.dataset.category;

        window.location.href =
            `../products.html?category=${category}`;

    });

});


// ==========================================
// Hero Banner Slider
// ==========================================

const slides = document.querySelectorAll(".hero-slide");

let currentSlide = 0;

function showSlide(index) {

    slides.forEach(slide => {

        slide.classList.remove("active");

    });

    slides[index].classList.add("active");

}

if (slides.length > 0) {

    showSlide(currentSlide);

    setInterval(() => {

        currentSlide++;

        if (currentSlide >= slides.length) {

            currentSlide = 0;

        }

        showSlide(currentSlide);

    }, 5000);

}


// ==========================================
// Floating Cart Button
// ==========================================

const floatingCart = document.getElementById("floatingCart");

if (floatingCart) {

    floatingCart.addEventListener("click", () => {

        window.location.href = "../cart.html";

    });

}


// ==========================================
// Notification Button
// ==========================================

const notificationBtn =
document.getElementById("notificationBtn");

if (notificationBtn) {

    notificationBtn.addEventListener("click", () => {

        window.location.href =
            "../notifications.html";

    });

}


// ==========================================
// Wishlist Button
// ==========================================

const wishlistBtn =
document.getElementById("wishlistBtn");

if (wishlistBtn) {

    wishlistBtn.addEventListener("click", () => {

        window.location.href =
            "../wishlist.html";

    });

}


// ==========================================
// Bottom Navigation
// ==========================================

document.querySelectorAll(".bottom-nav a").forEach(link => {

    link.addEventListener("click", () => {

        document.querySelectorAll(".bottom-nav a")
            .forEach(item => item.classList.remove("active"));

        link.classList.add("active");

    });

});


// ==========================================
// Smooth Scroll
// ==========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function(e) {

        e.preventDefault();

        document.querySelector(this.getAttribute("href"))
            ?.scrollIntoView({

                behavior: "smooth"

            });

    });

});


// ==========================================
// Welcome Animation
// ==========================================

window.addEventListener("load", () => {

    document.body.classList.add("loaded");

});
