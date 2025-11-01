/**
 * AI-Powered Google Drive Organizer Agent
 * * This script uses the Google Drive API and the Gemini API to automatically
 * analyze, categorize, rename, and move files from a source folder
 * to a structured set of destination folders.
 *
 * * HOW TO USE:
 * 1. Select the `runFileOrganizer` function from the dropdown menu at the top.
 * 2. Click the "Run" button.
 * 3. The script has a 6-minute time limit. You may need to click "Run"
 * multiple times to process all your files. It will pick up where it left off
 * by only processing the files remaining in the source folder.
 */

// --- CONFIGURATION ---
const GEMINI_API_KEY = 'AIzaSyDENK90fgc76gSaAToVVe2MmFoE4hHx8eQ'; // <-- YOUR API KEY
const SOURCE_FOLDER_ID = '1kbzD8TLDhsrOl-KV3zgUaTAHFB4c0J_9'; // <-- Your "Organized Folder" ID
const DESTINATION_PARENT_FOLDER_ID = '1kbzD8TLDhsrOl-KV3zgUaTAHFB4c0J_9'; // <-- Your "Organized Folder" ID

// Prompt for the AI to generate a filename AND category
const AI_PROMPT = `
Analyze the following content (from a doc or text).
Your task is to:
1.  Propose a concise, descriptive filename (5-10 words, no extension, use spaces).
2.  Propose a single, concise category name for a folder (e.g., "Resumes", "Recipes", "Projects", "Invoices").

Respond with ONLY text in the following two-line format:
FILENAME: Your Suggested Filename
CATEGORY: Your Suggested Category

Example response:
FILENAME: Quarterly Business Report Q4 2024
CATEGORY: Reports
`;
// --- END CONFIGURATION ---

// --- GLOBAL VARIABLES FOR MODELS ---
// This will be set by the getWorkingModelName() function
let TEXT_MODEL_NAME = '';


/**
 * Main function to run the organizer process.
 * This is the function you select and "Run" in the Apps Script editor.
 */
function runFileOrganizer() {
  try {
    // --- Step 1: Find a working AI model ---
    Logger.log('Finding available AI models...');
    const modelFound = getWorkingModelName();
    if (!modelFound) {
      Logger.log('FATAL ERROR: Could not find any working AI models for your project.');
      return;
    }
    Logger.log(`Using Text Model: ${TEXT_MODEL_NAME}`);
    // --- END STEP 1 ---

    Logger.log('Checking for files in source folder...');
    const files = listFilesInFolder(SOURCE_FOLDER_ID);
    if (!files || files.length === 0) {
      Logger.log('No files found in the source folder.');
      return;
    }

    Logger.log(`Found ${files.length} files in source folder. Starting analysis...`);

    // 3. Process each file
    files.forEach(file => {
      const fileName = file.getName();
      const fileId = file.getId();
      try {
        Logger.log(`--- Processing file: ${fileName} (ID: ${fileId}) ---`);
        
        const aiResponse = getAiAnalysis(file);

        if (aiResponse && aiResponse.filename && aiResponse.category) {
          const categoryName = aiResponse.category.trim();
          if (categoryName.length === 0) {
              Logger.log(`Skipping "${fileName}": AI returned an empty category.`);
              return;
          }
          
          const destinationFolder = getOrCreateFolder(DESTINATION_PARENT_FOLDER_ID, categoryName);
          
          // Get original extension, but handle .pdf and .docx correctly
          const originalMimeType = file.getMimeType();
          const extension = getFileExtension(fileName, originalMimeType);
          
          const newNameWithExtension = `${aiResponse.filename.trim()}${extension}`;
          
          Logger.log(`AI suggested name: "${newNameWithExtension}"`);
          Logger.log(`AI suggested category: "${categoryName}" (Folder ID: ${destinationFolder.getId()})`);
          
          moveAndRenameFile(file, destinationFolder, newNameWithExtension);
          Logger.log(`SUCCESS: Moved "${fileName}" to "${categoryName}" as "${newNameWithExtension}"`);

        } else {
          Logger.log(`Skipping "${fileName}": Could not get valid AI suggestion.`);
        }
      } catch (err) {
        Logger.log(`ERROR processing file ${fileName}: ${err.message} (Line: ${err.lineNumber})`);
      }
      // Increased delay from 2s to 5s to avoid "User rate limit exceeded" on file conversions.
      Utilities.sleep(5000); // 5-second delay
    });

    Logger.log('--- Organizing process complete. ---');

  } catch (e) {
    Logger.log(`FATAL ERROR: ${e.message} (Line: ${e.lineNumber})`);
    Logger.log(`Stack: ${e.stack}`);
  }
}

