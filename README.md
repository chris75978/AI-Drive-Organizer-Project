AI-Powered Google Drive Organizer

This project is an AI agent built with Google Apps Script and the Gemini API. It automatically scans a designated Google Drive folder, analyzes the content of each file (including Google Docs, PDFs, and Word documents), and then renames the file and moves it into a dynamically created category folder.

This project was developed as a practical application of the skills learned in the Google Project Manager Certificate program, demonstrating project initiation, planning, execution, and issue management.

Project Goal

The goal was to transform a "junk drawer" folder with hundreds of unorganized, poorly named files into a structured, searchable library of folders based on AI-driven categorization.

Key Features

Smart Categorization: Uses the Gemini AI to read file content and determine the best category (e.g., "Resumes," "Business Plans," "Invoices").

Dynamic Folder Creation: If a category folder doesn't exist, the agent creates it.

Intelligent Renaming: The AI generates a new, clean, and descriptive filename for each file.

Multi-Format Support: Reads text from:

Google Docs

Plain Text files

Microsoft Word (.docx) files (via conversion)

PDFs (via OCR conversion)

Image files (via OCR conversion)

Resilient & Safe: Built to handle errors, skip unsupported files (like spreadsheets), and operate only within a designated source folder to prevent errors.

Technical Stack

Google Apps Script: The "robot" that runs the project, handles files, and calls the APIs.

Google Drive API: Used to list, move, rename, and convert files.

Google Gemini API: The "brain" that reads file content and suggests names and categories.

How to Set It Up

(This section shows an employer you know how to document your work)

Create a Google Cloud Project: Enable the Gemini API and Google Drive API.

Enable Billing: Link a billing account to the project (required by the Gemini API).

Create an API Key: Create a new, restricted API key for the "Gemini API."

Create an Apps Script Project:

Go to script.google.com.

Paste the code from AIAgent.gs.js into the editor.

Enable the "Drive API" in the "Services" panel.

Configure the Script:

Paste your new API key into the GEMINI_API_KEY variable.

Paste your source/destination folder ID into the SOURCE_FOLDER_ID and DESTINATION_PARENT_FOLDER_ID variables.

Run: Select the runFileOrganizer function and click "Run." You may need to run it multiple times due to Google's 6-minute execution limit.
