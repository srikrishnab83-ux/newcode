/*==================================================
 SHOPVERSE HOME.JS
 Part 1
 Firebase • DOM • Helpers • Product Rendering
==================================================*/

import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/*==================================================
 DOM ELEMENTS
==================================================*/

const flashSaleContainer =
document.getElementById("flashSaleProducts");

const recommendedContainer =
document.getElementById("recommendedProducts");

const trendingContainer =
document.getElementById("trendingProducts");

const newArrivalContainer =
document.getElementById("newArrivalProducts");

const searchInput =
document.getElementById("searchInput");

const searchBtn =
document.getElementById("searchBtn");

const cartCount =
document.getElementById("cartCount");

const floatingCartCount =
document.getElementById("floatingCartCount");

const wishlistBadge =
document.getElementById("wishlistBadge");

const notificationBadge =
document.getElementById("notificationBadge");



/*==================================================
 APP STATE
==================================================*/

let allProducts = [];

let cart = [];

let wishlist = [];



/*==================================================
 LOCAL STORAGE
==================================================*/

cart = JSON.parse(
localStorage.getItem("shopverse_cart")
) || [];

wishlist = JSON.parse(
localStorage.getItem("shopverse_wishlist")
) || [];



/*==================================================
 SAVE
==================================================*/

function saveCart(){

localStorage.setItem(
"shopverse_cart",
JSON.stringify(cart)
);

updateBadges();

}

function saveWishlist(){

localStorage.setItem(
"shopverse_wishlist",
JSON.stringify(wishlist)
);

updateBadges();

}



/*==================================================
 BADGES
==================================================*/

function updateBadges(){

cartCount.textContent =
cart.length;

floatingCartCount.textContent =
cart.length;

wishlistBadge.textContent =
wishlist.length;

}



/*==================================================
 TOAST
==================================================*/

function showToast(message){

const toast =
document.createElement("div");

toast.className =
"toast";

toast.textContent =
message;

document.body.appendChild(toast);

setTimeout(()=>{

toast.classList.add("show");

},100);

setTimeout(()=>{

toast.classList.remove("show");

setTimeout(()=>{

toast.remove();

},300);

},2500);

}



/*==================================================
 SKELETON
==================================================*/

function skeleton(container){

container.innerHTML="";

for(let i=0;i<4;i++){

const card=
document.createElement("div");

card.className=
"product-skeleton";

container.appendChild(card);

}

}



/*==================================================
 PRICE FORMAT
==================================================*/

function money(value){

return "₹"+
Number(value).toLocaleString("en-IN");

}



/*==================================================
 PRODUCT TEMPLATE
==================================================*/

function productCard(product){

const inWishlist =
wishlist.includes(product.id);

return `

<div class="product-card">

<div class="product-image">

${product.discount ?

`<span class="product-badge">

${product.discount}% OFF

</span>`

:""}

<img
loading="lazy"
src="${product.image}"
alt="${product.name}">

<div
class="product-favourite"
data-id="${product.id}">

<i class="fa-${inWishlist?"solid":"regular"} fa-heart"></i>

</div>

</div>


<div class="product-content">

<div class="product-category">

${product.category}

</div>

<h3 class="product-title">

${product.name}

</h3>

<div class="product-rating">

★★★★★

<span>

(${product.rating || 5})

</span>

</div>

<div class="product-price">

<span class="current-price">

${money(product.price)}

</span>

${product.oldPrice ?

`<span class="old-price">

${money(product.oldPrice)}

</span>`

:""}

</div>

<div class="product-actions">

<button
class="add-cart"
data-id="${product.id}">

Add Cart

</button>

<button
class="buy-now"
data-id="${product.id}">

Buy

</button>

</div>

</div>

</div>

`;

}



/*==================================================
 RENDER PRODUCTS
==================================================*/

function renderProducts(container,data){

if(!data.length){

container.innerHTML=`

<div class="empty-products">

<i class="fa-solid fa-box-open"></i>

<h3>

No Products Found

</h3>

</div>

`;

return;

}

container.innerHTML=

data.map(productCard).join("");

}



