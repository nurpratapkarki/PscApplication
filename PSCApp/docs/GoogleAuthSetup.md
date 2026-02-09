# Google Authentication Setup for Frontend

This guide outlines how to integrate Google Sign-In in the React Native app and authenticate with the backend.

## 1. Overview

The authentication flow works as follows:
1.  **Mobile App**: User clicks "Sign in with Google".
2.  **Google SDK**: App requests an `access_token` from Google.
3.  **Mobile App**: Sends this token to the Backend API.
4.  **Backend**: Verifies token, creates/retrieves user, and returns JWT (Access + Refresh tokens).

## 2. Prerequisites

-   **Google Cloud Console Project**: You need a project with "Google People API" enabled.
-   **OAuth 2.0 Client IDs**:
    -   **Android**: Package name + SHA-1 certificate fingerprint.
    -   **iOS**: Bundle ID.
    -   **Web Client ID**: Required for the backend to verify tokens (even if the app is mobile).

## 3. Implementation Steps

### A. Install Dependencies
Using `@react-native-google-signin/google-signin`:

```bash
npm install @react-native-google-signin/google-signin
```

### B. Configuration
Initialize the SDK locally, likely in your `App.tsx` or Auth Context.

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_BACKEND_GOOGLE_CLIENT_ID', // From Google Console (Web client type)
  offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
});
```

### C. Login Function
Implement the sign-in logic:

```javascript
const signIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    // Get the ID Token or Access Token
    // Note: backend usually expects 'access_token' or 'id_token' depending on setup.
    // Our backend expects the 'access_token' in the body.
    const { accessToken } = await GoogleSignin.getTokens(); 

    // Send to Backend
    authenticateWithBackend(accessToken);
  } catch (error) {
    console.log('Login Error:', error);
  }
};

const authenticateWithBackend = async (googleToken) => {
  try {
    const response = await fetch('https://your-api.com/api/auth/google/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: googleToken, 
      }),
    });

    const data = await response.json();
    if (response.ok) {
        // Save data.access and data.refresh to SecureStore
        // data.user contains profile info
        console.log("Login Success!", data);
    }
  } catch (err) {
    console.error(err);
  }
};
```

## 4. Development & Testing (No Google Keys Required)

We have provided a **Developer Login Endpoint** so you can build the UI and test the "After Login" flow without needing real Google credentials or a configured emulator.

**Endpoint**: `POST /api/auth/dev-login/` (Only available when `DEBUG=True`)

**Usage:**

```javascript
const devLogin = async (email) => {
  const response = await fetch('http://localhost:8000/api/auth/dev-login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
  });
  const data = await response.json();
  // Returns same structure as Google Login: { access, refresh, user }
};
```
Use this to quickly test components that require a logged-in user state.
