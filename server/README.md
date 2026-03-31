##DO THIS WHENEVER YOU WANT TO RUN THE BACKEND SERVER NOW##

docker compose up -d

cd server && npm i

npx prisma migrate dev

npm run db:seed

npm run dev

##WHEN YOU,RE TESTING ON YOUR PHONE##
Physical device must use PC LAN IP