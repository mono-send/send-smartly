# Google SSO Implementation - Fix for "opt_out_or_no_session" Error

## Problem
When users tried to login via Google SSO and skipped/dismissed the process, subsequent attempts showed a cryptic error: `opt_out_or_no_session`. This occurred when:
- User has no active Google session in their browser
- User has opted out of third-party sign-in in their Google account settings
- Browser blocks third-party cookies

## Solution
Implemented a comprehensive Google SSO authentication flow with automatic fallback:

### 1. **Enhanced Error Handling**
- Replaced cryptic error codes with user-friendly messages
- Categorized different failure scenarios:
  - `opt_out_or_no_session`: Automatically redirects to OAuth flow
  - `user_cancel`/`tap_outside`: Silent dismissal (no error shown)
  - `suppressed_by_user`: Shows message and offers alternative
  - Other errors: Attempts fallback authentication

### 2. **OAuth Redirect Fallback**
When Google One Tap fails, the system now:
- Shows an informative toast message
- Automatically redirects to Google's OAuth consent screen
- Allows users to sign in even without an active Google session
- Redirects back to the app after successful authentication

### 3. **New Components**
- **GoogleCallback Component** (`/src/pages/auth/GoogleCallback.tsx`): Handles OAuth redirect callback
- **Route**: `/auth/google/callback` added to App.tsx

## Files Modified

1. **src/components/auth/LoginForm.tsx**
   - Added `handleGoogleLoginFallback()` function for OAuth redirect flow
   - Enhanced `handleGoogleLogin()` with intelligent error handling
   - Updated TypeScript declarations for Google Identity Services

2. **src/pages/auth/GoogleCallback.tsx** (New)
   - Processes authorization code from Google OAuth redirect
   - Exchanges code for access token via backend
   - Handles authentication completion

3. **src/App.tsx**
   - Added import for GoogleCallback component
   - Added route: `/auth/google/callback`

## Backend Requirements

⚠️ **IMPORTANT**: This implementation requires a backend endpoint to handle OAuth authorization codes.

### Required Endpoint
```
POST /auth/google/code
POST /v1.0/auth/google/code (if using versioned API)
```

### Request Format
```json
{
  "code": "authorization_code_from_google",
  "redirect_uri": "https://yourdomain.com/auth/google/callback"
}
```

### Response Format
```json
{
  "access_token": "your_jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "team_member_status": "active"
  }
}
```

### Backend Implementation Notes
The backend endpoint should:
1. Receive the authorization code
2. Exchange it with Google's OAuth server for tokens (requires client secret)
3. Validate the ID token
4. Create or retrieve user from database
5. Generate session/JWT token
6. Return access_token and user data

### Google OAuth Configuration
- **Client ID**: `435311949966-8tqfu9fr1uubrm96fhgm6fge254ed6j1.apps.googleusercontent.com`
- **Authorized redirect URI**: Must include `https://yourdomain.com/auth/google/callback`
- **Required scopes**: `openid`, `email`, `profile`

## User Experience Flow

### Scenario 1: One Tap Available
1. User clicks "Continue with Google"
2. Google One Tap prompt appears
3. User selects account
4. Instant authentication ✓

### Scenario 2: One Tap Unavailable (opt_out_or_no_session)
1. User clicks "Continue with Google"
2. One Tap fails to display
3. Toast message: "Redirecting to Google sign-in..."
4. User redirected to Google OAuth consent screen
5. User signs in to Google
6. User grants permissions
7. Redirected back to app
8. Authentication complete ✓

### Scenario 3: User Dismisses Prompt
1. User clicks "Continue with Google"
2. User clicks outside or cancels
3. No error shown (silent dismissal)
4. User can try again

## Testing Checklist

- [ ] Test with active Google session (One Tap should work)
- [ ] Test with no Google session (Should redirect to OAuth)
- [ ] Test with third-party cookies blocked (Should redirect to OAuth)
- [ ] Test canceling/dismissing One Tap prompt
- [ ] Test OAuth callback with successful code exchange
- [ ] Test OAuth callback with invalid/expired code
- [ ] Test error handling when backend endpoint is unavailable
- [ ] Verify redirect URI matches OAuth configuration

## Configuration

### Environment Variables
```bash
# Optional: API base URL
VITE_API_URL=https://internal-api.monosend.io/v1.0
```

If not set, defaults to: `https://internal-api.monosend.io`

## Security Considerations

1. **Client Secret**: Never expose in frontend code (handled server-side only)
2. **HTTPS Required**: OAuth redirect flow requires HTTPS in production
3. **CSRF Protection**: Consider adding state parameter to OAuth flow
4. **Code Expiration**: Authorization codes expire quickly (typically 10 minutes)
5. **Token Storage**: Access tokens stored in localStorage (consider security implications)

## Future Enhancements

- [ ] Add PKCE (Proof Key for Code Exchange) for additional security
- [ ] Implement refresh token rotation
- [ ] Add session timeout warnings
- [ ] Support for custom OAuth scopes
- [ ] Remember user's preferred login method
