-- Quick2Learn Production Database Least-Privilege Provisioning
-- Ensures the production database user owns only the quick2learn database and is NOT a superuser.

-- 1. Create dedicated application role (non-superuser)
CREATE USER q2l_app WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PRODUCTION_DB_PASSWORD';

-- 2. Create production database owned by q2l_app
CREATE DATABASE quick2learn WITH OWNER = q2l_app ENCODING = 'UTF8';

-- Connect to quick2learn database
\c quick2learn;

-- 3. Lock down public schema permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO q2l_app;

-- 4. Grant privileges on all current and future objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO q2l_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO q2l_app;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO q2l_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO q2l_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO q2l_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO q2l_app;

-- 5. Explicitly deny superuser privileges
ALTER USER q2l_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
