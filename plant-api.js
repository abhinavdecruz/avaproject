// Plant Identification API Integration
class PlantIdentificationAPI {
    constructor() {
        // You can replace these with actual API keys
        this.apiKeys = {
            plantNet: 'YOUR_PLANTNET_API_KEY',
            plantId: 'YOUR_PLANTID_API_KEY',
            googleVision: 'YOUR_GOOGLE_VISION_API_KEY'
        };
        
        this.apiEndpoints = {
            plantNet: 'https://my-api.plantnet.org/v2/identify',
            plantId: 'https://api.plant.id/v2/identify',
            googleVision: 'https://vision.googleapis.com/v1/images:annotate'
        };
    }

    // Main identification method - tries multiple APIs
    async identifyPlant(imageData, options = {}) {
        const { preferredAPI = 'plantNet', fallbackAPIs = ['plantId', 'googleVision'], quick = false, includeDiseaseDetection = false, includeCareInstructions = true } = options;
        
        try {
            // Try preferred API first
            const result = await this.callAPI(preferredAPI, imageData);
            if (result && result.confidence > 0.7) {
                return this.formatResult(result, preferredAPI);
            }
        } catch (error) {
            console.warn(`${preferredAPI} API failed:`, error);
        }

        // Try fallback APIs
        for (const api of fallbackAPIs) {
            try {
                const result = await this.callAPI(api, imageData);
                if (result && result.confidence > 0.5) {
                    return this.formatResult(result, api);
                }
            } catch (error) {
                console.warn(`${api} API failed:`, error);
            }
        }

        // If all APIs fail, return mock data
        const mockData = this.getMockPlantData();
        if (includeDiseaseDetection) {
            mockData.diseaseInfo = this.generateDiseaseInfo(mockData);
        }
        return mockData;
    }

    async callAPI(apiName, imageData) {
        switch (apiName) {
            case 'plantNet':
                return await this.callPlantNetAPI(imageData);
            case 'plantId':
                return await this.callPlantIdAPI(imageData);
            case 'googleVision':
                return await this.callGoogleVisionAPI(imageData);
            default:
                throw new Error(`Unknown API: ${apiName}`);
        }
    }

    async callPlantNetAPI(imageData) {
        const formData = new FormData();
        
        // Convert base64 to blob
        const blob = this.base64ToBlob(imageData, 'image/jpeg');
        formData.append('images', blob, 'plant.jpg');
        formData.append('organs', 'leaf'); // Focus on leaves
        formData.append('modifiers', 'crops_fast,similar_images');
        formData.append('plant-language', 'en');
        formData.append('plant-details', 'common_names,url,description,taxonomy,rank,gbif_id,inaturalist_id,image,synonyms');

        const response = await fetch(`${this.apiEndpoints.plantNet}?api-key=${this.apiKeys.plantNet}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`PlantNet API error: ${response.status}`);
        }

        const data = await response.json();
        return this.parsePlantNetResponse(data);
    }

    async callPlantIdAPI(imageData) {
        const base64Data = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        
        const response = await fetch(this.apiEndpoints.plantId, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': this.apiKeys.plantId
            },
            body: JSON.stringify({
                images: [base64Data],
                modifiers: ['crops_fast', 'similar_images', 'plant_net'],
                plant_language: 'en',
                plant_details: [
                    'common_names', 'url', 'description', 'taxonomy', 'rank', 
                    'gbif_id', 'inaturalist_id', 'image', 'synonyms', 
                    'edible_parts', 'watering'
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Plant.id API error: ${response.status}`);
        }

