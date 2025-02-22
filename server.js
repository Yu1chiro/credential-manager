require('dotenv').config();
// const cors = require('cors');
const express = require('express');
const CryptoJS = require('crypto-js');
const path = require('path');
const bcrypt = require('bcrypt');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
  }));
app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Secret key untuk enkripsi route dari .env
const ROUTE_SECRET = process.env.ROUTE_SECRET;

// Inisialisasi Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Fungsi untuk enkripsi route
const encryptRoute = (text) => {
  return CryptoJS.AES.encrypt(text, ROUTE_SECRET).toString()
    .replace(/\//g, '_')
    .replace(/\+/g, '-')
    .replace(/=/g, '~');
};

// Fungsi untuk dekripsi route
const decryptRoute = (text) => {
  const normalizedText = text
    .replace(/_/g, '/')
    .replace(/-/g, '+')
    .replace(/~/g, '=');
  return CryptoJS.AES.decrypt(normalizedText, ROUTE_SECRET).toString(CryptoJS.enc.Utf8);
};

// Fungsi untuk enkripsi credential
const encryptData = (data, pin) => {
  return CryptoJS.AES.encrypt(data, pin).toString();
};

// Fungsi untuk dekripsi credential
const decryptData = (encryptedData, pin) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, pin);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// API endpoint untuk menyimpan kredensial
app.post('/api/save-credential', async (req, res) => {
  try {
    const { credential, pin } = req.body;
    const userId = Date.now().toString();
    const encryptedCred = encryptData(credential, pin);
    const encryptedRoute = encryptRoute(userId);

    // Hash PIN menggunakan bcrypt
    const saltRounds = 10;
    const hashedPin = await bcrypt.hash(pin, saltRounds);

    await set(ref(database, `users/${userId}`), {
      credential: encryptedCred,
      pin: hashedPin
    });

    res.json({ userId: encryptedRoute });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint untuk verifikasi dan membaca kredensial
app.post('/api/verify-credential', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    const decryptedUserId = decryptRoute(userId);

    const snapshot = await get(ref(database, `users/${decryptedUserId}`));
    const userData = snapshot.val();

    if (!userData) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    // Cek PIN menggunakan bcrypt.compare
    const isMatch = await bcrypt.compare(pin, userData.pin);
    if (!isMatch) {
      return res.status(401).json({ error: 'PIN salah' });
    }

    const decryptedCred = decryptData(userData.credential, pin);
    res.json({ credential: decryptedCred });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server berjalan di port 3000');
});