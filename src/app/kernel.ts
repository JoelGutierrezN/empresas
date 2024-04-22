import express, {Router} from 'express';
import cors from 'cors';
import path from "node:path";

interface Options{
    port: number;
    routes: Router;
    public_path?: string;
}

export class Kernel {

    private app = express();
    private readonly port: number;
    private readonly publicPath: string;
    private readonly routes: Router;

    constructor(options: Options) {
        const {port, routes, public_path = 'public'} = options;
        this.port = port;
        this.publicPath = public_path;
        this.routes = routes;
    }

    async start() {

        // Middlewares
        this.app.use(express.json());
        this.app.use(cors());
        this.app.use(express.urlencoded({ extended: false }));

        // Public folder
        this.app.use( express.static(this.publicPath) );

        //Routes
        this.app.use( this.routes );


        this.app.get('*', (req, res) => {
            const indexPath = path.join(__dirname + `../../../${this.publicPath}/index.html`);
            res.sendFile(indexPath);
            return;
        });


        this.app.listen(this.port, ()=>{
            console.log(`Server running on port ${this.port}`);
        })
    }

}