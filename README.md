# Network Request Analyzer Chrome Extension

This Chrome extension analyzes the timing of all network requests on the current page. It provides detailed information about each request, including:

- URL
- Request type (document, stylesheet, script, image, etc.)
- HTTP method (GET, POST, etc.)
- Status code
- Total request time
- Time to First Byte (TTFB)
- And more...

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The extension should now be installed and visible in your Chrome toolbar

## Usage

1. Browse to any website
2. Click the Network Request Analyzer icon in your Chrome toolbar
3. View the timing information for all network requests made by the page
4. Use the search and filter options to find specific requests
5. Click on any request to view detailed information
6. Use the "Export CSV" button to download the data for further analysis

## Features

- Real-time monitoring of all network requests
- Filtering by request type and status
- Search functionality to find specific URLs
- Color-coding based on request duration (fast, medium, slow)
- Detailed view of individual requests
- CSV export for data analysis

## Note

You'll need to add your own icon images in the `images` directory:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

## License

MIT