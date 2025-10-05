// Plant Identifier App - Main JavaScript
class PlantIdentifier {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.capturedImage = document.getElementById('capturedImage');
        this.stream = null;
        this.currentFacingMode = 'environment'; // 'user' for front camera, 'environment' for back camera
        
        // Initialize plant identification API
        this.plantAPI = new PlantIdentificationAPI();
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCamera();
    }

    initializeElements() {
        // Get all necessary elements
        this.captureBtn = document.getElementById('captureBtn');
        this.switchCameraBtn = document.getElementById('switchCameraBtn');
        this.retakeBtn = document.getElementById('retakeBtn');
        this.identifyBtn = document.getElementById('identifyBtn');
        this.identifyAnotherBtn = document.getElementById('identifyAnotherBtn');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Get sections
        this.cameraSection = document.querySelector('.camera-section');
        this.imagePreview = document.getElementById('imagePreview');
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        this.plantDetails = document.getElementById('plantDetails');
        this.errorMessage = document.getElementById('errorMessage');
    }

    setupEventListeners() {
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        this.retakeBtn.addEventListener('click', () => this.retakePhoto());
        this.identifyBtn.addEventListener('click', () => this.identifyPlant());
        this.identifyAnotherBtn.addEventListener('click', () => this.resetToCamera());
        this.retryBtn.addEventListener('click', () => this.retry());
    }

    async initializeCamera() {
        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported on this device');
            }

            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.video.srcObject = this.stream;
            this.video.play();
            
            // Hide error section and show camera
            this.hideAllSections();
            this.cameraSection.style.display = 'block';
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Unable to access camera. Please ensure camera permissions are granted.');
        }
    }

    async switchCamera() {
        try {
            // Stop current stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            // Switch camera
            this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
            
            // Reinitialize camera
            await this.initializeCamera();
        } catch (error) {
            console.error('Error switching camera:', error);
            this.showError('Unable to switch camera');
        }
    }

    capturePhoto() {
        try {
            // Set canvas dimensions to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // Draw video frame to canvas
            const context = this.canvas.getContext('2d');
            context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Convert canvas to image data URL
            const imageDataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
            this.capturedImage.src = imageDataUrl;

            // Show image preview
            this.hideAllSections();
            this.imagePreview.style.display = 'block';
        } catch (error) {
            console.error('Error capturing photo:', error);
            this.showError('Unable to capture photo');
        }
    }

    retakePhoto() {
        this.hideAllSections();
        this.cameraSection.style.display = 'block';
    }

    async identifyPlant() {
        try {
            // Show loading section
            this.hideAllSections();
            this.loadingSection.style.display = 'block';

            // Get image data from canvas
            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // Use plant identification API
            const plantData = await this.plantAPI.identifyPlant(imageData, {
                preferredAPI: 'plantNet',
                fallbackAPIs: ['plantId', 'googleVision']
            });
            
            // Display results
            this.displayPlantResults(plantData);
            
        } catch (error) {
            console.error('Error identifying plant:', error);
            this.showError('Unable to identify plant. Please try again.');
        }
    }

    async simulatePlantIdentification(imageData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Mock plant data (replace with actual API call)
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
                }
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
                }
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
                }
            }
        ];

        // Return a random plant for demo purposes
        return mockPlants[Math.floor(Math.random() * mockPlants.length)];
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
                ${plantData.source ? `<small style="color: #6b7280; font-size: 0.8rem;">Source: ${plantData.source}</small>` : ''}
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

            ${plantData.image ? `
            <div class="plant-info">
                <h3>Reference Image</h3>
                <img src="${plantData.image}" alt="Plant reference" style="max-width: 100%; height: auto; border-radius: 10px; margin-top: 1rem;">
            </div>
            ` : ''}
        `;
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
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PlantIdentifier();
});

// Handle page visibility changes to restart camera
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.plantIdentifier) {
        window.plantIdentifier.initializeCamera();
    }
});

// Make PlantIdentifier available globally for debugging
window.PlantIdentifier = PlantIdentifier;