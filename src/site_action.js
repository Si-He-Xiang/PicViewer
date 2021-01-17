"use strict";
const { dialog} = require('electron').remote;
const fs=require('fs');
const path=require('path')
const utils=require('./utils.js')
const {parser_dict}=require('./parserFactory');
const { ComicMode } = require('./common.js')

// axios.default.proxy={
//     host: '127.0.0.1',
//     port: 18801,
// }
let selected_parser=undefined;

const fn_get_loading=(el_container)=>{
    let el_loading=el_container.querySelector('.right-view-item.loading')
    if(!el_loading){
        el_loading=document.createElement('div');
        el_loading.classList.add('right-view-item');
        el_loading.classList.add('loading');
        const el_div = document.createElement('div');
        el_div.innerHTML = '<i class="fas fa-spinner"></i>';
        el_loading.append(el_div);
        const el_display_container=document.createElement('div');
        el_display_container.classList.add('display-container');
        el_div.append(el_display_container);
        const el_display = document.createElement('span');
        el_display.classList.add('display');
        el_display.innerHTML="";
        el_display_container.append(el_display)

        const el_span = document.createElement('span');
        el_span.innerHTML='正在读取网站内容，请稍后...';
        el_loading.append(el_span);
        el_container.append(el_loading);
        const interval_id=window.setInterval(()=>{
            const el_icon=el_container.querySelector('.loading .fa-spinner')
            if(!el_icon){
                window.clearInterval(interval_id);
                return;
            }
            let current_transform=el_icon.style['transform'];
            const m = /(\d+)deg/i.exec(current_transform);
            if(!m){
                el_icon.style['transform'] ='rotate(0deg)';
                return;
            }
            let deg = (parseInt(m[1]) + 1)%360;
            el_icon.style['transform'] = `rotate(${deg}deg)`;
        },10);
    }
    return el_loading;
};
const fn_clean_download_progress_display = (el_loading) => {
    const el_display = el_loading.querySelector('.display');
    if (el_display){
        el_display.innerHTML='';
    }
};
const fnCreate_on_download_progress = (el_loading)=>{
    return (event)=>{
        const el_display=el_loading.querySelector('.display');
        if (el_display){
            if(event.total>0){
                el_display.innerHTML=`${(100*event.loaded / event.total).toFixed(0)}%`;
            }else{
                el_display.innerHTML = `${isNaN(parseInt(el_display.innerHTML)) ? 1 : parseInt(el_display.innerHTML)+1}`;
            }
        }
    };
}

const fn_create_album = (album)=>{
    const el_album_container=document.createElement('div');
    el_album_container.classList.add('album');
    el_album_container.classList.add('desc');
    
    const el_album = document.createElement('div');
    el_album.classList.add('album-img-container');
    el_album_container.append(el_album);
    const el_img = document.createElement('img');
    el_img.classList.add('album-img');
    el_album.append(el_img);


    const el_title = document.createElement('div');
    el_title.classList.add('title');
    el_album_container.append(el_title);
    const el_txt = document.createElement('div');
    el_txt.classList.add('txt');
    el_title.append(el_txt);

    // TODO 这里要放开
    el_img.src = album.thumb_url;
    el_txt.innerText = album.title;
    el_img.setAttribute('alt', album.title)
    el_album_container.setAttribute('title', album.title)
    el_album_container.setAttribute('alt', album.title)
    utils.attachDataToEl(el_album_container, 'album', album);

    el_album_container.addEventListener('dblclick',(event)=>{
        const el_album_container = event.target.closest('.album.desc');
        if (el_album_container){
            const album = utils.parseDataFromEl(el_album_container,'album');
            (async _=>{
                // chapter_list: 章节列表，数组
                const chapter_list=await selected_parser.parseImages(album,(progress)=>{
                    // console.log(progress);
                });

                const el_fullwindows_contailer=ComicMode.get_image_fullwindows_container();
                el_fullwindows_contailer.classList.remove('hide');
// TODO 删除输出
                ComicMode.inject_image_refresh(chapter_list, el_fullwindows_contailer);
            })();
            // console.log(album);
        }

    });

    return el_album_container;
};
const fn_show_site_index_in_right = (albums_list)=>{
    const el_container = document.querySelector('#right-container');
    let el_albums_shower = el_container.querySelector('.right-view-item.albums-shower')
    if (!el_albums_shower){
        el_albums_shower=document.createElement('div');
        el_albums_shower.classList.add('right-view-item');
        el_albums_shower.classList.add('albums-shower');
        el_container.append(el_albums_shower);
        const el_albums_list = document.createElement('div');
        el_albums_list.classList.add('albums-list');
        el_albums_list.classList.add('size-middle');
        el_albums_shower.append(el_albums_list);

    }
    el_albums_shower.classList.remove('hide');
    const el_albums_list = el_albums_shower.querySelector('.albums-list');
    (albums_list || []).forEach((album)=>{
        const el_album = fn_create_album(album);
        el_albums_list.append(el_album);
    });

};
const fn_show_loading_in_right=()=>{
    const el_container = document.querySelector('#right-container');
    const el_loading = fn_get_loading(el_container);
    utils.fn_hide_right_all();

    fn_clean_download_progress_display(el_loading);
    el_loading.classList.remove('hide');
}
const fn_hide_loading_in_right = () => {
    const el_container = document.querySelector('#right-container');
    const el_loading = fn_get_loading(el_container);

    fn_clean_download_progress_display(el_loading);
    el_loading.classList.add('hide');
}

const fn_init_left_site=()=>{
    const el_ul=document.querySelector('#selected-site>ul');
    el_ul.addEventListener('click',(event)=>{
        const target=event.target;
        const el_li=target.closest('li');
        if(el_li){
            let parser_name = utils.parseDataFromEl(el_li, 'name');
            if (!parser_name){
                const el_span=el_li.querySelector('span');
                if(el_span){
                    parser_name = el_span.innerText;
                }
            }
            if(parser_name){
                (async _=>{
                    fn_show_loading_in_right();
                    selected_parser = parser_dict[parser_name];
                    const albums_list =await selected_parser.parseIndexPage(1);
                    fn_hide_loading_in_right();
                    fn_show_site_index_in_right(albums_list);
                })();
            }
        }
    });
};
document.addEventListener('DOMContentLoaded',(event)=>{
    fn_init_left_site();
});

module.exports={

}