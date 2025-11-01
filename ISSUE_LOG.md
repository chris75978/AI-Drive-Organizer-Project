Project Issue Log

This document tracks the major issues encountered during the execution of the AI Drive Organizer project. This log demonstrates the iterative problem-solving and debugging process required for a successful technical project.

Issue 1: 404 Not Found (Models)

Problem: The script failed on the very first API call. The log showed models/gemini-1.5-flash is not found for API version v1beta.

Analysis: This error indicates the API can't find the AI model we're asking for. The troubleshooting process involved checking multiple potential causes.

Resolution (Multi-Step):

Enabled "Gemini API": Verified the API was enabled in the Google Cloud project. (Error persisted).

Enabled Billing: Discovered that Google Cloud requires a billing account to be linked to a project to unlock the Gemini models, even for free-tier usage. (Error persisted).

Corrected API Key: Discovered the API key being used was from a different project ("Gemini API") than the one with billing enabled ("My Drive Agent").

Final Solution: Created a new API key inside the correct "My Drive Agent" project, which solved all 404 errors.

Issue 2: 404 Not Found (Key Restriction)

Problem: After fixing the billing, the 404 error briefly returned.

Analysis: We had restricted the new API key to only the "Generative Language API." This was a good security step, but it was too restrictive.

Solution: Removed the API restriction on the key (set to "Don't restrict key"). This allowed the script to find all the models associated with the project.

Issue 3: Model Finder Failure

Problem: The script's "model finding" function failed, even after fixing the API key.

Analysis: The script was built to find two models: one for "text" and one for "vision." The project, however, had access to gemini-2.5-flash, which is a multimodal model (it does both). The script wasn't smart enough to assign this one model to both roles.

Solution: Rewrote the getWorkingModelNames() function to be smarter. It now looks for any "gemini" model and assigns it as the single model for all tasks.

Issue 4: finishReason": "MAX_TOKENS"

Problem: The script was connecting to the AI, but the AI's response was getting cut off, causing the script to skip the file.

Analysis: The maxOutputTokens setting (the "room" we give the AI to answer) was too small (set to 150).

Solution: Increased the maxOutputTokens value from 150 to 1024 to ensure the AI always has enough space to provide its full, two-line answer.

Issue 5: User rate limit exceeded

Problem: The script was successfully processing many PDFs but would suddenly stop with a "User rate limit exceeded" error.

Analysis: The script was making file conversion requests too quickly (one every 2 seconds). Google's servers were identifying this as "bot" behavior and temporarily blocking the script.

Solution: Increased the delay at the end of the script loop from Utilities.sleep(2000) (2 seconds) to Utilities.sleep(5000) (5 seconds). This is slower, but safer, and prevents the rate limit error.

Issue 6: Unread File Types (PDF, DOCX)

Problem: The script was working perfectly on Google Docs but skipping all .pdf and .docx files.

Analysis: Apps Script cannot read text from these files directly.

Solution: Implemented a conversion workflow. The script now uses the Drive API to temporarily convert a PDF or DOCX file into a Google Doc. This conversion automatically runs Google's Optical Character Recognition (OCR). The script then reads the text from the temporary Doc, gets the AI analysis, and finally deletes the temporary file. This unlocked the ability to read almost all files.
