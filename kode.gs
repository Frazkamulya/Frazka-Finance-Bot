// CONFIG
var BOT_TOKEN = "";
var USERS = [];
var VIEWERS = [];

function doGet(e) {
  return HtmlService.createHtmlOutput('<h1>OK</h1>');
}

function doPost(e) {
  if (e.postData.type == "application/json") {
    let update = JSON.parse(e.postData.contents);

    if (update.callback_query) {
      handleCallbackQuery(update.callback_query);
    } else if (update.message) {
      handleCommands(update);
    }
    return true;
  }
}

function handleCallbackQuery(callbackQuery) {
  let chatId = callbackQuery.message.chat.id;
  let data = callbackQuery.data;
  answerCallbackQuery(callbackQuery.id);

  if (USERS.includes(chatId) || VIEWERS.includes(chatId)) {
    if (data === "/ceksaldo") {
      try {
        const pesan = getDetailedBalanceMessage();
        sendMessage({
          chat_id: chatId,
          text: pesan,
          parse_mode: "Markdown"
        });
      } catch (error) {
        console.error("Error getting detailed balance from callback:", error);
        sendMessage({
          chat_id: chatId,
          text: `❌ Gagal mengambil saldo, sayang. Pastikan sheet 'Dashboard' dan sel-sel yang dibutuhkan sudah benar.`
        });
      }
    } else if (data === "/rekapharian_menu") {
      showRecapMenu(chatId);
    } else if (data === "/rekapharian") {
      showDailyDateSelection(chatId);
    } else if (data.startsWith("/rekapharian_date")) {
      const selectedDate = data.split(" ")[1];
      try {
        const pesan = getDailyExpenseSummaryMessage(new Date(selectedDate));
        sendMessage({
          chat_id: chatId,
          text: pesan,
          parse_mode: "Markdown"
        });
      } catch (error) {
        console.error("Error getting daily expense summary from callback:", error);
        sendMessage({
          chat_id: chatId,
          text: `❌ Gagal mengambil rekap pengeluaran harian untuk tanggal tersebut, sayang.`
        });
      }
    } else if (data === "/rekapbulanan") {
      showMonthlyDateSelection(chatId);
    } else if (data.startsWith("/rekapbulanan_month")) {
      const selectedMonth = data.split(" ")[1];
      showMonthlyDaysSelection(chatId, selectedMonth);
    } else if (data.startsWith("/rekapbulanan_date")) {
      const selectedDate = data.split(" ")[1];
      try {
        const pesan = getDailyExpenseSummaryMessage(new Date(selectedDate));
        sendMessage({
          chat_id: chatId,
          text: pesan,
          parse_mode: "Markdown"
        });
      } catch (error) {
        console.error("Error getting daily expense summary from callback:", error);
        sendMessage({
          chat_id: chatId,
          text: `❌ Gagal mengambil rekap pengeluaran harian untuk tanggal tersebut, sayang.`
        });
      }
    } else if (data === "/format") {
      sendMessage({
        chat_id: chatId,
        text: getFormatMessage(),
        parse_mode: "Markdown"
      });
    } else if (data === "/rekapkategori") {
      sendMessage({
        chat_id: chatId,
        text: "Masukkan bulan dan kategori yang ingin kamu lihat rekapan pengeluarannya dengan format: /rekapkategori Bulan;Kategori\n\nContoh: `/rekapkategori Juli;Makanan`",
        parse_mode: "Markdown"
      });
    } else if (data === "/cari") {
      sendMessage({
        chat_id: chatId,
        text: "Masukkan kata kunci transaksi yang ingin kamu cari dengan format: /cari KataKunci\n\nContoh: `/cari kopi`",
        parse_mode: "Markdown"
      });
    } else if (data === "/hapus") {
      try {
        const berhasilDihapus = deleteLastExpenseEntry();
        if (berhasilDihapus) {
          sendMessage({
            chat_id: chatId,
            text: "✅ Data pengeluaran terakhir berhasil dihapus, sayang."
          });
        } else {
          sendMessage({
            chat_id: chatId,
            text: "⚠️ Tidak ada data untuk dihapus, sayang."
          });
        }
      } catch (error) {
        sendMessage({
          chat_id: chatId,
          text: `❌ Gagal menghapus data. Error: ${error.message}`
        });
      }
    } else if (USERS.includes(chatId)) {
      if (data === "/tambahdata") {
        sendMessage({
          chat_id: chatId,
          text: "Masukkan data pengeluaran dengan format: /tambahdata Transaksi;Uraian;Kategori;Bank;Nilai"
        });
      } else if (data === "/updatepemasukan") {
        sendMessage({
          chat_id: chatId,
          text: "Masukkan data pemasukan bulanan dengan format: /updatepemasukan JenisPemasukan;Nilai\n\nContoh: `/updatepemasukan Gaji Bulanan;5000000`"
        });
      } else if (data === "/updatecash") {
        sendMessage({
          chat_id: chatId,
          text: "Masukkan saldo cash bulanan dengan format: /updatecash Nilai\n\nContoh: `/updatecash 1000000`"
        });
      } else if (data === 'cancel_last_expense') {
        const berhasilDihapus = deleteLastExpenseEntry();
        const messageId = callbackQuery.message.message_id;
        if (berhasilDihapus) {
          editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: '✅ Transaksi berhasil dibatalkan, sayang.',
            reply_markup: { inline_keyboard: [] }
          });
        } else {
          editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: '⚠️ Gagal membatalkan transaksi, sayang. Tidak ada data untuk dihapus.',
            reply_markup: { inline_keyboard: [] }
          });
        }
      } else if (data === 'change_category') {
        const categories = ['Makanan', 'Belanja', 'Tabungan', 'Investasi', 'Dana Darurat', 'Dana Tak Terduga', 'Apart'];
        const keyboard = categories.map(cat => ({ text: cat, callback_data: `update_category_${cat}` }));
        const messageId = callbackQuery.message.message_id;
        editMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: 'Pilih kategori baru, sayang:',
          reply_markup: { inline_keyboard: [keyboard.slice(0, 3), keyboard.slice(3, 6), keyboard.slice(6)] }
        });
      } else if (data.startsWith('update_category_')) {
        const newCategory = data.split('_')[2];
        const success = updateLastExpenseEntry('Kategori', newCategory);
        const messageId = callbackQuery.message.message_id;
        if (success) {
          editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: `✅ Kategori berhasil diperbarui menjadi *${newCategory}*, sayang.`,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [] }
          });
        } else {
          editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: '❌ Gagal memperbarui kategori, sayang.',
            reply_markup: { inline_keyboard: [] }
          });
        }
      } else if (data === 'change_bank') {
        const banks = ['BRI', 'BCA', 'BNI', 'Jago', 'Sea Bank'];
        const keyboard = banks.map(bank => ({ text: bank, callback_data: `update_bank_${bank}` }));
        const messageId = callbackQuery.message.message_id;
        editMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: 'Pilih bank baru, sayang:',
          reply_markup: { inline_keyboard: [keyboard.slice(0, 3), keyboard.slice(3, 5)] }
        });
      } else if (data.startsWith('update_bank_')) {
        const newBank = data.split('_')[2];
        const success = updateLastExpenseEntry('Bank', newBank);
        const messageId = callbackQuery.message.message_id;
        if (success) {
          editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: `✅ Bank berhasil diperbarui menjadi *${newBank}*, sayang.`,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [] }
          });
        } else {
          editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text: '❌ Gagal memperbarui bank, sayang.',
            reply_markup: { inline_keyboard: [] }
          });
        }
      } else if (data === "/analisis") {
        try {
          const pesan = getMonthlyAnalysisMessage();
          sendMessage({
            chat_id: chatId,
            text: pesan,
            parse_mode: "Markdown"
          });
        } catch (error) {
          console.error("Error getting monthly analysis:", error);
          sendMessage({
            chat_id: chatId,
            text: `❌ Gagal mengambil laporan analisis, sayang. Pastikan sheet 'Expenses' sudah terisi.`
          });
        }
      } else {
        sendMessage({
          chat_id: chatId,
          text: "Maaf, aku tidak mengerti perintah itu. Silakan gunakan menu yang ada."
        });
      }
    } else {
      sendMessage({
        chat_id: chatId,
        text: "Maaf, hanya Frazka yang bisa menggunakan perintah ini, sayang."
      });
    }
  } else {
    sendMessage({
      chat_id: chatId,
      text: "🚫 Anda tidak memiliki akses untuk menggunakan bot ini, sayang."
    });
  }
}