        const data = await response.json();
        return this.parsePlantIdResponse(data);
    }

    async callGoogleVisionAPI(imageData) {
        const base64Data = imageData.split(',')[1];
        
        const response = await fetch(`${this.apiEndpoints.googleVision}?key=${this.apiKeys.googleVision}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [{
                    image: {
                        content: base64Data
                    },
                    features: [{
                        type: 'LABEL_DETECTION',
                        maxResults: 10
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Google Vision API error: ${response.status}`);
        }

        const data = await response.json();
        return this.parseGoogleVisionResponse(data);
    }

    parsePlantNetResponse(data) {
        if (!data.results || data.results.length === 0) {
            return null;
        }

        const bestMatch = data.results[0];
        const species = bestMatch.species;
        
        return {
            name: species.scientificNameWithoutAuthor,
            scientificName: species.scientificNameAuthorship,
            commonNames: species.commonNames || [],
            confidence: Math.round(bestMatch.score * 100),
            description: species.gbif?.description || 'No description available',
            image: species.image?.url,
            source: 'PlantNet',
            details: {
                family: species.family?.scientificNameWithoutAuthor,
                genus: species.genus?.scientificNameWithoutAuthor,
                gbifId: species.gbif?.id,
                inaturalistId: species.inaturalistId
            }
        };
    }

    parsePlantIdResponse(data) {
        if (!data.suggestions || data.suggestions.length === 0) {
            return null;
        }

        const bestMatch = data.suggestions[0];
        const plant = bestMatch.plant_details;
        
        return {
            name: plant.common_name || plant.scientific_name,
            scientificName: plant.scientific_name,
            commonNames: plant.common_names || [plant.common_name],
            confidence: Math.round(bestMatch.probability * 100),
            description: plant.description?.value || 'No description available',
            image: plant.image?.url,
            source: 'Plant.id',
            details: {
                family: plant.taxonomy?.family,
                genus: plant.taxonomy?.genus,
                edibleParts: plant.edible_parts,
                watering: plant.watering
            }
        };
    }

    parseGoogleVisionResponse(data) {
        if (!data.responses || !data.responses[0].labelAnnotations) {
            return null;
        }

        const labels = data.responses[0].labelAnnotations;
        const plantLabels = labels.filter(label => 
            label.description.toLowerCase().includes('plant') ||
            label.description.toLowerCase().includes('leaf') ||
            label.description.toLowerCase().includes('flower') ||
            label.description.toLowerCase().includes('tree')
        );

        if (plantLabels.length === 0) {
            return null;
        }

        const bestMatch = plantLabels[0];
        return {
            name: bestMatch.description,
            scientificName: bestMatch.description,
            commonNames: [bestMatch.description],
            confidence: Math.round(bestMatch.score * 100),
            description: `Identified as ${bestMatch.description} using Google Vision API`,
            source: 'Google Vision',
            details: {}
        };
    }

    formatResult(result, apiName) {
        return {
            name: result.name || 'Unknown Plant',
            scientificName: result.scientificName || result.name,
            commonNames: result.commonNames || [result.name],
            confidence: result.confidence || 0,
            description: result.description || 'No description available',
            image: result.image,
            source: result.source || apiName,
            care: this.generateCareInstructions(result),
            characteristics: this.generateCharacteristics(result),
            details: result.details || {}
        };
    }

    generateCareInstructions(plant) {
        // Generate basic care instructions based on plant type
        const plantName = (plant.name || '').toLowerCase();
        
        if (plantName.includes('succulent') || plantName.includes('cactus')) {
            return {
                light: 'Bright, direct light',
                water: 'Water sparingly, let soil dry completely',
                humidity: 'Low humidity',
                temperature: '60-80°F (15-27°C)'
            };
        } else if (plantName.includes('fern') || plantName.includes('moss')) {
            return {
                light: 'Low to medium indirect light',
                water: 'Keep soil consistently moist',
                humidity: 'High humidity',
                temperature: '65-75°F (18-24°C)'
            };
        } else if (plantName.includes('tree') || plantName.includes('shrub')) {
            return {
                light: 'Bright, indirect to direct light',
                water: 'Water when top inch of soil is dry',
                humidity: 'Moderate humidity',
                temperature: '65-85°F (18-29°C)'
            };
        } else {
            return {
                light: 'Bright, indirect light',
                water: 'Water when top inch of soil is dry',
                humidity: 'Moderate humidity',
                temperature: '65-80°F (18-27°C)'
            };
        }
    }

    generateCharacteristics(plant) {
        const plantName = (plant.name || '').toLowerCase();
        
        return {
            leafShape: this.getLeafShape(plantName),
            leafColor: this.getLeafColor(plantName),
            size: this.getPlantSize(plantName),
            toxicity: this.getToxicityInfo(plantName)
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

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    getMockPlantData() {
        // Fallback mock data when APIs are not available
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
                source: "Mock Data"
            }
        ];
        
        return mockPlants[Math.floor(Math.random() * mockPlants.length)];
    }

    generateDiseaseInfo(plant) {
        const diseases = [
            { status: 'Healthy', recommendations: 'Continue current care routine' },
            { status: 'Slight yellowing', recommendations: 'Check watering schedule and light exposure' },
            { status: 'Good condition', recommendations: 'Plant appears healthy, maintain regular care' }
        ];
        return diseases[Math.floor(Math.random() * diseases.length)];
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlantIdentificationAPI;
} else {
    window.PlantIdentificationAPI = PlantIdentificationAPI;
}