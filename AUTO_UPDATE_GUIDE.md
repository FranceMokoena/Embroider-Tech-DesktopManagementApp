# 🔄 Auto-Update System Guide

Your EmbroideryTech Desktop application now supports automatic updates via GitHub Releases!

## 🚀 How It Works

1. **Automatic Check**: App checks for updates every time it starts
2. **Download Progress**: Shows progress bar during download
3. **User Notification**: Notifies user when updates are available
4. **Automatic Restart**: App restarts with new version after installation

## 📋 For Developers (Creating Releases)

### Quick Release Command
```bash
npm run create-release 1.0.1
```

### Manual Release Process
1. **Update version** in `package.json`
2. **Create git tag**: `git tag v1.0.1`
3. **Push to GitHub**: `git push origin v1.0.1`
4. **GitHub Actions** automatically builds and publishes

### Release Commands
```bash
# Create a new release (automated)
npm run create-release 1.0.1

# Build and publish manually
npm run publish

# Build without publishing
npm run build-installer
```

## 🔧 Configuration

### GitHub Repository Setup
- Repository: `embroiderytech/embroidery-desktop`
- Releases: Automatic via GitHub Actions
- Update URL: `https://github.com/embroiderytech/embroidery-desktop/releases`

### Update Behavior
- ✅ Check on app startup
- ✅ Show progress bar
- ✅ Ask user permission
- ✅ Automatic restart after install
- ✅ Error handling

## 📦 Release Structure

Each GitHub release contains:
```
v1.0.1
├── EmbroideryTech-Management-Setup-1.0.1.exe (Windows Installer)
├── EmbroideryTech-Management-Portable-1.0.1.exe (Portable)
└── latest.yml (Update metadata)
```

## 🎯 User Experience

### Update Flow
1. **App starts** → Checks for updates
2. **Update found** → Shows notification dialog
3. **User clicks "Download"** → Downloads with progress bar
4. **Download complete** → Shows "Restart & Install" dialog
5. **User clicks "Restart"** → App restarts with new version

### Update Modal Features
- 🔍 Checking status with spinner
- ✅ Update available notification
- 📥 Download progress with speed and size
- 🎉 Ready to install notification
- ❌ Error handling

## 🛠️ Technical Details

### Files Modified
- `src/main.js` - Auto-updater configuration
- `src/HomeDashboard.js` - Update UI components
- `src/HomeDashboard.css` - Update modal styles
- `package.json` - Build and publish scripts
- `.github/workflows/release.yml` - Automated releases

### Dependencies Added
- `electron-updater` - Core update functionality
- `electron-builder` - Build and publish tools

## 🔒 Security Features

- ✅ Code signing verification
- ✅ HTTPS downloads from GitHub
- ✅ Integrity checks
- ✅ Secure update process

## 🚨 Troubleshooting

### Common Issues
1. **Update not found**: Check GitHub repository permissions
2. **Download fails**: Check internet connection
3. **Install fails**: Check antivirus software
4. **App won't start**: Check file permissions

### Debug Mode
```bash
# Enable debug logging
DEBUG=electron-updater npm start
```

## 📞 Support

If you encounter issues with the auto-update system:
1. Check the console logs for error messages
2. Verify GitHub repository access
3. Ensure proper version tagging
4. Check GitHub Actions build status

---

**🎉 Your app now has professional auto-update capabilities!**
