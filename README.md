posgresql databasei hamar user u database grancel 
1. sudo su - postgres
2. psql
3. CREATE DATABASE database_name;
4. CREATE USER user_name WITH PASSWORD 'password';
5. GRANT ALL PRIVILEGES ON DATABASE database_name TO user_name;

