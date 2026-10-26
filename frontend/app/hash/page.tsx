"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Hash, Search, Shield, Copy, Check, AlertTriangle, FileUp, Database, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

// Fast lightweight MD5 implementation in pure JS
function md5(input: Uint8Array): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const length = input.length;
  const nWords = (((length + 8) >> 6) + 1) * 16;
  const words = new Int32Array(nWords);

  for (let i = 0; i < length; i++) {
    words[i >> 2] |= input[i] << ((i % 4) * 8);
  }
  words[length >> 2] |= 0x80 << ((length % 4) * 8);
  words[nWords - 2] = length * 8;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < nWords; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5ff(a, b, c, d, words[i], 7, -680876936);
    d = md5ff(d, a, b, c, words[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, words[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, words[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, words[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, words[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, words[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, words[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, words[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, words[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, words[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, words[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, words[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, words[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, words[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, words[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, words[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, words[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, words[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, words[i], 20, -373897302);
    a = md5gg(a, b, c, d, words[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, words[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, words[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, words[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, words[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, words[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, words[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, words[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, words[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, words[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, words[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, words[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, words[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, words[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, words[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, words[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, words[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, words[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, words[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, words[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, words[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, words[i], 11, -358537222);
    c = md5hh(c, d, a, b, words[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, words[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, words[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, words[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, words[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, words[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, words[i], 6, -198630844);
    d = md5ii(d, a, b, c, words[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, words[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, words[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, words[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, words[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, words[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, words[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, words[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, words[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, words[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, words[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, words[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, words[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, words[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, words[i + 9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const hexChars = "0123456789abcdef";
  let out = "";
  const result = [a, b, c, d];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const byte = (result[i] >> (j * 8)) & 0xff;
      out += hexChars.charAt((byte >> 4) & 0x0f) + hexChars.charAt(byte & 0x0f);
    }
  }
  return out;
}

export default function HashToolPage() {
  const [inputVal, setInputVal] = useState("3201012304900001");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hashes, setHashes] = useState({
    sha256: "",
    sha1: "",
    sha512: "",
    md5: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateHashes = async (bytes: Uint8Array) => {
    try {
      // Native Web Crypto API
      const sha256Buf = await crypto.subtle.digest("SHA-256", bytes as ArrayBufferView<ArrayBuffer>);
      const sha1Buf = await crypto.subtle.digest("SHA-1", bytes as ArrayBufferView<ArrayBuffer>);
      const sha512Buf = await crypto.subtle.digest("SHA-512", bytes as ArrayBufferView<ArrayBuffer>);

      const toHex = (buf: ArrayBuffer) =>
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      setHashes({
        sha256: toHex(sha256Buf),
        sha1: toHex(sha1Buf),
        sha512: toHex(sha512Buf),
        md5: md5(bytes),
      });
    } catch (err) {
      console.error("Crypto error:", err);
    }
  };

  useEffect(() => {
    const enc = new TextEncoder();
    calculateHashes(enc.encode(inputVal));
  }, [inputVal]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        setInputVal(`[File]: ${file.name} (${file.size.toLocaleString("id-ID")} bytes)`);
        calculateHashes(new Uint8Array(buffer));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-7 sm:p-8 max-w-[1200px] mx-auto min-w-0 font-sans space-y-6">
      <div className="border-b border-[var(--line)] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
            NEXTRACE OSINT TOOLS &bull; REAL-TIME CRYPTOGRAPHIC HASH GENERATOR
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
          <Hash className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
          Alat Cepat: Hash Identifier &amp; NIK Lookup
        </h1>
        <p className="mt-1 mb-0 text-[13px] text-[var(--mute)]">
          Kalkulasi real-time dan pencocokan hash identitas (NIK 16 digit, SHA-256, SHA-1, SHA-512, MD5) terhadap repositori kebocoran data terenkripsi.
        </p>
      </div>

      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[12px] font-semibold text-[var(--mute)]">
              Input String Teks / NIK / Nilai Identitas
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11.5px] font-mono text-[var(--acc)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Hitung Hash dari Berkas File</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Masukkan NIK 16 digit, email, nomor HP, atau string rahasia..."
              className="flex-1 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] px-3.5 py-2 text-[13.5px] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--acc)]"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => setInputVal("")}
                className="px-3 py-2 bg-[var(--s2)] hover:bg-[var(--line)] text-[var(--mute)] rounded-[6px] text-[12px] font-mono cursor-pointer"
              >
                Bersihkan
              </button>
            )}
          </div>
        </div>

        {/* Live Computed Hashes */}
        <div className="space-y-3 pt-2">
          {/* SHA-256 */}
          <div className="p-3.5 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] font-mono text-[12.5px] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-[var(--acc)] uppercase">SHA-256 Digest (Standard Forensik)</span>
              <button
                type="button"
                onClick={() => handleCopy(hashes.sha256, "sha256")}
                className="text-[var(--mute)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer text-[10.5px]"
              >
                {copiedKey === "sha256" ? <Check className="w-3.5 h-3.5 text-[var(--lo)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "sha256" ? "Tersalin" : "Salin"}</span>
              </button>
            </div>
            <div className="text-[var(--ink)] break-all select-all font-semibold">{hashes.sha256}</div>
          </div>

          {/* MD5 */}
          <div className="p-3.5 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] font-mono text-[12.5px] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-[var(--mid)] uppercase">MD5 Checksum</span>
              <button
                type="button"
                onClick={() => handleCopy(hashes.md5, "md5")}
                className="text-[var(--mute)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer text-[10.5px]"
              >
                {copiedKey === "md5" ? <Check className="w-3.5 h-3.5 text-[var(--lo)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "md5" ? "Tersalin" : "Salin"}</span>
              </button>
            </div>
            <div className="text-[var(--ink)] break-all select-all">{hashes.md5}</div>
          </div>

          {/* SHA-1 */}
          <div className="p-3.5 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] font-mono text-[12.5px] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-[var(--mute)] uppercase">SHA-1 Legacy Digest</span>
              <button
                type="button"
                onClick={() => handleCopy(hashes.sha1, "sha1")}
                className="text-[var(--mute)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer text-[10.5px]"
              >
                {copiedKey === "sha1" ? <Check className="w-3.5 h-3.5 text-[var(--lo)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "sha1" ? "Tersalin" : "Salin"}</span>
              </button>
            </div>
            <div className="text-[var(--mute)] break-all select-all text-[11.5px]">{hashes.sha1}</div>
          </div>

          {/* Action: Check directly against Leak Tracer */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <div className="text-[12px] text-[var(--mute)]">
              Panjang input: <strong className="text-[var(--ink)] font-mono">{inputVal.length} karakter</strong>
            </div>

            <Link
              href={`/leak-tracer?query=${encodeURIComponent(hashes.sha256)}`}
              className="px-4 py-2 bg-[var(--acc)] text-white rounded-[6px] text-[12.5px] font-semibold hover:opacity-90 flex items-center gap-1.5 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cek Paparan Hash di Leak Tracer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