/**
 * Calls the `listModels` API to find the first available text model.
 * @return {boolean} True if a model was found, false otherwise.
 */
function getWorkingModelName() {
  // If we already found the model, don't search again.
  if (TEXT_MODEL_NAME) return true; 

  const url = `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`;
  const options = {
    method: 'get',
    contentType: 'application/json',
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const data = JSON.parse(responseText);

    if (data.models && data.models.length > 0) {
       // Find the first available gemini model that can handle text
       const textModel = data.models.find(model =>
          model.supportedGenerationMethods.includes('generateContent') &&
          model.name.includes('gemini') &&
          !model.name.includes('embed')
       );
       
       if (textModel) {
          TEXT_MODEL_NAME = textModel.name;
          return true;
       }
    }
    // If we are here, no suitable model was found.
    Logger.log('Could not find a suitable text model in the list.');
    if (data.models) {
      Logger.log(`Available models: ${JSON.stringify(data.models.map(m => m.name))}`);
    }
    return false;

  } catch (e) {
    Logger.log(`Failed to call listModels API: ${e.message}`);
    return false;
  }
}


/**
 * Helper function to parse the AI's text response.
 * @param {string} responseText The raw text from the AI.
 * @return {object|null} A parsed object {filename, category} or null.
 */
function parseAiResponse(responseText) {
  try {
    const filenameMatch = responseText.match(/FILENAME:\s*(.*)/i);
    const categoryMatch = responseText.match(/CATEGORY:\s*(.*)/i);

    if (filenameMatch && categoryMatch && filenameMatch[1] && categoryMatch[1]) {
      return {
        filename: filenameMatch[1].trim(),
        category: categoryMatch[1].trim()
      };
    } else {
      Logger.log(`Could not parse AI response: ${responseText}`);
      return null;
    }
  } catch (e) {
    Logger.log(`Error parsing AI response: ${e.message}`);
    return null;
  }
}

/**
 * Finds or creates a single category subfolder using DriveApp.
 * @param {string} parentFolderId The ID of the main "Organized Files" folder.
 * @param {string} categoryName The name of the folder to find or create.
 * @return {DriveApp.Folder} The new or existing folder object.
 */
function getOrCreateFolder(parentFolderId, categoryName) {
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  
  // Check if folder already exists
  const folders = parentFolder.getFoldersByName(categoryName);
  
  if (folders.hasNext()) {
    // Folder already exists
    return folders.next();
  } else {
    // Folder does not exist, create it
    Logger.log(`Creating folder: "${categoryName}"...`);
    const newFolder = parentFolder.createFolder(categoryName);
    return newFolder;
  }
}

/**
 * Lists all files in the specified Google Drive folder using DriveApp.
 * @param {string} folderId The ID of the Google Drive folder.
 * @return {Array<DriveApp.File>} An array of file objects.
 */
function listFilesInFolder(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const filesIterator = folder.getFiles();
  const allFiles = [];
  
  while (filesIterator.hasNext()) {
    allFiles.push(filesIterator.next());
  }
  
  return allFiles;
}

/**
 * Router function to handle different file types.
 * @param {DriveApp.File} file The Drive file object.
 * @return {object|null} The parsed AI JSON response, or null.
 */
function getAiAnalysis(file) {
  const mimeType = file.getMimeType();

  if (mimeType === 'text/plain') {
    return getAiAnalysisForTextFile(file);
  } else if (mimeType === 'application/vnd.google-apps.document') {
    return getAiAnalysisForGoogleDoc(file);
  } else if (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // All conversion-types are routed here
    return getAiAnalysisViaConversion(file);
  } else {
    Logger.log(`Unsupported file type: ${mimeType}. Skipping.`);
    return null;
  }
}

/**
 * Gets AI analysis for a plain TEXT file.
 * @param {DriveApp.File} file The Drive file object.
 * @return {object|null} The parsed AI JSON response.
 */
