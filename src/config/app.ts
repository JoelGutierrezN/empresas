import 'dotenv/config';
import { get } from 'env-var';

export const app = {
    PORT: get('PORT').required().asPortNumber() || 3000,
    PUBLIC_PATH: get('PUBLIC_PATH').default('public').asString(),
    SFTP_URL: get('SFTP_URL').default('sftp://Public:PubAccess1845!@sftp.floridados.gov').asString(),
}