# 🚀 Panduan Menjalankan Digital RT-Muban Admin Dashboard

## FASE B — Frontend Admin Dashboard (Next.js)

### Langkah 1: Install Dependencies

Buka **PowerShell** atau **Command Prompt**, lalu jalankan:

```powershell
cd "c:\Users\hendr\OneDrive - mail.unnes.ac.id\app projek\RT Apps Toyota\frontend\admin-dashboard"
npm install
```

### Langkah 2: Jalankan Development Server

```powershell
npm run dev
```

Admin Dashboard akan berjalan di: **http://localhost:3001**

---

## FASE A — Backend Server (Node.js + PostgreSQL)

### Langkah 1: Setup Environment

```powershell
cd "c:\Users\hendr\OneDrive - mail.unnes.ac.id\app projek\RT Apps Toyota"
copy .env.example .env
```

Edit file `.env` — ubah minimal:
- `DB_PASSWORD` → password PostgreSQL Anda
- `JWT_SECRET` → string random panjang (min 32 karakter)
- `JWT_REFRESH_SECRET` → string random lain

### Langkah 2: Install Backend Dependencies

```powershell
cd backend
npm install

cd shared
npm install
cd ..

cd api-gateway
npm install
cd ..

cd database
npm install
cd ..
```

### Langkah 3: Jalankan Migration Database

```powershell
# Pastikan PostgreSQL sudah berjalan dulu!
cd database
npm run migrate
npm run seed
cd ..
```

### Langkah 4: Jalankan Backend Server

```powershell
cd api-gateway
npm run dev
```

Backend API berjalan di: **http://localhost:3000**

Test health check:
```powershell
curl http://localhost:3000/health
```

---

## FASE C — Docker Full Stack

### Jalankan semua sekaligus (PostgreSQL + Redis + API + Frontend)

```powershell
cd "c:\Users\hendr\OneDrive - mail.unnes.ac.id\app projek\RT Apps Toyota"
docker-compose up -d
```

Akses:
- Admin Dashboard: http://localhost:3001
- API Backend: http://localhost:3000
- pgAdmin: http://localhost:5050
- Redis Commander: http://localhost:8081
- RabbitMQ: http://localhost:15672

Cek status:
```powershell
docker-compose ps
docker-compose logs -f
```

Stop semua:
```powershell
docker-compose down
```

---

## Catatan Penting

⚠️ Untuk **FASE A** tanpa Docker, pastikan PostgreSQL sudah terinstall dan berjalan di port 5432.

💡 **Urutan yang disarankan:**
1. Install npm di admin-dashboard → test tampilan (tanpa backend)
2. Jalankan PostgreSQL → migrate → jalankan backend
3. Test API dengan Postman/Browser
4. Opsional: Docker untuk full production-like environment