function handleCommands(update) {
  let chatId = update.message.chat.id;
  let first_name = update.message.chat.first_name;
  let text = update.message.text || '';

  if (USERS.includes(chatId) || VIEWERS.includes(chatId)) {
    if (text.startsWith("/start")) {
      const happyEmojis = ["💖", "🥰", "❤️", "💕"];
      const randomHappyEmoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
      sendMessage({
        chat_id: chatId,
        text: `🙋🏽 Halo, Frazka sayang ${randomHappyEmoji}!\n\nSelamat datang di Bot-mu! Silakan pilih perintah di bawah ini:`,
        reply_markup: {
          inline_keyboard: [
            [{ text: "Tambah Pengeluaran", callback_data: "/tambahdata" }],
            [{ text: "Update Pemasukan", callback_data: "/updatepemasukan" }],
            [{ text: "Update Cash", callback_data: "/updatecash" }],
            [{ text: "Cek Laporan Saldo", callback_data: "/ceksaldo" }],
            [{ text: "Rekap Pengeluaran", callback_data: "/rekapharian_menu" }],
            [{ text: "Analisis Keuangan", callback_data: "/analisis" }],
            [{ text: "Rekap per Kategori", callback_data: "/rekapkategori" }],
            [{ text: "Cari Transaksi", callback_data: "/cari" }],
            [{ text: "Hapus Data Terakhir", callback_data: "/hapus" }],
            [{ text: "Format Data", callback_data: "/format" }]
          ]
        }
      });
    } else if (USERS.includes(chatId)) {
      if (text.startsWith("/cepat")) {
        const valueString = text.split(" ")[1];
        if (valueString) {
          const value = parseFloat(valueString);
          if (!isNaN(value)) {
            handleQuickExpense(chatId, value);
          } else {
            sendMessage({
              chat_id: chatId,
              text: `⚠️ Format nilai pengeluaran salah, sayang. Contoh: /cepat 25000`
            });
          }
        } else {
          sendMessage({
            chat_id: chatId,
            text: `⚠️ Silakan masukkan nilai pengeluaran setelah perintah, sayang. Contoh: /cepat 25000`
          });
        }
      } else if (text.startsWith("/hapus")) {
        try {
          const berhasilDihapus = deleteLastExpenseEntry();
          if (berhasilDihapus) {
            sendMessage({
              chat_id: chatId,
              text: "✅ Data pengeluaran terakhir berhasil dihapus, sayang."
            });
          } else {
            sendMessage({
              chat_id: chatId,
              text: "⚠️ Tidak ada data untuk dihapus, sayang."
            });
          }
        } catch (error) {
          sendMessage({
            chat_id: chatId,
            text: `❌ Gagal menghapus data. Error: ${error.message}`
          });
        }
      } else if (text.startsWith("/tambahdata")) {
        const dataString = text.split(" ").slice(1).join(" ");
        if (dataString) {
          const dataArray = dataString.split(";");
          if (dataArray.length === 5) {
            const [transaksi, uraian, kategori, bank, nilai] = dataArray;
            const numericValue = parseFloat(nilai);

            if (numericValue > 500000) {
              const angryEmojis = ["😡", "😠", "💢", "🤬"];
              const randomAngryEmoji = angryEmojis[Math.floor(Math.random() * angryEmojis.length)];
              sendMessage({
                chat_id: chatId,
                text: `${randomAngryEmoji} Sayang, pengeluaranmu ini besar banget! Apa benar-benar butuh? Lebih bijak lagi ya dalam mengelola uang. Aku mau lihat kamu sukses! 😊`
              });
            }

            const now = new Date();
            const tanggal = now.getDate().toString().padStart(2, '0');
            const bulan = (now.getMonth() + 1).toString().padStart(2, '0');
            const tahun = now.getFullYear();
            const data = {
              Tanggal: tanggal,
              Bulan: bulan,
              Tahun: tahun,
              Transaksi: transaksi,
              Uraian: uraian,
              Kategori: kategori,
              Bank: bank,
              Nilai: nilai
            };
            try {
              addDataToSheet(data);
              const happyEmojis = ["🥳", "🎉", "👏", "✅"];
              const randomHappyEmoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
              sendMessage({
                chat_id: chatId,
                text: `${randomHappyEmoji} Data pengeluaran berhasil ditambahkan, sayang: ${dataString}`
              });
            } catch (error) {
              console.error("Error adding data to Expenses sheet:", error);
              sendMessage({
                chat_id: chatId,
                text: `❌ Gagal menambahkan data pengeluaran, sayang. Silakan coba lagi.`
              });
            }
          } else {
            sendMessage({
              chat_id: chatId,
              text: `⚠️ Format data pengeluaran salah, sayang. Pastikan kamu pakai format: /tambahdata Transaksi;Uraian;Kategori;Bank;Nilai`
            });
          }
        } else {
          sendMessage({
            chat_id: chatId,
            text: `⚠️ Silakan masukkan data setelah perintah, sayang. Contoh: /tambahdata Transaksi;Uraian;Kategori;Bank;Nilai`
          });
        }
      } else if (text.startsWith("/updatepemasukan")) {
        const dataString = text.split(" ").slice(1).join(" ");
        if (dataString) {
          const dataArray = dataString.split(";");
          if (dataArray.length === 2) {
            const [jenisPemasukan, nilai] = dataArray;
            try {
              updateMonthlyIncome(jenisPemasukan.trim(), parseFloat(nilai));
              const happyEmojis = ["🥳", "🎉", "👏", "✅"];
              const randomHappyEmoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
              sendMessage({
                chat_id: chatId,
                text: `${randomHappyEmoji} Pemasukan '${jenisPemasukan.trim()}' berhasil diupdate untuk bulan ini menjadi ${parseFloat(nilai).toLocaleString('id-ID', {style: 'currency', currency: 'IDR'})}, sayang.`
              });
            } catch (error) {
              console.error("Error updating monthly income:", error);
              sendMessage({
                chat_id: chatId,
                text: `❌ Gagal mengupdate pemasukan bulanan. Error: ${error.message}. Pastikan 'Jenis Pemasukan' benar dan nilai numerik, sayang.`
              });
            }
          } else {
            sendMessage({
              chat_id: chatId,
              text: `⚠️ Format update pemasukan salah, sayang. Pastikan kamu pakai format: /updatepemasukan JenisPemasukan;Nilai\n\nContoh: \`/updatepemasukan Gaji Bulanan;5000000\``,
              parse_mode: "Markdown"
            });
          }
        } else {
          sendMessage({
            chat_id: chatId,
            text: `⚠️ Silakan masukkan data setelah perintah, sayang. Contoh: \`/updatepemasukan Gaji Bulanan;5000000\``,
            parse_mode: "Markdown"
          });
        }
      } else if (text.startsWith("/updatecash")) {
        const valueString = text.split(" ")[1];
        if (valueString) {
          const value = parseFloat(valueString);
          if (!isNaN(value)) {
            try {
              updateMonthlyCash(value);
              sendMessage({
                chat_id: chatId,
                text: `✅ Saldo cash berhasil diupdate menjadi ${value.toLocaleString('id-ID', {style: 'currency', currency: 'IDR'})}, sayang.`
              });
            } catch (error) {
              console.error("Error updating monthly cash:", error);
              sendMessage({
                chat_id: chatId,
                text: `❌ Gagal mengupdate saldo cash. Error: ${error.message}.`
              });
            }
          } else {
            sendMessage({
              chat_id: chatId,
              text: `⚠️ Format nilai cash salah, sayang. Pastikan kamu pakai format: /updatecash Nilai`
            });
          }
        } else {
          sendMessage({
            chat_id: chatId,
            text: `⚠️ Silakan masukkan nilai cash setelah perintah, sayang. Contoh: \`/updatecash 1000000\``,
            parse_mode: "Markdown"
          });
        }
      } else if (text.startsWith("/ceksaldo")) {
        try {
          const pesan = getDetailedBalanceMessage();
          sendMessage({
            chat_id: chatId,
            text: pesan,
            parse_mode: "Markdown"
          });
        } catch (error) {
          console.error("Error getting detailed balance:", error);
          sendMessage({
            chat_id: chatId,
            text: `❌ Gagal mengambil saldo, sayang. Pastikan sheet 'Dashboard' dan sel-sel yang dibutuhkan sudah benar.`
          });
        }
      } else if (text.startsWith("/rekapkategori")) {
        const dataString = text.split(" ").slice(1).join(" ");
        if (dataString) {
          const dataArray = dataString.split(";");
          if (dataArray.length === 2) {
            const [bulan, kategori] = dataArray;
            try {
              const pesan = getCategoryExpenseSummaryMessage(bulan.trim(), kategori.trim());
              sendMessage({
                chat_id: chatId,
                text: pesan,
                parse_mode: "Markdown"
              });
            } catch (error) {
              console.error("Error getting category expense summary:", error);
              sendMessage({
                chat_id: chatId,
                text: `❌ Gagal mengambil rekap pengeluaran per kategori, sayang. Pastikan format bulan dan nama kategori sudah benar.`
              });
            }
          } else {
            sendMessage({
              chat_id: chatId,
              text: `⚠️ Format rekap per kategori salah, sayang. Pastikan kamu pakai format: /rekapkategori Bulan;Kategori\n\nContoh: \`/rekapkategori Juli;Makanan\``,
              parse_mode: "Markdown"
            });
          }
        } else {
          sendMessage({
            chat_id: chatId,
            text: `⚠️ Silakan masukkan data setelah perintah, sayang. Contoh: \`/rekapkategori Juli;Makanan\``,
            parse_mode: "Markdown"
          });
        }
      } else if (text.startsWith("/cari")) {
        const keyword = text.split(" ").slice(1).join(" ");
        if (keyword) {
          try {
            const pesan = searchTransactions(keyword.trim());
            sendMessage({
              chat_id: chatId,
              text: pesan,
              parse_mode: "Markdown"
            });
          } catch (error) {
            console.error("Error searching transactions:", error);
            sendMessage({
              chat_id: chatId,
              text: `❌ Gagal mencari transaksi, sayang. Terjadi kesalahan saat memproses data.`
            });
          }
        } else {
          sendMessage({
            chat_id: chatId,
            text: `⚠️ Silakan masukkan kata kunci setelah perintah, sayang. Contoh: \`/cari kopi\``,
            parse_mode: "Markdown"
          });
        }
      } else if (text.startsWith("/rekapharian_menu")) {
        showRecapMenu(chatId);
      } else if (text.startsWith("/format")) {
        sendMessage({
          chat_id: chatId,
          text: getFormatMessage(),
          parse_mode: "Markdown"
        });
      } else if (text.startsWith("/analisis")) {
        try {
          const pesan = getMonthlyAnalysisMessage();
          sendMessage({
            chat_id: chatId,
            text: pesan,
            parse_mode: "Markdown"
          });
        } catch (error) {
          console.error("Error getting monthly analysis:", error);
          sendMessage({
            chat_id: chatId,
            text: `❌ Gagal mengambil laporan analisis, sayang. Pastikan sheet 'Expenses' sudah terisi.`
          });
        }
      } else {
        let lowerText = text.toLowerCase();
        let responses = [];
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const dashboardSheet = ss.getSheetByName("Dashboard");
        const tabungan = dashboardSheet.getRange("L12").getValue();
        const tabunganFormatted = tabungan.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

        if (lowerText.includes("hemat") || lowerText.includes("nabung") || lowerText.includes("menikah")) {
          const happyEmojis = ["💖", "🥰", "❤️", "💕"];
          const randomHappyEmoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
          responses = [
            `Semangat terus ya, sayang ${randomHappyEmoji}! Menabung memang butuh perjuangan, tapi hasilnya indah. Tabunganmu sekarang sudah ${tabunganFormatted}.`,
            `Hebat! Aku bangga banget lihat kamu konsisten menabung. Tabunganmu sekarang sudah ${tabunganFormatted}.`,
            `Jangan pantang menyerah, sayang. Katanya mau punya rumah dan menabung untuk menikah, kan? Tabunganmu sekarang sudah ${tabunganFormatted}.`,
            `Terus pertahankan kebiasaan baik ini, sayang. Tabunganmu sekarang sudah ${tabunganFormatted}.`
          ];
        } else if (lowerText.includes("keluar uang") || lowerText.includes("boros")) {
          const sadEmojis = ["😟", "🥺", "💔", "😥"];
          const randomSadEmoji = sadEmojis[Math.floor(Math.random() * sadEmojis.length)];
          responses = [
            `Santai, sayang. Pengeluaran yang penting itu bukan boros kok. 😉`,
            `Jangan sedih, sayang ${randomSadEmoji}. Aku tahu kamu bisa bijak. Tetap semangat!`,
            `Gak apa-apa, sayang. Yang penting kamu tahu mana yang prioritas. Rejeki pasti datang lagi!`
          ];
        } else {
          const friendlyEmojis = ["😊", "😉", "🙂", "👍"];
          const randomFriendlyEmoji = friendlyEmojis[Math.floor(Math.random() * friendlyEmojis.length)];
          responses = [
            `Hai, sayang ${randomFriendlyEmoji}. Apa ada yang bisa aku bantu?`,
            `Aku di sini untuk bantu kamu mengelola keuangan, sayang. Gunakan menu di bawah ya!`,
            `Silakan gunakan menu di bawah untuk mulai mencatat, sayang. 😉`
          ];
        }

        let randomResponse = responses[Math.floor(Math.random() * responses.length)];
        sendMessage({
          chat_id: chatId,
          text: randomResponse
        });
      }
    } else if (VIEWERS.includes(chatId)) {
      if (text.startsWith("/ceksaldo")) {
        try {
          const pesan = getDetailedBalanceMessage();
          sendMessage({
            chat_id: chatId,
            text: pesan,
            parse_mode: "Markdown"
          });
        } catch (error) {
          console.error("Error getting detailed balance:", error);
          sendMessage({
            chat_id: chatId,
            text: `❌ Gagal mengambil saldo, sayang. Pastikan sheet 'Dashboard' dan sel-sel yang dibutuhkan sudah benar.`
          });
        }
      } else if (text.startsWith("/rekapharian_menu")) {
        showRecapMenu(chatId);
      } else if (text.startsWith("/rekapkategori")) {
        const dataString = text.split(" ").slice(1).join(" ");
        if (dataString) {
          const dataArray = dataString.split(";");
          if (dataArray.length === 2) {
            const [bulan, kategori] = dataArray;
            try {
              const pesan = getCategoryExpenseSummaryMessage(bulan.trim(), kategori.trim());
              sendMessage({
                chat_id: chatId,
                text: pesan,
                parse_mode: "Markdown"
              });
            } catch (error) {
              console.error("Error getting category expense summary:", error);
              sendMessage({
                chat_id: chatId,
                text: `❌ Gagal mengambil rekap pengeluaran per kategori, sayang. Pastikan format bulan dan nama kategori sudah benar.`
              });
            }
          } else {
            sendMessage({
              chat_id: chatId,
              text: `⚠️ Format rekap per kategori salah, sayang. Pastikan kamu pakai format: /rekapkategori Bulan;Kategori\n\nContoh: \`/rekapkategori Juli;Makanan\``,
              parse_mode: "Markdown"
            });
          }
        } else {
          sendMessage({
            chat_id: chatId,
            text: `⚠️ Silakan masukkan data setelah perintah, sayang. Contoh: \`/rekapkategori Juli;Makanan\``,
            parse_mode: "Markdown"
          });
        }
      } else if (text.startsWith("/cari")) {
        const keyword = text.split(" ").slice(1).join(" ");
        if (keyword) {
          try {
            const pesan = searchTransactions(keyword.trim());
            sendMessage({
              chat_id: chatId,
              text: pesan,
              parse_mode: "Markdown"
            });
          } catch (error) {
            console.error("Error searching transactions:", error);
            sendMessage({
              chat_id: chatId,
              text: `❌ Gagal mencari transaksi, sayang. Terjadi kesalahan saat memproses data.`
            });
          }
        } else {
          sendMessage({
            chat_id: chatId,
            text: `⚠️ Silakan masukkan kata kunci setelah perintah, sayang. Contoh: \`/cari kopi\``,
            parse_mode: "Markdown"
          });
        }
      } else if (text.startsWith("/format")) {
        sendMessage({
          chat_id: chatId,
          text: getFormatMessage(),
          parse_mode: "Markdown"
        });
      } else if (text.startsWith("/analisis")) {
        try {
          const pesan = getMonthlyAnalysisMessage();
          sendMessage({
            chat_id: chatId,
            text: pesan,
            parse_mode: "Markdown"
          });
        } catch (error) {
          console.error("Error getting monthly analysis:", error);
          sendMessage({
            chat_id: chatId,
            text: `❌ Gagal mengambil laporan analisis, sayang. Pastikan sheet 'Expenses' sudah terisi.`
          });
        }
      } else {
        sendMessage({
          chat_id: chatId,
          text: "Maaf, hanya Frazka yang bisa menggunakan perintah ini, sayang."
        });
      }
    } else {
      sendMessage({
        chat_id: chatId,
        text: "Maaf, hanya Frazka yang bisa menggunakan perintah ini, sayang."
      });
    }
  } else {
    sendMessage({
      chat_id: chatId,
      text: "🚫 Anda tidak memiliki akses untuk menggunakan bot ini, sayang."
    });
  }
}

