/**
 * Homepage Generator - Core Generation Logic
 * 
 * This module handles:
 * 1. AI-powered homepage code generation
 * 2. Template-based component creation
 * 3. Style and feature customization
 */

const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

class HomepageGenerator {
    constructor(apiKey, baseUrl = null) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl || process.env.OPENAI_BASE_URL;
        
        // Initialize OpenAI client
        const clientConfig = { apiKey };
        if (this.baseUrl) {
            clientConfig.baseURL = this.baseUrl;
            console.log(`Using custom OpenAI base URL: ${this.baseUrl}`);
        }
        
        this.openai = new OpenAI(clientConfig);
        this.ready = false;
        
        // Configuration
        this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.3');
        this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '3000');
        
        console.log(`Generator configured with model: ${this.model}`);
    }
    
    async initialize() {
        this.ready = true;
        console.log('Homepage generator initialized');
    }
    
    isReady() {
        return this.ready && !!this.apiKey;
    }
    
    /**
     * Generate a complete homepage based on analysis results
     */
    async generateHomepage({
        analysisResult,
        businessName,
        stylePreference = 'modern',
        includeBooking = false,
        colorScheme = null
    }) {
        const generationId = uuidv4();
        const startTime = Date.now();
        
        try {
            console.log(`Generating homepage ${generationId} for ${businessName}`);
            
            // Extract relevant information from analysis
            const businessInfo = analysisResult.business_info;
            const recommendations = analysisResult.recommendations || [];
            const websiteContent = analysisResult.website_content;
            
            // Generate the homepage code
            const homepageCode = await this._generateHomepageCode({
                businessName,
                businessInfo,
                recommendations,
                websiteContent,
                stylePreference,
                includeBooking,
                colorScheme
            });
            
            // Generate additional CSS if needed
            const cssCode = await this._generateCustomCSS({
                businessInfo,
                stylePreference,
                colorScheme
            });
            
            // Determine features included
            const featuresIncluded = this._determineFeaturesIncluded({
                recommendations,
                includeBooking,
                stylePreference
            });
            
            // Generate improvement description
            const estimatedImprovement = this._generateImprovementDescription({
                recommendations,
                featuresIncluded
            });
            
            const generationTime = Date.now() - startTime;
            
            return {
                id: generationId,
                business_name: businessName,
                generated_at: new Date().toISOString(),
                html_code: homepageCode,
                css_code: cssCode,
                js_code: includeBooking ? this._generateBookingJS() : null,
                style_applied: stylePreference,
                features_included: featuresIncluded,
                estimated_improvement: estimatedImprovement,
                generation_time: generationTime
            };
            
        } catch (error) {
            console.error(`Homepage generation failed for ${generationId}:`, error);
            throw new Error(`Homepage generation failed: ${error.message}`);
        }
    }
    
    /**
     * Generate the main homepage HTML code using AI
     */
    async _generateHomepageCode({
        businessName,
        businessInfo,
        recommendations,
        websiteContent,
        stylePreference,
        includeBooking,
        colorScheme
    }) {
        const prompt = this._createHomepagePrompt({
            businessName,
            businessInfo,
            recommendations,
            websiteContent,
            stylePreference,
            includeBooking,
            colorScheme
        });
        
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert web developer specializing in creating modern, high-converting business websites. Generate clean, professional HTML code using Tailwind CSS.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.temperature,
                max_tokens: this.maxTokens
            });
            
            return response.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('OpenAI API error:', error);
            console.error(`Model: ${this.model}, Base URL: ${this.baseUrl}`);
            throw new Error(`Failed to generate homepage code: ${error.message}`);
        }
    }
    
    /**
     * Create a comprehensive prompt for homepage generation
     */
    _createHomepagePrompt({
        businessName,
        businessInfo,
        recommendations,
        websiteContent,
        stylePreference,
        includeBooking,
        colorScheme
    }) {
        const businessType = businessInfo.business_type;
        const industry = businessInfo.industry;
        const services = businessInfo.services || [];
        const description = businessInfo.description || '';
        const location = businessInfo.location || '';
        const phone = businessInfo.phone || '';
        
        const topRecommendations = recommendations.slice(0, 3).map(rec => 
            `- ${rec.title}: ${rec.description}`
        ).join('\n');
        
        const colorSchemeText = colorScheme ? `Use this color scheme: ${colorScheme}` : '';
        const bookingText = includeBooking ? 'Include a prominent "Book Appointment" or "Schedule Service" button with data-booking-btn attribute.' : '';
        
        // Get industry-specific template guidance
        const templateGuidance = this._getIndustryTemplate(industry, businessType);
        
        return `
Create a modern, professional homepage for this business:

Business Information:
- Name: ${businessName}
- Type: ${businessType}
- Industry: ${industry}
- Description: ${description}
- Location: ${location}
- Phone: ${phone}
- Services: ${services.join(', ')}

Style Requirements:
- Style: ${stylePreference}
- ${colorSchemeText}
- ${bookingText}

Key Improvements to Implement:
${topRecommendations}

Industry-Specific Requirements:
${templateGuidance}

Requirements:
1. Create a complete HTML page with Tailwind CSS
2. Include these sections:
   - Header with navigation and contact info
   - Hero section with compelling headline and value proposition
   - Services/features section with icons or images
   - About/trust section with credibility indicators
   - Contact section with form and map placeholder
   - Footer with business details
3. Make it mobile-responsive with proper breakpoints
4. Use modern design principles and accessibility
5. Include clear call-to-action buttons throughout
6. Optimize for ${businessType} businesses
7. Include contact information: ${phone}
8. Add proper semantic HTML structure
9. Include meta tags for SEO
10. Use appropriate color psychology for ${industry}

Generate only the complete HTML code with embedded Tailwind CSS classes. No explanations.
The code should be production-ready, visually appealing, and convert visitors to customers.
`;
    }
    
    /**
     * Get industry-specific template guidance
     */
    _getIndustryTemplate(industry, businessType) {
        const templates = {
            'home_services': `
- Emphasize trust and reliability with reviews/testimonials
- Include service area coverage map
- Feature emergency contact prominently
- Add before/after photos or service galleries
- Include licensing/insurance information`,
            
            'healthcare': `
- Emphasize professionalism and trust
- Include practitioner credentials and certifications
- Feature patient testimonials (anonymized)
- Add online appointment booking
- Include office hours and location prominently`,
            
            'food_and_beverage': `
- Showcase menu highlights with appetizing descriptions
- Include high-quality food photography placeholders
- Feature customer reviews and ratings
- Add online ordering or reservation system
- Include location, hours, and delivery info`,
            
            'automotive': `
- Emphasize expertise and certifications
- Include service guarantees and warranties
- Feature customer testimonials
- Add service appointment booking
- Include accepted insurance and payment methods`,
            
            'beauty_and_wellness': `
- Showcase services with before/after examples
- Include practitioner credentials and specialties
- Feature client transformations and testimonials
- Add online booking system
- Include pricing and package information`,
            
            'professional_services': `
- Emphasize expertise and credentials
- Include case studies or success stories
- Feature client testimonials
- Add consultation booking
- Include clear service descriptions and pricing`,
            
            'retail': `
- Showcase product highlights with images
- Include customer reviews and ratings
- Feature special offers and promotions
- Add online shopping or catalog
- Include store location and hours`,
            
            'default': `
- Focus on clear value proposition
- Include customer testimonials
- Feature key services prominently
- Add clear contact methods
- Include business credentials and trust signals`
        };
        
        return templates[industry] || templates.default;
    }
    
    /**
     * Generate custom CSS for additional styling
     */
    async _generateCustomCSS({ businessInfo, stylePreference, colorScheme }) {
        // For POC, return basic custom CSS
        // In full implementation, this could be AI-generated
        
        const baseColors = this._getBaseColors(colorScheme, businessInfo.industry);
        
        return `
/* Custom styles for ${businessInfo.name} */
:root {
    --primary-color: ${baseColors.primary};
    --secondary-color: ${baseColors.secondary};
    --accent-color: ${baseColors.accent};
}

.custom-hero-bg {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
}

.custom-card-hover {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.custom-card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.custom-btn-primary {
    background-color: var(--accent-color);
    transition: all 0.3s ease;
}

.custom-btn-primary:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .custom-hero-text {
        font-size: 2rem;
    }
}
`.trim();
    }
    
    /**
     * Get base colors based on industry and preferences
     */
    _getBaseColors(colorScheme, industry) {
        if (colorScheme) {
            // Parse color scheme if provided
            return {
                primary: '#3B82F6',
                secondary: '#1E40AF',
                accent: '#EF4444'
            };
        }
        
        // Industry-specific color schemes
        const industryColors = {
            'healthcare': { primary: '#10B981', secondary: '#059669', accent: '#3B82F6' },
            'food_and_beverage': { primary: '#F59E0B', secondary: '#D97706', accent: '#EF4444' },
            'home_services': { primary: '#3B82F6', secondary: '#1E40AF', accent: '#F59E0B' },
            'automotive': { primary: '#DC2626', secondary: '#B91C1C', accent: '#374151' },
            'beauty_and_wellness': { primary: '#EC4899', secondary: '#DB2777', accent: '#8B5CF6' },
            'professional_services': { primary: '#1F2937', secondary: '#111827', accent: '#3B82F6' },
            'default': { primary: '#3B82F6', secondary: '#1E40AF', accent: '#10B981' }
        };
        
        return industryColors[industry] || industryColors.default;
    }
    
    /**
     * Generate booking functionality JavaScript
     */
    _generateBookingJS() {
        return `
// Simple booking functionality
function openBookingModal() {
    // In a real implementation, this would open a booking widget
    alert('Booking functionality would be integrated here. This could connect to Calendly, Acuity, or a custom booking system.');
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const bookingButtons = document.querySelectorAll('[data-booking-btn]');
    bookingButtons.forEach(button => {
        button.addEventListener('click', openBookingModal);
    });
});
`.trim();
    }
    
    /**
     * Determine which features are included in the generated homepage
     */
    _determineFeaturesIncluded({ recommendations, includeBooking, stylePreference }) {
        const features = ['responsive_design', 'modern_layout'];
        
        // Add features based on style
        if (stylePreference === 'modern') {
            features.push('modern_typography', 'gradient_backgrounds');
        }
        
        // Add features based on recommendations
        const recTypes = recommendations.map(rec => rec.type);
        if (recTypes.includes('mobile_optimization')) {
            features.push('mobile_optimized');
        }
        if (recTypes.includes('seo_optimization')) {
            features.push('seo_optimized');
        }
        if (recTypes.includes('conversion_optimization')) {
            features.push('conversion_optimized');
        }
        
        // Add booking if requested
        if (includeBooking) {
            features.push('booking_integration');
        }
        
        // Standard features
        features.push('call_to_action', 'contact_section', 'services_showcase');
        
        return features;
    }
    
    /**
     * Generate improvement description
     */
    _generateImprovementDescription({ recommendations, featuresIncluded }) {
        const numRecommendations = recommendations.length;
        const numFeatures = featuresIncluded.length;
        
        let description = `Implemented ${numRecommendations} key improvements including `;
        
        const improvementTypes = recommendations.map(rec => {
            switch (rec.type) {
                case 'design_improvement': return 'modern design';
                case 'mobile_optimization': return 'mobile optimization';
                case 'seo_optimization': return 'SEO optimization';
                case 'conversion_optimization': return 'conversion optimization';
                case 'performance_boost': return 'performance improvements';
                default: return 'website enhancement';
            }
        });
        
        const uniqueTypes = [...new Set(improvementTypes)];
        description += uniqueTypes.slice(0, 3).join(', ');
        
        if (uniqueTypes.length > 3) {
            description += `, and ${uniqueTypes.length - 3} other improvements`;
        }
        
        description += `. Features ${numFeatures} modern web components for enhanced user experience and business growth.`;
        
        return description;
    }
}

module.exports = {
    HomepageGenerator
};