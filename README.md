# Plant Identifier - Mobile Camera App 🌱

A modern, mobile-friendly web application that uses your phone's camera to identify plants instantly. Simply point your camera at any plant and get detailed information about it!

## Features

- 📱 **Mobile-Optimized**: Designed specifically for mobile devices with responsive design
- 📸 **Camera Integration**: Access both front and back cameras with easy switching
- 🔍 **Plant Identification**: AI-powered plant recognition with detailed results
- 📊 **Detailed Information**: Get comprehensive plant details including:
  - Common and scientific names
  - Care instructions (light, water, humidity, temperature)
  - Plant characteristics (leaf shape, color, size, toxicity)
  - Confidence scores for identification accuracy

## How to Use

1. **Open the App**: Load `index.html` in your mobile browser
2. **Allow Camera Access**: Grant permission when prompted
3. **Point at Plant**: Position your camera so the plant is clearly visible
4. **Capture Photo**: Tap the camera button to take a picture
5. **Identify Plant**: Tap "Identify Plant" to get detailed information
6. **View Results**: Browse through comprehensive plant details and care instructions

## Technical Features

- **Progressive Web App**: Works offline after initial load
- **Responsive Design**: Optimized for all screen sizes
- **Modern UI**: Beautiful, intuitive interface with smooth animations
- **Camera Controls**: Easy photo capture and camera switching
- **Error Handling**: Graceful error handling with user-friendly messages

## Setup and Installation

### Option 1: Simple HTTP Server
```bash
# Using Python (recommended)
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

### Option 2: Live Server (VS Code)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Direct File Access
Simply open `index.html` directly in your mobile browser (some features may be limited due to CORS restrictions).

## File Structure

```
plant-identifier-app/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── package.json        # Project configuration
└── README.md          # This file
```

## Browser Compatibility

- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Edge (Android)
- ✅ Samsung Internet

## Camera Requirements

- **HTTPS Required**: Camera access requires a secure connection
- **Mobile Device**: Optimized for mobile cameras
- **Modern Browser**: Requires getUserMedia API support

## API Integration

The current version includes mock plant data for demonstration. To integrate with real plant identification APIs:

1. **PlantNet API**: Free plant identification service
2. **Plant.id API**: Commercial plant identification service
3. **Google Vision API**: General image recognition with plant detection
4. **Custom ML Model**: Train your own plant identification model

### Example API Integration

Replace the `simulatePlantIdentification` function in `script.js` with actual API calls:

```javascript
async function identifyPlantWithAPI(imageData) {
    const response = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': 'YOUR_API_KEY'
        },
        body: JSON.stringify({
            images: [imageData.split(',')[1]], // Remove data:image/jpeg;base64, prefix
            modifiers: ["crops_fast", "similar_images", "plant_net"],
            plant_language: "en",
            plant_details: ["common_names", "url", "description", "taxonomy", "rank", "gbif_id", "inaturalist_id", "image", "synonyms", "edible_parts", "watering"]
        })
    });
    
    return await response.json();
}
```

## Customization

### Adding New Plant Data
Edit the `mockPlants` array in `script.js` to add more plant species:

```javascript
const mockPlants = [
    {
        name: "Your Plant Name",
        scientificName: "Scientific name",
        commonNames: ["Common name 1", "Common name 2"],
        confidence: 95,
        description: "Plant description...",
        care: {
            light: "Light requirements",
            water: "Watering instructions",
            humidity: "Humidity needs",
            temperature: "Temperature range"
        },
        characteristics: {
            leafShape: "Leaf shape description",
            leafColor: "Leaf color",
            size: "Plant size",
            toxicity: "Toxicity information"
        }
    }
    // Add more plants...
];
```

### Styling Customization
Modify `styles.css` to change colors, fonts, and layout:

```css
:root {
    --primary-color: #4ade80;    /* Change primary green color */
    --secondary-color: #667eea;  /* Change gradient colors */
    --text-color: #333;          /* Change text color */
}
```

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS
- Check browser permissions
- Try refreshing the page
- Test on different browsers

### Poor Plant Identification
- Ensure good lighting
- Keep plant in focus
- Capture clear, unobstructed images
- Try different angles

### Mobile Performance Issues
- Close other apps to free up memory
- Use a modern browser
- Ensure stable internet connection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple devices
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Test on different devices and browsers

---

**Happy Plant Identifying! 🌿📱**