function answerCallbackQuery(callbackQueryId) {
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({
      callback_query_id: callbackQueryId
    }),
  };
  UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, options);
}

function sendMessage(postdata) {
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(postdata),
    'muteHttpExceptions': true
  };
  UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, options);
}

function editMessageText(postdata) {
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(postdata),
    'muteHttpExceptions': true
  };
  UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, options);
}

function getFormatMessage() {
  return `
*Panduan Lengkap untuk Format Data:*

*1. Jenis Transaksi:*
    - Pilihan: \`Transfer\` atau \`Cash\`

*2. Daftar Bank:*
    - Pilihan: \`BRI\`, \`BCA\`, \`BNI\`, \`Jago\`, \`Sea Bank\`

*3. Daftar Kategori Pengeluaran:*
    - Pilihan: \`Makanan\`, \`Belanja\`, \`Tabungan\`, \`Investasi\`, \`Dana Darurat\`, \`Dana Tak Terduga\`, \`Apart\`

*4. Contoh Penggunaan Perintah:*
    - \`/tambahdata\` *[Transaksi;Uraian;Kategori;Bank;Nilai]*
      \`\`\`
      /tambahdata Cash;Beli kopi;Makanan;BCA;25000
      \`\`\`
    - \`/updatepemasukan\` *[JenisPemasukan;Nilai]*
      \`\`\`
      /updatepemasukan Gaji Bulanan;5000000
      \`\`\`
    - \`/updatecash\` *[Nilai]*
      \`\`\`
      /updatecash 1000000
      \`\`\`
    - \`/rekapkategori\` *[Bulan;Kategori]*
      \`\`\`
      /rekapkategori Juli;Makanan
      \`\`\`
    - \`/cari\` *[KataKunci]*
      \`\`\`
      /cari kopi
      \`\`\`
    - \`/hapus\`
      *Perintah ini akan menghapus data pengeluaran terakhir yang Anda masukkan.*
`;
}

function addDataToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
  if (!sheet) {
    throw new Error("Sheet 'Expenses' tidak ditemukan. Pastikan nama sheet sudah benar.");
  }

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthIndex = parseInt(data.Bulan) - 1;
  const formattedDate = `${data.Tanggal} ${monthNames[monthIndex]} ${new Date().getFullYear()}`;
  const formattedValue = parseFloat(data.Nilai).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).replace('IDR', '').trim();

  const range = sheet.getRange("A2:I999");
  const values = range.getValues();

  let emptyRow = null;
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === false && values[i].slice(1).every(cell => cell === "")) {
      emptyRow = i + 2;
      break;
    }
  }

  if (emptyRow) {
    sheet.getRange(emptyRow, 1, 1, 9).setValues([
      [
        false,
        formattedDate,
        monthNames[monthIndex],
        data.Transaksi,
        data.Uraian,
        data.Kategori,
        data.Bank,
        formattedValue,
        data.Tahun
      ]
    ]);
  } else {
    throw new Error("Tidak ada baris kosong yang tersedia di sheet 'Expenses' antara baris 2 hingga 999.");
  }
}

function updateMonthlyIncome(incomeType, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = ss.getSheetByName("Dashboard").getRange("J3").getValue();
  const incomeSheet = ss.getSheetByName("Income " + year);
  
  if (!incomeSheet) {
    throw new Error(`Sheet 'Income ${year}' tidak ditemukan. Pastikan sheet sudah dibuat.`);
  }

  const headerRow = 3;
  const incomeTypeCol = 1;
  const incomeTypesRange = incomeSheet.getRange(headerRow + 1, incomeTypeCol, incomeSheet.getLastRow() - headerRow, 1);
  const existingIncomeTypes = incomeTypesRange.getValues();

  let targetRow = -1;
  for (let i = 0; i < existingIncomeTypes.length; i++) {
    if (existingIncomeTypes[i][0] && existingIncomeTypes[i][0].toString().trim().toLowerCase() === incomeType.toLowerCase()) {
      targetRow = headerRow + 1 + i;
      break;
    }
  }

  if (targetRow === -1) {
    throw new Error(`Jenis Pemasukan '${incomeType}' tidak ditemukan di Kolom A sheet 'Income ${year}'.`);
  }

  const currentMonth = new Date().getMonth();
  const targetCol = 3 + currentMonth;

  if (isNaN(value)) {
    throw new Error("Nilai pemasukan harus numerik.");
  }
  
  incomeSheet.getRange(targetRow, targetCol).setValue(value);
}

