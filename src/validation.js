/**
 * Request Validation for Homepage Builder Service
 */

const Joi = require('joi');

/**
 * Validation schema for homepage generation requests
 */
const generateRequestSchema = Joi.object({
    analysis_result: Joi.object({
        id: Joi.string().required(),
        url: Joi.string().uri().required(),
        analyzed_at: Joi.string().optional(),
        status: Joi.string().optional(),
        website_content: Joi.object().required(),
        business_info: Joi.object({
            name: Joi.string().required(),
            business_type: Joi.string().required(),
            industry: Joi.string().required(),
            description: Joi.string().allow(''),
            services: Joi.array().items(Joi.string()).default([]),
            location: Joi.string().allow(null),
            phone: Joi.string().allow(null),
            email: Joi.string().email().allow(null),
            hours: Joi.string().allow(null),
            confidence: Joi.number().min(0).max(1).required()
        }).unknown(true).required(),
        recommendations: Joi.array().items(Joi.object({
            id: Joi.string().required(),
            type: Joi.string().required(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            rationale: Joi.string().required(),
            priority: Joi.number().min(1).max(5).required(),
            estimated_impact: Joi.string().required(),
            estimated_effort: Joi.string().valid('low', 'medium', 'high').required(),
            estimated_hours: Joi.number().optional(),
            estimated_cost: Joi.number().optional(),
            example_urls: Joi.array().optional()
        }).unknown(true)).default([]),
        issues: Joi.array().default([]),
        seo_analysis: Joi.object().allow(null),
        performance_metrics: Joi.object().allow(null),
        confidence_score: Joi.number().min(0).max(1).required(),
        processing_time: Joi.number().optional(),
        ai_model_used: Joi.string().optional()
    }).unknown(true).required(),
    
    business_name: Joi.string().min(1).max(100).required(),
    style_preference: Joi.string().valid('modern', 'classic', 'minimal', 'bold', 'professional').default('modern'),
    include_booking: Joi.boolean().default(false),
    color_scheme: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(null).optional(),
    additional_features: Joi.array().items(
        Joi.string().valid('contact_form', 'testimonials', 'gallery', 'blog', 'social_media')
    ).default([])
});

/**
 * Validation schema for preview requests
 */
const previewRequestSchema = Joi.object({
    homepage_id: Joi.string().required(),
    device_type: Joi.string().valid('desktop', 'tablet', 'mobile').default('desktop')
});

/**
 * Validate homepage generation request
 */
function validateGenerateRequest(data) {
    return generateRequestSchema.validate(data, { 
        abortEarly: false,
        allowUnknown: false 
    });
}

/**
 * Validate preview request
 */
function validatePreviewRequest(data) {
    return previewRequestSchema.validate(data, { 
        abortEarly: false,
        allowUnknown: false 
    });
}

/**
 * Sanitize business name for safe use in code generation
 */
function sanitizeBusinessName(name) {
    if (!name || typeof name !== 'string') {
        return 'Business';
    }
    
    // Remove potentially harmful characters and limit length
    return name
        .replace(/[<>'"&]/g, '') // Remove HTML/JS injection chars
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim()
        .substring(0, 100);       // Limit length
}

/**
 * Validate color scheme format
 */
function validateColorScheme(colorScheme) {
    if (!colorScheme) return null;
    
    // Support hex colors, rgb, hsl, or named schemes
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const namedSchemes = ['blue', 'green', 'red', 'purple', 'orange', 'teal', 'indigo'];
    
    if (hexPattern.test(colorScheme) || rgbPattern.test(colorScheme)) {
        return colorScheme;
    }
    
    if (namedSchemes.includes(colorScheme.toLowerCase())) {
        return colorScheme.toLowerCase();
    }
    
    return null; // Invalid color scheme
}

/**
 * Validate analysis result structure
 */
function validateAnalysisResult(analysisResult) {
    if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('Analysis result is required and must be an object');
    }
    
    if (!analysisResult.business_info) {
        throw new Error('Analysis result must include business_info');
    }
    
    if (!analysisResult.website_content) {
        throw new Error('Analysis result must include website_content');
    }
    
    if (!analysisResult.business_info.name) {
        throw new Error('Business info must include a name');
    }
    
    return true;
}

/**
 * Extract safe data from analysis result for code generation
 */
function extractSafeAnalysisData(analysisResult) {
    const businessInfo = analysisResult.business_info || {};
    const websiteContent = analysisResult.website_content || {};
    const recommendations = analysisResult.recommendations || [];
    
    return {
        businessName: sanitizeBusinessName(businessInfo.name),
        businessType: businessInfo.business_type || 'other',
        industry: businessInfo.industry || 'other',
        description: (businessInfo.description || '').substring(0, 500),
        services: (businessInfo.services || []).slice(0, 10),
        location: businessInfo.location || '',
        phone: businessInfo.phone || '',
        email: businessInfo.email || '',
        originalTitle: (websiteContent.title || '').substring(0, 100),
        topRecommendations: recommendations.slice(0, 5),
        confidence: businessInfo.confidence || 0.5
    };
}

module.exports = {
    validateGenerateRequest,
    validatePreviewRequest,
    sanitizeBusinessName,
    validateColorScheme,
    validateAnalysisResult,
    extractSafeAnalysisData
};