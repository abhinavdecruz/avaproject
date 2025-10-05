// Ava's Enhanced Plant Identifier App - Complete Feature Set
class AvasPlantIdentifier {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.capturedImage = document.getElementById('capturedImage');
        this.stream = null;
        this.currentFacingMode = 'environment';
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.plantCollection = JSON.parse(localStorage.getItem('avaPlantCollection') || '[]');
        this.careReminders = JSON.parse(localStorage.getItem('avaCareReminders') || '[]');
        this.photoHistory = JSON.parse(localStorage.getItem('avaPhotoHistory') || '[]');
        
        // Initialize plant identification API
        this.plantAPI = new PlantIdentificationAPI();
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeTheme();
        this.initializeCamera();
        this.updateStats();
    }

    initializeElements() {
        // Get all necessary elements
        this.captureBtn = document.getElementById('captureBtn');
        this.switchCameraBtn = document.getElementById('switchCameraBtn');
        this.retakeBtn = document.getElementById('retakeBtn');
        this.identifyBtn = document.getElementById('identifyBtn');
        this.identifyAnotherBtn = document.getElementById('identifyAnotherBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.galleryBtn = document.getElementById('galleryBtn');
        this.backToCameraBtn = document.getElementById('backToCameraBtn');
        this.addToCollectionBtn = document.getElementById('addToCollectionBtn');
        this.setReminderBtn = document.getElementById('setReminderBtn');
        this.sharePlantBtn = document.getElementById('sharePlantBtn');
        this.aboutBtn = document.getElementById('aboutBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        // Get sections
        this.cameraSection = document.querySelector('.camera-section');
        this.imagePreview = document.getElementById('imagePreview');
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        this.gallerySection = document.getElementById('gallerySection');
        this.collectionSection = document.getElementById('collectionSection');
        this.arOverlay = document.getElementById('arOverlay');
        this.plantDetails = document.getElementById('plantDetails');
        this.errorMessage = document.getElementById('errorMessage');
        this.plantGallery = document.getElementById('plantGallery');
        this.totalPlants = document.getElementById('totalPlants');
        this.favoritePlants = document.getElementById('favoritePlants');
        this.careReminders = document.getElementById('careReminders');
        
        // AR elements
        this.arPlantName = document.getElementById('arPlantName');
        this.arPlantConfidence = document.getElementById('arPlantConfidence');
    }

    setupEventListeners() {
        // Camera controls
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        this.retakeBtn.addEventListener('click', () => this.retakePhoto());
        this.identifyBtn.addEventListener('click', () => this.identifyPlant());
        this.identifyAnotherBtn.addEventListener('click', () => this.resetToCamera());
        this.retryBtn.addEventListener('click', () => this.retry());
        
        // Theme and navigation
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.galleryBtn.addEventListener('click', () => this.showGallery());
        this.backToCameraBtn.addEventListener('click', () => this.resetToCamera());
        
        // Collection management
        this.addToCollectionBtn.addEventListener('click', () => this.addToCollection());
        this.setReminderBtn.addEventListener('click', () => this.setCareReminder());
        this.sharePlantBtn.addEventListener('click', () => this.sharePlant());
        
        // Footer buttons
        this.aboutBtn.addEventListener('click', () => this.showAbout());
        this.helpBtn.addEventListener('click', () => this.showHelp());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        
        // AR overlay
        this.arOverlay.addEventListener('click', (e) => {
            if (e.target === this.arOverlay) {
                this.hideAROverlay();
            }
        });
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const icon = this.themeToggle.querySelector('i');
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    async initializeCamera() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported on this device');
            }

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.video.srcObject = this.stream;
            this.video.play();
            
            this.hideAllSections();
            this.cameraSection.style.display = 'block';
            
            // Start AR detection
            this.startARDetection();
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Unable to access camera. Please ensure camera permissions are granted.');
        }
    }

    startARDetection() {
        // Simulate AR detection every 2 seconds
        setInterval(() => {
            if (this.cameraSection.style.display !== 'none') {
                this.detectPlantInAR();
            }
        }, 2000);
    }

    async detectPlantInAR() {
        try {
            // Quick plant detection for AR overlay
            const imageData = this.canvas.toDataURL('image/jpeg', 0.3);
            const plantData = await this.plantAPI.identifyPlant(imageData, { quick: true });
            
            if (plantData && plantData.confidence > 70) {
                this.showAROverlay(plantData);
            }
        } catch (error) {
            // Silently fail for AR detection
        }
    }

    showAROverlay(plantData) {
        this.arPlantName.textContent = plantData.name;
        this.arPlantConfidence.textContent = `Confidence: ${plantData.confidence}%`;
        this.arOverlay.style.display = 'flex';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideAROverlay();
        }, 3000);
    }

    hideAROverlay() {
        this.arOverlay.style.display = 'none';
    }

    async switchCamera() {
        try {
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
            await this.initializeCamera();
        } catch (error) {
            console.error('Error switching camera:', error);
            this.showError('Unable to switch camera');
        }
    }

    capturePhoto() {
        try {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            const context = this.canvas.getContext('2d');
            context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            const imageDataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
            this.capturedImage.src = imageDataUrl;

            // Add to photo history
            this.addToPhotoHistory(imageDataUrl);

            this.hideAllSections();
            this.imagePreview.style.display = 'block';
        } catch (error) {
            console.error('Error capturing photo:', error);
            this.showError('Unable to capture photo');
        }
    }

    addToPhotoHistory(imageData) {
        const photoEntry = {
            id: Date.now(),
            image: imageData,
            timestamp: new Date().toISOString(),
            plantData: null
        };
        
        this.photoHistory.unshift(photoEntry);
        if (this.photoHistory.length > 50) {
            this.photoHistory = this.photoHistory.slice(0, 50);
        }
        
        localStorage.setItem('avaPhotoHistory', JSON.stringify(this.photoHistory));
    }

    retakePhoto() {
        this.hideAllSections();
        this.cameraSection.style.display = 'block';
    }

    async identifyPlant() {
        try {
            this.hideAllSections();
            this.loadingSection.style.display = 'block';

            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // Use enhanced plant identification
            const plantData = await this.plantAPI.identifyPlant(imageData, {
                preferredAPI: 'plantNet',
                fallbackAPIs: ['plantId', 'googleVision'],
                includeDiseaseDetection: true,
                includeCareInstructions: true
            });
            
            // Update photo history with plant data
            if (this.photoHistory.length > 0) {
                this.photoHistory[0].plantData = plantData;
                localStorage.setItem('avaPhotoHistory', JSON.stringify(this.photoHistory));
            }
            
            this.displayPlantResults(plantData);
            this.updateStats();
            
        } catch (error) {
            console.error('Error identifying plant:', error);
            this.showError('Unable to identify plant. Please try again.');
        }
    }

    displayPlantResults(plantData) {
        this.hideAllSections();
        this.resultsSection.style.display = 'block';

        this.plantDetails.innerHTML = `
            <div class="plant-info">
                <h3>${plantData.name}</h3>
                <p class="scientific-name">${plantData.scientificName}</p>
                <p>${plantData.description}</p>
                <span class="confidence">${plantData.confidence}% Confidence</span>
                ${plantData.source ? `<small style="color: var(--text-secondary); font-size: 0.8rem;">Source: ${plantData.source}</small>` : ''}
            </div>

            ${plantData.commonNames && plantData.commonNames.length > 0 ? `
            <div class="plant-info">
                <h3>Common Names</h3>
                <p>${plantData.commonNames.join(', ')}</p>
            </div>
            ` : ''}

            <div class="plant-info">
                <h3>Care Instructions</h3>
                <div class="care-grid">
                    <div><strong>Light:</strong> ${plantData.care.light}</div>
                    <div><strong>Water:</strong> ${plantData.care.water}</div>
                    <div><strong>Humidity:</strong> ${plantData.care.humidity}</div>
                    <div><strong>Temperature:</strong> ${plantData.care.temperature}</div>
                </div>
            </div>

            <div class="plant-characteristics">
                <div class="characteristic">
                    <i class="fas fa-leaf"></i>
                    <h4>Leaf Shape</h4>
                    <p>${plantData.characteristics.leafShape}</p>
                </div>
                <div class="characteristic">
                    <i class="fas fa-palette"></i>
                    <h4>Leaf Color</h4>
                    <p>${plantData.characteristics.leafColor}</p>
                </div>
                <div class="characteristic">
                    <i class="fas fa-ruler"></i>
                    <h4>Size</h4>
                    <p>${plantData.characteristics.size}</p>
                </div>
                <div class="characteristic">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Toxicity</h4>
                    <p>${plantData.characteristics.toxicity}</p>
                </div>
            </div>

            ${plantData.diseaseInfo ? `
            <div class="plant-info">
                <h3>Health Assessment</h3>
                <p><strong>Status:</strong> ${plantData.diseaseInfo.status}</p>
                <p><strong>Recommendations:</strong> ${plantData.diseaseInfo.recommendations}</p>
            </div>
            ` : ''}

            ${plantData.image ? `
            <div class="plant-info">
                <h3>Reference Image</h3>
                <img src="${plantData.image}" alt="Plant reference" style="max-width: 100%; height: auto; border-radius: 10px; margin-top: 1rem;">
            </div>
            ` : ''}
        `;

        // Show collection management options
        this.collectionSection.style.display = 'block';
    }

    addToCollection() {
        const currentPlant = this.getCurrentPlantData();
        if (!currentPlant) return;

        const plantEntry = {
            id: Date.now(),
            ...currentPlant,
            addedDate: new Date().toISOString(),
            isFavorite: false,
            careNotes: '',
            lastWatered: null,
            nextWatering: null
        };

        this.plantCollection.push(plantEntry);
        localStorage.setItem('avaPlantCollection', JSON.stringify(this.plantCollection));
        
        this.showNotification('Plant added to your collection! 🌱', 'success');
        this.updateStats();
    }

    setCareReminder() {
        const currentPlant = this.getCurrentPlantData();
        if (!currentPlant) return;

        const reminder = {
            id: Date.now(),
            plantName: currentPlant.name,
            type: 'watering',
            frequency: 'weekly',
            nextDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true
        };

        this.careReminders.push(reminder);
        localStorage.setItem('avaCareReminders', JSON.stringify(this.careReminders));
        
        this.showNotification('Care reminder set! 🔔', 'success');
        this.updateStats();
    }

    sharePlant() {
        const currentPlant = this.getCurrentPlantData();
        if (!currentPlant) return;

        const shareText = `Check out this plant I identified with Ava's Plant Identifier! 🌱\n\n${currentPlant.name} (${currentPlant.scientificName})\nConfidence: ${currentPlant.confidence}%`;

        if (navigator.share) {
            navigator.share({
                title: 'Plant Identification',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText);
            this.showNotification('Plant info copied to clipboard! 📋', 'success');
        }
    }

    getCurrentPlantData() {
        // Get current plant data from the results section
        const plantName = this.plantDetails.querySelector('h3')?.textContent;
        const scientificName = this.plantDetails.querySelector('.scientific-name')?.textContent;
        const confidence = this.plantDetails.querySelector('.confidence')?.textContent;
        
        if (!plantName) return null;
        
        return {
            name: plantName,
            scientificName: scientificName || plantName,
            confidence: parseInt(confidence?.replace('% Confidence', '') || '0'),
            timestamp: new Date().toISOString()
        };
    }

    showGallery() {
        this.hideAllSections();
        this.gallerySection.style.display = 'block';
        this.renderPlantGallery();
    }

    renderPlantGallery() {
        this.plantGallery.innerHTML = '';
        
        if (this.plantCollection.length === 0) {
            this.plantGallery.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-seedling" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No plants in your collection yet!</h3>
                    <p>Start identifying plants to build your collection, Ava! 🌱</p>
                </div>
            `;
            return;
        }

        this.plantCollection.forEach(plant => {
            const plantCard = document.createElement('div');
            plantCard.className = 'plant-card fade-in';
            plantCard.innerHTML = `
                <img src="${plant.image || '/api/placeholder/200/200'}" alt="${plant.name}" class="plant-card-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTI1IDEyNUg3NUwxMDAgNTBaIiBmaWxsPSIjMjJjNTUiLz4KPHBhdGggZD0iTTEwMCAxNzVMMTI1IDEyNUg3NUwxMDAgMTc1WiIgZmlsbD0iIzIyYzU1Ii8+Cjwvc3ZnPgo='">
                <div class="plant-card-content">
                    <h3>${plant.name}</h3>
                    <p class="scientific-name">${plant.scientificName}</p>
                    <div class="plant-card-actions">
                        <button class="plant-card-btn primary" onclick="app.toggleFavorite('${plant.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="plant-card-btn secondary" onclick="app.viewPlantDetails('${plant.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            `;
            this.plantGallery.appendChild(plantCard);
        });
    }

    toggleFavorite(plantId) {
        const plant = this.plantCollection.find(p => p.id == plantId);
        if (plant) {
            plant.isFavorite = !plant.isFavorite;
            localStorage.setItem('avaPlantCollection', JSON.stringify(this.plantCollection));
            this.updateStats();
            this.showNotification(plant.isFavorite ? 'Added to favorites! ❤️' : 'Removed from favorites', 'success');
        }
    }

    viewPlantDetails(plantId) {
        const plant = this.plantCollection.find(p => p.id == plantId);
        if (plant) {
            this.displayPlantResults(plant);
        }
    }

    updateStats() {
        this.totalPlants.textContent = this.plantCollection.length;
        this.favoritePlants.textContent = this.plantCollection.filter(p => p.isFavorite).length;
        this.careReminders.textContent = this.careReminders.filter(r => r.isActive).length;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showAbout() {
        alert(`Ava's Plant Identifier 🌱\n\nVersion 2.0\n\nA comprehensive plant identification app with:\n• Real-time camera identification\n• Plant collection management\n• Care reminders\n• AR overlay\n• Dark mode\n• Photo history\n\nMade with 💚 for Ava!`);
    }

    showHelp() {
        alert(`How to use Ava's Plant Identifier:\n\n1. 📸 Point your camera at any plant\n2. 🎯 Tap the camera button to capture\n3. 🔍 Tap "Identify Plant" for detailed info\n4. 💾 Add plants to your collection\n5. 🔔 Set care reminders\n6. 🌙 Toggle dark mode anytime\n\nTips for better identification:\n• Ensure good lighting\n• Keep plant in focus\n• Capture clear, unobstructed images\n• Try different angles if needed`);
    }

    showSettings() {
        const settings = `
Ava's Plant Settings ⚙️

Current Theme: ${this.currentTheme}
Total Plants: ${this.plantCollection.length}
Favorites: ${this.plantCollection.filter(p => p.isFavorite).length}
Care Reminders: ${this.careReminders.filter(r => r.isActive).length}

Options:
• Toggle dark/light mode
• Clear photo history
• Export plant collection
• Reset all data
        `;
        alert(settings);
    }

    resetToCamera() {
        this.hideAllSections();
        this.cameraSection.style.display = 'block';
    }

    retry() {
        this.initializeCamera();
    }

    showError(message) {
        this.hideAllSections();
        this.errorMessage.textContent = message;
        this.errorSection.style.display = 'block';
    }

    hideAllSections() {
        this.cameraSection.style.display = 'none';
        this.imagePreview.style.display = 'none';
        this.loadingSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        this.gallerySection.style.display = 'none';
        this.collectionSection.style.display = 'none';
        this.arOverlay.style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AvasPlantIdentifier();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.app) {
        window.app.initializeCamera();
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);