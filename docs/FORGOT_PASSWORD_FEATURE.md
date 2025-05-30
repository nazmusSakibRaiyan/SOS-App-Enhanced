# Forgot Password / Reset Password Feature Documentation

## Overview

This document describes the implementation of the forgot password and reset password functionality for the Emergency SOS Response System. This feature allows users to securely reset their passwords when they forget them, using email-based verification.

## Feature Components

### 1. Backend Implementation

#### Database Schema Updates
- **File**: `backend/models/user.js`
- **New Fields Added**:
  ```javascript
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
  ```

#### New API Endpoints

##### Forgot Password Endpoint
- **URL**: `POST /api/auth/forgot-password`
- **Purpose**: Initiates password reset process
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Password reset link has been sent to your email address"
  }
  ```

##### Reset Password Endpoint
- **URL**: `POST /api/auth/reset-password/:token`
- **Purpose**: Resets user password using valid token
- **Request Body**:
  ```json
  {
    "password": "newPassword123",
    "confirmPassword": "newPassword123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Password has been reset successfully. You can now login with your new password."
  }
  ```

#### Controllers Implementation
- **File**: `backend/controllers/authController.js`
- **New Functions**:
  - `forgotPassword()` - Handles forgot password requests
  - `resetPassword()` - Handles password reset with token validation

#### Routes Updates
- **File**: `backend/routes/authRoutes.js`
- **New Routes Added**:
  ```javascript
  router.post("/forgot-password", forgotPassword);
  router.post("/reset-password/:token", resetPassword);
  ```

### 2. Frontend Implementation

#### New Pages Created

##### Forgot Password Page
- **File**: `frontend/src/pages/ForgotPassword.jsx`
- **Route**: `/forgot-password`
- **Features**:
  - Email input form
  - Loading states
  - Success confirmation screen
  - Navigation back to login

##### Reset Password Page
- **File**: `frontend/src/pages/ResetPassword.jsx`
- **Route**: `/reset-password/:token`
- **Features**:
  - New password input
  - Password confirmation
  - Token validation
  - Password strength requirements
  - Error handling for invalid/expired tokens

#### Login Page Updates
- **File**: `frontend/src/pages/Login.jsx`
- **Enhancement**: Added "Forgot your password?" link

#### Routing Updates
- **File**: `frontend/src/App.jsx`
- **New Routes**:
  ```jsx
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />
  ```

### 3. Configuration Updates

#### Environment Variables
- **File**: `backend/.env`
- **New Variable**: `FRONTEND_URL=http://localhost:5173`

## Security Features

### 1. Token Generation and Storage
- Uses Node.js `crypto` module for secure token generation
- Tokens are hashed using SHA-256 before storage
- Original unhashed token is sent in email for verification

### 2. Token Expiration
- Reset tokens expire after 15 minutes for security
- Expired tokens are automatically invalidated

### 3. Password Validation
- Minimum 6 characters required
- Password confirmation must match
- Server-side validation for all password requirements

### 4. Email Security
- Reset emails include clear instructions
- Links expire automatically
- Confirmation emails sent after successful reset

## User Flow

### Forgot Password Flow
1. User clicks "Forgot your password?" on login page
2. User enters email address
3. System validates email exists in database
4. System generates secure reset token
5. System sends email with reset link
6. User receives email with reset instructions
7. User clicks reset link in email

### Reset Password Flow
1. User clicks reset link from email
2. System validates token and expiration
3. User enters new password and confirmation
4. System validates password requirements
5. System updates user password
6. System clears reset token from database
7. System sends confirmation email
8. User redirected to login page

## Email Templates

### Forgot Password Email
```
Subject: Password Reset Request - SOS Emergency Response

Hi [User Name],

You have requested to reset your password for your SOS Emergency Response account.

Please click on the following link to reset your password:
[Reset URL]

This link will expire in 15 minutes for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best Regards,
SOS Emergency Response Team
```

### Password Reset Confirmation Email
```
Subject: Password Reset Successful - SOS Emergency Response

Hi [User Name],

Your password has been successfully reset for your SOS Emergency Response account.

If you did not make this change, please contact our support team immediately.

Best Regards,
SOS Emergency Response Team
```

## Error Handling

### Backend Error Responses
- `404`: User not found with email address
- `400`: Invalid or expired reset token
- `400`: Passwords do not match
- `400`: Password too short
- `500`: Server errors

### Frontend Error Handling
- Network error handling
- Invalid token detection
- Password validation feedback
- User-friendly error messages
- Automatic redirection on success

## API Testing

### Test Forgot Password
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Test Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password/YOUR_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"password": "newpassword123", "confirmPassword": "newpassword123"}'
```

## Dependencies

### Backend Dependencies
- `crypto` (Node.js built-in) - Token generation
- `nodemailer` (existing) - Email sending
- `bcrypt` (existing) - Password hashing

### Frontend Dependencies
- `react-router-dom` (existing) - Routing
- `react-hot-toast` (existing) - Notifications

## Integration Points

### Email Service
- Uses existing Nodemailer configuration
- Leverages current SMTP settings
- Reuses email transporter setup

### Authentication System
- Integrates with existing user model
- Uses current password hashing method
- Maintains existing authentication flow

### Database
- Extends current MongoDB user schema
- Uses existing database connection
- Follows current data modeling patterns

## Maintenance Notes

### Token Cleanup
- Consider implementing automated cleanup of expired tokens
- Monitor database growth of token fields
- Regular cleanup of old reset tokens recommended

### Email Monitoring
- Monitor email delivery rates
- Track bounce rates for reset emails
- Consider email service provider analytics

### Security Monitoring
- Monitor reset password attempt frequencies
- Track token usage patterns
- Implement rate limiting if needed

## Future Enhancements

### Potential Improvements
1. **Rate Limiting**: Implement rate limiting for forgot password requests
2. **Email Templates**: HTML email templates for better presentation
3. **SMS Option**: Alternative reset method via SMS
4. **Password History**: Prevent reuse of recent passwords
5. **Admin Notifications**: Alert admins of suspicious reset activities
6. **Analytics**: Track reset password usage statistics

### Advanced Security
1. **Two-Factor Reset**: Require additional verification for password reset
2. **Device Verification**: Verify device before allowing password reset
3. **Location Verification**: Alert for reset requests from unusual locations
4. **Account Lockout**: Temporary lockout after multiple reset attempts

## Troubleshooting

### Common Issues
1. **Email not received**: Check spam folder, verify email configuration
2. **Token expired**: Request new reset link
3. **Invalid token**: Ensure complete URL copied from email
4. **Password requirements**: Minimum 6 characters, passwords must match

### Debug Steps
1. Check server logs for email sending errors
2. Verify environment variables are set correctly
3. Test email configuration with sample email
4. Validate database connection and user collection

## Conclusion

The forgot password/reset password feature provides a secure and user-friendly way for users to recover their accounts. The implementation follows security best practices with token-based verification, email confirmation, and proper error handling. The feature integrates seamlessly with the existing authentication system and maintains the same security standards as the rest of the application.