/*==================================================
 LOAD ALL PRODUCTS
==================================================*/

async function loadProducts(){

try{

skeleton(flashSaleContainer);

skeleton(recommendedContainer);

skeleton(trendingContainer);

skeleton(newArrivalContainer);



const snap=

await getDocs(

collection(db,"products")

);



allProducts=

snap.docs.map(doc=>({

id:doc.id,

...doc.data()

}));



renderFlashSale();

renderRecommended();

renderTrending();

renderNewArrivals();

updateBadges();

}

catch(error){

console.error(error);

showToast("Unable to load products.");

}

}



/*==================================================
 FLASH SALE
==================================================*/

function renderFlashSale(){

const items=

allProducts

.filter(p=>p.flashSale)

.slice(0,8);

renderProducts(

flashSaleContainer,

items

);

}



/*==================================================
 RECOMMENDED
==================================================*/

function renderRecommended(){

const items=

allProducts

.filter(p=>p.recommended)

.slice(0,8);

renderProducts(

recommendedContainer,

items

);

}



/*==================================================
 TRENDING
==================================================*/

function renderTrending(){

const items=

allProducts

.filter(p=>p.trending)

.slice(0,8);

renderProducts(

trendingContainer,

items

);

}



/*==================================================
 NEW ARRIVALS
==================================================*/

function renderNewArrivals(){

const items=

[...allProducts]

sort(

(a,b)=>

(b.createdAt||0)

-

(a.createdAt||0)

)

.slice(0,8);

renderProducts(

newArrivalContainer,

items

);

}



/*==================================================
 INITIAL LOAD
==================================================*/

updateBadges();

loadProducts();
/*==================================================
 SHOPVERSE HOME.JS
 Part 2A
 Cart • Wishlist • Product Actions
==================================================*/


/*=========================================
 CART FUNCTIONS
=========================================*/

function addToCart(productId){

    const product = allProducts.find(p=>p.id===productId);

    if(!product){
        showToast("Product not found");
        return;
    }

    const exists = cart.find(item=>item.id===productId);

    if(exists){

        exists.quantity++;

    }else{

        cart.push({
            id:product.id,
            quantity:1
        });

    }

    saveCart();

    showToast("Added to cart");

}



/*=========================================
 REMOVE CART ITEM
=========================================*/

function removeFromCart(productId){

    cart = cart.filter(item=>item.id!==productId);

    saveCart();

}



/*=========================================
 WISHLIST
=========================================*/

function toggleWishlist(productId){

    if(wishlist.includes(productId)){

        wishlist =
        wishlist.filter(id=>id!==productId);

        showToast("Removed from wishlist");

    }else{

        wishlist.push(productId);

        showToast("Added to wishlist");

    }

    saveWishlist();

    refreshWishlistIcons();

}



/*=========================================
 REFRESH HEART ICONS
=========================================*/

function refreshWishlistIcons(){

    document

    .querySelectorAll(".product-favourite")

    .forEach(button=>{

        const id =
        button.dataset.id;

        const icon =
        button.querySelector("i");

        if(wishlist.includes(id)){

            icon.classList.remove("fa-regular");

            icon.classList.add("fa-solid");

        }else{

            icon.classList.remove("fa-solid");

            icon.classList.add("fa-regular");

        }

    });

}



/*=========================================
 BUY NOW
=========================================*/

function buyNow(productId){

    addToCart(productId);

    window.location.href="cart.html";

}



/*=========================================
 PRODUCT CLICK
=========================================*/

let currentProduct = null;



function openProduct(productId){

    const product =
    allProducts.find(p=>p.id===productId);

    if(!product) return;

    currentProduct=product;

    if(typeof openQuickView==="function"){

        openQuickView(product);

    }

}



/*=========================================
 PRODUCT GRID EVENTS
=========================================*/

