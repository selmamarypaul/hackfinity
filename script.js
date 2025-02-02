class FoodExpiryTracker {
    constructor() {
        this.products = [];
        this.rewardPoints = 0;
        this.foodBanks = [
            { id: 1, name: "Community Food Bank", address: "123 Main St" },
            { id: 2, name: "Hope Food Center", address: "456 Park Ave" },
            { id: 3, name: "Local Food Pantry", address: "789 Church St" }
        ];
        this.initializeQRScanner();
        this.initializeEventListeners();
    }

    initializeQRScanner() {
        const html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader", { fps: 10, qrbox: 250 });
            
        html5QrcodeScanner.render((decodedText) => {
            this.handleQRCode(decodedText);
        }, (error) => {
            console.warn(`QR Code scanning failed: ${error}`);
        });
    }

    initializeEventListeners() {
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleManualEntry();
        });

        document.getElementById('donate-btn').addEventListener('click', () => this.handleDonation());
        document.getElementById('return-btn').addEventListener('click', () => this.handleReturn());
        document.getElementById('recycle-btn').addEventListener('click', () => this.handleRecycle());
    }

    handleQRCode(decodedText) {
        try {
            const productData = JSON.parse(decodedText);
            this.addProduct(productData);
        } catch (error) {
            alert('Invalid QR Code format');
        }
    }

    handleManualEntry() {
        const productData = {
            name: document.getElementById('productName').value,
            batchNumber: document.getElementById('productNumber').value,
            manufacturingDate: document.getElementById('mfgDate').value,
            expiryDate: document.getElementById('expDate').value
        };
        
        if (this.validateProductData(productData)) {
            this.addProduct(productData);
            document.getElementById('product-form').reset();
        }
    }

    validateProductData(productData) {
        // Check for empty fields
        if (!productData.name || !productData.batchNumber || 
            !productData.manufacturingDate || !productData.expiryDate) {
            alert('All fields are required');
            return false;
        }

        // Validate dates
        const mfgDate = new Date(productData.manufacturingDate);
        const expDate = new Date(productData.expiryDate);
        const today = new Date();

        if (mfgDate > today) {
            alert('Manufacturing date cannot be in the future');
            return false;
        }

        if (expDate < mfgDate) {
            alert('Expiry date must be after manufacturing date');
            return false;
        }

        return true;
    }

    addProduct(productData) {
        const product = {
            ...productData,
            id: Date.now(),
            status: this.calculateStatus(new Date(productData.expiryDate))
        };
        
        this.products.push(product);
        this.updateProductLists();
        this.checkExpiryAlert(product);
    }

    calculateStatus(expiryDate) {
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) return 'expired';
        if (daysUntilExpiry <= 2) return 'expiring-soon';
        return 'fresh';
    }

    checkExpiryAlert(product) {
        if (product.status === 'expiring-soon') {
            alert(`Warning: ${product.name} is expiring within 2 days!`);
        }
    }

    updateProductLists() {
        const categories = {
            'fresh': document.querySelector('#fresh-products .product-list'),
            'expiring-soon': document.querySelector('#expiring-soon .product-list'),
            'expired': document.querySelector('#expired .product-list')
        };

        // Clear all lists
        Object.values(categories).forEach(list => list.innerHTML = '');

        // Calculate stock levels for each batch number
        const stockLevels = this.products.reduce((acc, product) => {
            acc[product.batchNumber] = (acc[product.batchNumber] || 0) + 1;
            return acc;
        }, {});

        // Sort products by expiry date
        const sortedProducts = [...this.products].sort((a, b) => 
            new Date(a.expiryDate) - new Date(b.expiryDate)
        );

        // Populate lists
        sortedProducts.forEach(product => {
            const li = this.createProductListItem(product, stockLevels[product.batchNumber]);
            categories[product.status].appendChild(li);
        });
    }

    createProductListItem(product, stockLevel) {
        const li = document.createElement('li');
        li.className = `product-item ${product.status}`;
        
        const mfgDate = new Date(product.manufacturingDate).toLocaleDateString();
        const expDate = new Date(product.expiryDate).toLocaleDateString();
        const daysUntilExpiry = Math.ceil((new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        li.innerHTML = `
            <div class="product-info">
                <input type="checkbox" data-id="${product.id}">
                <div class="product-details">
                    <h3>${product.name}</h3>
                    <div class="details-grid">
                        <span>Batch: ${product.batchNumber}</span>
                        <span>Stock Level: ${stockLevel} items</span>
                        <span>Mfg Date: ${mfgDate}</span>
                        <span>Exp Date: ${expDate}</span>
                        <span class="expiry-days ${product.status}">
                            ${daysUntilExpiry > 0 ? 
                                `${daysUntilExpiry} days until expiry` : 
                                'Expired'}
                        </span>
                    </div>
                </div>
            </div>
        `;
        return li;
    }

    getSelectedProducts() {
        const checkboxes = document.querySelectorAll('.product-item input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => {
            return this.products.find(p => p.id === parseInt(checkbox.dataset.id));
        });
    }

    handleDonation() {
        const selectedProducts = this.getSelectedProducts();
        if (selectedProducts.length === 0) {
            alert('Please select products to donate');
            return;
        }

        const foodBankSelect = document.getElementById('foodBankSelect');
        if (!foodBankSelect.value) {
            alert('Please select a food bank for donation');
            return;
        }

        const selectedFoodBank = this.foodBanks.find(fb => fb.id === parseInt(foodBankSelect.value));
        alert(`Donation confirmed! The items will be sent to ${selectedFoodBank.name}`);
        this.removeProducts(selectedProducts);
    }

    handleReturn() {
        const selectedProducts = this.getSelectedProducts();
        if (selectedProducts.length === 0) {
            alert('Please select products to return');
            return;
        }
        
        alert('Return request placed. The seller will process your return.');
        this.removeProducts(selectedProducts);
    }

    handleRecycle() {
        const selectedProducts = this.getSelectedProducts();
        if (selectedProducts.length === 0) {
            alert('Please select products to recycle');
            return;
        }
        
        // Award points for recycling (10 points per item)
        const pointsEarned = selectedProducts.length * 10;
        this.rewardPoints += pointsEarned;
        
        alert(`Products marked for recycling. You earned ${pointsEarned} points! Total points: ${this.rewardPoints}`);
        this.removeProducts(selectedProducts);
        this.updateRewardPointsDisplay();
    }

    updateRewardPointsDisplay() {
        const pointsDisplay = document.getElementById('rewardPoints');
        if (pointsDisplay) {
            pointsDisplay.textContent = this.rewardPoints;
        }
    }

    removeProducts(productsToRemove) {
        const productIds = productsToRemove.map(p => p.id);
        this.products = this.products.filter(p => !productIds.includes(p.id));
        this.updateProductLists();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new FoodExpiryTracker();
});