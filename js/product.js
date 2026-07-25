import { db } from "./firebase-config.js";
import { doc, getDoc, collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

let currentProduct = null;
let cart = JSON.parse(localStorage.getItem("shopverse_cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("shopverse_wishlist")) || [];

$("#cartCount").textContent = cart.length;

/* KERALA PINCODE CHECK */
function isKeralaPincode(pincode){
    return /^[6789]\d{5}$/.test(pincode) &&
           (pincode.startsWith('67') || pincode.startsWith('68') || pincode.startsWith('69'));
}

$("#checkPincodeBtn").addEventListener("click", ()=>{
    const pin = $("#pincodeInput").value.trim();
    const result = $("#pincodeResult");
    if(isKeralaPincode(pin)){
        result.textContent = "✅ Delivery Available in 2-3 Days";
        result.style.color = "#12a84f";
    } else {
        result.textContent = "❌ Sorry, We deliver only in Kerala";
        result.style.color = "red";
    }
});


async function loadProduct(){
    if(!productId){ window.location.href = "products.html"; return; }

    const docRef = doc(db, "products", productId);
    const snap = await getDoc(docRef);

    if(!snap.exists()){ window.location.href = "products.html"; return; }

    currentProduct = { id: snap.id, ...snap.data() };

    // BLOCK NON-KERALA PRODUCTS
    if(currentProduct.state && currentProduct.state !== "Kerala"){
        alert("This product is not available for Kerala delivery");
        window.location.href = "products.html";
        return;
    }

    renderProduct(currentProduct);
    loadRelatedProducts(currentProduct.category);
    setupWishlistBtn();
}


function renderProduct(p){
    document.title = `${p.name} | ShopVerse Kerala`;
    $("#productName").textContent = p.name;
    $("#productBrand").textContent = `Brand: ${p.brand || 'Generic'}`;
    $("#breadcrumbCat").textContent = p.category;
    $("#productPrice").textContent = `₹${p.price.toLocaleString('en-IN')}`;
    $("#productDescription").textContent = p.description || "No description available.";
    $("#sellerName").textContent = p.sellerName || "Kerala Seller";
    $("#sellerDistrict").textContent = `${p.district || 'Kozhikode'}, Kerala`;
    $("#mainImage").src = p.image || '../assets/images/product-placeholder.png';

    if(p.oldPrice){
        $("#productOldPrice").textContent = `₹${p.oldPrice.toLocaleString('en-IN')}`;
        const discount = Math.round(((p.oldPrice - p.price)/p.oldPrice)*100);
        $("#productDiscount").textContent = `${discount}% OFF`;
    }

    const specsList = $("#productSpecs");
    specsList.innerHTML = "";
    if(p.specs){
        Object.entries(p.specs).forEach(([key, value]) => {
            specsList.innerHTML += `<li><b>${key}:</b> ${value}</li>`;
        });
    }
}


/* LOAD RELATED PRODUCTS FROM SAME CATEGORY + KERALA */
async function loadRelatedProducts(category){
    const q = query(
        collection(db, "products"),
        where("category", "==", category),
        where("state", "==", "Kerala"),
        limit(4)
    );
    const snap = await getDocs(q);
    const related = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.id !== productId);
    
    $("#relatedGrid").innerHTML = related.map(p => `
        <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
            <div class="product-image">
                <img loading="lazy" src="${p.image}" alt="${p.name}">
            </div>
            <div class="product-content">
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">
                    <span class="current-price">₹${p.price.toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    `).join("");
}


$("#addToCartBtn").addEventListener("click", () => {
    const exists = cart.find(item => item.id === productId);
    if(exists){ exists.quantity++; } else { cart.push({ id: productId, quantity: 1 }); }
    localStorage.setItem("shopverse_cart", JSON.stringify(cart));
    $("#cartCount").textContent = cart.length;
    alert("Added to cart");
});

$("#buyNowBtn").addEventListener("click", () => {
    $("#addToCartBtn").click();
    window.location.href = "cart.html";
});

function setupWishlistBtn(){
    const btn = $("#wishlistBtnProduct");
    const icon = btn.querySelector("i");
    if(wishlist.includes(productId)){ icon.classList.add("fa-solid"); icon.classList.remove("fa-regular"); }
    btn.addEventListener("click", () => {
        if(wishlist.includes(productId)){
            wishlist = wishlist.filter(id => id !== productId);
            icon.classList.remove("fa-solid"); icon.classList.add("fa-regular");
        } else {
            wishlist.push(productId);
            icon.classList.add("fa-solid"); icon.classList.remove("fa-regular");
        }
        localStorage.setItem("shopverse_wishlist", JSON.stringify(wishlist));
    });
}

$$(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        $$(".tab-btn").forEach(b => b.classList.remove("active"));
        $$(".tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        $("#" + btn.dataset.tab).classList.add("active");
    });
});

document.addEventListener("DOMContentLoaded", loadProduct);
