import { Router } from "express";
import { ApiRoutes } from "../../../routes/api";
import { BusinessRoutes } from "../../../routes/business";

export class RouteServiceProvider {
    static get routes(): Router {
        const router = Router();

        router.use('/api', ApiRoutes.routes);
        router.use('/api/business', BusinessRoutes.routes);


        return router;
    }
}