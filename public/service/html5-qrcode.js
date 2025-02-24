let html5QrcodeScanner;
let currentTab = 'camera';
let lastDetectedUrl = '';
let cameraInitialized = false;

async function requestCameraPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" }
        });
        stream.getTracks().forEach(track => track.stop());
        document.getElementById('cameraPermissionRequest').classList.add('hidden');
        initializeScanner();
    } catch (error) {
        console.error('Camera permission error:', error);
        showStatus('error', 'Gagal mendapatkan izin kamera. Mohon izinkan akses kamera melalui pengaturan browser Anda.');
    }
}

async function checkCameraPermission() {
    try {
        const permissions = await navigator.permissions.query({ name: 'camera' });
        if (permissions.state === 'granted') {
            return true;
        } else if (permissions.state === 'prompt') {
            document.getElementById('cameraPermissionRequest').classList.remove('hidden');
            return false;
        } else {
            showStatus('error', 'Akses kamera ditolak. Mohon izinkan akses kamera melalui pengaturan browser Anda.');
            return false;
        }
    } catch (error) {
        console.error('Permission check error:', error);
        document.getElementById('cameraPermissionRequest').classList.remove('hidden');
        return false;
    }
}

async function initializeScanner() {
    if (cameraInitialized) return;

    try {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { 
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                videoConstraints: {
                    facingMode: { exact: "environment" }
                }
            }
        );

        await html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        cameraInitialized = true;
        showStatus('success', 'Kamera siap digunakan');
    } catch (error) {
        console.error('Scanner initialization error:', error);
        
        // Jika kamera belakang tidak tersedia, coba gunakan kamera depan
        try {
            html5QrcodeScanner = new Html5QrcodeScanner(
                "reader",
                { 
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    videoConstraints: {
                        facingMode: "user"
                    }
                }
            );
            
            await html5QrcodeScanner.render(onScanSuccess, onScanFailure);
            cameraInitialized = true;
            showStatus('success', 'Menggunakan kamera depan');
        } catch (fallbackError) {
            console.error('Fallback camera error:', fallbackError);
            showStatus('error', 'Tidak dapat mengakses kamera. Pastikan perangkat Anda memiliki kamera yang aktif.');
        }
    }
}

async function switchTab(tab) {
    currentTab = tab;
    document.getElementById('cameraSection').classList.toggle('hidden', tab !== 'camera');
    document.getElementById('uploadSection').classList.toggle('hidden', tab !== 'upload');
    
    document.getElementById('cameraTab').classList.toggle('text-blue-600', tab === 'camera');
    document.getElementById('cameraTab').classList.toggle('border-b-2', tab === 'camera');
    document.getElementById('cameraTab').classList.toggle('border-blue-600', tab === 'camera');
    document.getElementById('cameraTab').classList.toggle('text-gray-500', tab !== 'camera');
    
    document.getElementById('uploadTab').classList.toggle('text-blue-600', tab === 'upload');
    document.getElementById('uploadTab').classList.toggle('border-b-2', tab === 'upload');
    document.getElementById('uploadTab').classList.toggle('border-blue-600', tab === 'upload');
    document.getElementById('uploadTab').classList.toggle('text-gray-500', tab !== 'upload');

    if (tab === 'camera' && !cameraInitialized) {
        const hasPermission = await checkCameraPermission();
        if (hasPermission) {
            initializeScanner();
        }
    }
}

function showConfirmationModal(url) {
    lastDetectedUrl = url;
    document.getElementById('detectedUrl').textContent = url;
    document.getElementById('confirmationModal').classList.remove('hidden');
    
    if (html5QrcodeScanner) {
        html5QrcodeScanner.pause();
    }
}

function closeModal() {
    document.getElementById('confirmationModal').classList.add('hidden');
    if (html5QrcodeScanner) {
        html5QrcodeScanner.resume();
    }
}

function openDetectedUrl() {
    if (lastDetectedUrl) {
        window.open(lastDetectedUrl, '_blank');
        closeModal();
    }
}

function onScanSuccess(decodedText) {
    showStatus('success', 'QR Code berhasil dipindai!');
    addToHistory(decodedText);
    showConfirmationModal(decodedText);
}

function onScanFailure(error) {
    // Hanya log error, tidak perlu menampilkan ke user untuk menghindari spam
    console.warn(`QR Code scan error: ${error}`);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    showStatus('info', 'Memproses gambar...');

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.scanFile(file, true)
        .then(decodedText => {
            showStatus('success', 'QR Code berhasil dipindai!');
            addToHistory(decodedText);
            showConfirmationModal(decodedText);
        })
        .catch(err => {
            showStatus('error', 'Tidak dapat membaca QR Code dari gambar ini');
        });
}

function showStatus(type, message) {
    const status = document.getElementById('status');
    const statusIcon = document.getElementById('statusIcon');
    const statusMessage = document.getElementById('statusMessage');

    status.classList.remove('hidden');
    statusMessage.textContent = message;

    switch(type) {
        case 'success':
            statusIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
            break;
        case 'error':
            statusIcon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500"></i>';
            break;
        case 'info':
            statusIcon.innerHTML = '<i class="fas fa-info-circle text-blue-500"></i>';
            break;
    }
}

function addToHistory(url) {
    const history = document.getElementById('scanHistory');
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
    item.innerHTML = `
        <span class="text-sm text-gray-600 truncate flex-1">${url}</span>
        <button onclick="window.open('${url}', '_blank')" class="ml-2 text-blue-500 hover:text-blue-700">
            <i class="fas fa-external-link-alt"></i>
        </button>
    `;
    history.insertBefore(item, history.firstChild);
}

// Initialize camera permission check on page load
window.onload = async () => {
    const hasPermission = await checkCameraPermission();
    if (hasPermission) {
        initializeScanner();
    }
};