# Deployment & Security Guide

## 1. Production Keys Strategy
In modern web development (Vite/React), "Client-Side" keys like Firebase Config are technically exposed to the browser. **This is normal and safe** for Firebase, provided you use **Security Rules**.

However, you should absolutely separate your **Development** data from your **Production** data.

### How to Generate Prod Keys
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add Project"** and name it `math-game-prod`.
3.  Go to **Project Settings** and generate a new `firebaseConfig`.
4.  These are your **Production Keys**.

### How to Save Safely
DO NOT commit these keys to Git. Instead, use structure:

#### Local Development
- **File**: `.env`
- **Content**: Your *Development* keys.
- **Git**: Ignored (add to `.gitignore`).

#### Local Production Build
- **File**: `.env.production`
- **Content**: Your *Production* keys.
- **Git**: Ignored.

#### CI/CD (Vercel, Netlify, GitHub Actions)
When you deploy the app, you don't send the `.env` file. You use the hosting provider's dashboard:
1.  Go to **Settings > Environment Variables**.
2.  Add `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.
3.  Paste the **Production** values there.
4.  The build server will inject these keys into the code during `npm run build`.

## 2. Firebase Security Rules (Crucial)
Since keys are public, you protect your data by limiting *who* can read/write.

**Firestore Rules Example:**
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow users to read/write their OWN profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 3. Summary
- **Keys**: Separate projects for Dev vs Prod.
- **Storage**: `.env` locally, Dashboard Secrets for deployment.
- **Safety**: Rely on Firebase Security Rules, not hiding keys.
