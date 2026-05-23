import 'dotenv/config'

process.env.DATABASE_URL ??=
  'postgresql://hrportal:hrportal@localhost:5432/hrportal?schema=public'
