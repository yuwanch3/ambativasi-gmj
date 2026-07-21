export interface SoalAI {
  no: number;
  tipe_soal: "standar" | "full" | "drag_drop" | "fill_blank";
  pertanyaan: string;
  pilihan: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  jawaban_benar: string | string[];
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export async function generateSoalDirectGemini(
  sumberData: string,
  jumlahSoal: number = 10,
  bahasaSoal: string = "Indonesia"
): Promise<SoalAI[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("API Key Gemini belum terpasang di file .env!");
  }

  const namaSumber = sumberData.trim();
  const lowerSumber = namaSumber.toLowerCase();

  let mataPelajaran = "Umum";
  let levelMateri = "-";
  let judulMateri = namaSumber;
  let panduanSkripAsli = "";

  if (
    lowerSumber.includes("nihongo") ||
    lowerSumber.includes("bj") ||
    lowerSumber.includes("jepang") ||
    lowerSumber.includes("bab")
  ) {
    mataPelajaran = "Bahasa Jepang";
    levelMateri = "N5";
    judulMateri = "Bahasa Jepang Bab 1 / N5";
    panduanSkripAsli =
      "Wajib menggunakan aksara Jepang asli (Kanji, Hiragana, atau Katakana) secara menyeluruh pada komponen soal tersebut.";
  } else if (
    lowerSumber.includes("fatihah") ||
    lowerSumber.includes("tajwid") ||
    lowerSumber.includes("tj")
  ) {
    mataPelajaran = "Tajwid";
    levelMateri = "Dasar";
    judulMateri = "Tajwid / Al-Fatihah";
    panduanSkripAsli =
      "Wajib menggunakan potongan ayat Al-Qur'an bertuliskan teks Arab asli beserta tanda bacanya secara utuh.";
  } else {
    panduanSkripAsli = `Wajib menggunakan istilah teknis utama atau kosakata bahasa asing asli yang paling relevan dengan subjek ${mataPelajaran}.`;
  }

  const instruksiSistem = `
Anda adalah seorang guru pakar kurikulum profesional untuk mata pelajaran: "${mataPelajaran}" (Level: ${levelMateri}).
Tugas Anda adalah meracik tepat ${jumlahSoal} soal pilihan ganda bermutu tinggi berdasarkan materi referensi.

⚠️ ATURAN DISTRIBUSI VARIASI SOAL (MUTLAK):
Dari total ${jumlahSoal} soal yang Anda buat, Anda WAJIB membaginya secara seimbang ke dalam 4 tipe berikut:
- Tipe "standar"
- Tipe "full"
- Tipe "drag_drop"
- Tipe "fill_blank"
Sebarkan urutan tipenya secara acak dari nomor 1 sampai ${jumlahSoal}.

DEFINISI 4 KARAKTERISTIK TIPE SOAL:
1. "standar" -> Kalimat pertanyaan dan pilihan A, B, C, D disajikan dalam bahasa pengantar reguler (${bahasaSoal}).
2. "full" -> Aturan khusus: ${panduanSkripAsli} Seluruh string kalimat pertanyaan serta opsi pilihan A, B, C, D wajib ditulis menggunakan format khusus skrip asli tersebut.
3. "drag_drop" -> Soal susun kepingan kata interaktif. Kalimat 'pertanyaan' WAJIB mengandung satu simbol placeholder kosong yaitu "___" (tiga buah garis bawah). Sediakan kepingan kata pelengkap tunggal pada objek pilihan 'A', 'B', 'C', 'D' dan tentukan abjad jawaban yang benar ('A', 'B', 'C', atau 'D').
4. "fill_blank" -> Soal isian teks langsung (Keyboard). Kalimat 'pertanyaan' WAJIB mengandung satu simbol placeholder kosong yaitu "___".
   Khusus tipe 'fill_blank' ini, kolom 'jawaban_benar' HARUS berupa ARRAY DARI STRING yang menampung segala alternatif variasi penulisan jawaban yang sah dan diterima.
   ⚠️ WAJIB DITERAPKAN: Anda WAJIB memasukkan variasi penulisan teks Romaji / Alphabet / Latin (termasuk huruf kecil dan kapital, contoh: "jin", "Jin", "sugoi", "al-fatihah", "mad wajib") ke dalam array 'jawaban_benar', di samping variasi aksara/skrip asli (seperti Kanji/Hiragana/Katakana atau Teks Arab). Kolom 'pilihan' tetap diisi dengan 4 opsi dummy kata pengecoh pelengkap.

PANDUAN REFERENSI MATERI:
- Judul Materi: ${judulMateri}
- Subjek: ${mataPelajaran}

PANDUAN STRUKTUR JSON (GUARDRAILS):
Output HARUS berupa JSON Array murni dari objek-objek kuis. Objek di dalamnya wajib berstruktur:
- 'no' (integer)
- 'tipe_soal' (string: "standar", "full", "drag_drop", atau "fill_blank")
- 'pertanyaan' (string)
- 'pilihan' (objek dengan key 'A', 'B', 'C', 'D')
- 'jawaban_benar' (String 'A','B','C','D' untuk standar/full/drag_drop. Array of Strings khusus untuk 'fill_blank').
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Buatkan tepat ${jumlahSoal} kuis campuran interaktif untuk materi '${judulMateri}' sesuai aturan sistem.`,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [{ text: instruksiSistem }],
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.85,
        },
      }),
    });

    if (!response.ok) {
      const errJson = await response.json();
      throw new Error(errJson.error?.message || "Gagal meracik soal via Gemini API.");
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawText);

    const listSoal: SoalAI[] = Array.isArray(parsedData)
      ? parsedData
      : parsedData.soal || parsedData.data || [];

    return listSoal;
  } catch (error: any) {
    console.error("Error Direct Gemini:", error);
    throw error;
  }
}