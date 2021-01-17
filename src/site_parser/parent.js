"use strict";
class Parser{
    constructor() {};
    save(page_type,page_index,content){
        const key = `${this.parser_name}-${page_type}-${page_index}`;
        localStorage[key]=content;
    }
    load(page_type, page_index) {
        const key = `${this.parser_name}-${page_type}-${page_index}`;
        return localStorage[key];
    }
    
}

module.exports = Parser