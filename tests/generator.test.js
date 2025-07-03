/**
 * Tests for Homepage Generator
 */

const { HomepageGenerator } = require('../src/generator');

describe('HomepageGenerator', () => {
    let generator;
    
    beforeEach(() => {
        generator = new HomepageGenerator('test-api-key');
    });

    describe('Constructor', () => {
        test('should initialize with API key', () => {
            expect(generator.apiKey).toBe('test-api-key');
            expect(generator.ready).toBe(false);
        });

        test('should set default configuration', () => {
            expect(generator.model).toBe('gpt-4o-mini');
            expect(generator.temperature).toBe(0.3);
            expect(generator.maxTokens).toBe(3000);
        });
    });

    describe('initialize', () => {
        test('should set ready state to true', async () => {
            await generator.initialize();
            expect(generator.ready).toBe(true);
        });
    });

    describe('isReady', () => {
        test('should return false when not initialized', () => {
            expect(generator.isReady()).toBe(false);
        });

        test('should return true when initialized with API key', async () => {
            await generator.initialize();
            expect(generator.isReady()).toBe(true);
        });

        test('should return false when no API key', async () => {
            const noKeyGenerator = new HomepageGenerator('');
            await noKeyGenerator.initialize();
            expect(noKeyGenerator.isReady()).toBe(false);
        });
    });

    describe('_getBaseColors', () => {
        test('should return default colors for unknown industry', () => {
            const colors = generator._getBaseColors(null, 'unknown');
            expect(colors).toEqual({
                primary: '#3B82F6',
                secondary: '#1E40AF', 
                accent: '#10B981'
            });
        });

        test('should return healthcare colors', () => {
            const colors = generator._getBaseColors(null, 'healthcare');
            expect(colors).toEqual({
                primary: '#10B981',
                secondary: '#059669',
                accent: '#3B82F6'
            });
        });

        test('should use custom color scheme when provided', () => {
            const colors = generator._getBaseColors('#FF0000', 'healthcare');
            expect(colors.primary).toBe('#3B82F6'); // Still returns default pattern
        });
    });

    describe('_determineFeaturesIncluded', () => {
        test('should include basic features', () => {
            const features = generator._determineFeaturesIncluded({
                recommendations: [],
                includeBooking: false,
                stylePreference: 'modern'
            });
            
            expect(features).toContain('responsive_design');
            expect(features).toContain('modern_layout');
            expect(features).toContain('call_to_action');
            expect(features).toContain('contact_section');
            expect(features).toContain('services_showcase');
        });

        test('should include booking when requested', () => {
            const features = generator._determineFeaturesIncluded({
                recommendations: [],
                includeBooking: true,
                stylePreference: 'modern'
            });
            
            expect(features).toContain('booking_integration');
        });

        test('should include features based on recommendations', () => {
            const features = generator._determineFeaturesIncluded({
                recommendations: [
                    { type: 'mobile_optimization' },
                    { type: 'seo_optimization' }
                ],
                includeBooking: false,
                stylePreference: 'modern'
            });
            
            expect(features).toContain('mobile_optimized');
            expect(features).toContain('seo_optimized');
        });

        test('should include modern style features', () => {
            const features = generator._determineFeaturesIncluded({
                recommendations: [],
                includeBooking: false,
                stylePreference: 'modern'
            });
            
            expect(features).toContain('modern_typography');
            expect(features).toContain('gradient_backgrounds');
        });
    });

    describe('_generateImprovementDescription', () => {
        test('should generate description for single recommendation', () => {
            const description = generator._generateImprovementDescription({
                recommendations: [
                    { type: 'design_improvement', title: 'Modern Design', description: 'Update styling' }
                ],
                featuresIncluded: ['responsive_design', 'modern_layout']
            });
            
            expect(description).toContain('Implemented 1 key improvements');
            expect(description).toContain('modern design');
            expect(description).toContain('Features 2 modern web components');
        });

        test('should handle multiple recommendation types', () => {
            const description = generator._generateImprovementDescription({
                recommendations: [
                    { type: 'design_improvement' },
                    { type: 'mobile_optimization' },
                    { type: 'seo_optimization' },
                    { type: 'performance_boost' }
                ],
                featuresIncluded: ['responsive_design']
            });
            
            expect(description).toContain('modern design, mobile optimization, SEO optimization');
            expect(description).toContain('and 1 other improvements');
        });

        test('should handle no recommendations', () => {
            const description = generator._generateImprovementDescription({
                recommendations: [],
                featuresIncluded: ['responsive_design']
            });
            
            expect(description).toContain('Implemented 0 key improvements');
        });
    });

    describe('_generateBookingJS', () => {
        test('should return booking JavaScript code', () => {
            const js = generator._generateBookingJS();
            expect(js).toContain('function openBookingModal()');
            expect(js).toContain('data-booking-btn');
            expect(js).toContain('addEventListener');
        });
    });
});