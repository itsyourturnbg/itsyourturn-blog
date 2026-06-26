# Board Game Reviewer Deployment & Cloud Persistence Guide

This guide is designed for **non-technical creators** who want to deploy this website on Google Cloud Run, map a custom domain name, and ensure reviews and images persist forever using **Cloud Firestore**—fully compatible with the **free Starter/Spark tier** without needing any paid upgrades!

---

## Table of Contents
1. [How Free Cloud Persistence Works](#1-how-free-cloud-persistence-works)
2. [Step 1: Deploying to Google Cloud Run](#step-1-deploying-to-google-cloud-run)
3. [Step 2: Setting Up Your Custom Domain Name](#step-2-setting-up-your-custom-domain-name)
4. [Summary Checklist for Non-Technical Users](#summary-checklist-for-non-technical-users)

---

## 1. How Free Cloud Persistence Works

By default, when you upload images on Google Cloud Run, files saved to the local server disk are **ephemeral (temporary)**. Each time the server restarts or scales down to zero (which is normal and happens automatically), local files are cleared, causing uploaded images to disappear.

Typically, servers solve this by storing files in a separate cloud bucket (like Firebase Storage). However, **Firebase Storage is not available on free Starter tier projects** without a paid upgrade.

### The Zero-Cost, Maintenance-Free Solution:
We have updated your app to use a smart, 100% free persistence mechanism:
1. **Ultra-Efficient Compression:** When you upload an image (either as a cover or in the gallery), the app automatically compresses and resizes the photo client-side to keep it incredibly lightweight (under 100KB) while preserving beautiful, crisp detail.
2. **Direct Firestore Storage:** Because the compressed images are so small, we store them directly inside your **Cloud Firestore** database records as persistent Base64 Data URLs!
3. **No Setup & 100% Free:** Because Firestore is fully supported on the free **Starter tier**, your reviews and images will remain safe and sound forever, **without requiring you to pay, upgrade, or configure any storage buckets!**

---

## Step 1: Deploying to Google Cloud Run

Google Cloud Run is an amazing, free-tier-eligible service that runs your full-stack Node.js server. 

### Option A: The Easiest Way (Click Deploy in AI Studio)
If you are using **Google AI Studio**, you don't need to write commands!
1. Look at the top right of the Google AI Studio panel.
2. Click the **Deploy** or **Share** button.
3. Choose **Deploy to Cloud Run**.
4. Follow the on-screen prompts. AI Studio will automatically package your code, upload it, and spin up a Cloud Run service for you.

### Option B: Manual Deployment via the Google Cloud CLI (gcloud)
If you are deploying from your own computer or terminal:
1. Make sure you have the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed.
2. Open your project folder in your terminal.
3. Run the following command:
   ```bash
   gcloud run deploy board-game-reviewer --source . --platform managed --allow-unauthenticated
   ```
4. Choose a region close to your target audience.
5. Once complete, you will receive a public HTTPS URL (e.g., `https://board-game-reviewer-xxxxxx.run.app`).

---

## Step 2: Setting Up Your Custom Domain Name

Once your app is successfully running on Google Cloud Run, you can map your custom domain name (e.g., `www.myboardgamereviews.com`) to it.

### 1. Go to the Cloud Run Console
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the search bar at the top, type **Cloud Run** and select it.

---

### 2. Add Custom Domain Mapping (Two Ways to Find It)

Because Google Cloud's layout changes slightly depending on your account, here are the two ways to locate the custom domain setup:

#### Option A: From the Main Services List (Most Common)
If you are on the main **Cloud Run** page that lists all of your services:
1. Look at the very top menu bar of the services list (next to "Create Service", "Refresh", etc.).
2. You should see a button named **Manage Custom Domains** (if your screen is small, click the three vertical dots `⁝` on the far right of that top bar to show hidden options).
3. Click **Manage Custom Domains**, then click **Add Mapping**.
4. Select your service (e.g., `board-game-reviewer`), type in your domain (e.g., `www.myboardgamereviews.com`), and click **Continue**.

#### Option B: From the "Integrations" Tab (Recommended for New Services)
If you clicked into your specific service (e.g., `board-game-reviewer`) from the list:
1. In the inner tabs of your service (where you see *Metrics*, *Revision*, *Logs*), click on **Integrations**.
2. Click **Add Integration** (or **Explore Integrations**).
3. Click on the **Custom domains** integration box (powered by Google Cloud Load Balancing).
4. Enter your custom domain and follow the simple step-by-step wizard to automatically wire it up!

---

### 3. Update Your Domain Registrar's DNS Records
Google Cloud Run will now provide you with specific **DNS records** (such as `CNAME`, `A`, or `AAAA` records) that you need to add to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains/Squarespace, or Cloudflare).

1. Log in to your domain registrar's website.
2. Go to the **DNS Settings** / **DNS Zone Editor** page for your domain.
3. Create new records exactly as shown in the Google Cloud console:
   * **Type**: `CNAME` (or `A` / `AAAA` as instructed)
   * **Host/Name**: `www` (or `@` if mapping the root domain)
   * **Value/Target**: The destination address provided by Google Cloud (e.g., `ghs.googlehosted.com.`).
   * **TTL**: Leave as default.
4. Save the DNS changes.

*Note: DNS records can take anywhere from a few minutes to 24-48 hours to update worldwide. Once updated, your app will be securely accessible via your custom domain name with an automatic, free SSL certificate!*

---

## Summary Checklist for Non-Technical Users

- [ ] **Click Deploy to Cloud Run** in the AI Studio menu (or deploy via CLI).
- [ ] **Go to Google Cloud Run console** to map your custom domain.
- [ ] **Configure DNS records** in your Domain Registrar (like Namecheap or GoDaddy) using the provided `CNAME` or `A` records.
- [ ] **Celebrate!** Your reviews and photos are now backed up in the cloud securely and fully persistently on your free tier, and your blog is live under your custom domain!