function updateMonthlyCash(value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = ss.getSheetByName("Dashboard").getRange("J3").getValue();
  const incomeSheet = ss.getSheetByName("Income " + year);

  if (!incomeSheet) {
    throw new Error(`Sheet 'Income ${year}' tidak ditemukan. Pastikan sheet sudah dibuat.`);
  }

  const currentMonth = new Date().getMonth();
  const targetCol = 3 + currentMonth;
  const cashRow = 25;

  if (isNaN(value)) {
    throw new Error("Nilai cash harus numerik.");
  }

  // Ambil nilai lama dari sel
  const existingValue = incomeSheet.getRange(cashRow, targetCol).getValue();

  // Tambahkan nilai baru dengan nilai lama
  const newValue = (typeof existingValue === 'number') ? existingValue + value : value;

  // Tetapkan nilai total ke dalam sel
  incomeSheet.getRange(cashRow, targetCol).setValue(newValue);
}

function getGreetingByTime() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return "Selamat pagi";
  } else if (hour >= 11 && hour < 15) {
    return "Selamat siang";
  } else if (hour >= 15 && hour < 18) {
    return "Selamat sore";
  } else {
    return "Selamat malam";
  }
}

function getDetailedBalanceMessage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboardSheet = ss.getSheetByName("Dashboard");
  
  if (!dashboardSheet) {
    throw new Error("Sheet 'Dashboard' tidak ditemukan.");
  }

  const sisaUangMB = dashboardSheet.getRange("L7").getValue();
  const sisaMakanan = dashboardSheet.getRange("L10").getValue();
  const sisaBelanja = dashboardSheet.getRange("L11").getValue();
  const sisaTabungan = dashboardSheet.getRange("L12").getValue();
  const sisaInvestasi = dashboardSheet.getRange("L13").getValue();
  const sisaDanaDarurat = dashboardSheet.getRange("L14").getValue();
  const sisaDanaTakTerduga = dashboardSheet.getRange("L15").getValue();
  const sisaApart = dashboardSheet.getRange("L16").getValue();

  const totalSisa = sisaUangMB + sisaMakanan + sisaBelanja + sisaTabungan + sisaInvestasi + sisaDanaDarurat + sisaDanaTakTerduga + sisaApart;

  const toRupiah = (value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  
  const happyEmojis = ["💖", "🥰", "❤️", "💕"];
  const randomHappyEmoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
  const greeting = getGreetingByTime();
  const pesan = `
*Halo, ${greeting} sayang ${randomHappyEmoji}!*
*Ini adalah laporan saldo kamu untuk hari ini:*
*--- ☀️ Laporan Saldo Harian ☀️ ---*

*Saldo per Tanggal ${new Date().toLocaleDateString('id-ID')}*

💰 *Sisa Uang M & B:* ${toRupiah(sisaUangMB)}
  - Makanan: ${toRupiah(sisaMakanan)}
  - Belanja: ${toRupiah(sisaBelanja)}
  
💳 *Sisa Saldo Alokasi Lainnya:*
  - Tabungan: ${toRupiah(sisaTabungan)}
  - Investasi: ${toRupiah(sisaInvestasi)}
  - Dana Darurat: ${toRupiah(sisaDanaDarurat)}
  - Dana Tak Terduga: ${toRupiah(sisaDanaTakTerduga)}
  - Bayar Apart: ${toRupiah(sisaApart)}

*---*

*Saldo Keseluruhan Anda:* ${toRupiah(totalSisa)}
  `;

  return pesan;
}

