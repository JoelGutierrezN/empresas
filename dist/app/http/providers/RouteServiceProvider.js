"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteServiceProvider = void 0;
const express_1 = require("express");
const api_1 = require("../../../routes/api");
const business_1 = require("../../../routes/business");
class RouteServiceProvider {
    static get routes() {
        const router = (0, express_1.Router)();
        router.use('/api', api_1.ApiRoutes.routes);
        router.use('/api/business', business_1.BusinessRoutes.routes);
        return router;
    }
}
exports.RouteServiceProvider = RouteServiceProvider;
