# Link Exchange Hub — Roman Urdu Setup Guide

Yeh guide bilkul shuru se GitHub, Supabase aur Vercel setup karne ke liye hai.

## Pehle yeh samajh lein
- GitHub: aapke project ki files/code rakhne ki jagah.
- Supabase: login aur database jahan links save honge.
- Vercel: website ko online/live karne ki service.
- `.env.local` sirf local computer ke liye hoti hai. Vercel par environment variables alag se add karne hote hain.

## Step 1 — ZIP extract karein
1. `link-exchange-dashboard-complete-code.zip` download karein.
2. Windows mein ZIP par right-click karein.
3. **Extract All** par click karein.
4. Extracted folder ke andar `package.json`, `src`, `supabase`, `.env.example` aur `README.md` nazar aane chahiye.
5. ZIP file ko seedha GitHub par upload na karein; pehle extract karein aur andar wali files upload karein.

## Step 2 — Supabase project banayein
1. https://supabase.com par ja kar sign in karein.
2. **New project** par click karein.
3. Organization, project name aur database password set karein. Password ko safe jagah save karein.
4. Project tayyar hone ka intezar karein.
5. Project ke andar **SQL Editor** kholein.
6. GitHub/project folder se `supabase/schema.sql` file Notepad ya code editor mein kholein.
7. Is file ka poora SQL copy karein, Supabase SQL Editor mein paste karein aur **Run** karein.
8. Agar SQL error aaye to aage na barhein; error text ko copy karke help lein.

## Step 3 — Admin aur partner accounts banayein
1. Supabase mein **Authentication → Users** kholein.
2. Admin ke liye apna email/password user banayein.
3. Har partner ke liye alag user banayein ya invite karein.
4. Har user ki UUID copy karein.
5. **SQL Editor** mein `README.md` ke “Create profiles” example ko apni UUIDs, emails aur names ke saath update karke run karein.
6. Admin ki row mein role `admin` aur partners ki rows mein role `partner` hona chahiye.
7. Partner ko kabhi admin role na dein. Public sign-ups ko disable rakhein agar aap sirf apni taraf se accounts banana chahte hain.

## Step 4 — Supabase API values lein
1. Supabase mein **Project Settings → API** ya API Keys page kholein.
2. Project URL copy karein.
3. Publishable/anon public key copy karein. `service_role` ya secret key frontend mein kabhi na daalein.
4. Project folder mein `.env.example` ki copy bana kar uska naam `.env.local` rakhein.
5. `.env.local` mein values is format mein daalein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

`YOUR_PROJECT` aur `YOUR_PUBLIC_ANON_KEY` ko apni asli values se replace karein. Quotes ki zaroorat nahi. `.env.local` ko GitHub par upload/share na karein.

## Step 5 — GitHub repository banayein
1. https://github.com par sign in karein.
2. **New repository** par click karein.
3. Naam rakhein `link-exchange-dashboard`.
4. Repository ko **Private** select karein.
5. Create repository karein.
6. Repository page par **Add file → Upload files** kholein.
7. Extracted project folder ke andar ki files/folders select karein — `package.json`, `src`, `supabase`, `tsconfig.json`, etc.
8. `.env.local` upload na karein. `.env.example` rehne dein.
9. Neeche **Commit changes** par click karein.

## Step 6 — Vercel par deploy karein
1. https://vercel.com par sign in karein.
2. **Add New → Project** par click karein.
3. Apna GitHub account connect karein, phir `link-exchange-dashboard` repository import karein.
4. Framework preset Next.js rehne dein.
5. **Environment Variables** mein yeh dono variables alag-alag add karein:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon/public key
6. Production, Preview aur Development environments ke liye variables select karein jahan available hon.
7. **Deploy** par click karein aur build complete hone dein.
8. Website ka Vercel URL open karein.

## Step 7 — Agar build error aaye
Agar error `supabaseUrl is required` ya Supabase URL missing kahe:
1. Vercel → project → **Settings → Environment Variables** kholein.
2. URL aur anon/public key ke variable names bilkul sahi check karein.
3. Values ke aage/peeche spaces na hon.
4. Save karein.
5. **Deployments** tab mein latest deployment ke menu se **Redeploy** karein.

Agar `supabaseUrl is required` phir bhi aaye to build log ka pehla laal error aur environment variable names (values ko chhupa kar) share karein. Apni key/password kabhi share na karein.

## Step 8 — Pehli login aur privacy test
1. Live website par admin email/password se sign in karein.
2. Admin profile missing ka message aaye to Step 3 mein profiles ki rows aur UUIDs dobara check karein.
3. Admin dashboard se partner select karke link add karein.
4. Private/incognito window mein partner ke account se sign in karein.
5. Confirm karein ke partner ko sirf apne links nazar aate hain aur admin status controls nazar nahi aate.
6. Do test accounts se privacy check karne ke baad hi real partner data add karein.

## Important security rules
- `service_role` key ko frontend, GitHub ya `NEXT_PUBLIC_` variable mein kabhi na rakhein.
- `.env.local` ko GitHub par upload na karein.
- Supabase ke `supabase/schema.sql` mein maujood Row Level Security policies ko remove na karein.
- Partner ko admin role na dein.
- Is starter mein basic link tracking hai. Multiple email/community identities ke liye partner accounts aur notes ka sahi mapping rakhna zaroori hai; advanced workspace feature abhi included nahi.
