"use strict";
const Parser18comic=require('./site_parser/18comic');
const parser_dict={};

parser_dict[Parser18comic.getName()] = new Parser18comic();
module.exports = {
    parser_dict,
}