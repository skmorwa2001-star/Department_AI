# AI One's Platform

AI One's Platform is a lightweight workspace for notes, books, tasks, and files. It runs locally in the browser and can synchronize data to one GitHub repository through the included Node.js server.

## What The Current Version Supports

- Browser-based registration and login.
- Local-first notes, books, tasks, and file metadata.
- Notes and books can be created from the home page or their own sections.
- PDF and image uploads up to 10 MB.
- GitHub synchronization through a private server-side token.
- Home-page and sidebar counts that update after changes.
- Refresh from GitHub without deleting local items when a remote folder does not exist yet.

## Important Account And GitHub Limitation

Registration is currently browser-only. User names, passwords, sessions, and workspace data are stored in that browser's `localStorage`; there is no shared user database.

GitHub is also configured at the server level. All users of one deployed server use the repository and token configured in that server's `.env` file. The GitHub settings form verifies that the entered repository matches the server configuration; it does not connect an individual user's GitHub account.

This version is suitable for personal use, a trusted small group, or a shared workspace. It is not yet suitable for untrusted multi-user hosting or private per-user GitHub storage. A production multi-user version needs GitHub OAuth, server sessions, a database, and per-user token storage.

## Requirements

- Node.js 18 or newer. Node 18+ is required because the server uses the built-in `fetch` API.
- A GitHub repository with at least one commit.
- A fine-grained GitHub personal access token with repository **Contents: Read and write** permission.

## Local Setup

1. Open a terminal in the project directory.
2. Create the local environment file:

	```powershell
	Copy-Item .env.example .env
	```

3. Edit `.env` and set the real token and repository values:

	```env
	GITHUB_TOKEN=github_fine_grained_token
	GITHUB_OWNER=your-github-username
	GITHUB_REPO=your-repository
	GITHUB_BRANCH=main
	PORT=3000
	```

4. Start the server:

	```powershell
	npm install
	npm start
	```

	On Windows, if PowerShell blocks `npm.ps1`, use one of these commands instead:

	```powershell
	npm.cmd start
	node server.js
	```

5. Open `http://localhost:3000`. Do not open `index.html` directly; the GitHub proxy only exists when the server is running.

## First-Time User Process

1. Open the application URL.
2. Select **Create account**.
3. Enter a name, email, password, and confirmation.
4. Log in. The account is stored only in the current browser.
5. Open **GitHub settings**.
6. Enter the same owner, repository, and branch configured in the server `.env` file.
7. Select **Test & connect**.
8. Create a note or book from the home page, Notes page, or Books page.
9. The item is saved locally and written to the matching GitHub folder.
10. Use the refresh button to load repository data again.

## Creating And Uploading Data

### Notes

- Home page: **New note** -> **Write a note**.
- Notes page: **Add note**.
- Complete the title and description, then select **Save & sync**.
- Notes can be saved locally without GitHub. New or edited notes synchronize after a valid GitHub connection is configured; existing offline notes must be edited and saved again to upload them.

### Books

- Home page: **New note** -> **Add a book**.
- Books page: **Add book**.
- Complete the title, description, and category, then select **Save & sync**.

### Tasks

- Open **To-do tasks** and select **Add task**.
- Select the checkbox to change task status.
- Open tasks are counted in the sidebar; completed tasks are excluded from that count.

### Files

- Open **Files** or use the home quick-create menu.
- Select a PDF or image up to 10 MB.
- Files require a verified GitHub connection because their binary content is uploaded to the repository.
- The original file and a metadata JSON file are both stored in GitHub.

## GitHub Repository Layout

The app creates these paths when data is synchronized:

```text
notes/<id>.json
books/<id>.json
tasks/<id>.json
uploads/<id>.<extension>
uploads/<id>.json
```

Notes, books, and tasks contain their title, description, category or status, creation time, and update time. Upload metadata contains the display name, original name, extension, MIME type, size, folder, and creation time.

## Deployment

The app must be deployed as a Node.js web service, not as a static-only website, because `server.js` protects the GitHub token and proxies GitHub API requests.

### Render or Railway

1. Push the project to a GitHub repository.
2. Create a new Node.js web service from that repository.
3. Set the build command to `npm install`.
4. Set the start command to `node server.js`.
5. Add these environment variables in the hosting provider dashboard:

	```text
	GITHUB_TOKEN
	GITHUB_OWNER
	GITHUB_REPO
	GITHUB_BRANCH
	PORT
	```

	Most hosting providers assign the port automatically. The server already reads the provider's `PORT` value.

6. Deploy and open the generated HTTPS URL.
7. Register in the browser, then connect GitHub using the repository values configured in the service.

Never commit `.env`, a GitHub token, or real user credentials. The `.env` file should remain local and is excluded from source control.

## How Synchronization Works

1. The browser stores the current workspace in `localStorage`.
2. When an item is saved, the browser renders it immediately and then calls the Node server.
3. The Node server adds the GitHub authorization header and forwards the request to the GitHub Contents API.
4. GitHub stores each item as an individual JSON file.
5. Refresh reads the JSON files back into the browser.

The GitHub token is never placed in browser JavaScript. The browser only calls the local `/api/github` proxy.

## Troubleshooting

### `GITHUB_TOKEN is not configured`

Confirm that `.env` exists beside `server.js`, contains `GITHUB_TOKEN`, and restart the server.

### GitHub returns 401 or 403

Regenerate the fine-grained token and grant it access to the selected repository with **Contents: Read and write** permission. Check that the token has not expired.

### GitHub returns 404 when connecting

Check the owner, repository, and branch values. The repository must exist and contain an initial commit, such as a README file.

### `EADDRINUSE` on port 3000

Another process is already using port 3000. Stop that process or start this app on another port:

```powershell
$env:PORT=3001
node server.js
```

Then open `http://localhost:3001`.

### Users cannot connect different GitHub accounts

That is expected in the current version. GitHub credentials are server-wide. Per-user GitHub accounts require the OAuth upgrade described below.

## Required Upgrade For True Multi-User Hosting

To let every user register securely and connect their own GitHub account:

1. Replace browser-only registration with a backend authentication provider and database.
2. Create a GitHub OAuth App.
3. Add login and callback routes such as `/auth/github` and `/auth/github/callback`.
4. Use OAuth `state` protection and PKCE where supported.
5. Store each user's GitHub access token encrypted on the server.
6. Associate each workspace with its authenticated user.
7. Make the GitHub proxy use the current user's token and repository instead of the global `.env` token.
8. Add logout, token revocation, account deletion, rate limiting, HTTPS, and audit logging.

Until that upgrade is complete, deploy only for trusted users and treat the configured repository as a shared workspace.

## Project Commands

```powershell
npm install
npm start
```

There are currently no automated test scripts in `package.json`. Verify changes by starting the server and testing registration, GitHub connection, note creation, book creation, task updates, file uploads, refresh, and logout in the browser.
