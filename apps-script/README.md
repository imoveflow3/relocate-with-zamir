# Connect your Google Sheet (about 10 minutes, one time)

Every survey, meeting request, home valuation and contact form on your site will be saved
as a row in a Google Sheet and emailed to you. Your admin page (`/admin.html`) reads the
same sheet so you can see everyone, chart their answers, and track who you've called.

## 1. Make the sheet
1. Go to **sheets.new** while signed in to the Google account you want leads in.
2. Name it something like **Relocate with Zamir Leads**.

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**.
2. Delete what's in `Code.gs` and paste in everything from
   [Code.gs](Code.gs) (in this folder).
3. Click **Save** (disk icon).

## 3. Set your admin key and email
1. In Apps Script, click **Project Settings** (gear icon on the left).
2. Under **Script Properties**, click **Add script property** twice:
   - `ADMIN_KEY` = a password only you know (longer is safer)
   - `NOTIFY_EMAIL` = the email where new leads should be sent
3. Click **Save script properties**.

## 4. Publish it
1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy**, then **Authorize access** and allow it with your Google account
   (Google shows a warning because it's your own unverified script: click
   **Advanced → Go to (project name)**).
5. Copy the **Web app URL** (it ends in `/exec`).

## 5. Send the URL to Claude
Claude pastes it into `index.html` (`AGENT.sheetUrl`) and `admin.html` (`SHEET_URL`) and
publishes the site. Then open **/admin.html** and sign in with your admin key.

"Anyone" access only lets people *add* a lead. Reading leads or changing a status
needs your admin key.

## Built-in protections
- 5 wrong admin keys locks the admin page for 1 hour.
- A lead needs a name plus a phone or email; at most 20 leads a minute are accepted,
  and at most 80 alert emails a day are sent (leads past that still save to the sheet).
- Anything that looks like a spreadsheet formula is saved as plain text.
- Keep this sheet private (don't use "Anyone with the link" sharing).

**Changed the script later?** Use **Deploy → Manage deployments → Edit → New version** so
the URL stays the same.
