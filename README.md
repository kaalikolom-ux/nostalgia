# Nostalgia (নস্টালজিয়া) 📸✨
> AI চালিত পুরোনো ছবি ঠিক করার আধুনিক ও সহজ প্ল্যাটফর্ম

**Nostalgia** হলো একটি প্রিমিয়াম ওয়েব অ্যাপ্লিকেশন যার মাধ্যমে পুরোনো, বিবর্ণ, স্ক্র্যাচযুক্ত এবং ঘোলাটে ছবিগুলোকে কৃত্রিম বুদ্ধিমত্তা (AI) ব্যবহার করে কয়েক সেকেন্ডে স্পষ্ট, শার্প ও প্রাকৃতিক রঙে রূপান্তর করা যায়।

---

## 🌟 প্রধান ফিচারসমূহ (Key Features)

1. **৫টি বিশেষ রিস্টোরেশন মোড**:
   - 🌟 **সম্পূর্ণ ম্যাজিক রিস্টোরেশন (Full Magic Restore)**: স্বয়ংক্রিয়ভাবে নয়েজ দূর করে, মুখমণ্ডল স্পষ্ট করে এবং রঙ সতেজ করে।
   - 👤 **মুখমণ্ডল স্পষ্টকরণ (Face Restoration / Clarity)**: CodeFormer / GFPGAN মানের ডিপ-লার্নিং অ্যালগরিদম যা ঘোলাটে চোখের পাপড়ি, চুল ও মুখের সূক্ষ্ম ভাঁজ নিখুঁতভাবে ফুটিয়ে তোলে।
   - 🎨 **রঙিন করুন (Colorize B&W)**: পুরোনো সাদাকালো ও সেপিয়া ছবিকে প্রাকৃতিক রঙের ছবিতে রূপান্তর করে।
   - 🧹 **দাগ ও স্ক্র্যাচ দূরীকরণ (Scratch & Dust Removal)**: অ্যালবামের ভাঁজের দাগ, স্ক্র্যাচ ও ধূলিকণার দাগ দূর করে মসৃণ করে।
   - 🔍 **এইচডি আপস্কেল (2x/4x Super-Resolution)**: কম রেজোলিউশনের পুরোনো ছবিকে আল্ট্রা এইচডি কোয়ালিটিতে বড় করে।

2. **ইন্টারেক্টিভ স্প্লিট কম্প্যারিজন স্লাইডার (Interactive Comparison)**:
   - ড্র্যাগ করে আগে (Original) এবং পরের (Restored) ফলাফল সরাসরি তুলনা করার সুবিধা।
   - পাশাপাশি (Side-by-side) ভিউ এবং ফুলস্ক্রিন জুম মোড।

3. **ইন-ব্রাউজার ইঞ্জিন + ক্লাউড AI সাপোর্ট**:
   - **ইন-ব্রাউজার ইঞ্জিন**: কোনো API Key বা খরচ ছাড়াই তাৎক্ষণিক অফলাইন/ব্রাউজার প্রসেসিং।
   - **Replicate / HuggingFace AI**: সেটিংস থেকে আপনার টোকেন যোগ করে সরাসরি ক্লাউড নিউরাল মডেল ব্যবহার করতে পারবেন।

4. **সুপাবেস ক্লাউড ইন্টিগ্রেশন (Supabase Storage & DB)**:
   - ঠিক করা ছবি সরাসরি Supabase স্টোরেজ বাকেট `nostalgia-photos`-এ সংরক্ষিত হয়।
   - ডাটাবেস টেবিল `restorations`-এ প্রতিটি রিস্টোরেশনের হিস্ট্রি ট্র্যাকিং।
   - **স্মৃতির গ্যালারি**: সংরক্ষিত ছবিগুলো যেকোনো সময় ব্রাউজ, তুলনা ও ডাউনলোড করার সুবিধা।

5. **Cloudflare Pages ফ্রেন্ডলি**:
   - ক্লাউডফ্লেয়ার পেজেস-এ সরাসরি Deploy করার জন্য প্রস্তুত (`_redirects` এবং `_headers` যুক্ত)।

---

## 🛠 প্রযুক্তি ও ফ্রেমওয়ার্ক (Tech Stack)

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Database & Storage**: Supabase (PostgreSQL + S3 Storage Buckets)
- **Deployment**: Cloudflare Pages / Workers

---

## 🚀 লোকাল সেটআপ ও রান করার নিয়ম (Local Setup)

### ১. ক্লোন ও ডিপেন্ডেন্সি ইনস্টলেশন:
```bash
git clone https://github.com/kaalikolom-ux/nostalgia.git
cd nostalgia
npm install
```

### ২. এনভায়রনমেন্ট ভেরিয়েবল সেটআপ:
`.env` ফাইল তৈরি করুন:
```env
VITE_SUPABASE_URL=https://wlokctkwupttckkrigti.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yemRbPZpPgk2uh0Bux_PFA__aXEyzV3
```

### ৩. লোকাল ডেভেলপমেন্ট সার্ভার চালু করুন:
```bash
npm run dev
```

---

## ☁️ Cloudflare Pages-এ ডেপ্লয় করার নির্দেশিকা

Cloudflare ড্যাশবোর্ডে গিয়ে:
1. **Pages** > **Connect to Git** সিলেক্ট করুন এবং `kaalikolom-ux/nostalgia` রিপোজিটরি নির্বাচন করুন।
2. **Build Settings**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
3. **Environment variables**:
   - `VITE_SUPABASE_URL`: `https://wlokctkwupttckkrigti.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_yemRbPZpPgk2uh0Bux_PFA__aXEyzV3`
4. **Save and Deploy** এ চাপুন!