function getDailyExpenseSummaryMessage(date) {
  const expensesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
  const dashboardSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard");
  
  if (!expensesSheet || !dashboardSheet) {
    throw new Error("Sheet 'Expenses' atau 'Dashboard' tidak ditemukan.");
  }
  
  const timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const selectedDateFormatted = Utilities.formatDate(date, timeZone, 'dd MMMM yyyy');
  let totalPengeluaran = 0;
  let rincianPengeluaran = "";
  
  const data = expensesSheet.getRange(2, 2, expensesSheet.getLastRow() - 1, 7).getValues();
  
  data.forEach(row => {
    const transactionDate = new Date(row[0]);
    const transactionDateFormatted = Utilities.formatDate(transactionDate, timeZone, 'dd MMMM yyyy');
    const uraian = row[3];
    const kategori = row[4];
    const nilai = parseFloat(row[6]);

    if (transactionDateFormatted === selectedDateFormatted && !isNaN(nilai)) {
      totalPengeluaran += nilai;
      rincianPengeluaran += `    - ${uraian} (${kategori}) sebesar ${nilai.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}\n`;
    }
  });

  const toRupiah = (value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  const greeting = getGreetingByTime();
  
  let pesan = `
*Halo sayang! ${greeting}. Ini adalah rekap pengeluaran kamu untuk ${selectedDateFormatted}:*
    
*Total pengeluaranmu:* ${toRupiah(totalPengeluaran)}
    
*Rincian:*
${rincianPengeluaran || '    _Tidak ada pengeluaran di tanggal ini._'}
`;

  const sisaMakanan = dashboardSheet.getRange("L10").getValue();
  const sisaBelanja = dashboardSheet.getRange("L11").getValue();
  const sisaTabungan = dashboardSheet.getRange("L12").getValue();
  const sisaInvestasi = dashboardSheet.getRange("L13").getValue();
  const sisaDanaDarurat = dashboardSheet.getRange("L14").getValue();
  const sisaDanaTakTerduga = dashboardSheet.getRange("L15").getValue();
  const sisaApart = dashboardSheet.getRange("L16").getValue();

  const warnings = [];

  if (sisaMakanan < 0) {
    warnings.push(`*Makanan* kamu sudah **minus** ${toRupiah(Math.abs(sisaMakanan))}`);
  }
  if (sisaBelanja < 0) {
    warnings.push(`*Belanja* kamu sudah **minus** ${toRupiah(Math.abs(sisaBelanja))}`);
  }
  if (sisaTabungan < 0) {
    warnings.push(`*Tabungan* kamu sudah **minus** ${toRupiah(Math.abs(sisaTabungan))}`);
  }
  if (sisaInvestasi < 0) {
    warnings.push(`*Investasi* kamu sudah **minus** ${toRupiah(Math.abs(sisaInvestasi))}`);
  }
  if (sisaDanaDarurat < 0) {
    warnings.push(`*Dana Darurat* kamu sudah **minus** ${toRupiah(Math.abs(sisaDanaDarurat))}`);
  }
  if (sisaApart < 0) {
    warnings.push(`*Apart* kamu sudah **minus** ${toRupiah(Math.abs(sisaApart))}`);
  }

  if (warnings.length > 0) {
    const warningEmojis = ["⚠️", "🚨", "😱", "💔"];
    const randomWarningEmoji = warningEmojis[Math.floor(Math.random() * warnings.length)];
    pesan += `
---
${randomWarningEmoji} *PERINGATAN, SAYANG:*
Beberapa dana alokasi kamu sudah minus:
${warnings.join('\n')}.
Ayo lebih bijak lagi ya dalam mengelola uang! 💖
`;
  }
  
  return pesan;
}

function getCategoryExpenseSummaryMessage(month, category) {
  const expensesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
  if (!expensesSheet) {
    throw new Error("Sheet 'Expenses' tidak ditemukan.");
  }
  
  let totalPengeluaran = 0;
  let rincianPengeluaran = "";
  
  const data = expensesSheet.getRange(2, 2, expensesSheet.getLastRow() - 1, 7).getValues();
  
  data.forEach(row => {
    const transactionMonth = row[1];
    const transactionCategory = row[4];
    const transactionDescription = row[3];
    const nilai = parseFloat(row[6]);

    if (transactionMonth && transactionMonth.toLowerCase() === month.toLowerCase() && transactionCategory && transactionCategory.toLowerCase() === category.toLowerCase() && !isNaN(nilai)) {
      totalPengeluaran += nilai;
      rincianPengeluaran += `    - ${transactionDescription} (${new Date(row[0]).toLocaleDateString('id-ID')}) sebesar ${nilai.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}\n`;
    }
  });

  const toRupiah = (value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  const greeting = getGreetingByTime();
  
  let pesan = `
*Halo sayang! ${greeting}. Berikut adalah rekap pengeluaran untuk kategori ${category} di bulan ${month}:*
    
*Total pengeluaranmu:* ${toRupiah(totalPengeluaran)}
    
*Rincian:*
${rincianPengeluaran || '    _Tidak ada pengeluaran di kategori ini pada bulan yang kamu pilih._'}
`;
  
  return pesan;
}

function searchTransactions(keyword) {
  const expensesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
  if (!expensesSheet) {
    throw new Error("Sheet 'Expenses' tidak ditemukan.");
  }

  const data = expensesSheet.getRange(2, 2, expensesSheet.getLastRow() - 1, 7).getValues();
  const matchedTransactions = [];

  data.forEach(row => {
    const transactionDate = new Date(row[0]).toLocaleDateString('id-ID');
    const transactionDescription = row[3];
    const transactionCategory = row[4];
    const transactionValue = parseFloat(row[6]);

    if (
      (transactionDescription && transactionDescription.toLowerCase().includes(keyword.toLowerCase())) ||
      (transactionCategory && transactionCategory.toLowerCase().includes(keyword.toLowerCase())) ||
      (String(transactionValue) && String(transactionValue).includes(keyword))
    ) {
      matchedTransactions.push(`- ${transactionDate}: ${transactionDescription} (${transactionCategory}) sebesar ${transactionValue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`);
    }
  });

  const greeting = getGreetingByTime();
  let pesan = `
*Halo sayang! ${greeting}. Berikut adalah hasil pencarian untuk "${keyword}":*
    
*Hasil:*
${matchedTransactions.join('\n') || '    _Tidak ada transaksi yang cocok dengan kata kunci yang kamu masukkan._'}
`;
  
  return pesan;
}

function showRecapMenu(chatId) {
  sendMessage({
    chat_id: chatId,
    text: "Pilih opsi rekap yang kamu inginkan, sayang:",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Rekap Harian", callback_data: "/rekapharian" }],
        [{ text: "Rekap Bulanan", callback_data: "/rekapbulanan" }]
      ]
    }
  });
}

