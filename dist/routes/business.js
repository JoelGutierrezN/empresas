"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRoutes = void 0;
const express_1 = require("express");
const BusinessController_1 = require("../app/http/controllers/BusinessController");
class BusinessRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        const businessController = new BusinessController_1.BusinessController();
        router.get('/:date', businessController.index);
        return router;
    }
}
exports.BusinessRoutes = BusinessRoutes;
