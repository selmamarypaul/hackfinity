class FoodExpiryTracker {
    constructor() {
        this.products = [];
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
        this.addProduct(productData);
        document.getElementById('product-form').reset();
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

        // Populate lists
        this.products.forEach(product => {
            const li = this.createProductListItem(product);
            categories[product.status].appendChild(li);
        });
    }

    createProductListItem(product) {
        const li = document.createElement('li');
        li.className = `product-item ${product.status}`;
        li.innerHTML = `
            <input type="checkbox" data-id="${product.id}">
            <span>${product.name}</span>
            <span>Batch: ${product.batchNumber}</span>
            <span>Expires: ${new Date(product.expiryDate).toLocaleDateString()}</span>
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
        
        alert('Donation confirmed! The food bank will be notified.');
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
        
        alert('Products marked for recycling. Thank you for being environmentally conscious!');
        this.removeProducts(selectedProducts);
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