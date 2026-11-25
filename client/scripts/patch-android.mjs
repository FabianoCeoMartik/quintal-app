import fs from 'node:fs'
const f = 'android/app/src/main/AndroidManifest.xml'
let x = fs.readFileSync(f, 'utf8')
if (!x.includes('login-callback')) {
  const filter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.quintal.app" android:host="login-callback" />
            </intent-filter>
        `
  x = x.replace('</activity>', filter + '</activity>')
  fs.writeFileSync(f, x)
  console.log('AndroidManifest atualizado.')
}
