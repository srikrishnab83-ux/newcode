/*==================================================
 SHOPVERSE HOME.JS
 For: home.html + home.css
 Fixed: Search, ViewAll, Menu, Firebase Load
==================================================*/

import { db, auth } from "./firebase-config.js";
import {
    collection, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

/*=========================================
 DOM HELPERS - Must be first
=========================================*/
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/*=========================================
 DOM ELEMENTS
=========================================*/
const flashSaleContainer = $("#flashSaleProducts");
const recommendedContainer = $("#recommendedProducts");
const trendingContainer = $("#trendingProducts");
const newArrivalContainer = $("#newArrivalProducts");
const searchInput = $("#searchInput");
const searchBtn = $("#searchBtn");
const cartCount = $("#cartCount");
const floatingCartCount = $("#floatingCartCount");
const wishlistBadge = $("#wishlistBadge");
const notificationBadge = $("#notificationBadge");

const menuBtn = $("#menuBtn");
const sideMenu = $("#sideMenu");
const closeMenu = $("#closeMenu");
const menuOverlay = $("#menuOverlay");

const notificationBtn = $("#notificationBtn");
const notificationPanel = $("#notificationPanel");
const closeNotification = $("#closeNotification");

const quickView = $("#quickView");
const quickImage = $("#quickImage");
const quickTitle = $("#quickTitle");
const quickPrice = $("#quickPrice");
const quickAddToCart = $("#quickAddToCart");
const closeQuickView = $("#closeQuickView");

const floatingCart = $("#floatingCart");
const newsletterForm = $("#newsletterForm");
const logoutBtn = $("#logoutBtn");

/*=========================================
 APP STATE + LOCALSTORAGE
=========================================*/
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("shopverse_cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("shopverse_wishlist")) || [];
let currentUser = null;
let currentProduct = null;

function saveCart(){
    localStorage.setItem("shopverse_cart", JSON.stringify(cart));
    updateBadges();
    refreshFloatingCart();
}

function saveWishlist(){
    localStorage.setItem("shopverse_wishlist", JSON.stringify(wishlist));
    updateBadges();
}

/*=========================================
 UI HELPERS
=========================================*/
function updateBadges(){
    if(cartCount) cartCount.textContent = cart.length;
    if(floatingCartCount) floatingCartCount.textContent = cart.length;
    if(wishlistBadge) wishlistBadge.textContent = wishlist.length;
}

function showToast(message){
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
        background: '#222', color: '#fff', padding: '12px 20px', borderRadius: '12px',
        zIndex: '9999', opacity: '0', transition: '.3s'
    });
    document.body.appendChild(toast);
    setTimeout(()=>{ toast.style.opacity = '1'; },100);
    setTimeout(()=>{ toast.style.opacity = '0'; setTimeout(()=>{ toast.remove(); },300); },2000);
}

function money(value){ return "₹" + Number(value).toLocaleString("en-IN"); }

function skeleton(container){
    if(!container) return;
    container.innerHTML="";
    for(let i=0;i<4;i++){
        const card=document.createElement("div");
        card.className="product-skeleton";
        container.appendChild(card);
    }
}

/*=========================================
 PRODUCT CARD TEMPLATE
=========================================*/
function productCard(product){
    const inWishlist = wishlist.includes(product.id);
    const discount = product.oldPrice? Math.round(((product.oldPrice - product.price)/product.oldPrice)*100) : product.discount || 0;

    return `
    <div class="product-card">
        <div class="product-image">
            ${discount > 0? `<span class="product-badge">${discount}% OFF</span>` : ""}
            <img loading="lazy" src="${product.image || '../assets/images/product-placeholder.png'}" alt="${product.name}">
            <button class="product-favourite" data-id="${product.id}">
                <i class="fa-${inWishlist? "solid" : "regular"} fa-heart"></i>
            </button>
        </div>
        <div class="product-content">
            <div class="product-category">${product.category || 'General'}</div>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-rating">★★★ <span>(${product.rating || 5})</span></div>
            <div class="product-price">
                <span class="current-price">${money(product.price)}</span>
                ${product.oldPrice? `<span class="old-price">${money(product.oldPrice)}</span>` : ""}
            </div>
            <div class="product-actions">
                <button class="add-cart" data-id="${product.id}">Add Cart</button>
                <button class="buy-now" data-id="${product.id}">Buy</button>
            </div>
        </div>
    </div>`;
}