function showDailyDateSelection(chatId) {
  const timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const today = new Date();

  const buttons = [];
  const dateOptions = { day: 'numeric', month: 'long' };

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    let label = Utilities.formatDate(date, timeZone, 'dd MMMM');
    if (i === 0) {
      label = "Hari Ini";
    } else if (i === 1) {
      label = "Kemarin";
    }

    buttons.push({
      text: label,
      callback_data: `/rekapharian_date ${Utilities.formatDate(date, timeZone, 'yyyy-MM-dd')}`
    });
  }

  sendMessage({
    chat_id: chatId,
    text: "Pilih tanggal yang ingin kamu lihat rekapan pengeluarannya, sayang:",
    reply_markup: {
      inline_keyboard: [
        buttons.slice(0, 3),
        buttons.slice(3, 6),
        buttons.slice(6)
      ]
    }
  });
}

function showMonthlyDateSelection(chatId) {
  const today = new Date();
  const buttons = [];
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  for (let i = 0; i < 3; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();

    buttons.push({
      text: `${monthName} ${year}`,
      callback_data: `/rekapbulanan_month ${monthName}`
    });
  }

  sendMessage({
    chat_id: chatId,
    text: "Pilih bulan yang ingin kamu lihat rekapan pengeluarannya, sayang:",
    reply_markup: {
      inline_keyboard: [
        buttons
      ]
    }
  });
}

function showMonthlyDaysSelection(chatId, monthName) {
  const expensesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
  if (!expensesSheet) {
    sendMessage({
      chat_id: chatId,
      text: `❌ Sheet 'Expenses' tidak ditemukan, sayang. Tidak bisa menampilkan data.`
    });
    return;
  }

  const data = expensesSheet.getRange(2, 2, expensesSheet.getLastRow() - 1, 3).getValues();
  const uniqueDates = new Set();
  const dateButtons = [];

  data.forEach(row => {
    const transactionMonth = row[1];
    const transactionDate = new Date(row[0]);
    if (transactionMonth === monthName) {
      uniqueDates.add(transactionDate.toISOString().split('T')[0]);
    }
  });
  
  const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));
  
  if (sortedDates.length === 0) {
    sendMessage({
      chat_id: chatId,
      text: `Maaf sayang, tidak ada pengeluaran yang tercatat di bulan ${monthName}.`
    });
    return;
  }

  let buttonsPerRow = 3;
  let currentRow = [];
  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    const label = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
    currentRow.push({
      text: label,
      callback_data: `/rekapbulanan_date ${sortedDates[i]}`
    });
    if (currentRow.length === buttonsPerRow) {
      dateButtons.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length > 0) {
    dateButtons.push(currentRow);
  }
  
  sendMessage({
    chat_id: chatId,
    text: `Pengeluaran di bulan ${monthName} tercatat pada tanggal-tanggal ini. Pilih salah satu, sayang:`,
    reply_markup: {
      inline_keyboard: dateButtons
    }
  });
}


function sendDailyExpenseSummary() {
  const pesan = getDailyExpenseSummaryMessage(new Date());
  USERS.forEach(chatId => {
    sendMessage({
      chat_id: chatId,
      text: pesan,
      parse_mode: "Markdown"
    });
  });
}

function deleteLastExpenseEntry() {
  const expensesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
  if (!expensesSheet) {
    throw new Error("Sheet 'Expenses' tidak ditemukan.");
  }
  
  const lastRow = expensesSheet.getLastRow();
  const dateValues = expensesSheet.getRange(2, 2, lastRow - 1, 1).getValues();

  let lastDataRow = -1;
  for (let i = dateValues.length - 1; i >= 0; i--) {
    if (dateValues[i][0] && dateValues[i][0].toString().trim() !== "") {
      lastDataRow = i + 2;
      break;
    }
  }

  if (lastDataRow !== -1) {
    expensesSheet.deleteRow(lastDataRow);
    return true;
  }
  return false;
}

function updateLastExpenseEntry(columnName, newValue) {
  const expensesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
  if (!expensesSheet) {
    throw new Error("Sheet 'Expenses' tidak ditemukan.");
  }

  const lastRow = expensesSheet.getLastRow();
  if (lastRow < 2) {
    return false;
  }

  let columnIndex = -1;
  const headers = expensesSheet.getRange(1, 1, 1, expensesSheet.getLastColumn()).getValues()[0];
  const targetColumns = {
    'Kategori': 6,
    'Bank': 7,
  };
  
  if (targetColumns[columnName]) {
    columnIndex = targetColumns[columnName];
  } else {
    return false;
  }
  
  expensesSheet.getRange(lastRow, columnIndex).setValue(newValue);
  return true;
}

function handleQuickExpense(chatId, value) {
  const expensesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Expenses");
  if (!expensesSheet) {
    sendMessage({ chat_id: chatId, text: "❌ Sheet 'Expenses' tidak ditemukan, sayang." });
    return;
  }

  let defaultCategory = 'Makanan';
  let defaultBank = 'BRI';
  let defaultTransaksi = 'Cash';

  const lastRow = expensesSheet.getLastRow();
  if (lastRow > 1) {
    const lastDataRow = expensesSheet.getRange(lastRow, 4, 1, 4).getValues()[0];
    if (lastDataRow[2]) {
      defaultCategory = lastDataRow[2];
    }
    if (lastDataRow[3]) {
      defaultBank = lastDataRow[3];
    }
    if (lastDataRow[0]) {
      defaultTransaksi = lastDataRow[0];
    }
  }
  
  const now = new Date();
  const tanggal = now.getDate().toString().padStart(2, '0');
  const bulan = (now.getMonth() + 1).toString().padStart(2, '0');
  const tahun = now.getFullYear();
  const data = {
    Tanggal: tanggal,
    Bulan: bulan,
    Tahun: tahun,
    Transaksi: defaultTransaksi,
    Uraian: "Pengeluaran Cepat",
    Kategori: defaultCategory,
    Bank: defaultBank,
    Nilai: value
  };

  try {
    addDataToSheet(data);
    const pesan = `✅ Pengeluaran cepat berhasil ditambahkan sebesar *${value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}*
*(Kategori: ${defaultCategory}, Bank: ${defaultBank})*

Apakah ada yang salah, sayang?`;

    sendMessage({
      chat_id: chatId,
      text: pesan,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Batalkan', callback_data: 'cancel_last_expense' }],
          [{ text: '✏️ Ubah Kategori', callback_data: 'change_category' }],
          [{ text: '💰 Ubah Bank', callback_data: 'change_bank' }]
        ]
      }
    });
  } catch (error) {
    console.error("Error adding quick expense:", error);
    sendMessage({
      chat_id: chatId,
      text: `❌ Gagal menambahkan pengeluaran cepat, sayang. Silakan coba lagi.`
    });
  }
}

