# هیئت ثارالله — Static Website

وب‌سایت ایستا (Static) برای هیئت ثارالله. این سایت با HTML، CSS و JavaScript خالص ساخته شده و قابلیت استقرار مستقیم روی **GitHub Pages** را دارد. هیچ backend یا کد سرور مورد نیاز نیست.

## شروع سریع

### ۱. افزودن محتوا
فایل‌های خود را در پوشه‌های مربوطه قرار دهید:

| پوشه | نوع محتوا | قالب‌های مجاز |
|------|----------|---------------|
| `PIC/`  | تصاویر     | JPG, PNG, WebP, GIF, SVG |
| `VID/`  | ویدئو      | MP4, WebM, OGG |
| `MUSIC/`| مداحی/نوحه | MP3, M4A, OGG |
| `SUKH/` | سخنرانی    | MP3, M4A, OGG |
| `NEW/`  | اعلامیه     | TXT (با فرمت خاص — به ADMIN-GUIDE.md مراجعه کنید) |

### ۲. ساخت manifest
پس از افزودن یا حذف هر فایل، باید manifestها را به‌روزرسانی کنید:

```bash
node manifest-builder.js
```

این کار برای هر پوشه یک فایل `manifest.json` می‌سازد که لیست فایل‌های آن پوشه است.

### ۳. استقرار روی GitHub Pages

1. یک repository جدید در GitHub بسازید.
2. تمام فایل‌های این پروژه را push کنید:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
3. در تنظیمات repository به **Settings → Pages** بروید.
4. در بخش **Source**، شاخه `main` و پوشه `/ (root)` را انتخاب کنید.
5. روی **Save** کلیک کنید.
6. پس از چند دقیقه، سایت شما در آدرس `https://<username>.github.io/<repo-name>/` در دسترس خواهد بود.

## ساختار پروژه

```
static-site/
├── index.html              # صفحه اصلی
├── css/styles.css          # استایل‌ها
├── js/app.js               # منطق برنامه
├── manifest-builder.js     # اسکریپت ساخت manifest
├── README.md               # این فایل
├── ADMIN-GUIDE.md          # راهنمای جامع مدیر (فارسی)
├── PIC/                    # تصاویر
│   └── manifest.json
├── VID/                    # ویدئوها
│   └── manifest.json
├── MUSIC/                  # مداحی‌ها
│   └── manifest.json
├── SUKH/                   # سخنرانی‌ها
│   └── manifest.json
└── NEW/                    # اعلامیه‌ها (.txt)
    └── manifest.json
```

## راهنمای کامل

برای راهنمای جامع مدیریت محتوا، به **[ADMIN-GUIDE.md](ADMIN-GUIDE.md)** مراجعه کنید.

## ویژگی‌ها

- ✅ کاملاً ایستا (Static) — مناسب GitHub Pages
- ✅ پشتیبانی کامل از فارسی و راست‌چین (RTL)
- ✅ طراحی واکنش‌گرا (Mobile-first)
- ✅ گالری تصاویر با Lightbox
- ✅ گالری ویدئو با Modal پخش‌کننده
- ✅ پخش‌کننده صوتی حرفه‌ای با Playlist
- ✅ بخش اطلاع‌رسانی با کارت شاخص و کارت‌های کوچک
- ✅ بدون تصاویر لوگو — فقط تایپوگرافی
- ✅ تم محرم: مشکی، قرمز خونی، طلایی، کرم

## فناوری‌ها

- HTML5 خالص
- CSS3 (با CSS Variables و Grid/Flexbox)
- Vanilla JavaScript (بدون فریم‌ورک)
- Google Fonts (Vazirmatn + Gulzar)

---

السلام علیک یا ثارالله
