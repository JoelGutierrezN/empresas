"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kernel_1 = require("./app/kernel");
const app_1 = require("./config/app");
const RouteServiceProvider_1 = require("./app/http/providers/RouteServiceProvider");
(() => {
    main();
})();
function main() {
    const server = new kernel_1.Kernel({
        port: app_1.app.PORT,
        routes: RouteServiceProvider_1.RouteServiceProvider.routes,
        public_path: app_1.app.PUBLIC_PATH
    });
    server.start();
}
