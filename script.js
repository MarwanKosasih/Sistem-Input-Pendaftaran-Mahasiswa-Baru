/* ============================================================
   SCRIPT.JS - Sistem Input Pendaftaran Mahasiswa Baru
   UTS Pemrograman Web II - Universitas Pamulang
   
   File ini berisi seluruh logika bisnis aplikasi:
   - Penyimpanan data sementara menggunakan Array JavaScript
   - Validasi form, kalkulasi nilai, dan penentuan kelulusan
   - Ekstraksi kode pendaftaran (tempat tes & bulan tes)
   - Manajemen tabel (render, hapus, cari)
   - Fitur tambahan: dark mode, jam realtime, toast, cetak
   ============================================================ */

// ============================================================
// VARIABEL GLOBAL
// ============================================================

// Array utama untuk menyimpan seluruh data pendaftaran (pengganti database)
let dataPendaftar = [];

// Referensi elemen-elemen DOM yang sering digunakan
const formEl = document.getElementById('formPendaftaran');
const tabelBody = document.getElementById('tabelBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

// Elemen statistik
const elTotalPendaftar = document.getElementById('totalPendaftar');
const elTotalLulus = document.getElementById('totalLulus');
const elTotalCadangan = document.getElementById('totalCadangan');
const elTotalTidakLulus = document.getElementById('totalTidakLulus');

// ============================================================
// 1. JAM & TANGGAL REALTIME
// Menampilkan jam dan tanggal terkini di navbar
// ============================================================

/** Memperbarui tampilan jam dan tanggal setiap detik */
function updateClock() {
    const now = new Date();

    // Format jam: HH:MM:SS
    const jam = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // Format tanggal: DD NamaBulan YYYY
    const tanggal = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    document.getElementById('realtimeClock').textContent = jam;
    document.getElementById('realtimeDate').textContent = tanggal;
}

// Jalankan segera lalu ulangi setiap 1 detik
updateClock();
setInterval(updateClock, 1000);

// ============================================================
// 2. DARK MODE TOGGLE
// Mengubah tema antarmuka antara terang dan gelap
// ============================================================

const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = document.getElementById('darkModeIcon');

/** Toggle dark mode dan simpan preferensi ke localStorage */
darkModeToggle.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    // Ganti ikon sesuai mode
    darkModeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';

    // Simpan preferensi pengguna
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
});

// Terapkan preferensi dark mode saat halaman dimuat
(function loadDarkModePref() {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeIcon.className = 'fas fa-sun';
    }
})();

// ============================================================
// 3. TOAST NOTIFICATION
// Menampilkan notifikasi bergaya toast modern
// ============================================================

/**
 * Menampilkan toast notification
 * @param {string} message - Pesan yang ditampilkan
 * @param {string} type - Tipe toast: 'success', 'error', atau 'warning'
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');

    // Tentukan ikon berdasarkan tipe
    const icons = {
        success: 'fa-check',
        error: 'fa-exclamation-triangle',
        warning: 'fa-info-circle'
    };

    // Buat elemen toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.success}"></i>
        </div>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Hapus toast setelah 3.5 detik dengan animasi keluar
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ============================================================
// 4. VALIDASI FORM
// Memastikan semua field diisi dengan benar sebelum disimpan
// ============================================================

/**
 * Menampilkan pesan error pada field tertentu
 * @param {string} fieldId - ID elemen input
 * @param {string} errorId - ID elemen pesan error
 * @param {string} message - Pesan error yang ditampilkan
 */
function setError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.add('invalid');
    if (error) error.textContent = message;
}

/** Menghapus pesan error pada field tertentu */
function clearError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.remove('invalid');
    if (error) error.textContent = '';
}

/** Menghapus semua pesan error di form */
function clearAllErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

/**
 * Validasi seluruh form input
 * @returns {boolean} true jika semua field valid, false jika ada yang salah
 */
