"use strict";
const { dialog} = require('electron').remote;
const fs=require('fs');
const path=require('path')
const utils=require('./utils.js')


    // 将漫画模式的顶部工具栏写入某个父元素
    const inject_toolbar = (fileinfo,el_container)=>{
        const options=utils.parseDataFromEl(el_container,'options')||{};
        let el_toolbar=el_container.querySelector('.toolbar');
        if (!el_toolbar){
            el_toolbar=document.createElement('div');
            el_toolbar.classList.add('toolbar');
            el_container.append(el_toolbar);

            // 关闭容器
            const fn_close=(event)=>{
                const el_container = event.target.closest('.comic-shower');
                if (el_container !== null) {
                    el_container.classList.add('hide');
                }
            }


            // 18comic模式
            // const el_btn_close_18comic = document.createElement('div');
            // el_btn_close_18comic.setAttribute('title', '18comic模式')
            // el_btn_close_18comic.classList.add('btn');
            // el_btn_close_18comic.classList.add('T18comic');
            // el_btn_close_18comic.innerHTML = '18';
            // utils.attachFileInfoToEl(el_btn_close_18comic, fileinfo);
            // el_btn_close_18comic.addEventListener('click', (event) => {
            //     const el_target = event.currentTarget;
            //     const el_container = el_target.closest('.comic-shower');
            //     const fileinfo = utils.parseFileInfoFromEl(el_container);
            //     const options=utils.parseDataFromEl(el_container,'options')||{};
            //     const el_show_list = el_container.querySelector('.comic-show-list');
            //     const scroll_top = el_show_list.scrollTop, container_width = el_show_list.clientWidth
            //     inject_image_refresh(fileinfo, el_container, scroll_top, container_width,{'18comic':!options['18comic']});
            // });
            // el_toolbar.append(el_btn_close_18comic);            

            //取消全屏按钮
            const el_btn_close_fullwindow = document.createElement('div');
            el_btn_close_fullwindow.setAttribute('title', '取消全屏')
            el_btn_close_fullwindow.classList.add('btn');
            el_btn_close_fullwindow.classList.add('close-fullwindow');
            el_btn_close_fullwindow.innerHTML = '<i class="fas fa-compress"></i>';
            utils.attachFileInfoToEl(el_btn_close_fullwindow, fileinfo);
            el_btn_close_fullwindow.addEventListener('click', (event) => {
                const el_target = event.currentTarget;
                const el_container = el_target.closest('.comic-shower')
                const fileinfo = utils.parseFileInfoFromEl(el_container);
                const el_show_list = el_target.closest('.comic-shower').querySelector('.comic-show-list');
                const scroll_top = el_show_list.scrollTop, container_width = el_show_list.clientWidth

                // 打开全屏后关闭全屏内容
                fn_close(event);

                show_image_in_right(fileinfo, scroll_top, container_width);
            });
            el_toolbar.append(el_btn_close_fullwindow);

            //全屏按钮
            const el_btn_fullwindow = document.createElement('div');
            el_btn_fullwindow.setAttribute('title', '全屏浏览')
            el_btn_fullwindow.classList.add('btn');
            el_btn_fullwindow.classList.add('fullwindow');
            el_btn_fullwindow.innerHTML = '<i class="fas fa-expand"></i>';
            utils.attachFileInfoToEl(el_btn_fullwindow, fileinfo);
            el_btn_fullwindow.addEventListener('click', (event) => {
                const el_target = event.currentTarget;
                const el_container = el_target.closest('.comic-shower')
                const fileinfo = utils.parseFileInfoFromEl(el_container);
                const el_show_list = el_target.closest('.comic-shower').querySelector('.comic-show-list');
                const scroll_top=el_show_list.scrollTop, container_width=el_show_list.clientWidth

                // 打开全屏后关闭右侧内容
                fn_close(event);

                show_image_in_fullwindows(fileinfo, scroll_top, container_width);
            });
            el_toolbar.append(el_btn_fullwindow);

            //关闭按钮
            const el_btn_close = document.createElement('div');
            el_btn_close.setAttribute('title','关闭漫画模式')
            el_btn_close.classList.add('btn');
            el_btn_close.classList.add('close');
            el_btn_close.innerHTML = `<i class="fas fa-times-circle"></i>`;
            el_btn_close.addEventListener('click', fn_close);
            el_toolbar.append(el_btn_close);
        }

        const el_btn_18comic = el_container.querySelector('.btn.T18comic');
        if (el_btn_18comic){
            if (options['18comic']) {
                    el_btn_18comic.classList.add('checked');
            } else {
                el_btn_18comic.classList.remove('checked');
            }
        }

        //如果是全屏则显示退出全屏的按钮，否则显示打开全屏的按钮
        const el_btn_fullwindow = el_container.querySelector('.btn.fullwindow');
        const el_btn_close_fullwindow = el_container.querySelector('.btn.close-fullwindow');
        if(el_container.classList.contains('fullwindow')){
            el_btn_fullwindow.classList.add('hide');
            el_btn_close_fullwindow.classList.remove('hide');
        }else{
            el_btn_fullwindow.classList.remove('hide');
            el_btn_close_fullwindow.classList.add('hide');
        }
    }

    // 将漫画模式的内容写入某个父元素
    const inject_image_refresh = (chapter_info, el_container, scroll_top,container_width,options)=>{
        utils.attachFileInfoToEl(el_container, chapter_info);
        let exists_options = utils.parseDataFromEl(el_container,'options')||{};
        exists_options = Object.assign(exists_options,options);
        utils.attachDataToEl(el_container, 'options', exists_options);
        // if (fileinfo.path.endsWith('.18comic')){
        //     exists_options['18comic']=true;
        // }
        
        //写入工具栏
        // inject_toolbar(fileinfo,el_container);

        const fn_load_image = (event,options)=>{
            const el_img=event.target;
            const img_url=el_img.dataset['img-url'];

            if(options['18comic']){
                // let el_canvas = el_parent.querySelector(`canvas[tag=${fixed_basename}]`);
                // el_canvas = utils.draw18comic(el_img, el_canvas);
                // el_canvas.setAttribute('tag', fixed_basename);
                // el_canvas.style['width'] = '100%';
                // el_parent.insertBefore(el_canvas, el_placeholder);
            }else{
                el_img.classList.remove('hide');
            }
        };

        (async _ => {
            let el_clicked_img = undefined;

            let el_image_show_list = el_container.querySelector('.comic-show-list');
            if (el_image_show_list === null) {
                el_image_show_list = document.createElement('div');
                el_image_show_list.classList.add('comic-show-list');
                el_container.append(el_image_show_list);
            }
            utils.cleanElement(el_image_show_list);

            console.log(chapter_info);
            const img_url_list=chapter_info[0]['img_url_list'];
            for (let index = 0; index < img_url_list.length;index++){
                const img_url = img_url_list[0];

                const el_img= await (new Promise((resolve,reject)=>{
                    if (/\.psd/i.test(img_url)){
                        utils.fn_psd_to_canvas(img_url).then(el_canvas=>{
                            resolve(el_canvas);
                        }).catch(e=>{
                            reject(e);
                        });
                    }else{
                        const el_img = document.createElement('img');
                        el_img.addEventListener('load', (event) => {
                            resolve(el_img);
                        });
                        el_img.addEventListener('error',(event)=>{
                            reject('error');
                        });
                        el_img.src = img_url;
                    }
                }));
                    
                // el_img.classList.add('hide');
                el_image_show_list.append(el_img);
                // el_img.dataset['img-url']=img_url;
                // fn_load_image({ target: el_img},  exists_options);

               
            }

        })();             

    };

    // 漫画模式显示目录下的内容（右侧）
    const show_image_in_right = (fileinfo, scroll_top, container_width) => {
        let el_image_shower = document.querySelector('.comic-shower.right')
        if (el_image_shower === null) {
            el_image_shower = document.createElement('div');
            // el_image_shower.classList.add('image-shower-right');
            el_image_shower.classList.add('comic-shower');
            el_image_shower.classList.add('right');
            el_image_shower.classList.add('right-view-item');

            const el_container = document.querySelector('#right-container');
            el_container.append(el_image_shower);
        }

        el_image_shower.classList.remove('hide');
        inject_image_refresh(fileinfo, el_image_shower, scroll_top, container_width);        

    }

    const get_image_fullwindows_container=()=>{
        let el_image_shower = document.querySelector('.comic-shower.fullwindow')
        if (el_image_shower === null) {
            el_image_shower = document.createElement('div');
            // el_image_shower.classList.add('image-shower');
            el_image_shower.classList.add('comic-shower');
            el_image_shower.classList.add('fullwindow');

            document.body.append(el_image_shower);
        }

        let el_image_show_list = el_image_shower.querySelector('.comic-show-list');
        if (el_image_show_list === null) {
            el_image_show_list = document.createElement('div');
            el_image_show_list.classList.add('comic-show-list');
            el_image_shower.append(el_image_show_list);
        }
        return el_image_shower;
    }

    // 漫画模式显示目录下的内容（全屏）
    const show_image_in_fullwindows = (fileinfo, scroll_top, container_width)=>{
        let el_image_shower = document.querySelector('.comic-shower.fullwindow')
        if (el_image_shower===null){
            el_image_shower=document.createElement('div');
            // el_image_shower.classList.add('image-shower');
            el_image_shower.classList.add('comic-shower');
            el_image_shower.classList.add('fullwindow');
            
            document.body.append(el_image_shower);
        }

        let el_image_show_list=el_image_shower.querySelector('.comic-show-list');
        if (el_image_show_list===null){
            el_image_show_list=document.createElement('div');
            el_image_show_list.classList.add('comic-show-list');
            el_image_shower.append(el_image_show_list);
        }

        el_image_shower.classList.remove('hide');
        inject_image_refresh(fileinfo, el_image_shower, scroll_top,container_width);
    };


module.exports = {
    ComicMode:{
        inject_toolbar,
        inject_image_refresh,
        show_image_in_right,
        show_image_in_fullwindows,
        get_image_fullwindows_container,
    },
}