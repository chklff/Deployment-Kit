#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U yourusername; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done


echo "PostgreSQL is up - executing Prisma migrations"
npx prisma db push

echo "Database table inspection complete. Results saved to /app/db_tables.log"
cat /app/db_tables.log


# Define the token directly in the script
TOKEN="e6927c43c37d18d2222dd1da032940efebe3eebf3a3a94764835e04d9d481750"

echo "Using hardcoded token: $TOKEN"

echo "Starting countdown... Total wait time: 10 seconds."

# Wait for 50 seconds
echo "Waiting for 10 seconds..."
sleep 10

echo "10 seconds passed. Now retrieving user ID from nc_users_v2 table..."

# Retrieve the user ID from the nc_users_v2 table
USER_ID=$(psql postgresql://yourusername:yourpassword@postgres:5432/nocodb_db -t -c "SELECT id FROM nc_users_v2 WHERE email = 'admin@example.com';" | xargs)

echo "User ID found: $USER_ID"

echo "Adding record to nc_api_tokens table with User ID: $USER_ID..."

# Insert token into the nc_api_tokens table using the found USER_ID
psql postgresql://yourusername:yourpassword@postgres:5432/nocodb_db <<EOF
INSERT INTO nc_api_tokens (base_id, db_alias, description, permissions, token, expiry, enabled, created_at, updated_at, fk_user_id)
VALUES (
    '', 
    '', 
    'Token-1', 
    '', 
    '$TOKEN', 
    null, 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP, 
    '$USER_ID'
);
EOF

echo "Token added to the database."

# 1. Create the project and capture the project ID
echo "Creating the project..."

PROJECT_RESPONSE=$(curl --location "http://nocodb:8080/api/v1/db/meta/projects/" \
--header "xc-token: $TOKEN" \
--header "Content-Type: application/json" \
--data '{
    "title": "YESSSS 777",
    "meta": "{\"iconColor\":\"#7D26CD\"}"
}')

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.id')

echo "Project created with ID: $PROJECT_ID"

# 2. Create the integration and capture the integration ID
echo "Creating the integration..."

INTEGRATION_RESPONSE=$(curl --location "http://nocodb:8080/api/v2/meta/integrations" \
--header "xc-token: $TOKEN" \
--header "Content-Type: application/json" \
--data "{
    \"title\": \"bridge2\",
    \"type\": \"database\",
    \"sub_type\": \"pg\",
    \"config\": {
        \"client\": \"pg\",
        \"connection\": {
            \"host\": \"postgres\",
            \"port\": 5432,
            \"user\": \"yourusername\",
            \"password\": \"yourpassword\",
            \"database\": \"prisma_db\"
        },
        \"searchPath\": [
            \"public\"
        ]
    },
    \"is_private\": false
}")

INTEGRATION_ID=$(echo $INTEGRATION_RESPONSE | jq -r '.id')

echo "Integration created with ID: $INTEGRATION_ID"

# 3. Create the source using the captured project ID and integration ID
echo "Creating the source..."

curl --location "http://nocodb:8080/api/v1/db/meta/projects/$PROJECT_ID/bases/" \
--header "xc-token: $TOKEN" \
--header "Content-Type: application/json" \
--data "{
    \"fk_integration_id\": \"$INTEGRATION_ID\",
    \"alias\": \"Testbebebe\",
    \"config\": {
        \"connection\": {
            \"client\": \"pg\",
            \"database\": \"prisma_db\"
        },
        \"searchPath\": [
            \"public\"
        ]
    },
    \"inflection_column\": \"none\",
    \"inflection_table\": \"none\",
    \"is_schema_readonly\": true,
    \"is_data_readonly\": false
}"


# Check the environment variable APP_MODE
if [ "$APP_MODE" = "development" ]; then
  echo "Starting the application in development mode"
  node -r dotenv/config start-dev.js dotenv_config_path=.env.development
else
  echo "Starting the application in production mode"
  node -r dotenv/config src/app.js dotenv_config_path=.env.production
fi