document.addEventListener("click",e=>{

    const cartButton =
    e.target.closest(".add-cart");

    if(cartButton){

        addToCart(
            cartButton.dataset.id
        );

        return;

    }



    const buyButton =
    e.target.closest(".buy-now");

    if(buyButton){

        buyNow(
            buyButton.dataset.id
        );

        return;

    }



    const heart =
    e.target.closest(".product-favourite");

    if(heart){

        toggleWishlist(
            heart.dataset.id
        );

        return;

    }



    const card =
    e.target.closest(".product-card");

    if(card){

        const button =
        card.querySelector(".add-cart");

        if(button){

            openProduct(
                button.dataset.id
            );
        }

    }

});



/*=========================================
 SEARCH
=========================================*/

function performSearch(){

    const keyword =
    searchInput.value
    .trim()
    .toLowerCase();

    if(keyword===""){

        renderRecommended();

        renderTrending();

        renderFlashSale();

        renderNewArrivals();

        return;

    }

    const result =

    allProducts.filter(product=>{

        return (

        product.name?.toLowerCase().includes(keyword)

        ||

        product.category?.toLowerCase().includes(keyword)

        ||

        product.brand?.toLowerCase().includes(keyword)

        );

    });

    renderProducts(
        recommendedContainer,
        result
    );

}



searchBtn.addEventListener(
"click",
performSearch
);



searchInput.addEventListener(
"keyup",
e=>{

    if(e.key==="Enter"){

        performSearch();

    }

});



/*=========================================
 CATEGORY FILTER
=========================================*/

document

.querySelectorAll(".category-item")

.forEach(item=>{

    item.addEventListener("click",()=>{

        document

        .querySelectorAll(".category-item")

        .forEach(c=>c.classList.remove("active"));

        item.classList.add("active");

        const category =
        item.dataset.category;

        const filtered =

        allProducts.filter(product=>

        product.category?.toLowerCase()

        ===

        category.toLowerCase()

        );

        renderProducts(

            recommendedContainer,

            filtered

        );

    });

});



/*=========================================
 INITIAL UI
=========================================*/

refreshWishlistIcons();

updateBadges();
/*==================================================
 SHOPVERSE HOME.JS
 Part 2B
 Quick View • Side Menu • Notifications • Banner
==================================================*/


/*=========================================
 QUICK VIEW ELEMENTS
=========================================*/

const quickView =
document.getElementById("quickView");

const quickImage =
document.getElementById("quickImage");

const quickTitle =
document.getElementById("quickTitle");

const quickPrice =
document.getElementById("quickPrice");

const quickAddToCart =
document.getElementById("quickAddToCart");

const closeQuickView =
document.getElementById("closeQuickView");


/*=========================================
 OPEN QUICK VIEW
=========================================*/

function openQuickView(product){

    currentProduct = product;

    quickImage.src =
    product.image;

    quickTitle.textContent =
    product.name;

    quickPrice.textContent =
    money(product.price);

    quickView.classList.add("active");

}


/*=========================================
 CLOSE QUICK VIEW
=========================================*/

function closeProductView(){

    quickView.classList.remove("active");

}


closeQuickView.addEventListener(

"click",

closeProductView

);


quickView.addEventListener("click",e=>{

    if(e.target===quickView){

        closeProductView();

    }

});


/*=========================================
 QUICK CART
=========================================*/

quickAddToCart.addEventListener("click",()=>{

    if(!currentProduct) return;

    addToCart(currentProduct.id);

    closeProductView();

});


/*=========================================
 SIDE MENU
=========================================*/

const menuBtn =
document.getElementById("menuBtn");

const sideMenu =
document.getElementById("sideMenu");

const closeMenu =
document.getElementById("closeMenu");

const menuOverlay =
document.getElementById("menuOverlay");


function openMenu(){

    sideMenu.classList.add("active");

    menuOverlay.classList.add("active");

    document.body.style.overflow="hidden";

}


function hideMenu(){

    sideMenu.classList.remove("active");

    menuOverlay.classList.remove("active");

    document.body.style.overflow="";

}


menuBtn.addEventListener(

"click",

openMenu

);

closeMenu.addEventListener(

"click",

hideMenu

);

