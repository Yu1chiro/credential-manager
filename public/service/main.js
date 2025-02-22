let qrcode = null;
let editor = null;
// Preview image upload
document.getElementById('qrImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('previewImg');
            previewImg.src = e.target.result;
            document.getElementById('imagePreview').classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
});

// Inisialisasi CKEditor
ClassicEditor
    .create(document.querySelector('#credential'), {
        placeholder: 'Masukkan kredensial Anda di sini...',
        toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'undo', 'redo'],
        removePlugins: ['CKFinderUploadAdapter', 'CKFinder', 'EasyImage', 'Image', 'ImageCaption', 'ImageStyle', 'ImageToolbar', 'ImageUpload', 'MediaEmbed'],
    })
    .then(newEditor => {
        editor = newEditor;
        
        // Tambahan styling untuk container editor
        const editorElement = editor.ui.getEditableElement();
        const editorContainer = editor.ui.view.element;
        
        editorContainer.style.width = '100%';
        editorElement.style.minHeight = '200px';
        editorElement.style.maxHeight = '400px';
        editorElement.style.padding = '1rem';
    })
    .catch(error => {
        console.error(error);
    });

function createQRCode(text, logoUrl = null) {
    const qrcodeDiv = document.getElementById('qrcode');
    qrcodeDiv.innerHTML = '';
    
    qrcode = new QRCode(qrcodeDiv, {
        text: text,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    if (logoUrl) {
        const logoOverlay = document.getElementById('logoOverlay');
        logoOverlay.src = logoUrl;
        logoOverlay.classList.remove('hidden');
        logoOverlay.style.width = '50px';
        logoOverlay.style.height = '50px';
        logoOverlay.style.objectFit = 'contain';
        logoOverlay.style.backgroundColor = 'white';
        logoOverlay.style.padding = '5px';
        logoOverlay.style.borderRadius = '8px';
    }
}

async function downloadQRCode() {
    try {
        const qrContainer = document.getElementById('qrcode');
        const logoOverlay = document.getElementById('logoOverlay');
        const qrImage = qrContainer.querySelector('img');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const scale = 4;
        const padding = 40 * scale;
        const qrSize = 256 * scale;
        
        canvas.width = qrSize + (padding * 2);
        canvas.height = qrSize + (padding * 2);
        
        function roundRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }

        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        const gradientOuter = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradientOuter.addColorStop(0, '#4338CA');
        gradientOuter.addColorStop(1, '#7E22CE');
        ctx.fillStyle = gradientOuter;
        roundRect(ctx, 0, 0, canvas.width, canvas.height, 32 * scale);
        ctx.fill();

        const innerPadding = 20 * scale;
        ctx.fillStyle = 'white';
        roundRect(ctx, 
            innerPadding, 
            innerPadding, 
            canvas.width - (innerPadding * 2), 
            canvas.height - (innerPadding * 2), 
            24 * scale
        );
        ctx.fill();

        const qrCodeImage = await loadImage(qrImage.src);
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = (canvas.height - qrSize) / 2;
        ctx.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);
        
        if (!logoOverlay.classList.contains('hidden')) {
            const logo = await loadImage(logoOverlay.src);
            const logoSize = 60 * scale;
            const logoX = (canvas.width - logoSize) / 2;
            const logoY = (canvas.height - logoSize) / 2;
            
            ctx.save();
            ctx.beginPath();
            roundRect(ctx, logoX, logoY, logoSize, logoSize, 10 * scale);
            ctx.clip();
            
            ctx.fillStyle = 'white';
            ctx.fillRect(logoX, logoY, logoSize, logoSize);
            
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            ctx.restore();
        }
        
        const link = document.createElement('a');
        link.download = 'credential-qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
    } catch (error) {
        console.error('Error downloading QR code:', error);
        Swal.fire({
            title: 'Error',
            text: 'Gagal mendonwload sebagai alternatif silahkan screenshoot hehe, atau gunakan laptop😁',
            icon: 'error',
            confirmButtonText: 'Oke'
          });
    }
}

document.getElementById('downloadPNG').addEventListener('click', downloadQRCode);

document.getElementById('generateBtn').addEventListener('click', () => {
    document.getElementById('pinModal').classList.remove('hidden');
});

document.getElementById('submitPin').addEventListener('click', async () => {
    // Mengambil data dari CKEditor
    const credential = editor.getData();
    const pin = document.getElementById('pin').value;
    const fileInput = document.getElementById('qrImage');

    if (!credential || !pin) {
        alert('Silakan isi kredensial dan PIN');
        return;
    }

    if (pin.length < 6) {
        alert('PIN harus 6 digit');
        return;
    }

    document.getElementById('pinLoadingIndicator').classList.remove('hidden');
    document.getElementById('submitPin').disabled = true;

    try {
        const response = await fetch('/api/save-credential', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential, pin }),
        });

        const data = await response.json();
        
        if (data.userId) {
            document.getElementById('pinModal').classList.add('hidden');
            document.getElementById('loadingIndicator').classList.remove('hidden');
            
            let logoUrl = null;
            if (fileInput.files && fileInput.files[0]) {
                logoUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(fileInput.files[0]);
                });
            }

            createQRCode(`${window.location.origin}/verify.html?id=${data.userId}`, logoUrl);
            
            setTimeout(() => {
                document.getElementById('loadingIndicator').classList.add('hidden');
                document.getElementById('qrcodeContainer').classList.remove('hidden');
                editor.setData(''); // Reset CKEditor
                document.getElementById('pin').value = '';
            }, 1000);
        }
    } catch (error) {
        alert('Terjadi kesalahan: ' + error.message);
    } finally {
        document.getElementById('pinLoadingIndicator').classList.add('hidden');
        document.getElementById('submitPin').disabled = false;
    }
});

// Close modal when clicking outside
document.getElementById('pinModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});