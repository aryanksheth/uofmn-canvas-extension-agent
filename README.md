# UMN Canvas Copilot — on-demand Chrome extension

This prototype reads only the currently open `https://canvas.umn.edu` page when the user clicks **Analyze current page**. It sends extracted page text to a local FastAPI backend, which sends the selected content to the OpenAI API. No Canvas API key, Canvas administrator access, or Canvas password is needed.

## Requirements

- Chrome or Chromium browser with extensions enabled
- Python 3.11+
- OpenAI API key with billing configured (ChatGPT subscription does **not** include API credits)
- Permission to access the Canvas page normally through your own university login

## Backend setup

In `backend/`:

```bash
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env  # Windows PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env` with your OpenAI API key. Generate a strong random pairing secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Paste the generated value as `CANVAS_BRIDGE_TOKEN` in `.env`.

Start the backend **from the backend directory**:

```bash
uvicorn main:app --host 127.0.0.1 --port 8765
```

## Chrome setup

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked** and select the `extension/` folder.
4. Open a Canvas assignment or course page at `https://canvas.umn.edu` and sign in normally.
5. Click the extension icon, paste the same `CANVAS_BRIDGE_TOKEN` into **Local pairing secret**.
6. Select a task and click **Analyze current page**.

The extension stores only the pairing secret in Chrome local extension storage. The current page's content is sent on demand and is not stored by the backend. The OpenAI API receives the page text for processing with `store=False` requested.

## Security boundaries

- No Canvas cookies, passwords, or tokens are collected.
- No background browsing or automatic crawling occurs.
- The extension runs extraction only after a user click, and only on `canvas.umn.edu`.
- The backend listens on `127.0.0.1`, validates a long pairing secret, checks the Chrome extension origin, and restricts submitted URLs to `canvas.umn.edu`.
- The extension is **not** intended for instructors' private records, grades, FERPA-protected student information, or confidential course material. Review text before sharing.
- This is a **single-user local prototype**, not a secure hosted multi-user service. CORS and Origin headers are not authentication; the bearer secret is the primary local gate.
- A malicious local program with the pairing secret could impersonate the extension. Use operating-system protections and never expose the local service publicly.
- For hosted multi-user deployment, replace the shared secret with real user authentication, per-user authorization, strict extension origin allowlists, HTTPS, abuse controls, privacy policies, and isolated storage.
- Course HTML/text is untrusted input. The model is instructed not to follow commands embedded in the page.

## Limitations

- The extension reads rendered text on one open page, not all courses or assignments automatically.
- Some Canvas pages load content in iframes or custom widgets, which may not be captured.
- It does not submit assignments, read grades across courses, or perform write operations.
- API usage incurs separate OpenAI API charges.
- For a ChatGPT-native experience later, add a secure hosted MCP service and check your account's connector availability. This starter uses OpenAI API instead of a ChatGPT in-app plugin.
