const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Phone tracking database (simulated)
const phoneDatabase = {
    '+919876543210': {
        country: 'India',
        carrier: 'Jio',
        type: 'Mobile',
        location: 'Mumbai, Maharashtra',
        latitude: 19.0760,
        longitude: 72.8777,
        timezone: 'IST (UTC+5:30)'
    },
    '+11234567890': {
        country: 'United States',
        carrier: 'Verizon',
        type: 'Mobile',
        location: 'New York, NY',
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'EST (UTC-5)'
    },
    '+441632960000': {
        country: 'United Kingdom',
        carrier: 'Vodafone',
        type: 'Mobile',
        location: 'London, England',
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'GMT (UTC+0)'
    },
    '+33123456789': {
        country: 'France',
        carrier: 'Orange',
        type: 'Mobile',
        location: 'Paris, France',
        latitude: 48.8566,
        longitude: 2.3522,
        timezone: 'CET (UTC+1)'
    },
    '+49123456789': {
        country: 'Germany',
        carrier: 'Deutsche Telekom',
        type: 'Mobile',
        location: 'Berlin, Germany',
        latitude: 52.5200,
        longitude: 13.4050,
        timezone: 'CET (UTC+1)'
    }
};

// Utility function to normalize phone number
function normalizePhoneNumber(phone) {
    return phone.replace(/[\s\-\(\)]/g, '');
}

// Utility function to get geolocation from coordinates
async function getGeolocation(lat, lng) {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        return response.data.address.country || 'Unknown';
    } catch (error) {
        return 'Unknown';
    }
}

// API route for tracking phone
app.post('/api/track', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhoneNumber(phone);

        // Check if phone exists in database
        if (phoneDatabase[normalizedPhone]) {
            const data = phoneDatabase[normalizedPhone];
            return res.json({
                phone: normalizedPhone,
                ...data,
                success: true
            });
        }

        // Simulate finding phone with pattern matching
        for (const [key, value] of Object.entries(phoneDatabase)) {
            if (key.includes(normalizedPhone) || normalizedPhone.includes(key.slice(-10))) {
                return res.json({
                    phone: normalizedPhone,
                    ...value,
                    success: true
                });
            }
        }

        // If not found, generate mock data based on country code
        const mockData = generateMockData(normalizedPhone);
        if (mockData) {
            return res.json(mockData);
        }

        res.status(404).json({ 
            error: 'Phone number not found in database',
            tip: 'Try numbers like: +919876543210 or +11234567890'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Generate mock data based on country code
function generateMockData(phone) {
    const countryPrefixes = {
        '+91': { country: 'India', timezones: ['IST (UTC+5:30)'] },
        '+1': { country: 'United States', timezones: ['EST (UTC-5)', 'CST (UTC-6)', 'PST (UTC-8)'] },
        '+44': { country: 'United Kingdom', timezones: ['GMT (UTC+0)'] },
        '+33': { country: 'France', timezones: ['CET (UTC+1)'] },
        '+49': { country: 'Germany', timezones: ['CET (UTC+1)'] },
        '+39': { country: 'Italy', timezones: ['CET (UTC+1)'] },
        '+34': { country: 'Spain', timezones: ['CET (UTC+1)'] },
        '+81': { country: 'Japan', timezones: ['JST (UTC+9)'] },
        '+86': { country: 'China', timezones: ['CST (UTC+8)'] },
        '+61': { country: 'Australia', timezones: ['AEST (UTC+10)'] }
    };

    for (const [prefix, data] of Object.entries(countryPrefixes)) {
        if (phone.startsWith(prefix)) {
            // Generate random coordinates
            const lat = (Math.random() * 180 - 90);
            const lng = (Math.random() * 360 - 180);
            
            return {
                phone: phone,
                country: data.country,
                carrier: 'Local Carrier',
                type: 'Mobile',
                location: `${data.country} (Estimated)`,
                latitude: lat.toFixed(4),
                longitude: lng.toFixed(4),
                timezone: data.timezones[Math.floor(Math.random() * data.timezones.length)],
                success: true,
                note: 'Mock data - estimated location'
            };
        }
    }

    return null;
}

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Phone Tracker API is running' });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Phone Tracker API running on http://localhost:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log(`\n🧪 Test with sample phones: +919876543210, +11234567890, +441632960000`);
});
