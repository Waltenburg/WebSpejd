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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.file = file;
exports.server_error = server_error;
exports.not_found = not_found;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.redirect = redirect;
exports.response_code = response_code;
exports.send = send;
const fs = __importStar(require("fs/promises"));
const files_1 = require("./files");
function ok(content, headers) {
    return {
        status_code: 200,
        content: content,
        headers: headers
    };
}
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
function server_error(content) {
    return {
        status_code: 500,
        content: content
    };
}
function not_found(content) {
    return {
        status_code: 404,
        content: content
    };
}
function unauthorized(content) {
    return {
        status_code: 401,
        content: content
    };
}
function forbidden(content) {
    return {
        status_code: 403,
        content: content
    };
}
function redirect(path) {
    return {
        status_code: 303,
        content: null,
        headers: {
            "Location": path
        }
    };
}
function response_code(status_code, content) {
    return {
        status_code: status_code,
        content: content
    };
}
function send(connection, response) {
    for (let header in response.headers) {
        connection.setHeader(header, response.headers[header]);
    }
    connection.writeHead(response.status_code);
    connection.end(response.content);
}
//# sourceMappingURL=response.js.map