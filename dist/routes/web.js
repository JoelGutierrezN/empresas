"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRoutes = void 0;
const express_1 = require("express");
class WebRoutes {
    constructor() {
        this.routes = () => {
            const router = (0, express_1.Router)();
            return router;
        };
    }
}
exports.WebRoutes = WebRoutes;
