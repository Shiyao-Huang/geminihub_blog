# 🛰️ GeminiHub Satellite Blog Factory

This is your fully automated "Satellite SEO" machine. It is designed to run on autopilot, generating high-quality content to drive traffic to `geminihub.ai`.

## 📂 Structure
*   `src/content/blog/`: Where the markdown posts live.
*   `topics.txt`: The "Fuel Tank". Add post titles here (one per line). The bot eats one line per day.
*   `generate-post.js`: The AI worker script.
*   `.github/workflows/daily-content.yml`: The automation scheduler (runs daily at 8:00 UTC).

## 🚀 How to Launch
1.  **Push to GitHub**:
    Create a new repository (e.g., `gemini-satellite-design`) and push this folder's content to it.
2.  **Deploy to Vercel**:
    *   Import the repo on Vercel.
    *   Framework: `Astro` (Preset).
    *   **Environment Variables**: Add `GEMINI_API_KEY` to Vercel Project Settings.
3.  **Activate Automation**:
    *   Go to GitHub Repo -> Settings -> Secrets and Variables -> Actions.
    *   Add `GEMINI_API_KEY`.
    *   Now, every day, GitHub Actions will:
        1.  Wake up.
        2.  Read the top topic from `topics.txt`.
        3.  Generate a post.
        4.  Commit it to the repo.
        5.  Trigger Vercel to redeploy the site.

## 🛠 Manual Control
*   **Generate a specific post**:
    ```bash
    npm run gen "My Custom Topic"
    ```
*   **Preview locally**:
    ```bash
    npm run dev
    ```

## 📈 Scaling Strategy
To build the "Matrix":
1.  Fork this repo 3 times.
2.  Change `site_config.ts` in each fork (Title: "Gemini Dev", "Gemini Design", etc.).
3.  Give each fork a different `topics.txt` list.
4.  Deploy all 3 to Vercel.
