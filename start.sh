#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U yourusername; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing Prisma migrations"
npx prisma db push

echo "Database table inspection complete. Results saved to /app/db_tables.log"
cat /app/db_tables.log

# Check the environment variable APP_MODE
if [ "$APP_MODE" = "development" ]; then
  echo "Starting the application in development mode"
  npm run dev
else
  echo "Starting the application in production mode"
  npm start
fi