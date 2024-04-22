"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const env_var_1 = require("env-var");
exports.app = {
    PORT: (0, env_var_1.get)('PORT').required().asPortNumber(),
    PUBLIC_PATH: (0, env_var_1.get)('PUBLIC_PATH').default('public').asString(),
    SFTP_URL: (0, env_var_1.get)('SFTP_URL').default('sftp://Public:PubAccess1845!@sftp.floridados.gov').asString(),
};
