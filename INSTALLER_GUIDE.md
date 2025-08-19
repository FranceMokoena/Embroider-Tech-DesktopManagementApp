# 🚀 EmbroideryTech Professional Installer Guide

## 📋 Overview

This guide will help you create a professional Windows installer for the EmbroideryTech Management System that is universally accepted by all Windows systems. The installer will be a proper `.exe` installer (not a standalone executable) that follows Windows installation standards.

## 🎯 What You'll Get

- **Professional Windows Installer** (`.exe` file)
- **Universal Windows Compatibility** (Windows 7, 8, 10, 11)
- **Proper Installation/Uninstallation** through Windows Control Panel
- **Start Menu Integration**
- **Desktop Shortcuts**
- **File Associations** (`.emb` files)
- **Registry Integration**
- **Professional Branding**

## 🛠️ Prerequisites

### Required Software
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Windows 10/11** (for building)

### Optional Software
- **PowerShell** (for advanced build scripts)
- **Git** (for version control)

## 🚀 Quick Start

### Option 1: Automatic Build (Recommended)

#### Using Batch File (Windows)
```bash
# Double-click or run in Command Prompt
build-installer.bat
```

#### Using PowerShell (Windows)
```powershell
# Run in PowerShell
.\build-installer.ps1

# Or with options
.\build-installer.ps1 -Clean -Verbose
```

### Option 2: Manual Build

```bash
# 1. Install dependencies
npm install
cd desktop-backend && npm install && cd ..

# 2. Build React application
npm run build

# 3. Create installer
npm run create-installer
```

## 📁 Output Files

After successful build, you'll find these files in the `dist/` directory:

### Installer Files
- `EmbroideryTech-Management-Setup-1.0.0.exe` - Main installer
- `EmbroideryTech-Management-Portable-1.0.0.exe` - Portable version

### Additional Files
- `win-unpacked/` - Unpacked application (for testing)
- `builder-debug.yml` - Build configuration log

## 🎨 Customization Options

### 1. Application Branding

#### Update Application Information
Edit `package.json`:
```json
{
  "name": "embroidery-desktop",
  "version": "1.0.0",
  "description": "Your custom description",
  "author": "Your Company Name",
  "build": {
    "productName": "Your Product Name",
    "copyright": "Copyright © 2024 Your Company"
  }
}
```

#### Custom Icons
Replace `build-resources/icon.ico` with your own icon:
- Size: 256x256 pixels (minimum)
- Format: ICO file
- Multiple sizes included (16x16, 32x32, 48x48, 256x256)

#### Installer Graphics
Replace these files in `build-resources/`:
- `installer-sidebar.bmp` - Sidebar image (164x314 pixels)
- `uninstaller-sidebar.bmp` - Uninstaller sidebar (164x314 pixels)
- `installer-header.bmp` - Header image (150x57 pixels)
- `uninstaller-header.bmp` - Uninstaller header (150x57 pixels)

### 2. Installer Behavior

#### Customize Installation Options
Edit `build-resources/installer.nsi`:
```nsi
; Change default installation directory
InstallDir "$PROGRAMFILES\Your Company\Your Product"

; Add custom installation options
!define MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_COMPONENTS
```

#### Add Custom Pages
```nsi
; Add custom welcome page
!define MUI_WELCOMEPAGE_TITLE "Welcome to Your Product"
!define MUI_WELCOMEPAGE_TEXT "This will install Your Product on your computer."

; Add custom finish page
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "Your Product has been successfully installed."
```

### 3. File Associations

#### Add More File Types
Edit `package.json`:
```json
{
  "build": {
    "win": {
      "fileAssociations": [
        {
          "ext": "emb",
          "name": "EmbroideryTech Project",
          "description": "EmbroideryTech Management Project File"
        },
        {
          "ext": "embx",
          "name": "EmbroideryTech Export",
          "description": "EmbroideryTech Export File"
        }
      ]
    }
  }
}
```

## 🔧 Advanced Configuration

### 1. Multi-Language Support

Edit `build-resources/installer.nsi`:
```nsi
; Add multiple languages
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Spanish"
!insertmacro MUI_LANGUAGE "French"

; Language selection page
!define MUI_PAGE_CUSTOMFUNCTION_PRE LanguageSelectionPre
!insertmacro MUI_PAGE_LANGUAGE
```

### 2. Silent Installation

Create silent installer:
```bash
# Build silent installer
npm run build && electron-builder --win nsis --publish=never --config.nsis.oneClick=true
```

### 3. Auto-Updates

Configure auto-updates in `package.json`:
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo",
      "private": false
    }
  }
}
```

## 📦 Distribution

### 1. File Size Optimization

The installer will be approximately:
- **Main Installer**: 50-100 MB
- **Portable Version**: 40-80 MB

### 2. Distribution Methods

#### Direct Distribution
- Share the `.exe` file directly
- Upload to file sharing services
- Include in email attachments

#### Web Distribution
- Host on your website
- Use CDN services
- GitHub Releases

#### Enterprise Distribution
- Windows Software Center
- Group Policy deployment
- SCCM integration

### 3. Digital Signing (Recommended)

For enterprise distribution, digitally sign your installer:

```bash
# Using signtool (requires certificate)
signtool sign /f certificate.pfx /p password installer.exe

# Using PowerShell
Set-AuthenticodeSignature -FilePath "installer.exe" -Certificate $cert
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Fails
```bash
# Clean and rebuild
npm run build-installer -- --clean

# Check Node.js version
node --version  # Should be 14+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. Installer Won't Run
- Check Windows Defender settings
- Verify file integrity
- Run as administrator if needed

#### 3. Missing Dependencies
```bash
# Install missing packages
npm install --save-dev electron-builder
npm install --save-dev @electron-forge/cli
```

#### 4. Icon Issues
- Ensure icon is valid ICO format
- Check icon dimensions (256x256 recommended)
- Verify file path in configuration

### Debug Mode

Enable verbose logging:
```bash
# PowerShell with verbose output
.\build-installer.ps1 -Verbose

# Manual build with debug
DEBUG=electron-builder npm run create-installer
```

## 📋 Installation Features

### What the Installer Provides

✅ **Professional Installation Wizard**
- Welcome page with branding
- License agreement
- Installation directory selection
- Progress indicator
- Completion page

✅ **Windows Integration**
- Add/Remove Programs entry
- Start Menu shortcuts
- Desktop shortcut
- File associations
- Registry entries

✅ **User Experience**
- Automatic uninstall of previous versions
- Option to run after installation
- Clean uninstallation
- Error handling

✅ **Security**
- No admin privileges required (user-level install)
- Digital signature support
- Windows SmartScreen compatible

## 🎉 Success Indicators

You'll know the installer is working correctly when:

✅ **Installation**: Runs without errors  
✅ **Integration**: Appears in Control Panel  
✅ **Shortcuts**: Created in Start Menu and Desktop  
✅ **File Association**: `.emb` files open with your app  
✅ **Uninstallation**: Removes completely when uninstalled  

## 📞 Support

If you encounter issues:

1. **Check the logs** in the build output
2. **Verify prerequisites** (Node.js, npm)
3. **Test on clean system** to isolate issues
4. **Check Windows compatibility** (Windows 7+)

## 🚀 Next Steps

After creating your installer:

1. **Test thoroughly** on different Windows versions
2. **Distribute to beta users** for feedback
3. **Set up auto-updates** for future releases
4. **Consider code signing** for enterprise use
5. **Create documentation** for end users

---

**🎯 Your professional Windows installer is ready for distribution!**
