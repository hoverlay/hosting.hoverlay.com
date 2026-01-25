# Teleprompter Cloud Storage Setup

This guide will help you set up Google Sheets as a cloud storage backend for your teleprompter scripts, allowing you to develop scripts on your desktop and easily access them on your phone.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it something like "Teleprompter Scripts"

## Step 2: Set Up Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code in the editor
3. Copy all the code from `google-apps-script.js` in this directory
4. Paste it into the Apps Script editor
5. Click the **Save** icon (💾) and name your project (e.g., "Teleprompter API")

## Step 3: Initialize the Sheet

1. In the Apps Script editor, select the function `initializeSheet` from the dropdown at the top
2. Click the **Run** button (▶️)
3. You'll be prompted to authorize the script:
   - Click "Review Permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [Your Project Name] (unsafe)"
   - Click "Allow"
4. Go back to your Google Sheet - you should now see headers: "Script Name", "Last Modified", "Session Data"

## Step 4: Deploy as Web App

1. In the Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Teleprompter API v1" (or any description)
   - **Execute as**: "Me"
   - **Who has access**: "Anyone" (this is safe - only you can edit the sheet)
4. Click **Deploy**
5. **Important**: Copy the **Web app URL** that appears - you'll need this!
   - It will look like: `https://script.google.com/macros/s/XXXXX/exec`

## Step 5: Configure Your Teleprompter App

1. Open `script.js` in your teleprompter directory
2. Find this line near the top:
   ```javascript
   const CLOUD_API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` with your Web app URL (keep the quotes):
   ```javascript
   const CLOUD_API_URL = 'https://script.google.com/macros/s/XXXXX/exec';
   ```
4. Save the file

## Step 6: Test It Out!

### On Desktop:
1. Open your teleprompter app in a browser
2. Click the Settings gear icon
3. In the "Cloud Storage" section:
   - Enter a script name (e.g., "My First Script")
   - Click "Save to Cloud"
4. Check your Google Sheet - you should see your script appear!

### On Phone:
1. Open your teleprompter app URL on your phone
2. Click the Settings gear icon
3. Select your script from the dropdown
4. Click "Load from Cloud"
5. Your script should load with all settings!

## How to Use

### Developing on Desktop:
1. Write/edit your script in the teleprompter
2. Adjust settings (font size, speed, colors)
3. Enter a name and click "Save to Cloud"

### Using on Phone:
1. Open the teleprompter app
2. Click Settings
3. Select your script from the dropdown
4. Click "Load from Cloud"
5. Start presenting!

## Tips

- **Script names**: Use descriptive names like "presentation-jan-2026" or "speech-v2"
- **Updating scripts**: Saving with the same name will overwrite the previous version
- **Multiple scripts**: You can save as many scripts as you want
- **Offline**: The teleprompter works offline, but you need internet to save/load from cloud

## Troubleshooting

**"Please configure your Google Apps Script URL first"**
- You haven't updated the `CLOUD_API_URL` in `script.js`

**Scripts not appearing in dropdown**
- Check that you deployed the Apps Script as a web app
- Make sure you selected "Anyone" for "Who has access"
- Try refreshing the page

**CORS errors**
- Make sure you deployed with "Execute as: Me" and "Who has access: Anyone"
- Redeploy the web app if you made changes to the script

**Can't see my script in the Google Sheet**
- The data is stored in JSON format in the third column
- You can view the raw data, but don't edit it directly - use the teleprompter interface

## Privacy & Security

- Your scripts are stored in YOUR Google Sheet under YOUR Google account
- Only you can see and edit the data
- The "Anyone" access setting only allows the API to work - it doesn't expose your data
- No one else can access your scripts unless you share your Google Sheet with them
