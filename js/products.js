import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let allProducts = [];
let filteredProducts = [];

const productsGrid = $("#productsGrid");
const productCount = $("#productCount");
const sortSelect = $("#sortSelect");
const categoryInputs = $$('input[name="category"]');
const priceRange = $("#priceRange");
const priceValue = $("#priceValue");
const clearBtn = $("#clearFilters");
const searchInput = $("#searchInput");

// CART COUNT
let cart = JSON.parse(localStorage.getItem("shopverse_cart")) || [];
if($("#cartCount")) $("#cartCount").textContent = cart.length;

/* LOAD ALL PRODUCTS */
async function loadAllProducts(){
    productsGrid.innerHTML = `<div class="product-skeleton"></div><div class="product-skeleton"></div><div class="product-skeleton"></div><div class="product-skeleton"></div>`;
    
    try{
        const snap = await getDocs(collection(db, "products"));
        allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // KERALA ONLY FILTER
        allProducts = allProducts.filter(p => p.state === "Kerala" || !p.state);
        
        // Check URL for category ?cat=mobiles
        const urlParams = new URLSearchParams(window.location.search);
        const cat = urlParams.get('cat');
        if(cat){
            const catInput = $(`input[name="category"][value="${cat}"]`);
            if(catInput) catInput.checked = true;
        }

        filteredProducts = [...allProducts];
        applyFilters();
    } catch(err){
        console.error("FIREBASE ERROR:", err);
        productsGrid.innerHTML = `<div class="empty-products"><i class="fa-solid fa-box-open"></i><h3>Unable to load products</h3><p>${err.message}</p></div>`;
    }
}

/* APPLY FILTERS */
function applyFilters(){
    let result = [...allProducts];

    // Category
    const selectedCat = $('input[name="category"]:checked').value;
    if(selectedCat !== "all"){
        result = result.filter(p => p.category?.toLowerCase() === selectedCat.toLowerCase());
    }

    // Price
    const maxPrice = Number(priceRange.value);
    result = result.filter(p => p.price <= maxPrice);

    // Search
    const searchTerm = searchInput.value.toLowerCase();
    if(searchTerm){
        result = result.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    // Sort
    const sortBy = sortSelect.value;
    if(sortBy === "low") result.sort((a,b) => a.price - b.price);
    if(sortBy === "high") result.sort((a,b) => b.price - a.price);
    if(sortBy === "discount") result.sort((a,b) => ((b.oldPrice||0) - b.price) - ((a.oldPrice||0) - a.price));
    if(sortBy === "new") result.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));

    filteredProducts = result;
    renderProducts();
}

/* RENDER PRODUCTS */
function renderProducts(){
    productCount.textContent = `(${filteredProducts.length}) Products`;
    
    if(!filteredProducts.length){
        productsGrid.innerHTML = `<div class="empty-products"><i class="fa-solid fa-box-open"></i><h3>No Products Found in Kerala</h3></div>`;
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(p => {
        const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price)/p.oldPrice)*100) : 0;
        return `
        <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
            <div class="product-image">
                ${discount > 0 ? `<span class="product-badge">${discount}% OFF</span>` : ""}
                <img loading="lazy" src="${p.image || '../assets/images/product-placeholder.png'}" alt="${p.name}">
            </div>
            <div class="product-content">
                <div class="product-category">${p.category}</div>
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">
                    <span class="current-price">₹${p.price.toLocaleString('en-IN')}</span>
                    ${p.oldPrice ? `<span class="old-price">₹${p.oldPrice.toLocaleString('en-IN')}</span>` : ""}
                </div>
                <div class="product-actions">
                    <button class="add-cart" onclick="event.stopPropagation(); addToCart('${p.id}')">Add Cart</button>
                </div>
            </div>
        </div>
        `;
    }).join("");
}

/* CART FUNCTION */
window.addToCart = function(productId){
    let cart = JSON.parse(localStorage.getItem("shopverse_cart")) || [];
    const exists = cart.find(item => item.id === productId);
    if(exists){ exists.quantity++; } 
    else { cart.push({ id: productId, quantity: 1 }); }
    localStorage.setItem("shopverse_cart", JSON.stringify(cart));
    $("#cartCount").textContent = cart.length;
    alert("Added to cart");
}

/* EVENT LISTENERS */
categoryInputs.forEach(input => input.addEventListener("change", applyFilters));
priceRange.addEventListener("input", () => {
    priceValue.textContent = `₹${Number(priceRange.value).toLocaleString('en-IN')}`;
    applyFilters();
});
sortSelect.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);
clearBtn.addEventListener("click", () => {
    $('input[name="category"][value="all"]').checked = true;
    priceRange.value = 50000;
    priceValue.textContent = `₹50,000`;
    sortSelect.value = "new";
    searchInput.value = "";
    applyFilters();
});

/* INIT */
document.addEventListener("DOMContentLoaded", loadAllProducts);
