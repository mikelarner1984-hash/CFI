# Building Android APK for Work Tracker

This guide explains how to build an Android APK from the Work Tracker application.

## Prerequisites

1. **Java Development Kit (JDK) 17** or higher
   ```bash
   # Check if Java is installed
   java -version
   
   # If not installed, install OpenJDK 17
   sudo apt update
   sudo apt install openjdk-17-jdk
   ```

2. **Android Studio** (Recommended) or **Android SDK Command Line Tools**
   - Download from: https://developer.android.com/studio
   - Or use command line tools: https://developer.android.com/studio#command-tools

3. **Set up Android SDK environment variables:**
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```

## Build Steps

### Step 1: Build the React Application
```bash
cd /app/frontend
yarn build
```

### Step 2: Sync with Capacitor
```bash
npx cap sync android
```

### Step 3: Build APK using Android Studio (Recommended)

1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to `/app/frontend/android` and open it
4. Wait for Gradle sync to complete
5. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**
6. Once built, click "locate" to find the APK file
7. The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Build APK using Command Line (Alternative)

```bash
cd /app/frontend/android
./gradlew assembleDebug
```

The APK will be generated at:
```
/app/frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 5: Build Release APK (For Production)

1. **Generate a signing key:**
   ```bash
   keytool -genkey -v -keystore work-tracker-release-key.keystore -alias work-tracker -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Create `android/key.properties` file:**
   ```
   storePassword=YOUR_STORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=work-tracker
   storeFile=../work-tracker-release-key.keystore
   ```

3. **Update `android/app/build.gradle`:**
   Add before `android {`:
   ```gradle
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   ```

   Update `android { ... }` section:
   ```gradle
   signingConfigs {
       release {
           keyAlias keystoreProperties['keyAlias']
           keyPassword keystoreProperties['keyPassword']
           storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
           storePassword keystoreProperties['storePassword']
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled false
           proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
       }
   }
   ```

4. **Build release APK:**
   ```bash
   cd /app/frontend/android
   ./gradlew assembleRelease
   ```

   The release APK will be at:
   ```
   /app/frontend/android/app/build/outputs/apk/release/app-release.apk
   ```

## Installing the APK on Android Device

### Method 1: Via USB
1. Enable Developer Options and USB Debugging on your Android device
2. Connect device via USB
3. Run: `adb install app-debug.apk`

### Method 2: Direct Transfer
1. Transfer the APK file to your Android device
2. Open the APK file on your device
3. Allow installation from unknown sources if prompted
4. Install the app

## Quick Build Script

Save this as `build-apk.sh` in `/app/frontend`:

```bash
#!/bin/bash

echo "🔨 Building Work Tracker APK..."

# Step 1: Build React app
echo "📦 Building React application..."
yarn build

# Step 2: Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Step 3: Build APK
echo "🤖 Building Android APK..."
cd android
./gradlew assembleDebug

# Step 4: Show result
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📍 Location: /app/frontend/android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ APK build failed!"
    exit 1
fi
```

Make it executable:
```bash
chmod +x build-apk.sh
./build-apk.sh
```

## Troubleshooting

### Gradle Build Fails
- Ensure Java 17+ is installed: `java -version`
- Update Gradle: `cd android && ./gradlew --version`
- Clean build: `cd android && ./gradlew clean`

### SDK Not Found
- Set ANDROID_HOME environment variable
- Install required SDK packages via Android Studio SDK Manager

### App Crashes on Launch
- Check logs: `adb logcat`
- Ensure all permissions are granted in AndroidManifest.xml

## App Features in APK

The Android APK includes all Work Tracker features:
- ✅ Add work entries with date, client, start/finish times
- ✅ Automatic calculation of total hours worked
- ✅ Track client miles and commute miles
- ✅ Filter and sort entries
- ✅ Edit and delete entries
- ✅ Export data to PDF
- ✅ Import data from PDF
- ✅ Local storage (data persists on device)
- ✅ Professional, clean UI optimized for mobile

## Notes

- The debug APK is suitable for testing but not for production release
- For production, always build a signed release APK
- The app uses local storage, so data is stored on the device
- No internet connection required after installation (offline-first)
