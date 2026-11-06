@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   LedgerAI Mobile - Production Expo APK Builder
echo ========================================================
echo.

rem Set Android SDK Root
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
        echo [INFO] Detected Android SDK at !ANDROID_HOME!
    )
)

rem Find Java
where java >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\Microsoft\jdk-17*\bin\java.exe" (
        for /d %%D in ("C:\Program Files\Microsoft\jdk-17*") do (
            set "JAVA_HOME=%%D"
            set "PATH=%%D\bin;!PATH!"
            echo [INFO] Detected Java at %%D
        )
    )
)

echo [1/3] Verifying Expo Prebuild...
if not exist "android\build.gradle" (
    echo [INFO] Running Expo prebuild for Android...
    call npx expo prebuild --platform android --no-install
)

echo [2/3] Building APK with Gradle...
cd android
call gradlew.bat assembleDebug

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   BUILD SUCCESSFUL!
    echo   APK Generated at:
    echo   andr\android\app\build\outputs\apk\debug\app-debug.apk
    echo ========================================================
) else (
    echo.
    echo [ERROR] Gradle build encountered an issue.
    echo You can also build via Expo EAS Cloud:
    echo   npx eas-cli build -p android --profile preview
)

cd ..
pause