menuOverlay.addEventListener(

"click",

hideMenu

);


/*=========================================
 NOTIFICATION PANEL
=========================================*/

const notificationBtn =
document.getElementById("notificationBtn");

const notificationPanel =
document.getElementById("notificationPanel");

const closeNotification =
document.getElementById("closeNotification");


notificationBtn.addEventListener("click",()=>{

    notificationPanel.classList.add("active");

    menuOverlay.classList.add("active");

});


closeNotification.addEventListener("click",()=>{

    notificationPanel.classList.remove("active");

    menuOverlay.classList.remove("active");

});


/*=========================================
 FLOATING CART
=========================================*/

const floatingCart =
document.getElementById("floatingCart");

if(cart.length===0){

    floatingCart.style.display="none";

}else{

    floatingCart.style.display="flex";

}


function refreshFloatingCart(){

    floatingCartCount.textContent=

    cart.length;

    floatingCart.style.display=

    cart.length

    ?

    "flex"

    :

    "none";

}


const oldSaveCart = saveCart;

saveCart=function(){

    oldSaveCart();

    refreshFloatingCart();

};


/*=========================================
 BANNER SLIDER
=========================================*/

const slides =

document.querySelectorAll(".hero-slide");

let slideIndex=0;


function showSlide(index){

    slides.forEach(slide=>

    slide.classList.remove("active")

    );

    slides[index].classList.add("active");

}


function nextSlide(){

    slideIndex++;

    if(slideIndex>=slides.length){

        slideIndex=0;

    }

    showSlide(slideIndex);

}


if(slides.length>1){

    setInterval(nextSlide,5000);

}


/*=========================================
 FLASH COUNTDOWN
=========================================*/

const countdown =

document.querySelector(".countdown");


let seconds=

2*3600+15*60+30;


function updateCountdown(){

    if(seconds<=0){

        countdown.textContent="Expired";

        return;

    }

    seconds--;

    const h=

    String(Math.floor(seconds/3600))

    .padStart(2,"0");

    const m=

    String(

    Math.floor(seconds%3600/60)

    )

    .padStart(2,"0");

    const s=

    String(seconds%60)

    .padStart(2,"0");

    countdown.textContent=

    `${h}:${m}:${s}`;

}


setInterval(updateCountdown,1000);


/*=========================================
 NOTIFICATION BADGE
=========================================*/

notificationBadge.textContent="2";


/*=========================================
 PAGE LOADED
=========================================*/

window.addEventListener("load",()=>{

    refreshFloatingCart();

    updateBadges();

});
/*==================================================
  PART 3A
  USER • AUTH • PROFILE • NEWSLETTER • LOGOUT
===================================================*/

import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/*=========================================
        CURRENT USER
=========================================*/

let currentUser = null;


/*=========================================
        LOAD CUSTOMER PROFILE
=========================================*/

async function loadCustomerProfile(uid){

    try{

        const ref = doc(db,"customers",uid);

        const snap = await getDoc(ref);

        if(!snap.exists()) return;

        const data = snap.data();

        $("#customerName").textContent =
            data.name || "Customer";

        $("#customerEmail").textContent =
            data.email || "";

        $("#customerDistrict").textContent =
            data.district || "Kerala";

        if(data.photoURL){

            $("#userPhoto").src = data.photoURL;

        }

    }

    catch(error){

        console.error(error);

    }

}


/*=========================================
        AUTH STATE
=========================================*/

onAuthStateChanged(auth,async(user)=>{

    if(!user){

        location.href="../login.html";

        return;

    }

    currentUser=user;

    await loadCustomerProfile(user.uid);

});


/*=========================================
        PROFILE IMAGE FALLBACK
=========================================*/

$("#userPhoto")?.addEventListener("error",()=>{

    $("#userPhoto").src="../assets/images/avatar.png";

});


/*=========================================
        NEWSLETTER
=========================================*/

