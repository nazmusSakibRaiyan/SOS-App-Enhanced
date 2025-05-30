# Profile Picture Implementation Guide

## Quick Reference

### Problem Solved
- ✅ Profile pictures upload but don't display in UI
- ✅ No preview before upload
- ✅ State synchronization between components

### Solution Summary
- Added `updateUser` function to AuthContext for global state management
- Implemented image preview using FileReader API
- Synchronized profile picture state across Profile page and Navbar

## Code Changes

### 1. AuthContext.jsx Changes

```jsx
// Added updateUser function to context
const updateUser = (updates) => {
    setUser(prevUser => ({ ...prevUser, ...updates }));
};

// Updated context provider value
return (
    <AuthContext.Provider
        value={{ 
            user, 
            token, 
            login, 
            logout, 
            loading, 
            getUser, 
            getToken,
            updateUser  // New function added
        }}
    >
        {children}
    </AuthContext.Provider>
);
```

### 2. Profile.jsx Key Changes

#### State Management
```jsx
// Added preview state
const [previewUrl, setPreviewUrl] = useState(null);

// Destructured updateUser from AuthContext
const { user, token, logout, updateUser } = useAuth();
```

#### File Selection with Preview
```jsx
const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validation logic...
        
        setSelectedFile(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
    }
};
```

#### Upload Function
```jsx
const handleProfilePictureUpload = async () => {
    // Upload logic...
    
    if (response.data && response.data.profilePicture) {
        setProfilePicture(response.data.profilePicture);
        // Update AuthContext with new profile picture
        updateUser({ profilePicture: response.data.profilePicture });
        setSelectedFile(null);
        setPreviewUrl(null);
        // Clear file input...
    }
};
```

#### Delete Function
```jsx
const handleProfilePictureDelete = async () => {
    // Delete logic...
    
    setProfilePicture(null);
    // Update AuthContext to remove profile picture
    updateUser({ profilePicture: null });
    toast.success('Profile picture deleted successfully!');
};
```

#### UI Preview Logic
```jsx
{/* Show preview if file is selected, otherwise show current profile picture */}
{previewUrl ? (
    <img
        src={previewUrl}
        alt="Preview"
        className="w-full h-full object-cover"
    />
) : profilePicture ? (
    <img
        src={getProfilePictureUrl(profilePicture)}
        alt="Profile"
        className="w-full h-full object-cover"
        onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
        }}
    />
) : null}

{/* Preview indicator */}
{previewUrl && (
    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Preview
        </span>
    </div>
)}
```

## Backend (No Changes Required)

The backend profile picture functionality was already working correctly:

- ✅ Upload endpoint: `POST /api/auth/upload-profile-picture`
- ✅ Delete endpoint: `DELETE /api/auth/delete-profile-picture`
- ✅ File storage in `uploads/profiles/`
- ✅ Static file serving
- ✅ User model with profilePicture field

## Testing Checklist

### Upload Flow
- [ ] Select image file → Preview shows immediately
- [ ] Click Upload → Image uploads successfully
- [ ] Check Profile page → New image displays
- [ ] Check Navbar → New image displays
- [ ] Refresh page → Image persists

### Preview Flow
- [ ] Select file → Preview appears with "Preview" badge
- [ ] Cancel selection → Preview clears, original image returns
- [ ] Select different file → New preview replaces old

### Delete Flow
- [ ] Click Remove Photo → Confirmation dialog appears
- [ ] Confirm deletion → Image removed from all components
- [ ] Check after refresh → Image stays deleted

### Error Handling
- [ ] Select invalid file type → Error message, no preview
- [ ] Select oversized file → Error message, no preview
- [ ] Network error during upload → Error message, preview remains

## Common Issues & Solutions

### Issue: Preview not showing
**Solution**: Ensure FileReader.readAsDataURL() is called correctly and previewUrl state is set

### Issue: Image uploads but doesn't display
**Solution**: Make sure updateUser() is called after successful upload with the correct profile picture path

### Issue: Image shows in Profile but not Navbar
**Solution**: Verify AuthContext is properly updated and Navbar is consuming user data from context

### Issue: Memory leaks with preview
**Solution**: Clear previewUrl state when component unmounts or file selection changes

## Performance Tips

1. **Preview Generation**: Only generate preview for valid files after validation
2. **State Updates**: Use functional updates for better performance
3. **Memory Management**: Clear preview URLs when not needed
4. **File Size**: Validate file size before creating preview

## Browser Compatibility

- ✅ FileReader API: Supported in all modern browsers
- ✅ URL.createObjectURL: Alternative for older browsers if needed
- ✅ FormData: Supported for file uploads

## Security Notes

- Client-side validation is for UX only
- Server-side validation is enforced
- File type checking on both client and server
- Secure file naming and storage on backend

## Dependencies

### Frontend
- `react`: State management and component lifecycle
- `axios`: HTTP requests for upload/delete
- `react-hot-toast`: User notifications

### No Additional Dependencies Required
The implementation uses standard Web APIs (FileReader) and existing project dependencies.
