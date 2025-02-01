document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('product-form');
    const expiringProducts = document.getElementById('expiring-products');
    
    // Load existing products from localStorage
    let products = JSON.parse(localStorage.getItem('products')) || [];
    
    // Display existing products
    updateProductList();

    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const product = {
            id: Date.now(),
            name: document.getElementById('productName').value,
            number: document.getElementById('productNumber').value,
            mfgDate: document.getElementById('mfgDate').value,
            expDate: document.getElementById('expDate').value
        };

        // Add to products array
        products.push(product);
        
        // Save to localStorage
        saveProducts();
        
        // Update display
        updateProductList();
        
        // Reset form
        productForm.reset();
    });

    function updateProductList() {
        expiringProducts.innerHTML = '';
        
        // Sort products by expiry date
        products.sort((a, b) => new Date(a.expDate) - new Date(b.expDate));

        products.forEach(product => {
            const li = document.createElement('li');
            li.className = 'product-item';
            
            // Check if expired
            if(new Date(product.expDate) < new Date()) {
                li.classList.add('expired');
            }

            li.innerHTML = `
                <div>
                    <strong>${product.name}</strong> (${product.number})<br>
                    Mfg: ${formatDate(product.mfgDate)}<br>
                    Exp: ${formatDate(product.expDate)}
                </div>
                <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
            `;

            expiringProducts.appendChild(li);
        });
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    // Make deleteProduct function globally available
    window.deleteProduct = function(id) {
        products = products.filter(product => product.id !== id);
        saveProducts();
        updateProductList();
    };

    // document.getElementById('donate-btn').addEventListener('click', function() {
    //     // Function to calculate the number of days until expiry
    //     function getDaysUntilExpiry(expDate) {
    //         const expiryDate = new Date(expDate);
    //         const today = new Date();
    //         const timeDiff = expiryDate - today;
    //         return Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert milliseconds to days
    //     }
    
    //     // Filter products that expire in 3 days or less
    //     const expiringSoonProducts = products.filter(product => {
    //         const daysUntilExpiry = getDaysUntilExpiry(product.expDate);
    //         return daysUntilExpiry <= 3 && daysUntilExpiry >= 0; // Expiring in the next 3 days
    //     });
        
    //     // Display the result
    //     if (expiringSoonProducts.length > 0) {
    //         alert(`${expiringSoonProducts.length} products are expiring in the next 3 days.`);
    //     } else {
    //         alert('No products are expiring in the next 3 days.');
    //     }
    // });
    


    // Product expiry checker and notification system with detailed alerts
// Product expiry checker and notification system with correct ID display
document.getElementById('donate-btn').addEventListener('click', function() {
    // Function to calculate the number of days until expiry
    function getDaysUntilExpiry(expDate) {
        if (!expDate) return null;
        
        const expiryDate = new Date(expDate);
        // Check if date is valid
        if (isNaN(expiryDate.getTime())) return null;
        
        const today = new Date();
        const timeDiff = expiryDate - today;
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    // Filter products that expire in 3 days or less
    const expiringSoonProducts = products.filter(product => {
        const daysUntilExpiry = getDaysUntilExpiry(product.expDate);
        return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
    });
    
    // Create detailed message for alert
    if (expiringSoonProducts.length > 0) {
        let message = 'The following products are expiring soon:\n\n';
        expiringSoonProducts.forEach(product => {
            const days = getDaysUntilExpiry(product.expDate);
            // Using the correct product ID from your data structure
            message += `- ${product.name} (Item #${product.number}): ${days} day(s) remaining\n`;
        });
        message += `\nTotal items expiring soon: ${expiringSoonProducts.length}`;
        alert(message);
    } else {
        alert('No products are expiring in the next 3 days.');
    }
});
});