"use strict";
const { dialog} = require('electron').remote;
const fs=require('fs');
const path=require('path')
const JSZip=require('jszip');
const utils=require('./utils.js')
const siteAction=require('./site_action');

const HOME_PATH =`${process.env.HOME}/Pictures`;
// const HOME_PATH = '/Users/shixiao/Downloads/A/漫画/comic';
const Global={};
(_=>{
    // 创建左侧目录显示条目的结构（div_detail）
    const fn_create_folder_detail=(fileinfo)=>{
        const filename = path.basename(fileinfo.path)
        const el_div_detail=document.createElement('div');
        el_div_detail.setAttribute('title', filename);
        el_div_detail.classList.add('detail');
        el_div_detail.classList.add('valid');
        if(fileinfo.isDir){
            el_div_detail.classList.add('folder');
        }
        utils.attachFileInfoToEl(el_div_detail, fileinfo);
        
        el_div_detail.classList.add('icon');
        if(fileinfo.isZipFile){
            el_div_detail.classList.add('zip');
        }
        if (fileinfo.isDir) {
            el_div_detail.classList.add('closepand');
        } else if (fileinfo.type === 'image') {
            el_div_detail.classList.add('image');
        }

        const el_span_name = document.createElement('span');
        el_span_name.innerText = filename;
        el_div_detail.append(el_span_name);
        return el_div_detail;
    };

    // 添加一个目录到左侧目录列表第一层
    const fn_add_folder_to_left = (selected_path)=>{
        return (async _=>{
            const fileinfo=await utils.getFileInfo(selected_path);
            if(fileinfo && fileinfo.isDir){
                const el_selected_folder=document.querySelector('#selected-folder');
                if (el_selected_folder){
                    let el_folder_entry = el_selected_folder.querySelector(`.folder-entry[data-fullpath='${selected_path}']`);
                    if (!el_folder_entry) {
                        el_folder_entry = document.createElement('div');
                        el_folder_entry.classList.add('folder-entry');
                        
                        utils.attachFileInfoToEl(el_folder_entry,fileinfo);

                        const el_div_detail=fn_create_folder_detail(fileinfo);
                        el_div_detail.addEventListener('click', (event) => { fn_folder_click(event, el_folder_entry); })
                        el_folder_entry.append(el_div_detail);

                        // const el_ul = document.createElement('ul');
                        // el_ul.classList.add('folder-list')
                        // el_folder_entry.append(el_ul);

                        el_selected_folder.append(el_folder_entry);
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }else{
                return false;
            }
        })();
    };
    
    // 左侧目录工具栏中的添加按钮被点击
    const fn_folder_tools_btn_add_click=()=>{
        (async _ => {
            let selected_path = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
            if (selected_path) {
                selected_path = selected_path[0];
            }
            if (selected_path) {
                if(await fn_add_folder_to_left(selected_path)){
                    //添加成功保存到localStorage
                    const list=JSON.parse(localStorage['left-folders']||'[]');
                    list.push(selected_path);
                    localStorage['left-folders']=JSON.stringify(list);
                }
            }
        })();

    };

    // 取得目录下的所有文件和目录
    const fn_get_sub_files = async(parent_folder)=>{
        let type='';
        const extname=path.extname(parent_folder);
        const file_stat=fs.lstatSync(parent_folder);
        if(file_stat.isDirectory()){
            type='folder';
        }else if(file_stat.isFile() && '.zip'==extname.toLocaleLowerCase()){
            type='zip';
        }
        if(type=='folder'){
            const files_list = await new Promise((resolve, reject) => {
                fs.readdir(parent_folder, (err, files_list) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(files_list)
                    }
                });
            });
            const p_folder_stat = [];
            files_list.forEach((filename) => {
                const file_path = path.join(parent_folder, filename);
                p_folder_stat.push(utils.getFileInfo(file_path));
            });
            let folder_list = await Promise.all(p_folder_stat);   
            return folder_list;
        }else if(type=='zip'){
            var zip = new JSZip();
            const file_data=await new Promise((resolve,reject)=>{
                fs.readFile(parent_folder, function(err, data) {
                    if (err) {
                        reject(e);
                    } else {
                        resolve(data);
                    }
                });
            }) ;
            const zip_data=await new JSZip.external.Promise((resolve, reject)=>{
                JSZip.loadAsync(file_data).then(dd=>{
                    resolve(dd);
                },(err)=>{
                    reject(err);
                });
            });
            
            const p_folder_stat = [];
            for(let filename in zip_data.files){
                const zip_obj=zip_data.files[filename];
                p_folder_stat.push(utils.getZipContentFileInfo(zip_obj,parent_folder));
            };

            let folder_list = await Promise.all(p_folder_stat);   
            return folder_list;
        }else{
            return [];
        }
    }

    // 将漫画模式的顶部工具栏写入某个父元素
    const fn_inject_toolbar_in_comic_mode = (fileinfo,el_container)=>{
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
            //     fn_inject_image_comic_refresh(fileinfo, el_container, scroll_top, container_width,{'18comic':!options['18comic']});
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

                fn_show_image_by_comic_in_right(fileinfo, scroll_top, container_width);
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

                fn_show_image_by_comic_in_fullwindows(fileinfo, scroll_top, container_width);
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
    const fn_inject_image_comic_refresh = (fileinfo, el_container, scroll_top,container_width,options)=>{
        utils.attachFileInfoToEl(el_container,fileinfo);
        let exists_options = utils.parseDataFromEl(el_container,'options')||{};
        exists_options = Object.assign(exists_options,options);
        utils.attachDataToEl(el_container, 'options', exists_options);
        if (fileinfo.path.endsWith('.18comic')){
            exists_options['18comic']=true;
        }
        
        const current_path = el_container.dataset['path'];
        let dirname ='';
        if(fileinfo.isBlob){
            dirname =fileinfo['srcFilename']||'';
        }else{
            dirname =(fileinfo.isDir || fileinfo.isZipFile) ? fileinfo.path : path.dirname(fileinfo.path);
        }
        //写入工具栏
        fn_inject_toolbar_in_comic_mode(fileinfo,el_container);

        const fn_load_image = (event, el_placeholder,options)=>{
            const el_img=event.target;
            const fileinfo=utils.parseFileInfoFromEl(el_img);
            const basename=path.basename(fileinfo.path);
            // const fixed_basename = `T-${basename.replace(/\./g, '-')}`;
            const fixed_basename = 'T'+Buffer.from(basename).toString('base64').replace(/[=\+]/g, '');

            const el_parent = el_placeholder.parentElement;

            if(options['18comic']){
                let el_canvas = el_parent.querySelector(`canvas[tag=${fixed_basename}]`);
                el_canvas = utils.draw18comic(el_img, el_canvas);
                el_canvas.setAttribute('tag', fixed_basename);
                el_canvas.style['width'] = '100%';
                // el_canvas.style['height']='400px';
                el_parent.insertBefore(el_canvas, el_placeholder);
            }else{
                el_img.classList.remove('hide');
            }
        };

        (async _ => {
            let el_clicked_img = undefined;
            if (current_path !== dirname) {
                el_container.dataset['path'] = dirname;

                let el_image_show_list = el_container.querySelector('.comic-show-list');
                if (el_image_show_list === null) {
                    el_image_show_list = document.createElement('div');
                    el_image_show_list.classList.add('comic-show-list');
                    el_container.append(el_image_show_list);
                }
                utils.cleanElement(el_image_show_list);

                const parent_path = dirname;
                const fileinfo_list = await fn_get_sub_files(parent_path);
                const imageinfo_dict = {};
                let images_name_list = fileinfo_list.filter((file_info) => {
                    return file_info.type === 'image' && !file_info.isHidden;
                }).map((file_info) => {
                    const basename = path.basename(file_info.path);
                    imageinfo_dict[basename] = file_info;
                    return basename;
                });
                images_name_list = utils.sortByName(images_name_list);
                for (let index = 0; index < images_name_list.length;index++){
                    const basename = images_name_list[index];
                    // const fixed_basename = `T-${basename.replace(/\./g, '-')}`;
                    const fixed_basename = 'T' + Buffer.from(basename).toString('base64').replace(/[=\+]/g, '');
                    const imageinfo = imageinfo_dict[basename];
                    
                    const el_placeholder=document.createElement('div');
                    el_placeholder.classList.add('placeholder');
                    el_placeholder.setAttribute('tag', fixed_basename);


                    const el_img= await (new Promise((resolve,reject)=>{
                        if (/\.psd/i.test(imageinfo.path)){
                            utils.fn_psd_to_canvas(imageinfo.path).then(el_canvas=>{
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
                            if(imageinfo.isBlob){
                                el_img.src = utils.getBlobUrl(imageinfo);
                            }else{
                                el_img.src = imageinfo.path;
                            }
                        }
                    }));
                    // const el_img = document.createElement('img');
                    // utils.attachFileInfoToEl(el_img, imageinfo);
                    // el_img.addEventListener('load', (event) => {
                    //     fn_load_image(event, el_placeholder, exists_options);
                    // });
                    // el_img.src = imageinfo.path;


                    el_img.classList.add('hide');
                    el_image_show_list.append(el_img);
                    el_image_show_list.append(el_placeholder);
                    utils.attachFileInfoToEl(el_img, imageinfo);
                    fn_load_image({ target: el_img}, el_placeholder, exists_options);

                    if (fileinfo.path === imageinfo.path) {
                        el_clicked_img = el_img;
                    }


                }
            } else {
                const el_image_show_list = el_container.querySelector('.comic-show-list');
                const el_img_list = el_container.querySelectorAll('img');
                for (let index = 0; index < el_img_list.length; index++) {
                    const el_img = el_img_list[index];
                    const imageinfo = utils.parseFileInfoFromEl(el_img);
                    const basename = path.basename(imageinfo.path);
                    // const fixed_basename = `T-${basename.replace(/\./g, '-')}`;
                    const fixed_basename = 'T' + Buffer.from(basename).toString('base64').replace(/[=\+]/g, '');
                    if (!exists_options['18comic']) {
                        el_img.classList.remove('hide');
                        window.a = el_image_show_list;
                        const el_canvas = el_image_show_list.querySelector(`canvas[tag=${fixed_basename}]`);
                        if (el_canvas){
                            el_canvas.classList.add('hide');
                        }
                        if (fileinfo.path === imageinfo.path) {
                            el_clicked_img = el_img;
                        }
                    }else{
                        let el_canvas = el_image_show_list.querySelector(`canvas[tag=${fixed_basename}]`);
                        el_canvas=utils.draw18comic(el_img, el_canvas)
                        el_canvas.setAttribute('tag', fixed_basename);
                        el_canvas.classList.remove('hide');
                        el_image_show_list.insertBefore(el_canvas,el_img);
                        el_img.classList.add('hide');
                        if (fileinfo.path === imageinfo.path) {
                            el_clicked_img = el_canvas;
                        }

                    }
                }
            }
            window.setTimeout(() => {
                if (scroll_top===undefined){
                    if (el_clicked_img){
                        el_clicked_img.scrollIntoView();
                    }
                }else{
                    const el_comic_show_list = el_container.querySelector('.comic-show-list');
                    const target_scroll_top = (el_comic_show_list.clientWidth / container_width) * scroll_top;
                    el_comic_show_list.scrollTop = target_scroll_top;
                }
            }, 100);

        })();             

    };

    // 漫画模式显示目录下的内容（右侧）
    const fn_show_image_by_comic_in_right = (fileinfo, scroll_top, container_width) => {
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
        fn_inject_image_comic_refresh(fileinfo, el_image_shower, scroll_top, container_width);        

    }
    // 漫画模式显示目录下的内容（全屏）
    const fn_show_image_by_comic_in_fullwindows = (fileinfo, scroll_top, container_width)=>{
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
        fn_inject_image_comic_refresh(fileinfo, el_image_shower, scroll_top,container_width);
    };

    // 点击左侧目录
    const fn_folder_click = (event, e_li)=>{
        const file_info =utils.parseFileInfoFromEl(e_li);
        const el_div_detail = e_li.querySelector('div.detail');
        if (file_info.isDir){
            const e_ul_sub=e_li.querySelector('ul');
            el_div_detail.classList.add('icon');
            if (e_ul_sub !== null && e_ul_sub.childNodes.length>0){
                e_li.removeChild(e_ul_sub);
                el_div_detail.classList.remove('expand');
                el_div_detail.classList.add('closepand');
            }else{
                fn_refresh_sub(e_li);
                el_div_detail.classList.add('expand');
                el_div_detail.classList.remove('closepand');
            }
            fn_show_folder_content_in_right(file_info);
        }else if(file_info.isZipFile){
            fn_show_folder_content_in_right(file_info);
        } else if (file_info.type==='image'){
            const imageinfo=utils.parseFileInfoFromEl(e_li);
            fn_show_image_by_comic_in_right(imageinfo);
        }
        document.querySelectorAll('div.detail.selected').forEach((el_div_detail_selected)=>{
            el_div_detail_selected.classList.remove('selected');
        });
        el_div_detail.classList.add('selected');
        Global['selected-file-el'] = el_div_detail;
    };

    // 在右侧显示目录内容
    const fn_show_folder_content_in_right=(folder_info)=>{
        const el_right_container = document.querySelector("#right-container");
        let el_folder_content_container = el_right_container.querySelector('.folder-content-shower.right-view-item');
        if (!el_folder_content_container){
            el_folder_content_container=document.createElement('div');
            el_folder_content_container.classList.add('right-view-item');
            el_folder_content_container.classList.add('folder-content-shower');

            const el_toolbar=document.createElement('div');
            el_toolbar.classList.add('toolbar');
            el_folder_content_container.append(el_toolbar);

            //变更图标大小
            const el_tool_size = document.createElement('div');
            el_tool_size.classList.add('tool');
            el_tool_size.classList.add('size');
            const el_size_min = document.createElement('div');
            el_size_min.classList.add('btn');
            el_size_min.classList.add('min');
            el_size_min.innerHTML='小';
            const el_size_middle = document.createElement('div');
            el_size_middle.classList.add('btn');
            el_size_middle.classList.add('middle');
            el_size_middle.classList.add('selected');
            el_size_middle.innerHTML = '中';
            const el_size_max = document.createElement('div');
            el_size_max.classList.add('btn');
            el_size_max.classList.add('max');
            el_size_max.innerHTML = '大';
            el_tool_size.append(el_size_min, el_size_middle, el_size_max);
            const fn_onSize_click=(event)=>{
                const el=event.target;
                const el_file_show_list=el.closest('.folder-content-shower').querySelector('.file-show-list')
                if(el.classList.contains('min')){
                    el_file_show_list.classList.remove('size-middle');
                    el_file_show_list.classList.remove('size-max');
                    el_file_show_list.classList.add('size-min');
                } else if (el.classList.contains('middle')){
                    el_file_show_list.classList.remove('size-min');
                    el_file_show_list.classList.remove('size-max');
                    el_file_show_list.classList.add('size-middle');
                } else if (el.classList.contains('max')){
                    el_file_show_list.classList.remove('size-min');
                    el_file_show_list.classList.remove('size-middle');
                    el_file_show_list.classList.add('size-max');
                }
                el.closest('.tool.size').querySelectorAll('.btn').forEach(el_btn=>{
                    el_btn.classList.remove('selected');
                });
                el.classList.add('selected');
            }
            el_size_min.addEventListener('click',fn_onSize_click);
            el_size_middle.addEventListener('click', fn_onSize_click);
            el_size_max.addEventListener('click', fn_onSize_click);

            el_toolbar.append(el_tool_size);

            //测试按钮
            const el_tool_comic_read = document.createElement('div');
            el_tool_comic_read.classList.add('tool');
            const el_tool_comic_read_btn = document.createElement('div');
            el_tool_comic_read_btn.classList.add('btn');
            el_tool_comic_read_btn.innerHTML = '阅读模式';
            el_tool_comic_read_btn.addEventListener('click',(event)=>{
                const el_file_show_list= event.target.closest('.folder-content-shower').querySelector('.file-show-list');
                const fileinfo = utils.parseFileInfoFromEl(el_file_show_list);
                fn_show_image_by_comic_in_right(fileinfo);
            });
            el_tool_comic_read.append(el_tool_comic_read_btn);
            el_toolbar.append(el_tool_comic_read);
            el_right_container.append(el_folder_content_container);
        }

        // 如果显示的目录与选择的目录一直则直接返回
        const container_folder_info = utils.parseFileInfoFromEl(el_folder_content_container);
        if (container_folder_info && (container_folder_info.path === folder_info.path)) {
            return;
        } else {
            utils.attachFileInfoToEl(el_folder_content_container, folder_info);
        }

        //隐藏其他的右侧功能视图
        el_right_container.querySelectorAll('.right-view-item').forEach((el_item)=>{
            el_item.classList.add('hide');
        });
        //显示目录内容视图
        el_folder_content_container.classList.remove('hide');

        fn_inject_folder_content(folder_info, el_folder_content_container);
    };

    
    const fn_load_image = (image_path)=>{
        if(/\.psd$/i.test(image_path)){
            return new Promise((resolve, reject) => {
                const p=utils.fn_psd_to_canvas(image_path);
                p.then(el_canvas=>{
                    resolve(el_canvas);
                });
            });
        }else{
            return new Promise((resolve,reject)=>{
                let el_thumbnail_img = undefined;
                el_thumbnail_img = document.createElement('img');
                el_thumbnail_img.addEventListener('load', (event) => {
                    resolve(el_thumbnail_img);
                });
                el_thumbnail_img.addEventListener('error', (event) => {
                    console.log(el_thumbnail_img, image_path)
                    reject(el_thumbnail_img);
                });
                el_thumbnail_img.src = image_path;
                
            });
        }
    };

    const fn_load_image_blob = (file_info)=>{
        const image_path=file_info.path;
        return new Promise((resolve,reject)=>{
            let el_thumbnail_img = undefined;
            el_thumbnail_img = document.createElement('img');
            el_thumbnail_img.addEventListener('load', (event) => {
                resolve(el_thumbnail_img);
            });
            el_thumbnail_img.addEventListener('error', (event) => {
                console.log(el_thumbnail_img, image_path)
                reject(el_thumbnail_img);
            });
            el_thumbnail_img.src = utils.getBlobUrl(file_info);
            
        });
    };    

    // 将目录内容注入到指定容器中
    const fn_inject_folder_content=(folder_info,el_container)=>{
        const fn_create_file_desc=(fileinfo)=>{
            const el_file=document.createElement('div');
            utils.attachFileInfoToEl(el_file, fileinfo);
            el_file.classList.add('file')
            el_file.classList.add('desc')
            el_file.addEventListener('dblclick',(event)=>{
                const el_file=event.target.closest('.file.desc');
                const fileinfo = utils.parseFileInfoFromEl(el_file);
                fn_show_image_by_comic_in_right(fileinfo);
            });

            const el_icon_container = document.createElement('div');
            el_icon_container.classList.add('file-icon-container');
            el_file.append(el_icon_container);

            const iconname = utils.getFileIcon(fileinfo['mimetype']);
            const el_icon = document.createElement('div');
            el_icon.classList.add('file-icon');
            el_icon.innerHTML = `<i class="far ${iconname}"></i>`;
            el_icon_container.append(el_icon);


            const el_filename = document.createElement('div');
            el_filename.classList.add('file-name');
            el_file.append(el_filename);
            const el_filename_txt = document.createElement('div');
            el_filename_txt.classList.add('txt');
            el_filename_txt.innerText = path.basename(fileinfo.path);
            el_filename.append(el_filename_txt);
            
            if(utils.isImageFile(fileinfo)){
                const el_thumbnail = document.createElement('div');
                let p =null;
                if(fileinfo.isBlob){
                    p=fn_load_image_blob(fileinfo);
                }else if(fileinfo.isFile){
                    p=fn_load_image(fileinfo.path);
                }
                if(p){
                    p.then(el_thumbnail_img=>{
                        el_thumbnail_img.classList.add('thumbnail-img');
                        utils.cleanElement(el_icon_container);
                        el_thumbnail.append(el_thumbnail_img);
                        el_thumbnail.classList.add('thumbnail');
                        el_icon_container.append(el_thumbnail);
                    });
                }
            }
            return el_file;

        };
        (async _ => {
            const showable_file_list = (await fn_get_sub_files(folder_info.path)).filter((fileinfo) => {
                return (fileinfo.isFile || fileinfo.isBlob) && utils.isImageFile(fileinfo) && !fileinfo.isHidden;
            });
            if (showable_file_list.length===0){
                el_container.classList.add('hide');
            }else{
                let el_file_shower_list = el_container.querySelector('.file-show-list');
                if (!el_file_shower_list){
                    el_file_shower_list = document.createElement('div');
                    el_file_shower_list.classList.add('file-show-list');
                    el_file_shower_list.classList.add('size-middle');
                    
                    el_container.append(el_file_shower_list);
                }
                utils.attachFileInfoToEl(el_file_shower_list,folder_info);
                utils.cleanElement(el_file_shower_list);
                for (let index = 0; index < showable_file_list.length;index++){
                    const fileinfo = showable_file_list[index];
                    const el_file_icon=fn_create_file_desc(fileinfo);
                    el_file_shower_list.append(el_file_icon);
                }

            }
        })();
        
    };

    // 在左侧显示目录内容(第二步)
    const fn_show_folder=(parent_el,file_info_list)=>{
        let parent_el_ul_sub=parent_el.querySelector('ul');
        if (parent_el_ul_sub==null){
            parent_el_ul_sub = document.createElement('ul');
            parent_el_ul_sub.classList.add('folder-list');

            parent_el.append(parent_el_ul_sub);

        }
        utils.cleanElement(parent_el_ul_sub);

        const file_dict={};
        let basename_list = file_info_list.map((item) => { 
            const basename = path.basename(item['path']);
            file_dict[basename]=item;
            return basename;
        });

        basename_list = utils.sortByName(basename_list);
        if (file_info_list.length>0){
            (basename_list || []).forEach((folder_name)=>{
                const file_info = file_dict[folder_name];

                const e_li=document.createElement("li");
                utils.attachFileInfoToEl(e_li, file_info);

                const el_div_detail = fn_create_folder_detail(file_info);
                el_div_detail.addEventListener('click', (event) => { fn_folder_click(event, e_li); })
                e_li.append(el_div_detail);


                // const el_ul_sub = document.createElement('ul')
                // el_ul_sub.classList.add('folder-list')
                // e_li.append(el_ul_sub);
                
                parent_el_ul_sub.append(e_li);

            });
        }else{
            const e_li = document.createElement("li");
            e_li.classList.add('hide');
            const el_span_name = document.createElement('span')
            el_span_name.classList.add('invalid');
            el_span_name.innerHTML = '<i class="fas fa-ban"></i> [没有子目录]';
            e_li.append(el_span_name);
            parent_el_ul_sub.append(e_li);


        }
    }

    // 在左侧显示目录内容(第一步)
    const fn_refresh_sub=(parent_el)=>{
        const parent_folder = parent_el.dataset['fullpath'];
        (async _=>{
            let file_info_list =await fn_get_sub_files(parent_folder);
            file_info_list = file_info_list.filter((file_info) => {
                return (file_info.isDir && !file_info.isHidden) || (file_info.isZipFile)

                // return (file_info.isDir || file_info.type==='image') && !file_info.isHidden
            });
            fn_show_folder(parent_el,file_info_list);
        })();
    }

    document.addEventListener('keydown',(event)=>{
        if (event.key ==='Escape'){
            const el_comic_shower_fullwindow=document.querySelector('.comic-shower.fullwindow');
            if (el_comic_shower_fullwindow){
                el_comic_shower_fullwindow.classList.add('hide');
            }
        }
    });
    document.addEventListener('DOMContentLoaded',()=>{
        // 初始化目录工具条
        // 添加按钮事件
        const folder_tools_btn_add = document.querySelector('#folder-tools>.btn-add');
        if (folder_tools_btn_add) {
            folder_tools_btn_add.addEventListener('click', (event) => {
                fn_folder_tools_btn_add_click();
            })
        }

        const stored_folders = JSON.parse(localStorage['left-folders'] || '[]');
        (async _=>{
            for (let index = 0; index < stored_folders.length;index++){
                const folder_path=stored_folders[index];
                await fn_add_folder_to_left(folder_path);
            }
        })();
    });
    document.addEventListener('selectstart',(event)=>{
        event.preventDefault();
    });


})();

