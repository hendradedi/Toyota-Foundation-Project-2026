# Regression Test Report - 21 Mei 2026

## Ringkasan Eksekutif

Seluruh pipeline Phase 1 sampai Phase 5 sudah ditelusuri, diperbaiki, dan divalidasi ulang. Hasil akhir menunjukkan sistem **sudah lulus regression test** untuk skenario utama, termasuk autentikasi, role-based flow, endpoint proteksi, dan smoke test dasar.

**Status akhir**: ✅ **PASS**

---

## Hasil Uji Akhir

| Skrip | Status | Ringkasan |
|------|--------|-----------|
| `test_api.ps1` | PASS | Token, profile, refresh, dan logout tervalidasi |
| `test_api_v2.ps1` | PASS | Token, profile, refresh, dan logout tervalidasi |
| `test_all_roles.ps1` | PASS | Super Admin, RT Leader, dan Resident lulus semua tes |
| `test_simple.ps1` | PASS | Health check, login, dan protected endpoints berhasil |

---

## Perbaikan yang Dilakukan

### 1. Startup dan Service Orchestration
- Menormalkan script backend workspace agar semua microservice dapat dijalankan bersama.
- Menyelesaikan konflik port dan proses listener lama yang menyebabkan `EADDRINUSE`.
- Mengaktifkan kembali service inti: API Gateway, User, Administration, Waste Bank, Marketplace, SOS, Patrol, dan Notification.

### 2. API Gateway
- Memperbaiki proxy request body agar POST login/refresh tidak terputus.
- Menyelaraskan request body forwarding menggunakan `fixRequestBody`.

### 3. Database Schema Alignment
- Menjalankan migrasi database untuk menyamakan schema yang dipakai service.
- Menyesuaikan query service terhadap nama kolom/tabel aktual.

### 4. Sinkronisasi Endpoint Test
- Memperbarui skrip test agar memakai endpoint yang memang tersedia.
- Mengganti request yang rawan timeout ke mekanisme yang lebih stabil.
- Menambahkan token-aware flow pada smoke test untuk endpoint protected.

---

## Validasi Endpoint

Endpoint yang tervalidasi dalam regression test akhir:

- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/users/:id`
- `GET /api/waste-bank/categories`
- `GET /api/marketplace/products`
- `GET /api/sos/alerts`
- `GET /api/patrol/shifts`

---

## Temuan Teknis Sebelum Perbaikan

Beberapa masalah utama yang sempat ditemukan:

- Port service bentrok karena proses lama masih aktif.
- Endpoint lama di test script tidak cocok dengan route aktual.
- Query service lama masih mengacu ke kolom/tabel yang berbeda dari schema aktual.
- Payload JSON request dari skrip PowerShell tidak konsisten saat login/refresh.

Semua temuan tersebut sudah ditangani dan diverifikasi ulang.

---

## Kesimpulan

Sistem RT Apps Toyota sekarang berada pada kondisi **siap regression** untuk skenario utama. Semua skrip uji akhir sudah lulus dan alur antar service sudah tersambung.

**Kesimpulan akhir**: ✅ **Phase 1-5 tersambung dan tervalidasi**

---

## Referensi File yang Diubah

- [backend/package.json](backend/package.json)
- [backend/api-gateway/src/middleware/proxy.middleware.ts](backend/api-gateway/src/middleware/proxy.middleware.ts)
- [backend/services/waste-bank-service/src/controllers/waste-category.controller.ts](backend/services/waste-bank-service/src/controllers/waste-category.controller.ts)
- [backend/services/marketplace-service/src/controllers/product.controller.ts](backend/services/marketplace-service/src/controllers/product.controller.ts)
- [backend/services/sos-service/src/controllers/sos.controller.ts](backend/services/sos-service/src/controllers/sos.controller.ts)
- [backend/services/patrol-service/src/controllers/patrol.controller.ts](backend/services/patrol-service/src/controllers/patrol.controller.ts)
- [test_api.ps1](test_api.ps1)
- [test_api_v2.ps1](test_api_v2.ps1)
- [test_all_roles.ps1](test_all_roles.ps1)
- [test_simple.ps1](test_simple.ps1)

*** End Patch