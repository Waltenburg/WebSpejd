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
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = exports.response_code = exports.redirect = exports.forbidden = exports.unauthorized = exports.not_found = exports.server_error = exports.file = exports.ok = void 0;
const fs = __importStar(require("fs/promises"));
const files_1 = require("./files");
function ok(content, headers) {
    return {
        status_code: 200,
        content: content,
        headers: headers
    };
}
exports.ok = ok;
async function file(path) {
    try {
        const content = await fs.readFile(path);
        const mimeType = files_1.files.determineContentType(path);
        return {
            status_code: 200,
            content: content,
            headers: {
                "Content-Type": mimeType
            }
        };
    }
    catch (e) {
        return server_error();
    }
}
exports.file = file;
function server_error(content) {
    return {
        status_code: 500,
        content: content
    };
}
exports.server_error = server_error;
function not_found(content) {
    return {
        status_code: 404,
        content: content
    };
}
exports.not_found = not_found;
function unauthorized(content) {
    return {
        status_code: 401,
        content: content
    };
}
exports.unauthorized = unauthorized;
function forbidden(content) {
    return {
        status_code: 403,
        content: content
    };
}
exports.forbidden = forbidden;
function redirect(path) {
    return {
        status_code: 303,
        content: null,
        headers: {
            "Location": path
        }
    };
}
exports.redirect = redirect;
function response_code(status_code, content) {
    return {
        status_code: status_code,
        content: content
    };
}
exports.response_code = response_code;
function send(connection, response) {
    for (let header in response.headers) {
        connection.setHeader(header, response.headers[header]);
    }
    connection.writeHead(response.status_code);
    connection.end(response.content);
}
exports.send = send;
//# sourceMappingURL=response.js.map