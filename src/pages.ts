import * as fs from "fs/promises";
import Handlebars from "handlebars";
import * as responses from "./response";

export const MAIN: string = "assets/html/master/main.html.hbs";
export const POSTS: string = "assets/html/master/posts.html.hbs";

export async function createTemplate(filename: string): Promise<HandlebarsTemplateDelegate<any>> {
    let content = await fs.readFile(filename);
    let template = Handlebars.compile(content.toString());
    return template;
}

export class Templates {
    private templates: { [key: string]: HandlebarsTemplateDelegate<any> };
    private cache: boolean;

    constructor(cache: boolean = true) {
        this.templates = {};
        this.cache = cache;
    }

    async render(templateName: string, data: any): Promise<string> {
        if(!this.cache) {
            let template = await createTemplate(templateName);
            return template(data);
        }
        let template = this.templates[templateName];
        if(template === undefined) {
            template = await createTemplate(templateName);
            this.templates[templateName] = template;
        }
        return template(data);
    }

    async respond(templateName: string, data: any): Promise<responses.Response> {
        return responses.ok(await this.render(templateName, data));
    }
}
