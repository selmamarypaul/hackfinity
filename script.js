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
        const qrReader = document.getElementById('qr-reader');
        
        if (!qrReader) {
            console.error('QR reader element not found');
            return;
        }

        this.html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
                defaultZoomValueIfSupported: 2
            }
        );

        const onScanSuccess = (decodedText, decodedResult) => {
            console.log('Raw QR Scan Result:', decodedText);
            this.handleQRData(decodedText);
        };

        const onScanError = (errorMessage) => {
            console.warn(`QR scan error: ${errorMessage}`);
        };

        this.html5QrcodeScanner.render(onScanSuccess, onScanError);

        // Add a restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Scanner';
        restartButton.className = 'restart-scanner-btn';
        restartButton.onclick = () => this.restartScanner();
        qrReader.parentElement.appendChild(restartButton);
    }

    handleQRData(data) {
        const scanResult = document.getElementById('scan-result');
        if (!scanResult) {
            console.error('Scan result element not found');
            return;
        }

        console.log('Received QR Data:', data);

        try {
            let productData;
            
            // Try to parse as JSON first
            try {
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                productData = {
                    name: parsedData.productName || parsedData.name || '',
                    batchNumber: parsedData.batchNumber || parsedData.batch || '',
                    manufacturingDate: parsedData.manufacturingDate || parsedData.mfgDate || '',
                    expiryDate: parsedData.expiryDate || parsedData.expDate || ''
                };
            } catch (parseError) {
                // If JSON parsing fails, try to parse the text format
                const lines = data.split('\n');
                productData = {
                    name: lines[0].split(': ')[1] || '',
                    manufacturingDate: lines[1].split(': ')[1] || '',
                    expiryDate: lines[2].split(': ')[1] || '',
                    batchNumber: lines[3].split(': ')[1] || ''
                };
            }

            console.log('Processed Product Data:', productData);

            // Validate the product data
            if (this.validateProductData(productData)) {
                // Add the product directly
                this.addProduct({
                    ...productData,
                    status: this.calculateStatus(new Date(productData.expiryDate))
                });

                // Display the scanned result
                scanResult.innerHTML = `
                    <div class="scan-result success">
                        <h3>Product Successfully Added:</h3>
                        <p>Product Name: ${productData.name}</p>
                        <p>Manufacturing Date: ${productData.manufacturingDate}</p>
                        <p>Expiry Date: ${productData.expiryDate}</p>
                        <p>Batch Number: ${productData.batchNumber}</p>
                    </div>
                `;

                // Clear and reinitialize scanner
                this.restartScanner();

            } else {
                console.error('Product validation failed');
                scanResult.innerHTML = `
                    <div class="scan-result error">
                        <h3>Invalid Product Data</h3>
                        <p>Please ensure the QR code contains valid product information.</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error processing QR data:', error);
            scanResult.innerHTML = `
                <div class="scan-result error">
                    <h3>Error Scanning Product</h3>
                    <p>Invalid QR code format. Please try again.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }

    restartScanner() {
        if (this.html5QrcodeScanner) {
            this.html5QrcodeScanner.clear().then(() => {
                console.log('Scanner cleared successfully');
                // Add a slight delay before reinitializing
                setTimeout(() => {
                    const qrReader = document.getElementById('qr-reader');
                    qrReader.innerHTML = ''; // Clear the old scanner UI
                    this.initializeQRScanner(); // Reinitialize the scanner
                }, 1000);
            }).catch((error) => {
                console.error('Failed to clear scanner:', error);
            });
        }
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
        console.log('Products array after adding:', this.products); // Debug log
        this.updateProductLists();
        this.checkExpiryAlert(product);
    }

    calculateStatus(expiryDate) {
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
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
        console.log('Updating product lists...');
        
        // Get the container elements
        const freshList = document.querySelector('#fresh-products .product-list');
        const expiringSoonList = document.querySelector('#expiring-soon .product-list');
        const expiredList = document.querySelector('#expired .product-list');

        if (!freshList || !expiringSoonList || !expiredList) {
            console.error('Product list containers not found. DOM elements:', {
                freshList,
                expiringSoonList,
                expiredList
            });
            return;
        }

        // Clear existing lists
        freshList.innerHTML = '';
        expiringSoonList.innerHTML = '';
        expiredList.innerHTML = '';

        // Calculate stock levels
        const stockLevels = this.products.reduce((acc, product) => {
            acc[product.batchNumber] = (acc[product.batchNumber] || 0) + 1;
            return acc;
        }, {});

        // Sort products by expiry date
        const sortedProducts = [...this.products].sort((a, b) => 
            new Date(a.expiryDate) - new Date(b.expiryDate)
        );

        console.log('Sorted products:', sortedProducts); // Debug log

        // Distribute products to appropriate lists
        sortedProducts.forEach(product => {
            const li = this.createProductListItem(product, stockLevels[product.batchNumber]);
            
            switch(product.status) {
                case 'fresh':
                    freshList.appendChild(li);
                    break;
                case 'expiring-soon':
                    expiringSoonList.appendChild(li);
                    break;
                case 'expired':
                    expiredList.appendChild(li);
                    break;
            }
        });
    }

    createProductListItem(product, stockLevel) {
        const li = document.createElement('li');
        li.className = `product-item ${product.status}`;
        
        const mfgDate = new Date(product.manufacturingDate).toLocaleDateString();
        const expDate = new Date(product.expiryDate).toLocaleDateString();
        const daysUntilExpiry = Math.ceil((new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        const isExpired = product.status === 'expired';
        
        li.innerHTML = `
            <div class="product-info">
                <input type="checkbox" data-id="${product.id}" 
                       ${isExpired ? 'disabled' : ''}>
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
                                '<i class="expired-icon">⚠️</i>Expired'}
                        </span>
                        ${isExpired ? 
                            '<span class="expired-warning">This item cannot be donated as it has expired</span>' 
                            : ''}
                    </div>
                </div>
            </div>
        `;
        return li;
    }

    getSelectedProducts() {
        const checkboxes = document.querySelectorAll('.product-item input[type="checkbox"]:checked:not(:disabled)');
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

        // Check if any selected product is expired
        const hasExpiredItems = selectedProducts.some(product => product.status === 'expired');
        if (hasExpiredItems) {
            alert('Cannot donate expired items. Please remove expired items from selection.');
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

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new FoodExpiryTracker();
});