import { AppleAuthConfig } from 'apple-auth';
import dotenv from 'dotenv';
import { RedisConfig, ServiceAccount } from '../@types/types-custom';

// '.env' File Loading
dotenv.config();

const NODE_ENV: string = process.env.NODE_ENV || 'dev';

if (NODE_ENV === 'prod') dotenv.config({ path: `${__dirname}/../../.env.prod` });
else if (NODE_ENV === 'dev') dotenv.config({ path: `${__dirname}/../../.env.dev` });
else if (NODE_ENV === 'test') dotenv.config({ path: `${__dirname}/../../.env.test` });

// Apple Config
const appleConfig = {
  client_id: process.env.APPLE_CLIENT_ID,
  team_id: process.env.APPLE_TEAM_ID,
  key_id: process.env.APPLE_KEY_ID,
  redirect_uri: process.env.APPLE_REDIRECT_URI,
  scope: process.env.APPLE_SCOPE,
} as AppleAuthConfig;

const fcmConfig = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: String(process.env.PRIVATE_KEY).replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
} as ServiceAccount;

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
} as RedisConfig;

// ENV Module
export default {
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT),
  PASSWORD_SECRET: process.env.PASSWORD_SECRET,
  APPLE: appleConfig,
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL,
  },
  FIREBASE: process.env.FIREBASE_CONFIG_ROOT,
  FCM: fcmConfig,
  REDIS: redisConfig,
};
