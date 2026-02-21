// --- Конфигурация Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBk99RmIn2McXhLlMV4huc2iTUGONc7Zig",
  authDomain: "rootscalc-1c302.firebaseapp.com",
  projectId: "rootscalc-1c302",
  storageBucket: "rootscalc-1c302.firebasestorage.app",
  messagingSenderId: "466620468252",
  appId: "1:466620468252:web:e65ad3b731f4315f06a3d9"
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

    let currentUid = "Загрузка...";
    try {
        const userCred = await signInAnonymously(auth);
        currentUid = userCred.user.uid;
    } catch (e) {
        currentUid = "Ошибка сети";
    }

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
            
            <!-- Логотип -->
            <div style="margin-bottom: 50px;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1.5px; color: #000; display: flex; align-items: center; justify-content: center;">
                    BRAID TONE
                </h1>
                <p style="margin: 4px 0 0; font-size: 11px; letter-spacing: 4px; color: #a1a1a1; text-transform: uppercase; font-weight: 500;">
                    LABORATORY 2026
                </p>
            </div>

            <!-- Контент активации -->
            <div style="margin-bottom: 45px;">
                <p style="color: #bbbbbb; text-transform: uppercase; font-size: 11px; letter-spacing: 2px; margin-bottom: 12px; font-weight: 600;">
                    ПРОБНЫЙ ПЕРИОД ЗАВЕРШЕН
                </p>
                <h2 style="font-weight: 500; font-size: 28px; margin: 0; color: #1a1a1a; letter-spacing: -0.5px;">Активация устройства</h2>
            </div>

            <!-- Поле ввода (с закруглением как в UI) -->
            <div style="margin-bottom: 16px;">
                <input type="text" id="license-input" placeholder="XXXX - XXXX - XXXX" 
                    style="width: 100%; padding: 22px; border: 1.5px solid #f2f2f7; background: #f9f9fb; border-radius: 40px; 
                    font-size: 16px; letter-spacing: 1px; text-align: center; box-sizing: border-box; outline: none; color: #000; font-weight: 500;">
            </div>

            <!-- Кнопка (с закруглением как у кнопки СОХРАНИТЬ) -->
            <button id="license-submit" style="width: 100%; background: #0c0d12; color: white; border: none; 
                padding: 22px; font-size: 14px; letter-spacing: 3px; cursor: pointer; text-transform: uppercase; font-weight: 700; border-radius: 40px; margin-bottom: 35px; transition: transform 0.2s, background 0.2s;">
                АКТИВИРОВАТЬ
            </button>

            <!-- Линия разделителя -->
            <div style="width: 80%; height: 1px; background: #f0f0f5; margin: 0 auto 35px;"></div>

            <!-- Ссылка -->
            <div style="margin-bottom: 50px;">
                <p style="color: #999; font-size: 14px; margin: 0; font-weight: 400;">
                    Ключ можно приобрести 
                    <a href="https://t.me/afro_perm" target="_blank" style="color: #000; text-decoration: none; border-bottom: 1.5px solid #e0e0e0; font-weight: 600; padding-bottom: 2px;">@afro_perm</a>
                </p>
            </div>

            <!-- ID устройства -->
            <div style="background: #fdfdfd; padding: 10px; border-radius: 12px;">
                <p style="color: #cfcfcf; font-size: 10px; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1.5px; font-weight: 600;">DEVICE SIGNATURE:</p>
                <p id="display-uid" style="color: #d1d1d1; font-size: 11px; word-break: break-all; font-family: 'SFMono-Regular', Consolas, monospace; max-width: 300px; margin: 0 auto; line-height: 1.4;">${currentUid}</p>
            </div>

            <div id="license-msg" style="margin-top: 25px; font-size: 14px; min-height: 24px; font-weight: 600;"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    const btn = document.getElementById('license-submit');
    btn.onmousedown = () => btn.style.transform = 'scale(0.97)';
    btn.onmouseup = () => btn.style.transform = 'scale(1)';

    document.getElementById('license-submit').onclick = async () => {
        const keyInput = document.getElementById('license-input');
        const key = keyInput.value.trim();
        const msg = document.getElementById('license-msg');
        if (!key) return;

        msg.style.color = "#999";
        msg.innerText = "Авторизация...";

        try {
            const userCred = await signInAnonymously(auth);
            const uid = userCred.user.uid;

            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'keys', key);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                if (data.ownerId && data.ownerId !== uid) {
                    msg.style.color = "#ff3b30";
                    msg.innerText = "Ключ уже используется другим устройством";
                } else {
                    if (data.active === false) {
                        msg.style.color = "#ff3b30";
                        msg.innerText = "Ключ заблокирован";
                        return;
                    }

                    localStorage.setItem(LICENSE_KEY_STORE, 'true');
                    if (checkInterval) clearInterval(checkInterval);

                    if (!data.ownerId) {
                        await updateDoc(docRef, { ownerId: uid, active: true });
                    }
                    
                    msg.style.color = "#34c759";
                    msg.innerText = "Доступ разрешен. Запуск...";
                    setTimeout(() => overlay.remove(), 1200);
                }
            } else {
                msg.style.color = "#ff3b30";
                msg.innerText = "Неверный код активации";
            }
        } catch (e) {
            msg.style.color = "#ff3b30";
            msg.innerText = "Ошибка соединения с сервером";
            console.error(e);
        }
    };
}

window.addEventListener('load', initGuard);