function getTotalMonthlyExpense(year, monthIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const expensesSheet = ss.getSheetByName("Expenses");
  if (!expensesSheet) return 0;
  
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const data = expensesSheet.getRange(2, 3, expensesSheet.getLastRow() - 1, 7).getValues();
  let total = 0;
  
  data.forEach(row => {
    const transactionMonth = row[0];
    const transactionValue = parseFloat(row[5]);
    const transactionYear = row[6];

    if (transactionMonth === monthNames[monthIndex] && transactionYear === year && !isNaN(transactionValue)) {
      total += transactionValue;
    }
  });
  
  return total;
}

function getHighestSpendingCategory(year, monthIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const expensesSheet = ss.getSheetByName("Expenses");
  if (!expensesSheet) return { category: 'N/A', amount: 0 };
  
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const data = expensesSheet.getRange(2, 3, expensesSheet.getLastRow() - 1, 7).getValues();
  const spendingByCategory = {};
  
  data.forEach(row => {
    const transactionMonth = row[0];
    const transactionCategory = row[3];
    const transactionValue = parseFloat(row[5]);
    const transactionYear = row[6];
    
    if (transactionMonth === monthNames[monthIndex] && transactionYear === year && !isNaN(transactionValue)) {
      if (!spendingByCategory[transactionCategory]) {
        spendingByCategory[transactionCategory] = 0;
      }
      spendingByCategory[transactionCategory] += transactionValue;
    }
  });
  
  let maxAmount = 0;
  let maxCategory = 'N/A';
  for (const category in spendingByCategory) {
    if (spendingByCategory[category] > maxAmount) {
      maxAmount = spendingByCategory[category];
      maxCategory = category;
    }
  }
  
  return { category: maxCategory, amount: maxAmount };
}

function getMonthlyAnalysisMessage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboardSheet = ss.getSheetByName("Dashboard");
  const expensesSheet = ss.getSheetByName("Expenses");
  if (!dashboardSheet || !expensesSheet) {
    throw new Error("Sheet 'Dashboard' atau 'Expenses' tidak ditemukan.");
  }

  const toRupiah = (value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const totalExpenseCurrent = dashboardSheet.getRange("L4").getValue();
  const totalExpensePrev = getTotalMonthlyExpense(prevYear, prevMonth);
  const percentageChange = ((totalExpenseCurrent - totalExpensePrev) / totalExpensePrev) * 100;
  const changeMessage = percentageChange >= 0 ? `naik *${percentageChange.toFixed(2)}%*` : `turun *${Math.abs(percentageChange).toFixed(2)}%*`;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const averageDailySpending = totalExpenseCurrent / now.getDate();
  const highestSpending = getHighestSpendingCategory(currentYear, currentMonth);

  let saran = "";
  if (percentageChange > 5) {
    const responses = [
      `Sayang, bulan ini pengeluaranmu naik! Khususnya di kategori *${highestSpending.category}*, kamu terlalu banyak mengeluarkan dana. Ayo lebih bijak dan disiplin lagi bulan depan!`,
      `Kamu boros bulan ini! Pengeluaranmu naik *${percentageChange.toFixed(2)}%* dari bulan lalu. Perhatikan lagi pengeluaranmu di kategori *${highestSpending.category}*. Seharusnya kamu bisa lebih hemat.`,
      `Peringatan! Pengeluaranmu bulan ini tidak terkontrol. Kategori *${highestSpending.category}* menjadi penyebab utama. Kamu bisa lebih baik dari ini. Yuk, mulai dari sekarang kita perbaiki!`
    ];
    saran = responses[Math.floor(Math.random() * responses.length)];
  } else if (percentageChange < -5) {
    const responses = [
      `Luar biasa! Pengeluaranmu turun *${Math.abs(percentageChange).toFixed(2)}%* dari bulan lalu. Ini menunjukkan kamu sangat bijak. Semangat terus! Agar tujuanmu tercapai!`,
      `Hebat! Aku bangga lihat kamu berhemat bulan ini. Pengeluaranmu jauh lebih rendah. Terus pertahankan ya, sayang. Kamu pasti bisa mencapai semua impianmu!`,
      `Kerja bagus! Kamu sudah berhasil mengendalikan pengeluaranmu. Ini adalah langkah besar menuju masa depan yang lebih cerah. Ayo kita lanjutkan tren positif ini!`
    ];
    saran = responses[Math.floor(Math.random() * responses.length)];
  } else {
    saran = `Pengeluaranmu stabil bulan ini. Terus pertahankan kedisiplinanmu ya, sayang!`;
  }

  const daysLeft = daysInMonth - now.getDate();
  const projectedRemainingSpending = averageDailySpending * daysLeft;
  const projectedEndMonthBalance = dashboardSheet.getRange("L7").getValue() - projectedRemainingSpending;

  const laporan = `
📊 *Analisis Keuangan Bulan ${monthNames[currentMonth]}*
  - Total pengeluaranmu: *${toRupiah(totalExpenseCurrent)}*, ${changeMessage} dari bulan lalu.
  - Kategori pengeluaran terbesarmu: *${highestSpending.category}* (${toRupiah(highestSpending.amount)}).
  - Rata-rata pengeluaran harianmu: *${toRupiah(averageDailySpending)}*.

---

🔮 *Proyeksi Saldo Akhir Bulan*
  - Berdasarkan pola pengeluaran saat ini, diperkirakan sisa saldo uang M&B di akhir bulan adalah: *${toRupiah(projectedEndMonthBalance)}*

*Saran dariku:*
${saran}
  `;

  return laporan;
}

function setBotCommands() {
  var url = `https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`;
  var commands = [
    { command: "start", description: "Mulai dan lihat menu utama" },
    { command: "cepat", description: "Tambah pengeluaran cepat (contoh: /cepat 25000)" },
    { command: "tambahdata", description: "Masukkan data pengeluaran" },
    { command: "updatepemasukan", description: "Update pemasukan bulanan" },
    { command: "updatecash", description: "Update saldo cash bulanan" },
    { command: "ceksaldo", description: "Cek laporan saldo terperinci" },
    { command: "rekapharian_menu", description: "Rekap Pengeluaran Harian/Bulanan" },
    { command: "analisis", description: "Lihat analisis dan prediksi keuangan bulanan" },
    { command: "rekapkategori", description: "Rekap Pengeluaran per Kategori" },
    { command: "cari", description: "Cari transaksi berdasarkan kata kunci" },
    { command: "hapus", description: "Hapus data pengeluaran terakhir" },
    { command: "format", description: "Lihat daftar format bank dan kategori" }
  ];
  var payload = {
    commands: commands
  };
  var options = {
    'method': 'post',
    'payload': JSON.stringify(payload),
    'contentType': 'application/json'
  };
  UrlFetchApp.fetch(url, options);
}

function sendDailyBalanceSummary() {
  const pesan = getDetailedBalanceMessage();
  USERS.forEach(chatId => {
    sendMessage({
      chat_id: chatId,
      text: pesan,
      parse_mode: "Markdown"
    });
  });
}