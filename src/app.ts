import { Kernel } from "./app/kernel";
import { app } from "./config/app";
import { RouteServiceProvider } from "./app/http/providers/RouteServiceProvider";

(()=>{
    main();
})();

function main(){
    const server = new Kernel({
        port: app.PORT,
        routes: RouteServiceProvider.routes,
        public_path: app.PUBLIC_PATH
    });

    server.start();
}