function validateForm() {
    let isValid = true;
    clearAllErrors();

    // Daftar field yang wajib diisi beserta pesan errornya
    const fields = [
        { id: 'jumlahInput', errId: 'errJumlahInput', msg: 'Jumlah input data wajib diisi' },
        { id: 'kodePendaftaran', errId: 'errKodePendaftaran', msg: 'Kode pendaftaran wajib diisi' },
        { id: 'namaPendaftar', errId: 'errNamaPendaftar', msg: 'Nama pendaftar wajib diisi' },
        { id: 'tempatLahir', errId: 'errTempatLahir', msg: 'Tempat lahir wajib diisi' },
        { id: 'tanggalLahir', errId: 'errTanggalLahir', msg: 'Tanggal lahir wajib diisi' },
        { id: 'asalSekolah', errId: 'errAsalSekolah', msg: 'Asal sekolah wajib diisi' },
        { id: 'pekerjaanOrtu', errId: 'errPekerjaanOrtu', msg: 'Pekerjaan orang tua wajib dipilih' },
        { id: 'nilaiMat', errId: 'errNilaiMat', msg: 'Nilai Matematika wajib diisi' },
        { id: 'nilaiIng', errId: 'errNilaiIng', msg: 'Nilai Bahasa Inggris wajib diisi' },
        { id: 'nilaiUmum', errId: 'errNilaiUmum', msg: 'Nilai Pengetahuan Umum wajib diisi' },
    ];

    // Periksa setiap field
    fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (!el.value.trim()) {
            setError(f.id, f.errId, f.msg);
            isValid = false;
        }
    });

    // Validasi radio button jenis kelamin
    const jenisKelamin = document.querySelector('input[name="jenisKelamin"]:checked');
    if (!jenisKelamin) {
        document.getElementById('errJenisKelamin').textContent = 'Jenis kelamin wajib dipilih';
        isValid = false;
    }

    // Validasi range nilai (0-100)
    ['nilaiMat', 'nilaiIng', 'nilaiUmum'].forEach(id => {
        const val = parseFloat(document.getElementById(id).value);
        const errId = 'err' + id.charAt(0).toUpperCase() + id.slice(1);
        if (!isNaN(val) && (val < 0 || val > 100)) {
            setError(id, errId, 'Nilai harus antara 0 - 100');
            isValid = false;
        }
    });

    return isValid;
}

// ============================================================
// 5. EKSTRAKSI KODE PENDAFTARAN
// Mengurai kode pendaftaran untuk menentukan tempat tes & bulan tes
// Aturan:
//   - 2 karakter pertama menentukan Tempat Tes
//     A = Gedung A, B = Gedung B, V = Viktor
//   - 1 karakter terakhir menentukan Bulan Tes
//   Contoh: A2-101-9 → Tempat Tes: Gedung A, Bulan Tes: 9
// ============================================================

/**
 * Mengekstrak informasi tempat tes dari kode pendaftaran
 * @param {string} kode - Kode pendaftaran (contoh: A2-101-9)
 * @returns {string} Nama tempat tes
 */
function getTempatTes(kode) {
    // Ambil karakter pertama dari kode pendaftaran
    const huruf = kode.charAt(0).toUpperCase();

    // Map huruf ke nama tempat tes
    const tempatMap = {
        'A': 'Gedung A',
        'B': 'Gedung B',
        'V': 'Viktor'
    };

    return tempatMap[huruf] || 'Tidak Diketahui';
}

/**
 * Mengekstrak bulan tes dari karakter terakhir kode pendaftaran
 * @param {string} kode - Kode pendaftaran
 * @returns {string} Bulan tes
 */
function getBulanTes(kode) {
    // Ambil 1 karakter terakhir dari kode
    const bulan = kode.charAt(kode.length - 1);
    return bulan;
}

// ============================================================
// 6. KALKULASI NILAI & PENENTUAN KELULUSAN
// Menghitung rata-rata dan menentukan status kelulusan
// Aturan:
//   - Rata-rata >= 70    → Lulus
//   - Rata-rata 60 - 69  → Cadangan
//   - Rata-rata < 60     → Tidak Lulus
// ============================================================

/**
 * Menghitung nilai rata-rata dari tiga mata ujian
 * @param {number} mat - Nilai Matematika
 * @param {number} ing - Nilai Bahasa Inggris
 * @param {number} umum - Nilai Pengetahuan Umum
 * @returns {number} Nilai rata-rata (2 desimal)
 */
function hitungRataRata(mat, ing, umum) {
    return parseFloat(((mat + ing + umum) / 3).toFixed(2));
}

/**
 * Menentukan keterangan kelulusan berdasarkan rata-rata
 * @param {number} rataRata - Nilai rata-rata
 * @returns {string} 'Lulus', 'Cadangan', atau 'Tidak Lulus'
 */
function getKeterangan(rataRata) {
    if (rataRata >= 70) return 'Lulus';
    if (rataRata >= 60) return 'Cadangan';
    return 'Tidak Lulus';
}

// ============================================================
// 7. FORMAT TANGGAL
// Mengubah format tanggal dari YYYY-MM-DD ke DD-MM-YYYY
// ============================================================

