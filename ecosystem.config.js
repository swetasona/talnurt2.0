module.exports = {
  apps: [
    {
      name: "talnurt",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/talnurt2.0",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
        NEXTAUTH_URL: "https://swetacodes.xyz",
        BASE_URL: "https://swetacodes.xyz",
        API_URL: "https://swetacodes.xyz/api",
        NEXT_PUBLIC_API_URL: "https://swetacodes.xyz/api",
        DB_HOST: "localhost",
        DB_USER: "postgres",
        DB_PASSWORD: "12345678",
        DB_NAME: "postgres",
        DB_PORT: 5432,
        NEXTAUTH_SECRET: "4c398c042a7bb6e983ad7c0be23a07fe073a4de169291db4cb6e40302b9d1f76"
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    }
  ]
};
