import {Router} from "express";
import {BusinessController} from "../app/http/controllers/BusinessController";

export class WebRoutes {

    public routes = (): Router => {
        const router = Router();

        return router;
    }

}