function getAiAnalysisForTextFile(file) {
  const fileBlob = file.getBlob();
  let textContent = '';
  textContent = fileBlob.getDataAsString();

  // Truncate text to avoid sending too much data
  const truncatedText = textContent.substring(0, 15000);
  return callGeminiText(truncatedText);
}

/**
 * Gets AI analysis for a GOOGLE DOC file.
 * @param {DriveApp.File} file The Drive file object.
 * @return {object|null} The parsed AI JSON response.
 */
function getAiAnalysisForGoogleDoc(file) {
  try {
    const doc = DocumentApp.openById(file.getId());
    const textContent = doc.getBody().getText();
    const truncatedText = textContent.substring(0, 30000); // Larger limit for text
    return callGeminiText(truncatedText);
  } catch (e) {
    Logger.log(`Could not open Google Doc (permissions?): ${e.message}`);
    return null;
  }
}

/**
 * Gets AI analysis for PDF, WORD, or IMAGE files by converting them to a temp Google Doc.
 * @param {DriveApp.File} file The Drive file object.
 * @return {object|null} The parsed AI JSON response.
 */
function getAiAnalysisViaConversion(file) {
  const fileId = file.getId();
  const fileName = file.getName();
  Logger.log(`Converting "${fileName}" to Google Doc for OCR...`);

  try {
    // 1. Define the new (temp) Google Doc resource
    const tempDocResource = {
      name: `[TEMP OCR] ${fileName}`,
      mimeType: 'application/vnd.google-apps.document'
    };
    
    // 2. Call Drive.Files.copy() to create the new doc
    // This requires the "Drive API" advanced service to be enabled!
    const tempDoc = Drive.Files.copy(tempDocResource, fileId);
    
    // 3. Create a DriveApp File object from the new ID
    const tempDriveAppFile = DriveApp.getFileById(tempDoc.id);

    // 4. Analyze the new temp doc
    const aiResponse = getAiAnalysisForGoogleDoc(tempDriveAppFile);
    
    // 5. Delete the temp file
    tempDriveAppFile.setTrashed(true);
    Logger.log(`Removed temp file: ${tempDoc.name}`);

    return aiResponse;

  } catch (e) {
    Logger.log(`Could not convert file: ${e.message}. Make sure the "Drive API" advanced service is enabled.`);
    return null;
  }
}

/**
 * Calls the Gemini Text API for text analysis.
 */
function callGeminiText(textContent) {
  const url = `https://generativelanguage.googleapis.com/v1/${TEXT_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [
      {
        parts: [
          { text: AI_PROMPT },
          { text: "\n\n--- FILE CONTENT START --- \n" + textContent + "\n--- FILE CONTENT END ---" }
        ]
      }
    ],
    generationConfig: {
      "temperature": 0.2,
      "maxOutputTokens": 1024 // Increased token limit
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const data = JSON.parse(responseText);

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0 && data.candidates[0].content.parts[0].text) {
      const plainText = data.candidates[0].content.parts[0].text;
      return parseAiResponse(plainText);
    } else {
      Logger.log(`Gemini Text API Error: ${responseText}`);
      return null;
    }
  } catch (e) {
    Logger.log(`Failed to call or parse Gemini Text response: ${e.message}`);
    return null;
  }
}

/**
 * Moves and renames a file in Google Drive using DriveApp.
 * @param {DriveApp.File} file The file object to move/rename.
 * @param {DriveApp.Folder} destinationFolder The folder object to move to.
 * @param {string} newName The new name for the file.
 */
function moveAndRenameFile(file, destinationFolder, newName) {
  // DriveApp moves the file and renames in two steps
  
  // 1. Rename the file
  file.setName(newName);
  
  // 2. Move the file
  file.moveTo(destinationFolder);
}

/**
* Helper function to get the file extension from a filename.
* We preserve the original extension for PDF and DOCX.
* @param {string} filename The original filename.
* @param {string} mimeType The original mimeType.
* @return {string} The extension (e.g., ".pdf") or an empty string.
*/
function getFileExtension(filename, mimeType) {
  if (mimeType === 'application/pdf') {
    return '.pdf';
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return '.docx';
  }
  if (mimeType.startsWith('image/')) {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) return '';
    return filename.substring(lastDot); // return .jpg, .png etc.
  }
  
  // For Google Docs, text files, etc.
  return ''; 
}