/**
 * Format tanggal ke format Indonesia
 * @param {string} dateStr - Tanggal dalam format YYYY-MM-DD
 * @returns {string} Tanggal dalam format DD-MM-YYYY
 */
function formatTanggal(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

// ============================================================
// 8. SUBMIT FORM & SIMPAN DATA
// Proses pengambilan data dari form, validasi, dan penyimpanan ke array
// ============================================================

formEl.addEventListener('submit', function (e) {
    e.preventDefault(); // Mencegah reload halaman

    // Jalankan validasi
    if (!validateForm()) {
        showToast('Mohon lengkapi semua field yang wajib diisi!', 'error');
        return;
    }

    // Ambil seluruh nilai dari form
    const jumlahInput = parseInt(document.getElementById('jumlahInput').value);
    const kodePendaftaran = document.getElementById('kodePendaftaran').value.trim();
    const namaPendaftar = document.getElementById('namaPendaftar').value.trim();
    const jenisKelamin = document.querySelector('input[name="jenisKelamin"]:checked').value;
    const tempatLahir = document.getElementById('tempatLahir').value.trim();
    const tanggalLahir = document.getElementById('tanggalLahir').value;
    const asalSekolah = document.getElementById('asalSekolah').value.trim();
    const pekerjaanOrtu = document.getElementById('pekerjaanOrtu').value;
    const nilaiMat = parseFloat(document.getElementById('nilaiMat').value);
    const nilaiIng = parseFloat(document.getElementById('nilaiIng').value);
    const nilaiUmum = parseFloat(document.getElementById('nilaiUmum').value);

    // Proses logika bisnis
    const tempatTes = getTempatTes(kodePendaftaran);
    const bulanTes = getBulanTes(kodePendaftaran);
    const rataRata = hitungRataRata(nilaiMat, nilaiIng, nilaiUmum);
    const keterangan = getKeterangan(rataRata);

    // Buat objek data pendaftar baru
    const pendaftar = {
        id: Date.now(), // ID unik berdasarkan timestamp
        jumlahInput,
        kodePendaftaran,
        namaPendaftar,
        jenisKelamin,
        tempatLahir,
        tanggalLahir,
        asalSekolah,
        pekerjaanOrtu,
        nilaiMat,
        nilaiIng,
        nilaiUmum,
        tempatTes,
        bulanTes,
        rataRata,
        keterangan
    };

    // Simpan ke array global
    dataPendaftar.push(pendaftar);

    // Perbarui tampilan tabel dan statistik
    renderTabel();
    updateStatistik();

    // Auto-clear: Reset form setelah data berhasil disimpan
    formEl.reset();
    clearAllErrors();

    // Tampilkan notifikasi sukses
    showToast(`Data "${namaPendaftar}" berhasil disimpan! Status: ${keterangan}`, 'success');
});

// Reset form: bersihkan error saat tombol reset diklik
formEl.addEventListener('reset', function () {
    setTimeout(() => clearAllErrors(), 50);
});

// ============================================================
// 9. RENDER TABEL DATA
// Menampilkan data dari array ke dalam tabel HTML
// ============================================================

/**
 * Render seluruh data pendaftar ke tabel
 * Mendukung filter pencarian jika keyword tersedia
 * @param {string} keyword - Kata kunci pencarian (opsional)
 */
function renderTabel(keyword = '') {
    tabelBody.innerHTML = '';

    // Filter data berdasarkan keyword pencarian
    let dataFiltered = dataPendaftar;
    if (keyword) {
        const lowerKey = keyword.toLowerCase();
        dataFiltered = dataPendaftar.filter(d =>
            d.namaPendaftar.toLowerCase().includes(lowerKey) ||
            d.kodePendaftaran.toLowerCase().includes(lowerKey)
        );
    }

    // Tampilkan/sembunyikan pesan kosong
    if (dataFiltered.length === 0) {
        emptyState.style.display = 'block';
        // Ubah pesan jika sedang mencari
        if (keyword && dataPendaftar.length > 0) {
            emptyState.querySelector('p').textContent = 'Data tidak ditemukan.';
            emptyState.querySelector('span').textContent = `Tidak ada hasil untuk pencarian "${keyword}".`;
        } else {
            emptyState.querySelector('p').textContent = 'Belum ada data pendaftaran.';
            emptyState.querySelector('span').textContent = 'Silakan isi form di atas untuk menambahkan data.';
        }
        return;
    }

    emptyState.style.display = 'none';

    // Render setiap baris data
    dataFiltered.forEach((d, index) => {
        // Tentukan class badge berdasarkan keterangan
        let badgeClass = '';
        if (d.keterangan === 'Lulus') badgeClass = 'badge-lulus';
        else if (d.keterangan === 'Cadangan') badgeClass = 'badge-cadangan';
        else badgeClass = 'badge-gagal';

        // Singkatan jenis kelamin
        const jk = d.jenisKelamin === 'Laki-laki' ? 'L' : 'P';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${d.kodePendaftaran}</strong></td>
            <td>${d.namaPendaftar}</td>
            <td>${jk}</td>
            <td>${d.tempatLahir}, ${formatTanggal(d.tanggalLahir)}</td>
            <td>${d.asalSekolah}</td>
            <td>${d.pekerjaanOrtu}</td>
            <td>${d.tempatTes}</td>
            <td>${d.bulanTes}</td>
            <td>${d.nilaiMat}</td>
            <td>${d.nilaiIng}</td>
            <td>${d.nilaiUmum}</td>
            <td><strong>${d.rataRata}</strong></td>
            <td><span class="badge ${badgeClass}">${d.keterangan}</span></td>
            <td class="no-print">
                <button class="btn-hapus" onclick="hapusData(${d.id})" title="Hapus data">
                    <i class="fas fa-trash-alt"></i> Hapus
                </button>
            </td>
        `;

        // Animasi masuk untuk baris baru
        tr.style.animation = `fadeInUp 0.3s ease ${index * 0.05}s both`;
        tabelBody.appendChild(tr);
    });
}

// ============================================================
// 10. HAPUS DATA
// Menghapus data pendaftar dari array berdasarkan ID unik
// ============================================================

/**
 * Menghapus satu data pendaftar berdasarkan ID
 * @param {number} id - ID unik pendaftar
 */
function hapusData(id) {
    // Cari data yang akan dihapus untuk notifikasi
    const data = dataPendaftar.find(d => d.id === id);
    const nama = data ? data.namaPendaftar : '';

    // Filter: hapus data dengan ID yang cocok
    dataPendaftar = dataPendaftar.filter(d => d.id !== id);

    // Perbarui tampilan
    renderTabel(searchInput.value);
    updateStatistik();

    showToast(`Data "${nama}" berhasil dihapus.`, 'warning');
}

// ============================================================
// 11. UPDATE STATISTIK REAL-TIME
// Menghitung dan menampilkan jumlah pendaftar per kategori
// ============================================================

/** Memperbarui kartu statistik berdasarkan data terkini */
function updateStatistik() {
    const total = dataPendaftar.length;
    const lulus = dataPendaftar.filter(d => d.keterangan === 'Lulus').length;
    const cadangan = dataPendaftar.filter(d => d.keterangan === 'Cadangan').length;
    const tidakLulus = dataPendaftar.filter(d => d.keterangan === 'Tidak Lulus').length;

    // Animasi angka berubah
    animateNumber(elTotalPendaftar, total);
    animateNumber(elTotalLulus, lulus);
    animateNumber(elTotalCadangan, cadangan);
    animateNumber(elTotalTidakLulus, tidakLulus);
}

/**
 * Animasi transisi angka pada kartu statistik
 * @param {HTMLElement} el - Elemen yang menampilkan angka
 * @param {number} target - Angka tujuan
 */
function animateNumber(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const duration = 400; // durasi animasi dalam ms
    const step = (target - current) / (duration / 16);
    let value = current;

    const interval = setInterval(() => {
        value += step;
        if ((step > 0 && value >= target) || (step < 0 && value <= target)) {
            el.textContent = target;
            clearInterval(interval);
        } else {
            el.textContent = Math.round(value);
        }
    }, 16);
}

// ============================================================
// 12. SEARCH / PENCARIAN REAL-TIME
// Memfilter data tabel berdasarkan input pencarian
// ============================================================

searchInput.addEventListener('input', function () {
    renderTabel(this.value.trim());
});

// ============================================================
// 13. CETAK / EXPORT PDF
// Menggunakan window.print() dengan styling @media print CSS
// ============================================================

document.getElementById('btnPrint').addEventListener('click', function () {
    if (dataPendaftar.length === 0) {
        showToast('Tidak ada data untuk dicetak!', 'error');
        return;
    }
    window.print();
});

// ============================================================
// INISIALISASI AWAL
// Memastikan tampilan konsisten saat halaman pertama kali dimuat
// ============================================================
renderTabel();
updateStatistik();
