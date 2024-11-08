(async () => {
  // Menggunakan dynamic import untuk 'chalk'
  const chalk = (await import('chalk')).default;

  const { ethers } = require('ethers');
  const readlineSync = require('readline-sync');
  require('dotenv').config();
  const fs = require('fs');
  const axios = require('axios');

  // Menampilkan tampilan awal dengan warna menggunakan chalk
  function displayWelcomeMessage() {
    console.log(chalk.green("=================================================="));
    console.log(chalk.green("                  A I   D R O P                   "));
    console.log(chalk.green("=================================================="));
    console.log(chalk.cyan("Join:    https://t.me/ai_drop100"));
    console.log(chalk.cyan("Github:  https://github.com/zeevana"));
    console.log(chalk.green("=================================================="));
    console.log();
  }

  // Fungsi untuk mencatat log aktivitas
  function logActivity(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('activity.log', `${timestamp} - [romd] ${message}\n`);
  }

  // Konfigurasi RPC Taiko dan Wallet
  const provider = new ethers.JsonRpcProvider(process.env.TAIKO_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Kontrak WETH Taiko
  const WETH_ADDRESS = "0xa51894664a773981c6c112c43ce576f315d5b1b6";
  const wethContract = new ethers.Contract(WETH_ADDRESS, [
    "function deposit() public payable",
    "function withdraw(uint256 amount) public",
    "function balanceOf(address account) external view returns (uint256)",
  ], wallet);

  // Konfigurasi jumlah min dan max untuk swap serta gas price (Gwei)
  const MIN_AMOUNT = parseFloat(process.env.MIN_AMOUNT || "0.00005");
  const MAX_AMOUNT = parseFloat(process.env.MAX_AMOUNT || "0.00021");
  const GAS_PRICE_GWEI = parseFloat(process.env.GAS_PRICE_GWEI || "0.13");
  const MIN_ETH_BALANCE = "0.00012"; // Minimum saldo ETH yang harus dijaga (dalam ETH)

  // Validasi nilai konfigurasi
  if (MIN_AMOUNT <= 0 || MAX_AMOUNT <= 0 || MIN_AMOUNT > MAX_AMOUNT) {
    throw new Error('Nilai MIN_AMOUNT atau MAX_AMOUNT tidak valid.');
  }

  // Fungsi untuk mengecek saldo ETH
  async function checkETHBalance() {
    try {
      const balance = await provider.getBalance(wallet.address);
      const balanceInEth = ethers.formatEther(balance);
      return {
        balance: balanceInEth,
        sufficientBalance: parseFloat(balanceInEth) >= parseFloat(MIN_ETH_BALANCE)
      };
    } catch (error) {
      console.error('Error mengecek saldo ETH:', error.message);
      return { balance: '0', sufficientBalance: false };
    }
  }

  // Fungsi untuk mengecek saldo WETH
  async function checkWETHBalance() {
    try {
      const balance = await wethContract.balanceOf(wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error mengecek saldo WETH:', error.message);
      return '0';
    }
  }

  // Fungsi untuk mengambil data profil dan rank dari API Taiko
  async function getTaikoProfile() {
    try {
      const address = wallet.address;  // Ambil alamat dari wallet yang sudah ada
      const url = `https://trailblazer.mainnet.taiko.xyz/s2/user/rank?address=${address}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (response.data) {
        const rank = response.data.rank || 'Tidak ditemukan';
        const score = response.data.score || 'Tidak ditemukan';
        const transaction = response.data.breakdown.find(event => event.event === 'Transaction')?.total_points || 'Tidak ditemukan';
        const txValue = response.data.breakdown.find(event => event.event === 'TransactionValue')?.total_points || 'Tidak ditemukan';
        const blacklisted = response.data.blacklisted ? 'Ya' : 'Tidak';

        // Menampilkan informasi profil dengan format yang diinginkan
        console.log("\n===== Profil Taiko =====");
        console.log(`Address        : ${response.data.address}`);
        console.log(`Rank           : ${rank}`);
        console.log(`Score          : ${score}`);
        console.log(`Transaction    : ${transaction}`);
        console.log(`TxValue        : ${txValue}`);
        console.log(`Blacklisted    : ${blacklisted}`);
        console.log("=========================");
      } else {
        console.log("Profil tidak ditemukan dalam respon API.");
      }
    } catch (error) {
      console.error("Error mengambil data profil Taiko:", error.message);
    }
  }

  // Fungsi delay acak
  function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // Fungsi jumlah acak untuk swap
  function getRandomAmount(min, max) {
    return (Math.random() * (max - min) + min).toFixed(4);
  }

  // Fungsi wrap ETH ke WETH
  async function wrapETH(amount) {
    const gasPrice = ethers.parseUnits(GAS_PRICE_GWEI.toString(), "gwei");

    // Cek saldo ETH sebelum wrap
    const { balance, sufficientBalance } = await checkETHBalance();
    const estimatedGasCost = parseFloat(ethers.formatEther(gasPrice)) * 21000;
    const totalNeeded = parseFloat(amount) + estimatedGasCost;

    if (!sufficientBalance) {
      console.log(`Saldo ETH (${balance} ETH) kurang dari minimum yang dibutuhkan (${MIN_ETH_BALANCE} ETH)`);
      return false;
    }

    if (parseFloat(balance) - totalNeeded < parseFloat(MIN_ETH_BALANCE)) {
      console.log(`Transaksi dibatalkan: Saldo setelah wrap akan kurang dari ${MIN_ETH_BALANCE} ETH`);
      return false;
    }

    try {
      const tx = await wethContract.deposit({
        value: ethers.parseEther(amount),
        gasPrice
      });
      console.log(`Status     : Wrapping ${amount} ETH ke WETH`);
      console.log(`TxHash     : ${tx.hash}`);

      await tx.wait();
      console.log('Status Tx  : Wrap Berhasil');
      logActivity(`Wrap berhasil: ${amount} ETH, TxHash: ${tx.hash}`);
      return true;
    } catch (error) {
      const errorMessage = error.code || error.message.split("(")[0];
      console.error(`Error wrap: ${errorMessage}`);
      logActivity(`Error wrap: ${errorMessage}`);
      return false;
    }
  }

  // Fungsi unwrap WETH ke ETH
  async function unwrapWETH(amount) {
    const gasPrice = ethers.parseUnits(GAS_PRICE_GWEI.toString(), "gwei");

    // Cek saldo ETH untuk biaya gas
    const { balance } = await checkETHBalance();
    const estimatedGasCost = parseFloat(ethers.formatEther(gasPrice)) * 21000;

    if (parseFloat(balance) < estimatedGasCost) {
      console.log(`Saldo ETH   :(${balance} ETH) tidak cukup untuk biaya gas`);
      return false;
    }

    // Cek saldo WETH
    const wethBalance = await checkWETHBalance();
    if (parseFloat(wethBalance) < parseFloat(amount)) {
      console.log(`Saldo WETH  :(${wethBalance} WETH) tidak cukup untuk unwrap ${amount} WETH`);
      return false;
    }

    try {
      const txAmount = ethers.parseEther(amount);
      const tx = await wethContract.withdraw(txAmount, { gasPrice });
      console.log(`Status     : Unwrapping ${amount} WETH ke ETH`);
      console.log(`TxHash     : ${tx.hash}`);

      await tx.wait();
      console.log('Status Tx  : Unwrap Berhasil');
      logActivity(`Unwrap berhasil: ${amount} WETH, TxHash: ${tx.hash}`);
      return true;
    } catch (error) {
      const errorMessage = error.code || error.message.split("(")[0];
      console.error(`Error unwrap : ${errorMessage}`);
      logActivity(`Error unwrap : ${errorMessage}`);
      return false;
    }
  }

  // Fungsi utama untuk eksekusi auto-swap
  async function autoSwap(repeatCount, minDelay, maxDelay) {
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < repeatCount; i++) {
      const amount = getRandomAmount(MIN_AMOUNT, MAX_AMOUNT);
      let success;

      // Cek saldo ETH sebelum setiap transaksi
      const { balance, sufficientBalance } = await checkETHBalance();
      console.log(`\nSaldo ETH  : ${balance} ETH`);

      // Jika saldo ETH di bawah minimum, coba lakukan auto-unwrap
      if (!sufficientBalance) {
        console.log(`Saldo ETH di bawah minimum ${MIN_ETH_BALANCE} ETH. Mencoba auto-unwrap...`);
        const unwrapSuccess = await performAutoUnwrap();

        if (!unwrapSuccess) {
          console.log("Auto-unwrap gagal atau tidak dapat dilakukan. Menghentikan proses.");
          break;
        }

        // Tunggu sejenak setelah auto-unwrap
        const cooldownDelay = 5000; // 5 detik
        console.log(`Menunggu ${cooldownDelay / 1000} detik setelah auto-unwrap...`);
        await new Promise(resolve => setTimeout(resolve, cooldownDelay));

        // Cek ulang saldo setelah auto-unwrap
        const newBalanceCheck = await checkETHBalance();
        if (!newBalanceCheck.sufficientBalance) {
          console.log("Saldo masih di bawah minimum setelah auto-unwrap. Menghentikan proses.");
          break;
        }
      }

      // Pilih untuk melakukan wrap atau unwrap secara acak
      if (Math.random() < 0.5) {
        success = await wrapETH(amount);
      } else {
        success = await unwrapWETH(amount);
      }

      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      const delay = getRandomDelay(minDelay, maxDelay);
      console.log(`Delay      : Menunggu ${delay / 1000} detik`);
      console.log();
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log();
    console.log('==================================================');
    console.log(`\nJumlah transaksi berhasil : ${successCount}`);
    console.log(`Jumlah transaksi gagal    : ${failureCount}`);
    console.log('==================================================');
    console.log();
  }

  // Menambahkan otentikasi sebelum memulai
  const password = readlineSync.question('Masukkan password untuk melanjutkan: ', {
    hideEchoBack: true
  });

  if (password !== process.env.AUTH_PASSWORD) {
    console.log('Password salah! Akses ditolak.');
    return;
  }

  displayWelcomeMessage();

  // Menu pilihan
  async function displayMenu() {
    while (true) {
      console.log("\nPilih tindakan:");
      console.log("1. Cek saldo ETH/WETH");
      console.log("2. Jalankan auto-swap");
      console.log("3. Cek profil Taiko");
      console.log("4. Keluar");

      const choice = readlineSync.questionInt('Masukkan pilihan: ', {
        limit: input => input >= 1 && input <= 4,
        limitMessage: 'Pilihan tidak valid, coba lagi.'
      });

      switch (choice) {
        case 1:
          console.log(`Saldo ETH   : ${await checkETHBalance().then(res => res.balance)} ETH`);
          console.log(`Saldo WETH  : ${await checkWETHBalance()} WETH`);
          break;

        case 2:
          const count = readlineSync.questionInt('Masukkan jumlah transaksi: ', {
            limit: input => input > 0,
            limitMessage: 'Jumlah transaksi tidak valid!'
          });
          const minDelay = 1000;
          const maxDelay = 15000;
          await autoSwap(count, minDelay, maxDelay);
          break;

        case 3:
          await getTaikoProfile();  // Ambil data profil langsung dari wallet
          break;

        case 4:
          console.log("Terima kasih! Sampai jumpa.");
          return;

        default:
          console.log("Pilihan tidak valid.");
      }
    }
  }

  // Menjalankan menu
  displayMenu();
})();
