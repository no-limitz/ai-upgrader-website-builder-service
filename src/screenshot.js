/**
 * Screenshot Service for Homepage Builder
 * Generates screenshots of HTML content using Puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ScreenshotService {
    constructor() {
        this.browser = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the screenshot service with a browser instance
     */
    async initialize() {
        try {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-images',
                    '--disable-javascript',
                    '--disable-default-apps',
                    '--disable-sync'
                ],
                timeout: 60000, // 60 second timeout
                ignoreDefaultArgs: ['--disable-extensions'],
                defaultViewport: {
                    width: 1200,
                    height: 800
                }
            });
            this.isInitialized = true;
            console.log('📸 Screenshot service initialized');
        } catch (error) {
            console.error('Failed to initialize screenshot service:', error);
            console.error('Error details:', error.message);
            // Don't throw - allow service to start without screenshots
            this.isInitialized = false;
            console.log('⚠️ Screenshot service disabled - continuing without screenshots');
        }
    }

    /**
     * Generate a screenshot of HTML content
     * @param {string} htmlContent - The HTML content to screenshot
     * @param {string} cssContent - The CSS content to include
     * @param {Object} options - Screenshot options
     * @returns {Promise<Buffer>} Screenshot as buffer
     */
    async generateScreenshot(htmlContent, cssContent = '', options = {}) {
        if (!this.isInitialized || !this.browser) {
            throw new Error('Screenshot service not initialized');
        }

        const {
            width = 1200,
            height = 800,
            deviceScaleFactor = 1,
            fullPage = true,
            format = 'png',
            quality = 90
        } = options;

        let page = null;

        try {
            // Create a new page
            page = await this.browser.newPage();

            // Set viewport
            await page.setViewport({
                width,
                height,
                deviceScaleFactor
            });

            // Combine HTML and CSS into a complete document
            const completeHtml = this._createCompleteHtml(htmlContent, cssContent);

            // Set the HTML content
            await page.setContent(completeHtml, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000
            });

            // Wait for any dynamic content to load
            await page.waitForTimeout(1000);

            // Generate screenshot
            const screenshotOptions = {
                type: format,
                fullPage,
                ...(format === 'jpeg' && { quality })
            };

            const screenshot = await page.screenshot(screenshotOptions);

            return screenshot;

        } catch (error) {
            console.error('Failed to generate screenshot:', error);
            throw error;
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    /**
     * Generate a screenshot and save it to a file
     * @param {string} htmlContent - The HTML content to screenshot
     * @param {string} cssContent - The CSS content to include
     * @param {string} outputPath - Path to save the screenshot
     * @param {Object} options - Screenshot options
     * @returns {Promise<string>} Path to the saved screenshot
     */
    async generateScreenshotFile(htmlContent, cssContent = '', outputPath, options = {}) {
        const screenshot = await this.generateScreenshot(htmlContent, cssContent, options);
        
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Save screenshot to file
        await fs.writeFile(outputPath, screenshot);

        return outputPath;
    }

    /**
     * Generate a screenshot and return as base64 data URL
     * @param {string} htmlContent - The HTML content to screenshot
     * @param {string} cssContent - The CSS content to include
     * @param {Object} options - Screenshot options
     * @returns {Promise<string>} Base64 data URL
     */
    async generateScreenshotDataUrl(htmlContent, cssContent = '', options = {}) {
        const screenshot = await this.generateScreenshot(htmlContent, cssContent, options);
        const format = options.format || 'png';
        const base64 = screenshot.toString('base64');
        return `data:image/${format};base64,${base64}`;
    }

    /**
     * Create a complete HTML document with CSS
     * @param {string} htmlContent - The HTML content
     * @param {string} cssContent - The CSS content
     * @returns {string} Complete HTML document
     */
    _createCompleteHtml(htmlContent, cssContent) {
        // Check if htmlContent is already a complete HTML document
        if (htmlContent.includes('<!DOCTYPE html>') || htmlContent.includes('<html')) {
            // Insert CSS into existing document
            if (cssContent) {
                // Try to insert CSS in the head
                if (htmlContent.includes('</head>')) {
                    return htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
                } else {
                    // If no head tag, insert at the beginning
                    return htmlContent.replace('<html', `<html><head><style>${cssContent}</style></head><html`);
                }
            }
            return htmlContent;
        }

        // Create complete HTML document
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Homepage</title>
    ${cssContent ? `<style>${cssContent}</style>` : ''}
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>
    ${htmlContent}
</body>
</html>`;
    }

    /**
     * Generate multiple viewport screenshots (desktop, tablet, mobile)
     * @param {string} htmlContent - The HTML content to screenshot
     * @param {string} cssContent - The CSS content to include
     * @returns {Promise<Object>} Screenshots for different viewports
     */
    async generateResponsiveScreenshots(htmlContent, cssContent = '') {
        const viewports = {
            desktop: { width: 1200, height: 800, deviceScaleFactor: 1 },
            tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
            mobile: { width: 375, height: 667, deviceScaleFactor: 2 }
        };

        const screenshots = {};

        for (const [device, viewport] of Object.entries(viewports)) {
            try {
                screenshots[device] = await this.generateScreenshotDataUrl(
                    htmlContent, 
                    cssContent, 
                    { ...viewport, fullPage: false }
                );
            } catch (error) {
                console.error(`Failed to generate ${device} screenshot:`, error);
                screenshots[device] = null;
            }
        }

        return screenshots;
    }

    /**
     * Cleanup the screenshot service
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.isInitialized = false;
            console.log('📸 Screenshot service cleaned up');
        }
    }

    /**
     * Check if the service is ready
     */
    isReady() {
        return this.isInitialized && this.browser;
    }
}

module.exports = ScreenshotService;