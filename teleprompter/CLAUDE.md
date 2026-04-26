# Teleprompter Web Application

A feature-rich web-based teleprompter application with camera integration, recording capabilities, and cloud storage support.

## Overview

This is a standalone teleprompter app that allows users to:
- Display scrolling text for reading on camera
- Control playback speed and text size
- Flip display horizontally/vertically for mirror setups
- Integrate with webcam for recording
- Save and load scripts from cloud storage or local files
- Customize appearance (colors, background)

## File Structure

- **index.html** - Main application structure and UI controls
- **script.js** - Application logic and functionality
- **styles.css** - Styling and layout
- **google-apps-script.js** - Google Apps Script for cloud storage backend
- **CLOUD_SETUP.md** - Instructions for setting up cloud storage
- **sessions/** - Directory for local session storage
- **assets/** - Application assets (images, icons, etc.)

## Key Features

### Playback Controls
- Play/Pause toggle
- Adjustable speed (1-50)
- Adjustable text size (30-180)

### Display Options
- Horizontal flip (for teleprompter mirrors)
- Vertical flip
- Custom background and text colors
- Editable content area with spellcheck

### Camera & Recording
- Toggle camera overlay
- Video recording capability (when camera is active)
- Recording time indicator

### Script Management
- **Cloud Storage**: Save/load scripts via Google Apps Script backend
- **Local Files**: Import/export session files (.json format)
- Named script storage and retrieval

### Additional Features
- Start delay option (0, 3, or 5 seconds)
- Countdown overlay before playback
- Settings panel for all configurations

## Setup

### Basic Usage
1. Open index.html in a web browser
2. Paste or type your script in the content area
3. Use the control panel to adjust settings
4. Press play to start scrolling

### Cloud Storage Setup
See [CLOUD_SETUP.md](CLOUD_SETUP.md) for detailed instructions on configuring Google Apps Script backend for cloud storage functionality.

## Technical Notes

- Pure vanilla JavaScript (no frameworks)
- Uses browser APIs: MediaStream, MediaRecorder, localStorage
- Responsive design for various screen sizes
- SVG icons for all controls

## Development

When modifying this app:
- All functionality is self-contained within this directory
- No external dependencies or build process
- Test camera/recording features in HTTPS context (required by browser APIs)
