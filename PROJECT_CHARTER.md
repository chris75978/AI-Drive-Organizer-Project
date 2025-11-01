Project Charter: AI Drive Organizer

Project Initiation

Date: November 1, 2025

Project Manager: Christopher McDonald

Sponsor / Customer: Christopher McDonald (Personal Project)

1. Problem Statement

My personal Google Drive "Organized Folder" contains over 150 unorganized files, including documents, PDFs, and duplicates. The filenames are inconsistent (e.g., "Untitled document," "resume.pdf.pdf"), making it impossible to find specific information quickly. Manually sorting, reading, and renaming each file would be a tedious, multi-day project with a high chance of human error.

2. Project Goal

To design, build, and deploy an autonomous AI agent that will:

Read the content of every file in the source folder.

Intelligently determine a concise, descriptive new filename.

Intelligently determine a single category for the file.

Create a new folder for that category if one does not exist.

Move and rename the file into its new category folder.

This project will turn a chaotic "junk drawer" into a fully organized, searchable, and maintainable library.

3. Scope

In-Scope:

Reading content from Google Docs, .txt files, .docx files, and PDFs.

Using the Gemini API to generate a new name and category.

Dynamically creating new category folders.

Moving and renaming processed files.

Skipping file types it cannot read (e.g., spreadsheets, presentations).

Out-of-Scope (for this version):

Deleting duplicate files.

Organizing files in any folder outside the single designated SOURCE_FOLDER_ID.

A user interface (the project is an automated script).

4. Key Stakeholders

Project Manager: Christopher McDonald

Developer: Christopher McDonald

End User: Christopher McDonald

5. Success Criteria

The project will be considered a success when:

The script runs successfully without fatal errors.

All readable files from the source folder have been moved into new, appropriately named category folders.

The new filenames and categories are logical and descriptive.

The original source folder is empty (containing only unsupported files).
