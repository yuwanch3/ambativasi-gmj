export interface BabDetail {
  judul: string;
  pdfBin: string; // Mengarah ke nama file di folder python backend
  pdfBjp: string; // Mengarah ke nama file di folder python backend
  youtubeId: string;
}

export const dataMateriBab: Record<string, BabDetail> = {
  bab1: {
    judul: "Perkenalan diri & Pola Kalimat Dasar",
    pdfBin: "document_materi/bahasa_jepang/bab_1/minho-bab-1-bjp.pdf",
    pdfBjp: "document_materi/bahasa_jepang/bab_1/minho-bab-1-ind.pdf",
    youtubeId: "lrhkh5WPfy8", // Ganti dengan ID video YouTube asli Bab 1 kamu
  },
  bab2: {
    judul: "Benda, Tempat, serta Kepemilikan",
    pdfBin: "",
    pdfBjp: "",
    youtubeId: "", // Ganti dengan ID video YouTube asli Bab 2 kamu
  },
  // Nanti kalau tambah Bab 3, tinggal copas dan tambah di bawah sini kawan!
};
