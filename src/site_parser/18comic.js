"use strict";
const path=require('path');
const AParserClass=require('./parent.js');
const axios = require('axios');
const utils = require('../utils.js');
const name = '18comic';
class Parser extends AParserClass{
    constructor() {
        super();
        this.parser_name = name;
    };
    static getName(){
        return name;
    }
    getIndexPageUrl(page){
        page=page||1;
        return `https://18comic.org/albums?o=mr&page=${page}`;
    }
    getDetailPageUrl(id){
        return `https://18comic.org/album/${id}/`;
    }
    parseIndexPage(page){
        return (async _=>{
            // if(page!=1){
            //     this.parseIndexPage(1);
            // }
            let content=this.load('index',page);
            const str_url = this.getIndexPageUrl(page);
            if(!content){
                const response=await axios({
                    method: 'get',
                    url: str_url,
                    // onDownloadProgress: fnCreate_on_download_progress(el_loading),
                })
                content=response.data;
                this.save('index',page,content);
            }

            const dom_parser = new DOMParser();
            const xmlDoc = dom_parser.parseFromString(content, "text/html");
            
            const el_list = xmlDoc.querySelectorAll('div.container div.list-col>.well.well-sm');
            const albums_list=[];
            el_list.forEach((el)=>{
                const el_href = el.querySelector('a');
                const el_img = el.querySelector('.thumb-overlay-albums img');
                const href = el_href.getAttribute('href');
                const thumb = el_img.getAttribute('data-original');
                const title = el_img.getAttribute('title');
                const comic_id=/\/(\d+)\//.exec(href)[1];
                const albums_url=new URL(href,str_url);
                const albums={
                    id: comic_id,
                    url: albums_url.toString(),
                    thumb_url:thumb,
                    title:title,

                }
                albums_list.push(albums);

            });
            
            return albums_list;
        })();
    }

    parseImages(album,callback_progress){
        // album={
        //     id: 182168,
        //     url: 'https://18comic.org/album/182168/'
        // }
        let progress=0.0;
        const fn_fire_progress=(progress)=>{
            if (typeof (callback_progress) === 'function') {
                callback_progress({
                    data: album,
                    progress: progress,
                });
            };
        };
        let detail_url = album.url;
        return (async _=>{
            let series_list=undefined;
            try{
                series_list = JSON.parse(this.load('series_list', album.id));
            }catch(e){};
            
            if (series_list === undefined || series_list.length===0){
                series_list=[];
                const response = await axios({
                    method: 'get',
                    url: detail_url,
                    // onDownloadProgress: (event)=>{
                    // },
                    // proxy:{
                    //     host: '127.0.0.1',
                    //     port: 18801,
                    // },
                    // headers:{
                    //     'Remote Address': '127.0.0.1:18801',
                    // },
                })
                const content = response.data;
                const dom_parser = new DOMParser();
                const htmlDoc = dom_parser.parseFromString(content, "text/html");
                const el_series_list=[];
                const el_episode=htmlDoc.querySelector('.episode')
                if (el_episode){
                    el_episode.querySelectorAll('a').forEach((el_series)=>{
                        el_series_list.push(el_series);
                    });
                }else{
                    const el_series = htmlDoc.querySelector('a.reading');
                    if(el_series){
                        el_series_list.push(el_series);
                    }
                }
                const progress_total_page = 1 + el_series_list.length;
                progress = 1 / progress_total_page;
                fn_fire_progress(progress);

                for (let index = 0; index < el_series_list.length;index++){
                    const el_series = el_series_list[index];
                    const series_url = new URL(el_series.getAttribute('href'), detail_url);
                    const series_id = /\/photo\/(\d+)/.exec(series_url)[1];
                    const series={
                        id: series_id,
                        url: series_url.toString(),
                    };
                    
                    const response = await axios({
                        method: 'get',
                        url: series_url,
                        // onDownloadProgress: (event) => {
                        // },
                    })
                    const content = response.data;
                    const dom_parser = new DOMParser();
                    const htmlDoc = dom_parser.parseFromString(content, "text/html");
                    
                    const el_title = htmlDoc.querySelector('title');
                    let title=undefined;
                    if(el_title){
                        title = el_title.innerText;
                        const r_re = /^([^|]*)|/.exec(title);
                        if(r_re){
                            title=r_re[1];
                        }
                        title=title.trim();
                    }
                    if(!title){
                        title='无标题';
                    }
                    series['title'] = title;

                    const img_url_list=[]
                    htmlDoc.querySelectorAll('img[class*=img-responsive-]').forEach((el_img)=>{
                        let str_url=el_img.dataset['original'];
                        if(!str_url){
                            str_url=el_img.getAttribute('src');
                        }
                        if (str_url){
                            const img_url = new URL(str_url, series_url);
                            img_url_list.push(img_url.toString());
                        }
                    });
                    series['img_url_list'] = img_url_list;
                    
                    series_list.push(series);
                    
                    progress = (index + 2) / progress_total_page;
                    fn_fire_progress(progress);

                }

                this.save('series_list', album.id, JSON.stringify(series_list));
            }


            return series_list;
        })();
    }
}
module.exports=Parser