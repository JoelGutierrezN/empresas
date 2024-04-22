import { Router } from "express";
import { BusinessController } from "../app/http/controllers/BusinessController";

export class BusinessRoutes {
    static get routes(): Router {
        const router = Router();
        const businessController = new BusinessController();

        router.get('/:date', businessController.index);

        return router;
    }
}