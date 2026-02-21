// --- Конфигурация Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBj9aAck5z6uByWGCQJCSLAqOWNfdgCI14",
  authDomain: "rootscalc.firebaseapp.com",
  projectId: "rootscalc",
  storageBucket: "rootscalc.firebasestorage.app",
  messagingSenderId: "1061234600590",
  appId: "1:1061234600590:web:df5c8d8842a3fe0efcb7df"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = "rootscalc-pro"; 
const TRIAL_TIME = 10 * 60 * 1000; 
const STORAGE_KEY = 'bt_trial_start';
const LICENSE_KEY_STORE = 'bt_license_active';

let checkInterval = null;

async function initGuard() {
    if (localStorage.getItem(LICENSE_KEY_STORE) === 'true') return;

    let startTime = localStorage.getItem(STORAGE_KEY);
    if (!startTime) {
        startTime = Date.now();
        localStorage.setItem(STORAGE_KEY, startTime);
    }

    const checkTrial = () => {
        if (localStorage.getItem(LICENSE_KEY_STORE) === 'true') {
            if (checkInterval) clearInterval(checkInterval);
            return true;
        }

        if (Date.now() - parseInt(startTime) > TRIAL_TIME) {
            showLockScreen();
            return true;
        }
        return false;
    };

    checkInterval = setInterval(checkTrial, 5000);
    checkTrial();
}

async function showLockScreen() {
    if (document.getElementById('license-overlay')) return;

    let currentUid = "Авторизация...";
    
    const overlay = document.createElement('div');
    overlay.id = 'license-overlay';
    overlay.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: #ffffff; 
        z-index: 999999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 24px; box-sizing: border-box;
    `;

    overlay.innerHTML = `
        <div style="width: 100%; max-width: 400px; text-align: center;">
            <div style="margin-bottom: 50px;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1.5px; color: #000;">BRAID TONE</h1>
                <p style="margin: 4px 0 0; font-size: 11px; letter-spacing: 4px; color: #a1a1a1; text-transform: uppercase;">LABORATORY 2026</p>
            </div>
            <div style="margin-bottom: 45px;">
                <p style="color: #bbbbbb; text-transform: uppercase; font-size: 11px; letter-spacing: 2px; margin-bottom: 12px; font-weight: 600;">ПРОБНЫЙ ПЕРИОД ЗАВЕРШЕН</p>
                <h2 style="font-weight: 500; font-size: 28px; margin: 0; color: #1a1a1a;">Активация устройства</h2>
            </div>
            <div style="margin-bottom: 16px;">
                <input type="text" id="license-input" placeholder="Введите ключ" 
                    style="width: 100%; padding: 22px; border: 1.5px solid #f2f2f7; background: #f9f9fb; border-radius: 40px; font-size: 16px; text-align: center; box-sizing: border-box; outline: none; color: #000;">
            </div>
            <button id="license-submit" style="width: 100%; background: #0c0d12; color: white; border: none; padding: 22px; font-size: 14px; letter-spacing: 3px; cursor: pointer; text-transform: uppercase; font-weight: 700; border-radius: 40px; margin-bottom: 35px;">АКТИВИРОВАТЬ</button>
            <div style="width: 80%; height: 1px; background: #f0f0f5; margin: 0 auto 35px;"></div>
            <div style="margin-bottom: 50px;">
                <p style="color: #999; font-size: 14px;">Ключ: <a href="https://t.me/afro_perm" target="_blank" style="color: #000; font-weight: 600;">@afro_perm</a></p>
            </div>
            <div style="background: #fdfdfd; padding: 10px; border-radius: 12px;">
                <p style="color: #cfcfcf; font-size: 10px; text-transform: uppercase; margin-bottom: 6px;">DEVICE SIGNATURE:</p>
                <p id="display-uid" style="color: #d1d1d1; font-size: 11px; font-family: monospace;">${currentUid}</p>
            </div>
            <div id="license-msg" style="margin-top: 25px; font-size: 14px; min-height: 24px; font-weight: 600;"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Сразу пытаемся получить UID
    try {
        const userCred = await signInAnonymously(auth);
        document.getElementById('display-uid').innerText = userCred.user.uid;
    } catch (e) {
        console.error("Auth Error:", e);
        document.getElementById('display-uid').innerText = "Ошибка авторизации (проверьте консоль)";
    }

    document.getElementById('license-submit').onclick = async () => {
        const key = document.getElementById('license-input').value.trim();
        const msg = document.getElementById('license-msg');
        if (!key) return;

        msg.style.color = "#999";
        msg.innerText = "Проверка...";

        try {
            const userCred = await signInAnonymously(auth);
            const uid = userCred.user.uid;

            // Путь к документу: artifacts / rootscalc-pro / public / data / keys / {KEY}
            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'keys', key);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.ownerId && data.ownerId !== uid) {
                    msg.style.color = "#ff3b30";
                    msg.innerText = "Ключ используется другим устройством";
                } else if (data.active === false) {
                    msg.style.color = "#ff3b30";
                    msg.innerText = "Ключ деактивирован";
                } else {
                    localStorage.setItem(LICENSE_KEY_STORE, 'true');
                    if (!data.ownerId) {
                        await updateDoc(docRef, { ownerId: uid, active: true });
                    }
                    msg.style.color = "#34c759";
                    msg.innerText = "Готово! Запуск...";
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                msg.style.color = "#ff3b30";
                msg.innerText = "Ключ не найден в базе";
            }
        } catch (e) {
            console.error("Firestore Error:", e);
            msg.style.color = "#ff3b30";
            msg.innerText = "Ошибка: " + e.code; // Выведет конкретный код ошибки (например, 'permission-denied')
        }
    };
}

window.addEventListener('load', initGuard);