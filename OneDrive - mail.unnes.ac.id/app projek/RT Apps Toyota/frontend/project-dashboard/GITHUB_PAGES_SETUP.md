# 🚀 Cara Mengaktifkan GitHub Pages

## Langkah-langkah Aktivasi

### 1. Buka Repository Settings

1. Buka browser dan kunjungi: https://github.com/hendradedi/Toyota-Foundation-Project-2026
2. Klik tab **"Settings"** (di bagian atas, sebelah kanan)

### 2. Navigasi ke Pages

1. Di sidebar kiri, scroll ke bawah
2. Klik **"Pages"** (di bagian "Code and automation")

### 3. Konfigurasi Source

Di halaman Pages, Anda akan melihat bagian **"Build and deployment"**:

1. **Source**: Pilih **"GitHub Actions"** dari dropdown
   - JANGAN pilih "Deploy from a branch"
   - HARUS pilih "GitHub Actions"

2. Klik **"Save"** (jika ada tombol save)

### 4. Tunggu Deployment

Setelah mengaktifkan GitHub Actions:

1. Klik tab **"Actions"** di repository Anda
2. Anda akan melihat workflow **"Deploy Project Dashboard"** sedang berjalan
3. Tunggu hingga selesai (biasanya 2-3 menit)
4. Status akan berubah menjadi ✅ hijau jika berhasil

### 5. Akses Dashboard

Setelah deployment selesai, dashboard Anda akan tersedia di:

```
https://hendradedi.github.io/Toyota-Foundation-Project-2026/
```

## Troubleshooting

### Jika GitHub Actions tidak muncul di dropdown

Kemungkinan penyebab:
- Repository masih private (GitHub Pages gratis hanya untuk public repo)
- Workflow files belum ter-push dengan benar

**Solusi:**
1. Pastikan repository adalah **Public**
2. Cek apakah folder `.github/workflows/` ada di repository
3. Refresh halaman Settings → Pages

### Jika workflow gagal

1. Klik tab **"Actions"**
2. Klik pada workflow yang gagal
3. Lihat error log
4. Biasanya error karena:
   - Permissions tidak cukup
   - Build error

**Solusi untuk Permissions:**
1. Go to Settings → Actions → General
2. Scroll ke "Workflow permissions"
3. Pilih **"Read and write permissions"**
4. Centang **"Allow GitHub Actions to create and approve pull requests"**
5. Klik **"Save"**

### Jika halaman masih menampilkan README

Ini normal! Setelah mengaktifkan GitHub Actions:
1. Workflow perlu berjalan dulu (2-3 menit)
2. Setelah selesai, refresh halaman
3. Clear cache browser (Ctrl + Shift + Delete)
4. Buka URL dashboard lagi

## Verifikasi Setup

Untuk memastikan semuanya benar:

1. ✅ Repository: https://github.com/hendradedi/Toyota-Foundation-Project-2026
2. ✅ Settings → Pages → Source = "GitHub Actions"
3. ✅ Actions tab menunjukkan workflow berjalan
4. ✅ Workflow "Deploy Project Dashboard" selesai dengan status hijau
5. ✅ Dashboard URL: https://hendradedi.github.io/Toyota-Foundation-Project-2026/

## Catatan Penting

- **Pertama kali setup**: Butuh 2-5 menit untuk deployment pertama
- **Update otomatis**: Setiap push ke main branch akan auto-deploy
- **Data update**: Dashboard data akan update otomatis setiap 6 jam
- **Cache**: Jika tidak melihat perubahan, clear browser cache

## Kontak

Jika masih ada masalah, screenshot error dari Actions tab dan kirim ke saya.

---

**Dibuat**: 2026-05-15  
**Status**: Siap untuk aktivasi