$("#newsletterForm")?.addEventListener("submit",

async(e)=>{

    e.preventDefault();

    const email=$("#newsletterEmail").value.trim();

    if(email===""){

        alert("Enter your email.");

        return;

    }

    try{

        await setDoc(

            doc(db,"newsletter",email),

            {

                email,

                createdAt:serverTimestamp()

            }

        );

        alert("Subscribed successfully.");

        $("#newsletterForm").reset();

    }

    catch(err){

        console.error(err);

        alert("Subscription failed.");

    }

});


/*=========================================
        LOGOUT
=========================================*/

$("#logoutBtn")?.addEventListener("click",

async(e)=>{

    e.preventDefault();

    if(!confirm("Logout now?")) return;

    try{

        await signOut(auth);

        location.href="../login.html";

    }

    catch(err){

        console.error(err);

    }

});


/*=========================================
        UPDATE PROFILE PHOTO
=========================================*/

function updateProfilePhoto(url){

    if(!url) return;

    $("#userPhoto").src=url;

}


/*=========================================
        UPDATE CUSTOMER NAME
=========================================*/

function updateCustomerName(name){

    if(!name) return;

    $("#customerName").textContent=name;

}


/*=========================================
        UPDATE DISTRICT
=========================================*/

function updateDistrict(district){

    if(!district) return;

    $("#customerDistrict").textContent=district;

}


/*=========================================
        GREETING
=========================================*/

function greeting(){

    const h=new Date().getHours();

    if(h<12) return "Good Morning";

    if(h<17) return "Good Afternoon";

    return "Good Evening";

}

console.log(greeting());


/*=========================================
        SESSION CHECK
=========================================*/

window.addEventListener("focus",()=>{

    if(auth.currentUser){

        currentUser=auth.currentUser;

    }

});


/*=========================================
        SAVE LAST VISIT
=========================================*/

localStorage.setItem(

    "lastVisit",

    new Date().toISOString()

);


/*=========================================
        RESTORE SCROLL
=========================================*/

window.addEventListener("beforeunload",()=>{

    sessionStorage.setItem(

        "homeScroll",

        window.scrollY

    );

});


window.addEventListener("load",()=>{

    const y=sessionStorage.getItem("homeScroll");

    if(y){

        window.scrollTo({

            top:Number(y),

            behavior:"instant"

        });

    }

});
/*==================================================
  SHOPVERSE HOME.JS
  PART 3B
  Search • Recently Viewed • Lazy Loading
  Image Fallback • Performance
==================================================*/


/*=========================================
        DOM SHORTCUT
=========================================*/

function $(selector){
    return document.querySelector(selector);
}

function $$(selector){
    return document.querySelectorAll(selector);
}


/*=========================================
        IMAGE FALLBACK
=========================================*/

function enableImageFallback(){

    $$("img").forEach(img=>{

        img.onerror=function(){

            this.src="../assets/images/product-placeholder.png";

        };

    });

}


/*=========================================
        LAZY LOADING
=========================================*/

function enableLazyImages(){

    const images=$$("img");

    const observer=new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(!entry.isIntersecting) return;

            const img=entry.target;

            if(img.dataset.src){

                img.src=img.dataset.src;

                img.removeAttribute("data-src");

            }

            observer.unobserve(img);

        });

    },{
        rootMargin:"100px"
    });

    images.forEach(img=>observer.observe(img));

}


/*=========================================
        RECENTLY VIEWED
=========================================*/

function saveRecentlyViewed(product){

    let viewed=

    JSON.parse(

    localStorage.getItem("recentProducts")

    ) || [];

    viewed=viewed.filter(

        p=>p.id!==product.id

    );

    viewed.unshift(product);

    viewed=viewed.slice(0,10);

    localStorage.setItem(

        "recentProducts",

        JSON.stringify(viewed)

    );

}


function getRecentlyViewed(){

    return JSON.parse(

        localStorage.getItem("recentProducts")

    ) || [];

}


/*=========================================
        QUICK VIEW SAVE
=========================================*/

const originalQuickView=openQuickView;

openQuickView=function(product){

    saveRecentlyViewed(product);

    originalQuickView(product);

};


/*=========================================
        SMART SEARCH
=========================================*/

