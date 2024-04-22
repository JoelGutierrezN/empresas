"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessController = void 0;
const ssh2_sftp_client_1 = __importDefault(require("ssh2-sftp-client"));
const url_1 = require("url");
const app_1 = require("../../../config/app");
const fs = __importStar(require("node:fs"));
const client_1 = require("@prisma/client");
class BusinessController {
    constructor() {
        this.index = (request, response) => {
            try {
                (() => __awaiter(this, void 0, void 0, function* () {
                    const data = yield this.downloadFile(request.params.date, response);
                    if (data) {
                        const { localFile, newDate } = data;
                        fs.readFile(localFile, 'utf8', (err, data) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                response.status(404).json({
                                    result: false,
                                    status: 'error',
                                    message: 'Aun no hay datos existentes para la fecha seleccionada.',
                                    data: []
                                });
                            }
                            // Split the file contents into rows
                            let rows = data.split('\n');
                            // Process the rows
                            const processedRows = yield this.buildItems(rows, newDate.id.toString());
                            console.log(newDate.id);
                            for (const row of processedRows) {
                                const corporation = yield this.prisma.corporations.findFirst({
                                    where: {
                                        Document: row['Document'],
                                        date_id: newDate.id
                                    },
                                });
                                if (corporation) {
                                    if (row['Person3_Zip'] && row['Person3_Zip'].length > 25) {
                                        // Truncate 'Person3_Zip' if necessary
                                        row['Person3_Zip'] = row['Person3_Zip'].substring(0, 25);
                                    }
                                    // Si la corporación existe, actualiza
                                    yield this.prisma.corporations.update({
                                        where: { id: corporation.id },
                                        data: row
                                    });
                                }
                                else {
                                    // Si la corporación no existe, crea una nueva
                                    row['date_id'] = newDate.id;
                                    if (row['Person3_Zip'] && row['Person3_Zip'].length > 25) {
                                        // Truncate 'Person3_Zip' if necessary
                                        row['Person3_Zip'] = row['Person3_Zip'].substring(0, 25);
                                    }
                                    yield this.prisma.corporations.create({
                                        data: row
                                    });
                                }
                            }
                            console.log(`Inserted/updated ${processedRows.length} rows in the database`);
                        }));
                        const corporations = yield this.prisma.corporations.findMany({
                            where: {
                                date_id: newDate.id,
                            }
                        });
                        const corporationsWithStrings = corporations.map(corporation => (Object.assign(Object.assign({}, corporation), { date_id: corporation.date_id.toString() })));
                        yield this.client.end();
                        response.json(corporationsWithStrings);
                    }
                }))();
            }
            catch (error) {
                console.error('Error in the /process-data endpoint:', error);
                response.status(500).send('An error occurred while processing the data.');
            }
        };
        this.prisma = new client_1.PrismaClient();
        this.client = new ssh2_sftp_client_1.default();
    }
    downloadFile(requestedDate, response) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.end();
            const parsedURL = new url_1.URL(app_1.app.SFTP_URL);
            const port = Number(parsedURL.port) || 22;
            const { host, username, password } = parsedURL;
            yield this.client.connect({ host, port, username, password });
            // Se crea una nueva fecha con el día anterior al actual
            const date = new Date(requestedDate);
            let year = date.getFullYear();
            let month = (date.getMonth() + 1).toString().padStart(2, '0');
            let day = date.getDate().toString().padStart(2, '0');
            const remoteFile = `/public/doc/cor/${year}${month}${day}c.txt`;
            console.log(remoteFile);
            const localDirectory = '/storage/files/';
            fs.mkdirSync(localDirectory, { recursive: true });
            const localFile = `${localDirectory}${year}${month}${day}c.txt`;
            // Guardar descarga el archivo y lo guarda en storage
            const fileList = yield this.client.list('/public/doc/cor');
            const existFile = fileList.some(file => file.name === `${year}${month}${day}c.txt`);
            if (existFile) {
                yield this.client.fastGet(remoteFile, localFile);
                yield this.client.end();
                // Se crea la nueva fecha en la tabla dates para asociar los registros a la fecha
                const newDate = yield this.createDate(date);
                return { localFile, newDate };
            }
            else {
                yield this.client.end();
                response.status(404).json({
                    result: false,
                    status: 'error',
                    message: 'Aun no hay datos existentes para la fecha seleccionada.',
                    data: []
                });
            }
        });
    }
    buildItems(rows, date_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const columnMapping = yield this.columnMapping();
            const processedRows = [];
            for (const row of rows) {
                const rowData = {};
                for (const { start, end, column, truncate } of columnMapping) {
                    const value = row.substring(start - 1, end).replace(/\s+/g, ' ').trim();
                    switch (column) {
                        case 0:
                            rowData["Document"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 1:
                            rowData["Name"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 2:
                            rowData["Status"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 3:
                            rowData["Address"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 4:
                            rowData["City"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 5:
                            rowData["State"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 6:
                            rowData["Zip"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 7:
                            rowData["Mail_Addr"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 8:
                            rowData["Mail_City"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 9:
                            rowData["Mail_State"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 10:
                            rowData["Mail_Zip"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 11:
                            rowData["File_Date"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 12:
                            rowData["FEIN"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 13:
                            rowData["Person1_Title"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 14:
                            rowData["Person1_Type"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 15:
                            rowData["Person1_Name"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 16:
                            rowData["Person1_Address"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 17:
                            rowData["Person1_City"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 18:
                            rowData["Person1_State"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 19:
                            rowData["Person1_Zip"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 20:
                            rowData["Person2_Title"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 21:
                            rowData["Person2_Type"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 22:
                            rowData["Person2_Name"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 23:
                            rowData["Person2_Address"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 24:
                            rowData["Person2_City"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 25:
                            rowData["Person2_State"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 26:
                            rowData["Person2_Zip"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 27:
                            rowData["Person3_Title"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 28:
                            rowData["Person3_Type"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 29:
                            rowData["Person3_Name"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 30:
                            rowData["Person3_Address"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 31:
                            rowData["Person3_City"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 32:
                            rowData["Person3_State"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 33:
                            rowData["Person3_Zip"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 34:
                            rowData["Person4_Title"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 35:
                            rowData["Person4_Type"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 36:
                            rowData["Person4_Name"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 37:
                            rowData["Person4_Address"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 38:
                            rowData["Person4_City"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 39:
                            rowData["Person4_State"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 40:
                            rowData["Person4_Zip"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 41:
                            rowData["Person5_Title"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 42:
                            rowData["Person5_Type"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 43:
                            rowData["Person5_Name"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 44:
                            rowData["Person5_Address"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 45:
                            rowData["Person5_City"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 46:
                            rowData["Person5_State"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 47:
                            rowData["Person5_Zip"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 48:
                            rowData["Person6_Title"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 49:
                            rowData["Person6_Type"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 50:
                            rowData["Person6_Name"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 51:
                            rowData["Person6_Address"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 52:
                            rowData["Person6_City"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 53:
                            rowData["Person6_State"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 54:
                            rowData["Person6_Zip"] = truncate ? value.substring(0, truncate) : value;
                            break;
                        case 55:
                            rowData["date_id"] = date_id;
                            break;
                        default: break;
                    }
                }
                processedRows.push(rowData);
            }
            return processedRows;
        });
    }
    columnMapping() {
        return __awaiter(this, void 0, void 0, function* () {
            // Define the column mapping
            return [
                { start: 1, end: 12, column: 0, truncate: null },
                { start: 13, end: 192, column: 1, truncate: null },
                { start: 204, end: 304, column: 2, truncate: null },
                { start: 305, end: 332, column: 3, truncate: null },
                { start: 333, end: 334, column: 4, truncate: null },
                { start: 335, end: 344, column: 5, truncate: null },
                { start: 430, end: 431, column: 6, truncate: null },
                { start: 431, end: 458, column: 7, truncate: null },
                { start: 459, end: 460, column: 8, truncate: null },
                { start: 461, end: 470, column: 9, truncate: null },
                { start: 471, end: 480, column: 10, truncate: null },
                { start: 481, end: 494, column: 11, truncate: null },
                { start: 669, end: 672, column: 12, truncate: null },
                { start: 673, end: 673, column: 13, truncate: null },
                { start: 674, end: 715, column: 14, truncate: null },
                { start: 716, end: 757, column: 15, truncate: null },
                { start: 758, end: 785, column: 16, truncate: null },
                { start: 786, end: 787, column: 17, truncate: null },
                { start: 788, end: 796, column: 18, truncate: null },
                { start: 800, end: 801, column: 19, truncate: null },
                { start: 802, end: 843, column: 20, truncate: null },
                { start: 844, end: 885, column: 21, truncate: null },
                { start: 886, end: 913, column: 22, truncate: null },
                { start: 914, end: 915, column: 23, truncate: null },
                { start: 916, end: 924, column: 24, truncate: null },
                { start: 925, end: 928, column: 25, truncate: null },
                { start: 929, end: 930, column: 26, truncate: null },
                { start: 971, end: 972, column: 27, truncate: null },
                { start: 1013, end: 1013, column: 28, truncate: null },
                { start: 1041, end: 1043, column: 29, truncate: null },
                { start: 1052, end: 1056, column: 30, truncate: null },
                { start: 1057, end: 1099, column: 31, truncate: null },
                { start: 1100, end: 1141, column: 32, truncate: null },
                { start: 1142, end: 1169, column: 33, truncate: null },
                { start: 1170, end: 1171, column: 34, truncate: null },
                { start: 1172, end: 1180, column: 35, truncate: null },
                { start: 1181, end: 1184, column: 36, truncate: null },
                { start: 1185, end: 1186, column: 37, truncate: null },
                { start: 1227, end: 1228, column: 38, truncate: null },
                { start: 1269, end: 1297, column: 39, truncate: null },
                { start: 1298, end: 1299, column: 40, truncate: null },
                { start: 1308, end: 1309, column: 41, truncate: null },
                { start: 1312, end: 1313, column: 42, truncate: null },
                { start: 1314, end: 1355, column: 43, truncate: null },
                { start: 1356, end: 1397, column: 44, truncate: null },
                { start: 1398, end: 1425, column: 45, truncate: null },
                { start: 1426, end: 1427, column: 46, truncate: null },
                { start: 1428, end: 1436, column: 47, truncate: null }
            ];
        });
    }
    createDate(date) {
        return __awaiter(this, void 0, void 0, function* () {
            date.setUTCHours(0, 0, 0, 0);
            console.log(date);
            let dateRecord = yield this.prisma.dates.findFirst({
                where: {
                    date: date
                }
            });
            if (!dateRecord) {
                dateRecord = yield this.prisma.dates.create({
                    data: {
                        date: date
                    }
                });
            }
            return dateRecord;
        });
    }
}
exports.BusinessController = BusinessController;
