# Turning a Google Sheet into the shared list

Twenty minutes, once. After this, every phone writes into the same sheet and the
boss can watch it fill up.

## 1 · Make the sheet
New Google Sheet. Name it something like **PROMPTERGO IBC2026 visitors**.

## 2 · Add the script
**Extensions → Apps Script.** Delete whatever is in the editor, paste all of `Code.gs`.

At the top, change:

    var TOKEN = "prompt-ibc26-CHANGE-THIS";

to a long phrase of your own. This is the shared password between the phones and
the sheet — anyone holding the URL *and* the token can read and write, so don't
put it in a chat group. Save (the disk icon).

## 3 · Build the tabs
In the editor, pick **setup** from the function dropdown and press **Run**.
Google asks for permission the first time: choose your account, then
Advanced → Go to (project name) → Allow. It needs Sheets access to write rows and
Drive access to store the card photos.

You now have three tabs: **Visitors** (the data), **Questions for engineer**
(auto-filtered), **Dashboard** (live counts).

## 4 · Publish it
**Deploy → New deployment → gear icon → Web app.**

- Execute as: **Me**
- Who has access: **Anyone**

Deploy, and copy the **Web app URL** — it ends in `/exec`.

"Anyone" sounds alarming but is required: the phones aren't signed in to Google.
The token is what actually guards it, which is why it must be long.

## 5 · Connect the phones
Open the app on each phone → **Setup** → Shared Google Sheet.
Paste the URL and the token, tap **Test connection**. You want "Connected ✓".
Then **Sync now** once to push anything already on that phone.

These two values live on the phone, never in the GitHub repository — a public
page therefore gives nobody access to your data.

## 6 · Give the boss access
Share the Sheet with his email (Viewer is enough), and share the Drive folder
**Booth Log cards** with him too, or the business-card photos will show as links
he can't open. Tell him to watch the **Dashboard** tab.

**Google is blocked in mainland China.** He will need a VPN. The evening report
and the Excel file over WeChat don't touch Google, so that route always works —
check with him before the show which one he's actually going to use.

## How the syncing behaves

- Saves go out immediately, and the app re-checks every 15 seconds.
- No signal? Records queue on the phone, the dot beside the stand name turns red,
  and everything goes up when the connection returns. Nothing is lost.
- Two phones editing the same visitor: the later edit wins.
- Deleting marks the row **Deleted = YES** rather than removing it, so the delete
  reaches the other phones. Hide those rows with a filter if they bother you.
- Card photos land in the Drive folder and the sheet holds a link.

## If Test connection fails

- "Token rejected" → the token in Setup and in `Code.gs` differ. Re-deploy after
  editing the script; edits don't go live until you deploy again.
- "No answer" → the URL must end in `/exec`, not `/dev`, and access must be **Anyone**.
- After changing `Code.gs`: **Deploy → Manage deployments → edit → Version: New version.**
