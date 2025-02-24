let html5QrcodeScanner;
        let currentTab = 'camera';
        let lastDetectedUrl = '';

        async function checkCameraPermission() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                return true;
            } catch (err) {
                console.error('Camera permission error:', err);
                return false;
            }
        }

        async function initializeScanner() {
            try {
                const hasPermission = await checkCameraPermission();
                if (!hasPermission) {
                    showStatus('error', 'Tidak dapat mengakses kamera. Mohon berikan izin akses kamera pada browser Anda.');
                    return;
                }

                html5QrcodeScanner = new Html5QrcodeScanner(
                    "reader",
                    { 
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true,
                        rememberLastUsedCamera: true,
                        videoConstraints: {
                            facingMode: { ideal: "environment" }
                        }
                    }
                );
                
                html5QrcodeScanner.render(onScanSuccess, onScanFailure);
            } catch (error) {
                console.error('Scanner initialization error:', error);
                showStatus('error', 'Terjadi kesalahan saat menginisialisasi pemindai. Mohon muat ulang halaman.');
            }
        }

        // Rest of the JavaScript code remains the same
        
        // Add error handling for initialization
        window.onload = async () => {
            try {
                await initializeScanner();
            } catch (error) {
                console.error('Initialization error:', error);
                showStatus('error', 'Gagal menginisialisasi pemindai. Silakan periksa izin kamera Anda.');
            }
        };