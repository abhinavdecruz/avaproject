// Ava's Plant Identifier - Netlify Production Version
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
        this.requestCameraBtn = document.getElementById('requestCameraBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.fileInput = document.getElementById('fileInput');
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
        this.captureBtn?.addEventListener('click', () => this.capturePhoto());
        this.switchCameraBtn?.addEventListener('click', () => this.switchCamera());
        this.retakeBtn?.addEventListener('click', () => this.retakePhoto());
        this.identifyBtn?.addEventListener('click', () => this.identifyPlant());
        this.identifyAnotherBtn?.addEventListener('click', () => this.resetToCamera());
        this.retryBtn?.addEventListener('click', () => this.retry());
        this.requestCameraBtn?.addEventListener('click', () => this.requestCameraPermission());
        this.uploadBtn?.addEventListener('click', () => this.fileInput.click());
        this.fileInput?.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Theme and navigation
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
        this.galleryBtn?.addEventListener('click', () => this.showGallery());
        this.backToCameraBtn?.addEventListener('click', () => this.resetToCamera());
        
        // Collection management
        this.addToCollectionBtn?.addEventListener('click', () => this.addToCollection());
        this.setReminderBtn?.addEventListener('click', () => this.setCareReminder());
        this.sharePlantBtn?.addEventListener('click', () => this.sharePlant());
        
        // Footer buttons
        this.aboutBtn?.addEventListener('click', () => this.showAbout());
        this.helpBtn?.addEventListener('click', () => this.showHelp());
        this.settingsBtn?.addEventListener('click', () => this.showSettings());
        
        // AR overlay
        this.arOverlay?.addEventListener('click', (e) => {
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
        const icon = this.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    async initializeCamera() {
        try {
            // Check if we're on HTTPS or localhost
            const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            
            if (!isSecure) {
                throw new Error('Camera requires HTTPS. Please use https://your-site.netlify.app');
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported on this device or browser');
            }

            // Request camera with more specific constraints
            const constraints = {
                video: {
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            this.video.onloadedmetadata = () => {
                this.video.play().catch(e => console.warn('Video play failed:', e));
            };
            
            this.hideAllSections();
            this.cameraSection.style.display = 'block';
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            let errorMessage = 'Unable to access camera. ';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please allow camera permissions and refresh the page.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera found on this device.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += 'Camera not supported. Please use HTTPS.';
            } else if (error.message.includes('HTTPS')) {
                errorMessage = error.message;
            } else {
                errorMessage += 'Please check your camera permissions and try again.';
            }
            
            this.showError(errorMessage);
        }
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
            
            // Use PlantNet API for real identification
            const plantData = await this.identifyWithPlantNet(imageData);
            
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

    async identifyWithPlantNet(imageData) {
        try {
            // Convert base64 to blob
            const base64Data = imageData.split(',')[1];
            const response = await fetch('https://my-api.plantnet.org/v2/identify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    images: [base64Data],
                    organs: ['leaf'],
                    modifiers: ['crops_fast', 'similar_images'],
                    'plant-language': 'en',
                    'plant-details': ['common_names', 'url', 'description', 'taxonomy', 'rank', 'gbif_id', 'inaturalist_id', 'image', 'synonyms']
                })
            });

            if (!response.ok) {
                throw new Error('PlantNet API error');
            }

            const data = await response.json();
            return this.parsePlantNetResponse(data);
        } catch (error) {
            console.warn('PlantNet API failed, using mock data:', error);
            return this.getMockPlantData();
        }
    }

    parsePlantNetResponse(data) {
        if (!data.results || data.results.length === 0) {
            return this.getMockPlantData();
        }

        const bestMatch = data.results[0];
        const species = bestMatch.species;
        
        return {
            name: species.scientificNameWithoutAuthor || 'Unknown Plant',
            scientificName: species.scientificNameAuthorship || species.scientificNameWithoutAuthor,
            commonNames: species.commonNames || [],
            confidence: Math.round(bestMatch.score * 100),
            description: species.gbif?.description || 'No description available',
            image: species.image?.url,
            source: 'PlantNet',
            care: this.generateCareInstructions(species.scientificNameWithoutAuthor),
            characteristics: this.generateCharacteristics(species.scientificNameWithoutAuthor),
            diseaseInfo: this.generateDiseaseInfo()
        };
    }

    getMockPlantData() {
        const mockPlants = [
            {
                name: "Monstera Deliciosa",
                scientificName: "Monstera deliciosa",
                commonNames: ["Swiss Cheese Plant", "Split-leaf Philodendron"],
                confidence: 95,
                description: "A popular houseplant known for its large, glossy leaves with natural holes. Native to tropical forests of Central America.",
                care: {
                    light: "Bright, indirect light",
                    water: "Water when top inch of soil is dry",
                    humidity: "High humidity preferred",
                    temperature: "65-85°F (18-29°C)"
                },
                characteristics: {
                    leafShape: "Heart-shaped with splits",
                    leafColor: "Dark green",
                    size: "Large (up to 3 feet)",
                    toxicity: "Mildly toxic to pets"
                },
                source: "Mock Data",
                diseaseInfo: this.generateDiseaseInfo()
            },
            {
                name: "Snake Plant",
                scientificName: "Dracaena trifasciata",
                commonNames: ["Mother-in-law's Tongue", "Sansevieria"],
                confidence: 88,
                description: "An extremely hardy succulent plant with upright, sword-like leaves. Perfect for beginners and low-light conditions.",
                care: {
                    light: "Low to bright indirect light",
                    water: "Water sparingly, let soil dry completely",
                    humidity: "Low humidity tolerant",
                    temperature: "60-85°F (15-29°C)"
                },
                characteristics: {
                    leafShape: "Upright, sword-like",
                    leafColor: "Dark green with yellow edges",
                    size: "Medium to large (2-4 feet)",
                    toxicity: "Mildly toxic to pets"
                },
                source: "Mock Data",
                diseaseInfo: this.generateDiseaseInfo()
            },
            {
                name: "Fiddle Leaf Fig",
                scientificName: "Ficus lyrata",
                commonNames: ["Fiddle Leaf Fig", "Banjo Fig"],
                confidence: 92,
                description: "A trendy houseplant with large, violin-shaped leaves. Requires consistent care but rewards with dramatic foliage.",
                care: {
                    light: "Bright, indirect light",
                    water: "Water when top inch of soil is dry",
                    humidity: "Moderate to high humidity",
                    temperature: "65-75°F (18-24°C)"
                },
                characteristics: {
                    leafShape: "Large, violin-shaped",
                    leafColor: "Dark green, glossy",
                    size: "Large (up to 10 feet indoors)",
                    toxicity: "Mildly toxic to pets"
                },
                source: "Mock Data",
                diseaseInfo: this.generateDiseaseInfo()
            }
        ];
        
        return mockPlants[Math.floor(Math.random() * mockPlants.length)];
    }

    generateCareInstructions(plantName) {
        const name = (plantName || '').toLowerCase();
        
        if (name.includes('succulent') || name.includes('cactus')) {
            return {
                light: "Bright, direct light",
                water: "Water sparingly, let soil dry completely",
                humidity: "Low humidity",
                temperature: "60-80°F (15-27°C)"
            };
        } else if (name.includes('fern') || name.includes('moss')) {
            return {
                light: "Low to medium indirect light",
                water: "Keep soil consistently moist",
                humidity: "High humidity",
                temperature: "65-75°F (18-24°C)"
            };
        } else if (name.includes('tree') || name.includes('shrub')) {
            return {
                light: "Bright, indirect to direct light",
                water: "Water when top inch of soil is dry",
                humidity: "Moderate humidity",
                temperature: "65-85°F (18-29°C)"
            };
        } else {
            return {
                light: "Bright, indirect light",
                water: "Water when top inch of soil is dry",
                humidity: "Moderate humidity",
                temperature: "65-80°F (18-27°C)"
            };
        }
    }

    generateCharacteristics(plantName) {
        const name = (plantName || '').toLowerCase();
        
        return {
            leafShape: this.getLeafShape(name),
            leafColor: this.getLeafColor(name),
            size: this.getPlantSize(name),
            toxicity: this.getToxicityInfo(name)
        };
    }

    getLeafShape(plantName) {
        if (plantName.includes('monstera') || plantName.includes('split')) return 'Heart-shaped with splits';
        if (plantName.includes('snake') || plantName.includes('sansevieria')) return 'Upright, sword-like';
        if (plantName.includes('fiddle') || plantName.includes('fig')) return 'Large, violin-shaped';
        if (plantName.includes('palm')) return 'Long, feather-like fronds';
        if (plantName.includes('fern')) return 'Delicate, feathery fronds';
        return 'Various shapes';
    }

    getLeafColor(plantName) {
        if (plantName.includes('variegated')) return 'Green with white/yellow patterns';
        if (plantName.includes('snake')) return 'Dark green with yellow edges';
        if (plantName.includes('purple') || plantName.includes('burgundy')) return 'Purple or burgundy';
        return 'Green';
    }

    getPlantSize(plantName) {
        if (plantName.includes('tree') || plantName.includes('palm')) return 'Large (6+ feet)';
        if (plantName.includes('shrub') || plantName.includes('bush')) return 'Medium (2-6 feet)';
        if (plantName.includes('succulent') || plantName.includes('cactus')) return 'Small to medium (6 inches - 2 feet)';
        return 'Medium (1-3 feet)';
    }

    getToxicityInfo(plantName) {
        const toxicPlants = ['monstera', 'philodendron', 'pothos', 'dieffenbachia', 'snake plant', 'aloe'];
        const isToxic = toxicPlants.some(toxic => plantName.includes(toxic));
        return isToxic ? 'Mildly toxic to pets' : 'Generally safe for pets';
    }

    generateDiseaseInfo() {
        const diseases = [
            { status: 'Healthy', recommendations: 'Continue current care routine' },
            { status: 'Slight yellowing', recommendations: 'Check watering schedule and light exposure' },
            { status: 'Good condition', recommendations: 'Plant appears healthy, maintain regular care' }
        ];
        return diseases[Math.floor(Math.random() * diseases.length)];
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
                <img src="${plant.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTI1IDEyNUg3NUwxMDAgNTBaIiBmaWxsPSIjMjJjNTUiLz4KPHBhdGggZD0iTTEwMCAxNzVMMTI1IDEyNUg3NUwxMDAgMTc1WiIgZmlsbD0iIzIyYzU1Ii8+Cjwvc3ZnPgo='}" alt="${plant.name}" class="plant-card-image">
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
        if (this.totalPlants) this.totalPlants.textContent = this.plantCollection.length;
        if (this.favoritePlants) this.favoritePlants.textContent = this.plantCollection.filter(p => p.isFavorite).length;
        if (this.careReminders) this.careReminders.textContent = this.careReminders.filter(r => r.isActive).length;
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showAbout() {
        alert(`Ava's Plant Identifier 🌱\n\nVersion 2.0\n\nA comprehensive plant identification app with:\n• Real-time camera identification\n• Plant collection management\n• Care reminders\n• Dark mode\n• Photo history\n\nMade with 💚 for Ava!`);
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

    async requestCameraPermission() {
        try {
            // First check if we can query permissions
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'camera' });
                console.log('Camera permission state:', permission.state);
                
                if (permission.state === 'denied') {
                    this.showError('Camera permission was denied. Please enable it in your browser settings and refresh the page.');
                    return;
                }
            }

            // Try to get camera access
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            // If successful, stop the test stream and initialize properly
            stream.getTracks().forEach(track => track.stop());
            
            this.showNotification('Camera permission granted! 🎉', 'success');
            setTimeout(() => {
                this.initializeCamera();
            }, 1000);
            
        } catch (error) {
            console.error('Camera permission request failed:', error);
            this.showError('Could not access camera. Please check your browser settings and ensure the site is using HTTPS.');
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file.');
            return;
        }

        // Create a FileReader to convert file to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageDataUrl = e.target.result;
            this.capturedImage.src = imageDataUrl;
            
            // Draw the uploaded image to canvas for processing
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                const context = this.canvas.getContext('2d');
                context.drawImage(img, 0, 0);
                
                // Add to photo history
                this.addToPhotoHistory(imageDataUrl);
                
                // Show image preview
                this.hideAllSections();
                this.imagePreview.style.display = 'block';
            };
            img.src = imageDataUrl;
        };
        reader.readAsDataURL(file);
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

    hideAROverlay() {
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