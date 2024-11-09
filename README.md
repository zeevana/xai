# XAI
**DYOR** Gunakan sesuai research kalaian pribadi agar tidak mengalami kerugian.

## Note
Jangan lupa import private key pada **.env** dan setting sesuai kebutuhan. Setiing pada **main.js** lalu sesuaikan dengan keinginan.

## Cara penginstalan

1. **Impor File**
   Untuk mengunduh repositori, jalankan perintah berikut:
   ```bash
   git clone https://github.com/zeevana/xai.git
   
2. **Navigasi ke Direktori**
   Masuk ke dalam direktori proyek:
    ```bash
    cd zxer
   
3. **Install dependensi**
   Jalankan perintah berikut untuk menginstal dependensi yang diperlukan:
   ```bash
   npm install ethers dotenv readline-sync axios chalk

   
4. **Pengaturan .env**
   Buat file .env di direktori proyek dan tambahkan variabel berikut jika sudah     
   terimport silahkan setting sesuai kebutuhan:
   ```plaintext
   PRIVATE_KEY=your_private_key_here
   TAIKO_RPC_URL=https://rpc.mainnet.taiko.xyz
   AUTH_PASSWORD=your_password_here
   MIN_AMOUNT=0.0003
   MAX_AMOUNT=0.001
   GAS_PRICE_GWEI=0.18

5. **Eksekusi**
   Jalankan skrip dengan perintah berikut:
   ```bash
   node main.js

   
 ## Catatan khusus untuk setiap platform

**Windows**
1. Pastikan Anda memiliki Node.js terinstal.
2. Gunakan Command Prompt atau PowerShell untuk menjalankan perintah di atas.

**Linux**
1. Pastikan Anda memiliki Node.js dan git terinstal.
2. Buka terminal dan jalankan perintah yang tertera.

**Termux**
1. Instal Node.js dan git dengan perintah berikut:
   ```bash
   pkg install nodejs git
2. Lakukan langkah yang sama seperti pada Linux untuk mengunduh dan mengatur proyek.

 