function renderProducts(container, data){
    if(!container) return;
    if(!data.length){
        container.innerHTML=`<div class="empty-products"><i class="fa-solid fa-box-open"></i><h3>No Products Found</h3></div>`;
        return;
    }
    container.innerHTML = data.map(productCard).join("");
    refreshWishlistIcons();
}

/*=========================================
 LOAD PRODUCTS FROM FIREBASE
=========================================*/
async function loadProducts(){
    try{
        skeleton(flashSaleContainer);
        skeleton(recommendedContainer);
        skeleton(trendingContainer);
        skeleton(newArrivalContainer);

        const snap = await getDocs(collection(db,"products"));
        allProducts = snap.docs.map(doc=>({ id:doc.id,...doc.data() }));

        renderFlashSale();
        renderRecommended();
        renderTrending();
        renderNewArrivals();
        updateBadges();
    }
    catch(error){
        console.error(error);
        showToast("Unable to load products. Check Firebase.");
    }
}

function renderFlashSale(){
    const items = allProducts.filter(p=>p.flashSale || p.discount > 0).slice(0,8);
    renderProducts(flashSaleContainer, items);
}

function renderRecommended(){
    const items = allProducts.filter(p=>p.recommended).slice(0,8);
    if(!items.length) items.push(...allProducts.slice(0,8)); // fallback
    renderProducts(recommendedContainer, items);
}

function renderTrending(){
    const items = allProducts.filter(p=>p.trending).sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,8);
    if(!items.length) items.push(...allProducts.slice(0,8));
    renderProducts(trendingContainer, items);
}

