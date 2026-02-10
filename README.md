## SAVVYTRACK LOCAL DEV (FRESH CLONE → WORKING ON EXPO GO)

------------------------------------------------------------
ONE-TIME SETUP (ONLY DO THIS ONCE PER MACHINE / FRESH CLONE)
------------------------------------------------------------

1) YOU MUST INSTALL THESE THINGS
- Node.js (LTS)
- Docker Desktop (open + running)
- Expo Go on your phone (iOS/Android)

2) CLONE + OPEN REPO
git clone <REPO_URL>
cd SavvyCoders-FoodLog01

3) CREATE REQUIRED .ENV FILES

A) FRONTEND ENV (repo root)
Create: a .env file in SavvyCoders-FoodLog01/

Put this in it (replace YOUR_LAPTOP_IP):
EXPO_PUBLIC_API_BASE=http://YOUR_LAPTOP_IP:3000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

Find YOUR_LAPTOP_IP on Windows:
ipconfig | findstr /R /C:"IPv4 Address"

Use the Wi-Fi LAN IP (usually 192.168.x.x). Example:
EXPO_PUBLIC_API_BASE=http://192.168.4.35:3000

B) BACKEND ENV (server folder)
Create: a .env file in SavvyCoders-FoodLog01/server/

Put this in it:
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/foodlog?schema=public
PORT=3000
JWT_SECRET=some-long-random-secret
OPENAI_API_KEY=sk-your-real-key
GOOGLE_CLIENT_ID=your-google-client-id
APPLE_CLIENT_ID=your-apple-client-id

4) INSTALL FRONTEND DEPENDENCIES (repo root)
From repo root (SavvyCoders-FoodLog01):
npm install

5) INSTALL BACKEND DEPENDENCIES + PRISMA CLIENT (server folder)

*OPEN A NEW TERMINAL ON VSCODE AND TYPE THESE COMMANDS*
cd server
npm install
npx prisma generate

---------------------------------------------------------------------
FIRST TIME SETUP IS DONE, NOW WHEN YOU WANT TO ACTUALLY TEST THE APP
---------------------------------------------------------------------

STEP 1:

(IN TERMINAL A — In your first terminal type these commands in this order)

cd server

docker compose up -d

npm install

npx prisma migrate dev

npm run db:seed

npm run dev

BACKEND SHOULD BE LISTENING ON:
- http://127.0.0.1:3000 (computer)
- http://YOUR_LAPTOP_IP:3000 (phone)


STEP 2:

(IN TERMINAL B — from repo root (should look something like C:\Users\YOURNAME\Documents\GitHub\SavvyCoders-FoodLog01>) )

npx expo start -c

SCAN QR CODE WITH:
- iOS Camera app → opens Expo Go
- or open Expo Go and scan

------------------------------------------------------------
“IS IT WORKING?” HOW TO CHECK
------------------------------------------------------------

A) CHECK BACKEND IS RUNNING (run in command prompt or powershell or something on computer)
curl "http://127.0.0.1:3000/foods?q="

Expected:
[]   (empty array on fresh DB, that is OK)

B) CHECK YOUR PHONE CAN REACH YOUR BACKEND (LAN)
Your phone MUST be able to reach:
http://YOUR_LAPTOP_IP:3000

If "Continue With Google" or "Continue With Apple" OAuth button fails with “Network request failed”, it almost always means:
- EXPO_PUBLIC_API_BASE is wrong, OR
- phone and laptop not on same Wi-Fi, OR
- backend not running

------------------------------------------------------------
WHEN YOU’RE TESTING ON YOUR PHONE (IMPORTANT)
------------------------------------------------------------

1) Physical device must use your PC LAN IP:
- root .env must have:
  EXPO_PUBLIC_API_BASE=http://YOUR_LAPTOP_IP:3000

2) Laptop + phone must be on the same Wi-Fi network.

------------------------------------------------------------
HOW TO SHUT IT DOWN WHEN YOU ARE DONE
------------------------------------------------------------

1) Stop database container:
- Terminal A (in ./server):
  docker compose down

2) Stop backend server:
- Terminal A: Ctrl + C

3) Stop Expo:
- Terminal B: Ctrl + C
