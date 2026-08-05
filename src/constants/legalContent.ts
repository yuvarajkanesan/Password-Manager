export type LegalSection = {
  heading: string;
  body: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: August 4, 2026',
  intro:
    'SecureVault ("the app", "we", "us") is a password and card manager developed by Yuvaraj Kanesan. This policy explains what happens to your data when you use it.',
  sections: [
    {
      heading: 'The short version',
      body: [
        "SecureVault has no server, no account system, and no internet access. Everything you save stays encrypted on your device, and nothing is ever transmitted anywhere. That's not a promise — it's enforced at the operating-system level: the app's release build does not request the Android INTERNET permission at all, so it is technically incapable of sending data over a network.",
      ],
    },
    {
      heading: 'What data the app handles, and where it stays',
      body: [
        'Passwords, usernames, and notes you save are encrypted (AES-256) in on-device storage and never leave your device.',
        'Card numbers, expiry dates, CVV, and PIN you save are encrypted (AES-256) in on-device storage and never leave your device.',
        'Your master password is never stored in plaintext anywhere. It is used only in memory to derive an encryption key (PBKDF2), which is discarded when the app locks.',
        'Backup files you export are written only to a location you explicitly choose via the Android file picker. They only leave your device if you personally move or share that file yourself — the app never uploads it anywhere.',
        'All saved entries are encrypted with AES-256-CBC using a key derived from your master password via PBKDF2. The app itself cannot decrypt your data without the master password, and there is no "forgot password" recovery — this is by design, the same tradeoff every offline, zero-knowledge password manager makes.',
      ],
    },
    {
      heading: 'Permissions the app requests, and exactly why',
      body: [
        'Camera — used only for the optional "scan card" shortcut when adding a card. The photo is processed on-device by Google ML Kit\'s on-device text recognition (nothing is ever sent to Google\'s or anyone else\'s servers) and the temporary photo file is deleted immediately after processing. Nothing from a scan is stored beyond the card fields you review and choose to save.',
        "Biometric unlock (fingerprint/face) — if you enable it, unlocking uses Android's own biometric prompt system. Your fingerprint or face data is handled entirely by the Android OS and device hardware; the app never receives, sees, or stores biometric data itself.",
        'No other permissions are requested. There is no location, contacts, microphone, or storage-wide access, and — as above — no internet access.',
      ],
    },
    {
      heading: 'Third-party services',
      body: [
        "The only third-party component involved is Google ML Kit's on-device Text Recognition, used solely for the card-scan feature described above. It runs locally on your device and does not transmit data to Google. We do not use analytics, crash reporting, ads, or any other third-party SDK.",
      ],
    },
    {
      heading: 'Backups',
      body: [
        'The "Export backup" and scheduled "Auto-backup" features save an encrypted copy of your vault to a file or folder you choose via the system file picker. This file is exactly as encrypted as your on-device vault — it is only ever readable with your master password. Where you store or share that file afterward (a cloud drive, email, USB stick) is entirely your choice and outside the app\'s control.',
      ],
    },
    {
      heading: 'Data deletion',
      body: [
        'Because everything lives only on your device: using "Erase vault" in Settings permanently deletes everything immediately. Uninstalling the app deletes everything (the app does not use Android\'s auto-backup, so no copy survives an uninstall unless you exported one yourself). There is no server-side copy to request deletion of, because none exists.',
      ],
    },
    {
      heading: "Children's privacy",
      body: [
        'SecureVault is not directed at children under 13 and does not knowingly collect data from anyone, regardless of age — it does not collect data from anyone at all, by design.',
      ],
    },
    {
      heading: 'Security measures',
      body: [
        "In addition to AES-256 encryption of stored data, the app's release build: blocks screenshots and screen recording while open, refuses to run if USB debugging or a debugger is detected, refuses to run on rooted devices, and disables the Android Autofill framework on sensitive fields. No security measure is perfect, and this policy doesn't constitute a guarantee against all possible attacks — only a description of what protections are in place.",
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'If this policy changes, the "Last updated" date above will change accordingly. Continued use of the app after an update constitutes acceptance of the revised policy.',
      ],
    },
    {
      heading: 'Contact',
      body: ['Questions about this policy: yuvaraj8747@gmail.com'],
    },
  ],
};

export const TERMS_AND_CONDITIONS: LegalDocument = {
  title: 'Terms & Conditions',
  lastUpdated: 'Last updated: August 4, 2026',
  intro:
    'These terms govern your use of SecureVault ("the app"), developed by Yuvaraj Kanesan. By installing or using the app, you agree to these terms.',
  sections: [
    {
      heading: '1. What the app is',
      body: [
        'SecureVault is a local, offline password and card manager. It stores the entries you create, encrypted, on your own device. It does not have a server, does not require an account, and cannot access the internet.',
      ],
    },
    {
      heading: '2. Your master password',
      body: [
        'Your master password encrypts your vault and is never stored anywhere, by us or on your device, in a recoverable form. If you forget your master password, your saved data cannot be recovered by SecureVault, its developer, or anyone else. You are solely responsible for remembering it or keeping it somewhere safe. We strongly recommend using the app\'s backup/export feature and choosing a master password you can reliably recall.',
      ],
    },
    {
      heading: '3. Your responsibilities',
      body: [
        'You agree to: keep your master password confidential and not share it with anyone; keep any exported backup files secure, since they are only as safe as where you choose to store them; use the app only for lawful purposes; and not attempt to reverse engineer, decompile, tamper with, or circumvent the app\'s security controls, except to the extent such restriction is prohibited by applicable law.',
      ],
    },
    {
      heading: '4. License',
      body: [
        'Subject to these terms, you are granted a personal, non-exclusive, non-transferable, revocable license to install and use SecureVault on devices you own or control, for your own personal or business password/card management.',
      ],
    },
    {
      heading: '5. No warranty',
      body: [
        'The app is provided "as is" and "as available," without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the app will be error-free, uninterrupted, or that it will meet your specific requirements.',
      ],
    },
    {
      heading: '6. Limitation of liability',
      body: [
        'To the maximum extent permitted by applicable law, the developer shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data (including loss of access to your vault due to a forgotten master password), arising out of or related to your use of the app.',
      ],
    },
    {
      heading: '7. Third-party components',
      body: [
        "The app uses Google ML Kit's on-device text recognition for its optional card-scanning feature, as described in the Privacy Policy. Use of that feature is subject to Google's applicable terms for ML Kit.",
      ],
    },
    {
      heading: '8. Termination',
      body: [
        'You may stop using the app at any time by uninstalling it. We may update or discontinue the app at our discretion. Because all your data is stored locally, uninstalling the app removes your vault unless you have exported a backup beforehand.',
      ],
    },
    {
      heading: '9. Changes to these terms',
      body: [
        'We may update these terms from time to time. The "Last updated" date above reflects the most recent revision. Continued use of the app after changes take effect constitutes acceptance of the revised terms.',
      ],
    },
    {
      heading: '10. Governing law',
      body: ['These terms are governed by the laws of India, without regard to conflict-of-law principles.'],
    },
    {
      heading: '11. Contact',
      body: ['Questions about these terms: yuvaraj8747@gmail.com'],
    },
  ],
};
