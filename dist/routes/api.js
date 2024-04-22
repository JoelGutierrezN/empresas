"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRoutes = void 0;
const express_1 = require("express");
class ApiRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        // Api global routes
        return router;
    }
}
exports.ApiRoutes = ApiRoutes;