function smartSearch(keyword){

    keyword=keyword.toLowerCase().trim();

    if(keyword===""){

        renderRecommended();

        return;

    }

    const result=allProducts.filter(product=>{

        return(

        product.name?.toLowerCase().includes(keyword)

        ||

        product.category?.toLowerCase().includes(keyword)

        ||

        product.brand?.toLowerCase().includes(keyword)

        ||

        product.description?.toLowerCase().includes(keyword)

        );

    });

    renderProducts(

        recommendedContainer,

        result

    );

}


searchInput?.addEventListener(

"input",

e=>{

    smartSearch(e.target.value);

});


/*=========================================
        PRODUCT IMAGE PRELOAD
=========================================*/

function preloadImages(){

    allProducts.forEach(product=>{

        if(!product.image) return;

        const img=new Image();

        img.src=product.image;

    });

}


/*=========================================
        LOADING SPINNER
=========================================*/

function showLoading(){

    const loader=document.createElement("div");

    loader.id="pageLoader";

    loader.innerHTML=

    `<div class="loader"></div>`;

    document.body.appendChild(loader);

}


function hideLoading(){

    const loader=$("#pageLoader");

    if(loader){

        loader.remove();

    }

}


/*=========================================
        EMPTY SEARCH
=========================================*/

function showEmptySearch(){

    recommendedContainer.innerHTML=

    `

    <div class="empty-products">

    <i class="fa-solid fa-magnifying-glass"></i>

    <h3>No matching products</h3>

    </div>

    `;

}


/*=========================================
        SEARCH UPDATE
=========================================*/

const oldSearch=smartSearch;

smartSearch=function(keyword){

    keyword=keyword.trim();

    if(keyword===""){

        renderRecommended();

        return;

    }

    const result=

    allProducts.filter(product=>

    product.name?.toLowerCase()

    .includes(

    keyword.toLowerCase()

    )

    ||

    product.category?.toLowerCase()

    .includes(

    keyword.toLowerCase()

    )

    );

    if(result.length===0){

        showEmptySearch();

        return;

    }

    renderProducts(

        recommendedContainer,

        result

    );

};


/*=========================================
        PERFORMANCE
=========================================*/

window.requestIdleCallback?.(()=>{

    preloadImages();

});


window.addEventListener("load",()=>{

    enableImageFallback();

    enableLazyImages();

});


/*=========================================
        ONLINE STATUS
=========================================*/

window.addEventListener("offline",()=>{

    showToast("You're offline");

});


window.addEventListener("online",()=>{

    showToast("Back online");

});


/*=========================================
        PRODUCT CACHE
=========================================*/

function cacheProducts(){

    localStorage.setItem(

        "cachedProducts",

        JSON.stringify(allProducts)

    );

}


function restoreCache(){

    const cache=

    JSON.parse(

    localStorage.getItem("cachedProducts")

    );

    if(cache && cache.length){

        allProducts=cache;

    }

}


restoreCache();


/*=========================================
        AFTER FIREBASE LOAD
=========================================*/

const originalLoadProducts=loadProducts;

loadProducts=async function(){

    showLoading();

    await originalLoadProducts();

    cacheProducts();

    hideLoading();

};


/*=========================================
        INITIALIZE
=========================================*/

enableImageFallback();

enableLazyImages();
/*==================================================
  PART 4
  FOOTER • RESPONSIVE • ANIMATIONS
==================================================*/


/*=========================
        FOOTER
=========================*/

.home-footer{
    background:#111827;
    color:#fff;
    padding:40px 18px 110px;
    margin-top:30px;
}

.footer-grid{
    display:grid;
    grid-template-columns:1fr;
    gap:30px;
}

.footer-grid h3,
.footer-grid h4{
    margin-bottom:12px;
}

.footer-grid p{
    color:#ccc;
    line-height:1.7;
}

.footer-grid ul{
    list-style:none;
}

.footer-grid li{
    margin-bottom:10px;
}

.footer-grid a{
    color:#ddd;
    transition:.25s;
}

