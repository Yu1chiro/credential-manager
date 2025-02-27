document.addEventListener("DOMContentLoaded", function() {
    const steps = [
        { element: null, intro: 'Selamat datang di Credential Manager, Yuk pelajari fitur"nya!' },
        { element: '#readme', intro: 'Memuat informasi terkait credential manager, silakan baca dokumentasi berikut.' },
        { element: '#important', intro: 'Masukkan informasi credential akun Anda seperti Gmail, sosial media, email pemulihan, dan email sekolah.' },
        { element: '#output', intro: 'Tambahkan gambar untuk mempercantik tampilan barcode Anda!' },
        { element: '#generateBtn', intro: 'Klik tombol ini untuk meng-generate barcode. Pastikan menggunakan PIN unik yang mudah diingat, tapi sulit ditebak!' }
    ];

    if (!localStorage.getItem('tourCompleted')) {
        introJs().setOptions({ steps: steps }).oncomplete(function() {
            localStorage.setItem('tourCompleted', true);
            Swal.fire({
                title: '🎉 Tur Selesai!',
                text: 'Selamat! Anda telah menyelesaikan tur happy coding!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }).start();
    }
});