-- Creates test database on postgres container startup
SELECT 'CREATE DATABASE quick2learn_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'quick2learn_test')\gexec