.footer-grid a:hover{
    color:#fff;
}

.footer-social{
    display:flex;
    gap:12px;
    margin-top:10px;
}

.footer-social a{
    width:42px;
    height:42px;
    border-radius:50%;
    background:#202b40;
    display:flex;
    align-items:center;
    justify-content:center;
    transition:.25s;
}

.footer-social a:hover{
    background:var(--primary);
}

.footer-bottom{
    margin-top:30px;
    padding-top:20px;
    border-top:1px solid rgba(255,255,255,.08);
    text-align:center;
    color:#aaa;
    font-size:14px;
}



/*=========================
      DESKTOP
=========================*/

@media(min-width:992px){

.mobile-header{

    padding:0 40px;

}

main{

    width:min(1450px,96%);
    margin:auto;

}

.products-grid{

    grid-template-columns:repeat(4,1fr);

}

.store-slider{

    overflow:visible;

}

.footer-grid{

    grid-template-columns:
    repeat(4,1fr);

}

.offer-box{

    grid-template-columns:
    repeat(3,1fr);

}

.banner-card{

    min-height:320px;

}

.banner-content h1{

    font-size:50px;

}

}



/*=========================
      TABLET
=========================*/

@media(min-width:600px) and (max-width:991px){

.products-grid{

    grid-template-columns:
    repeat(2,1fr);

}

.footer-grid{

    grid-template-columns:
    repeat(2,1fr);

}

.offer-box{

    grid-template-columns:
    repeat(2,1fr);

}

}



/*=========================
      MOBILE
=========================*/

@media(max-width:599px){

.products-grid{

    grid-template-columns:
    repeat(2,1fr);

}

.banner-card{

    flex-direction:column;

    text-align:center;

}

.banner-image{

    margin-top:20px;

}

.banner-content h1{

    font-size:32px;

}

.banner-content p{

    font-size:15px;

}

.store-card{

    min-width:220px;

}

.footer-grid{

    grid-template-columns:1fr;

}

.logo span{

    font-size:19px;

}

}



/*=========================
      SMALL PHONES
=========================*/

@media(max-width:380px){

.logo span{

    display:none;

}

.header-icons{

    gap:5px;

}

.header-icons button{

    width:36px;
    height:36px;

}

#userPhoto{

    width:36px;
    height:36px;

}

.search-box{

    flex-wrap:nowrap;

}

#searchBtn{

    width:82px;

    font-size:12px;

}

.category-item{

    min-width:72px;

}

.category-icon{

    width:58px;
    height:58px;

    font-size:26px;

}

.bottom-nav span{

    font-size:10px;

}

}



/*=========================
      UTILITIES
=========================*/

.hide{
    display:none !important;
}

.show{
    display:block !important;
}

.text-center{
    text-align:center;
}

.mt-20{
    margin-top:20px;
}

.mb-20{
    margin-bottom:20px;
}



/*=========================
      CUSTOM SCROLLBAR
=========================*/

::-webkit-scrollbar{
    width:8px;
    height:8px;
}

::-webkit-scrollbar-thumb{
    background:#cfd4e6;
    border-radius:20px;
}

::-webkit-scrollbar-track{
    background:#f5f7fb;
}



/*=========================
      ANIMATIONS
=========================*/

@keyframes fadeUp{

from{
    opacity:0;
    transform:translateY(18px);
}

to{
    opacity:1;
    transform:translateY(0);
}

}

@keyframes zoomIn{

from{
    opacity:0;
    transform:scale(.92);
}

to{
    opacity:1;
    transform:scale(1);
}

}

.product-card,
.store-card,
.banner-card,
.offer-box div{

    animation:fadeUp .45s ease;

}

.quick-view-content{

    animation:zoomIn .35s ease;

}

.category-icon:hover{

    transform:translateY(-5px)
    scale(1.05);

}

button{

    transition:.25s;

}

button:hover{

    opacity:.96;

}

button:active{

    transform:scale(.97);

}

img{

    user-select:none;

}

html{

    scroll-behavior:smooth;

}