function renderNewArrivals(){
    const items = [...allProducts].sort((a,b)=> (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0,8);
    renderProducts(newArrivalContainer, items);
}

/*=========================================
 CART + WISHLIST + BUY
=========================================*/
function addToCart(productId){
    const product = allProducts.find(p=>p.id===productId);
    if(!product){ showToast("Product not found"); return; }
    const exists = cart.find(item=>item.id===productId);
    if(exists){ exists.quantity++; } else { cart.push({ id:product.id, quantity:1 }); }
    saveCart();
    showToast("Added to cart");
}

function toggleWishlist(productId){
    if(wishlist.includes(productId)){
        wishlist = wishlist.filter(id=>id!==productId);
        showToast("Removed from wishlist");
    }else{
        wishlist.push(productId);
        showToast("Added to wishlist");
    }
    saveWishlist();
    refreshWishlistIcons();
}

function refreshWishlistIcons(){
    $$(".product-favourite").forEach(button=>{
        const id = button.dataset.id;
        const icon = button.querySelector("i");
        if(wishlist.includes(id)){
            icon.classList.remove("fa-regular"); icon.classList.add("fa-solid");
        }else{
            icon.classList.remove("fa-solid"); icon.classList.add("fa-regular");
        }
    });
}

function buyNow(productId){
    addToCart(productId);
    window.location.href="cart.html";
}

/*=========================================
 PRODUCT GRID CLICK EVENTS
=========================================*/
document.addEventListener("click", e=>{
    const cartButton = e.target.closest(".add-cart");
    if(cartButton){ addToCart(cartButton.dataset.id); return; }

    const buyButton = e.target.closest(".buy-now");
    if(buyButton){ buyNow(buyButton.dataset.id); return; }

    const heart = e.target.closest(".product-favourite");
    if(heart){ toggleWishlist(heart.dataset.id); return; }

    const card = e.target.closest(".product-card");
    if(card){
        const button = card.querySelector(".add-cart");
        if(button){ openQuickView(allProducts.find(p=>p.id===button.dataset.id)); }
    }
});

/*=========================================
 SEARCH + CATEGORIES - FIXED
=========================================*/
function performSearch(){
    const keyword = searchInput.value.trim().toLowerCase();
    if(keyword === ""){
        renderRecommended(); renderTrending(); renderFlashSale(); renderNewArrivals();
        return;
    }
    const result = allProducts.filter(product=>{
        return product.name?.toLowerCase().includes(keyword) ||
               product.category?.toLowerCase().includes(keyword) ||
               product.brand?.toLowerCase().includes(keyword);
    });
    renderProducts(recommendedContainer, result);
}

searchBtn?.addEventListener("click", performSearch);
searchInput?.addEventListener("keypress", e=>{ if(e.key==="Enter"){ performSearch(); } });

// CATEGORY CLICK
$$(".category-item").forEach(item=>{
    item.addEventListener("click",()=>{
        $$(".category-item").forEach(c=>c.classList.remove("active"));
        item.classList.add("active");
        const category = item.dataset.category;
        const filtered = allProducts.filter(p=> p.category?.toLowerCase() === category.toLowerCase());
        renderProducts(recommendedContainer, filtered);
    });
});

// VIEW ALL BUTTON - FIXED
$(".categories.section-title a")?.addEventListener("click", e=>{
    e.preventDefault();
    window.location.href = "categories.html";
});

/*=========================================
 SIDE MENU - 3 LINE BUTTON - FIXED
=========================================*/
function openMenu(){
    sideMenu.classList.add("active");
    menuOverlay.classList.add("active");
    document.body.style.overflow="hidden";
}
function closeSideMenu(){
    sideMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
    document.body.style.overflow="";
}
menuBtn?.addEventListener("click", openMenu);
closeMenu?.addEventListener("click", closeSideMenu);
menuOverlay?.addEventListener("click", closeSideMenu);

/*=========================================
 NOTIFICATION PANEL
=========================================*/
notificationBtn?.addEventListener("click",()=>{
    notificationPanel.classList.add("active");
    menuOverlay.classList.add("active");
});
closeNotification?.addEventListener("click",()=>{
    notificationPanel.classList.remove("active");
    menuOverlay.classList.remove("active");
});

/*=========================================
 QUICK VIEW
=========================================*/
function openQuickView(product){
    if(!product) return;
    currentProduct = product;
    quickImage.src = product.image || '../assets/images/product-placeholder.png';
    quickTitle.textContent = product.name;
    quickPrice.textContent = money(product.price);
    quickView.classList.add("active");
}
function closeProductView(){ quickView.classList.remove("active"); }
closeQuickView?.addEventListener("click", closeProductView);
quickView?.addEventListener("click",e=>{ if(e.target===quickView){ closeProductView(); } });
quickAddToCart?.addEventListener("click",()=>{
    if(!currentProduct) return;
    addToCart(currentProduct.id);
    closeProductView();
});

/*=========================================
 FLOATING CART
=========================================*/
function refreshFloatingCart(){
    if(!floatingCart) return;
    floatingCartCount.textContent = cart.length;
    floatingCart.style.display = cart.length? "flex" : "none";
}

/*=========================================
 NEWSLETTER + LOGOUT + AUTH
=========================================*/
newsletterForm?.addEventListener("submit", async(e)=>{
    e.preventDefault();
    const email = $("#newsletterEmail").value.trim();
    if(email===""){ alert("Enter your email."); return; }
    try{
        await setDoc(doc(db,"newsletter",email), { email, createdAt: serverTimestamp() });
        alert("Subscribed successfully.");
        newsletterForm.reset();
    } catch(err){ console.error(err); alert("Subscription failed."); }
});

logoutBtn?.addEventListener("click", async(e)=>{
    e.preventDefault();
    if(!confirm("Logout now?")) return;
    await signOut(auth);
    location.href="../login.html";
});

onAuthStateChanged(auth, async(user)=>{
    if(!user){ location.href="../login.html"; return; }
    currentUser = user;
    const ref = doc(db,"customers",user.uid);
    const snap = await getDoc(ref);
    if(snap.exists()){
        const data = snap.data();
        $("#customerName").textContent = data.name || "Customer";
        $("#customerEmail").textContent = data.email || "";
        $("#customerDistrict").textContent = data.district || "Kerala";
        if(data.photoURL){ $("#userPhoto").src = data.photoURL; }
    }
});

/*=========================================
 BANNER SLIDER + COUNTDOWN
=========================================*/
const slides = $$(".hero-slide");
let slideIndex = 0;
function showSlide(index){
    slides.forEach(slide=> slide.classList.remove("active"));
    slides[index]?.classList.add("active");
}
function nextSlide(){
    slideIndex = (slideIndex + 1) % slides.length;
    showSlide(slideIndex);
}
if(slides.length > 1){ setInterval(nextSlide, 5000); }

const countdown = $(".countdown");
let seconds = 2*3600+15*60+30;
function updateCountdown(){
    if(!countdown) return;
    if(seconds <= 0){ countdown.textContent="Expired"; return; }
    seconds--;
    const h = String(Math.floor(seconds/3600)).padStart(2,"0");
    const m = String(Math.floor(seconds%3600/60)).padStart(2,"0");
    const s = String(seconds%60).padStart(2,"0");
    countdown.textContent = `${h}:${m}:${s}`;
}
setInterval(updateCountdown,1000);

/*=========================================
 INITIALIZE
=========================================*/
document.addEventListener("DOMContentLoaded", ()=>{
    updateBadges();
    refreshFloatingCart();
    loadProducts();
});

console.log("ShopVerse home.js loaded ✅");
