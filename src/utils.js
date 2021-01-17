const fs = require('fs')
const path=require('path')
const mimetype=require('mimetype')
const PSD=require('psd')

const isHiddenFile=function(file_path){
    return /^\./.test(path.basename(file_path));
}
const isImageFile = function (file_path) {
    if (typeof (file_path)==='object'){
        file_path = file_path.path||'';
    }
    const extname = (path.extname(file_path)||'').toLocaleLowerCase();
    const file_mimetype = mimetype.lookup(extname);
    let ret=false;
    if (file_mimetype) {
        // ret = /^image\//i.test(file_mimetype) && !(/\/vnd\.adobe\.photoshop$/i.test(file_mimetype));
        // ret = /^image\//i.test(file_mimetype) && !(/adobe/i.test(file_mimetype));
        ret = /^image\//i.test(file_mimetype);
    }

    return ret;
}

const sortByName=function(list){
    const re=/^\d+/;
    return (list||[]).sort((a, b) => {
        const A = a.toUpperCase(), B = b.toUpperCase();
        if (re.test(A) && re.test(B)) {
            const a_num=parseInt(re.exec(A)[0]);
            const b_num = parseInt(re.exec(B)[0]);
            return a_num-b_num;
        }else{
            return A > B ? 1 : A < B ? -1 : 0;
        }
    });
}
const cleanElement=function(el){
    if(el){
        for (let i = el.childNodes.length - 1; i >= 0; i--) {
            el.removeChild(el.childNodes[i]);
        }
    }
}
const getFileInfo=function(filepath){
    return new Promise((resolve,reject)=>{
        fs.lstat(filepath, (err, file_stats) => {
            if (err) {
                reject(err)
            } else {
                const file_info = { path: filepath };
                file_info['isDir'] = file_stats.isDirectory();
                file_info['isFile'] = file_stats.isFile();
                file_info['isLink'] = file_stats.isSymbolicLink();
                file_info['isHidden'] = isHiddenFile(filepath);
                if (file_stats.isFile()){
                    const extname = path.extname(filepath);
                    const file_mimetype = mimetype.lookup(extname);
                    if (file_mimetype) {
                        file_info['mimetype'] = file_mimetype;
                    }
                }
                if (file_stats.isFile() && isImageFile(filepath)) {
                    file_info['type'] = 'image';
                }
                resolve(file_info);
            }
        })
    });
}
const attachFileInfoToEl=function(el,fileinfo){
    if(el && fileinfo){
        attachDataToEl(el,'fullpath',fileinfo.path);
        attachDataToEl(el, 'fileinfo', JSON.stringify(fileinfo));
    }
}
const parseFileInfoFromEl = function (el) {
    return parseDataFromEl(el,'fileinfo');
}
const attachDataToEl = function (el, key,obj) {
    if (el && obj) {
        let v='';
        if(typeof(obj)==='object'){
            v = JSON.stringify(obj);
        } else if (typeof (obj) === 'string') {
            v=obj;
        }
        el.dataset[key] = v;
    }
}
const parseDataFromEl=function(el,key){
    if (el) {
        let ret=undefined;
        const v = el.dataset[key];
        try{
            ret=JSON.parse(v);
        }catch(e){
            ret=v;
        }
        return ret;
    } else {
        return undefined;
    }    
}
const readImage=function(filepath){
    return new Promise((resolve,reject)=>{
        const img=new Image();
        img.addEventListener('load',()=>{
            resolve(img);
        });
        img.addEventListener('error', () => {
            reject(img);
        });
        img.src=filepath;
    })
}

const getFileIcon=function(str_mimetype){
    let ret ='fa-file';
    if (/^image\//i.test(str_mimetype)){
        ret = 'fa-file-image';
    } else if (/^video\//i.test(str_mimetype)){
        ret = 'fa-file-vedio';
    }
    return ret;
}

const draw18comic=function(el_img,el_canvas){
    if(!el_img){
        return undefined;
    }
    if(!el_canvas){
        el_canvas=document.createElement('canvas');
    }
    const ctx = el_canvas.getContext('2d');
    ctx.clearRect(0, 0, ctx.width, ctx.height);
    const w = el_img.naturalWidth;//原始尺寸
    const h = el_img.naturalHeight;
    el_canvas.width = w;
    el_canvas.height = h;

    var num = 10;
    var remainder = parseInt(h % num);
    var copyW = w;
    for (var i = 0; i < num; i++) {
        var copyH = Math.floor(h / num);
        var py = copyH * (i);
        var y = h - (copyH * (i + 1)) - remainder;

        if (i == 0) {
            copyH = copyH + remainder;
        } else {
            py = py + remainder;
        }
        ctx.drawImage(el_img, 0, y, copyW, copyH, 0, py, copyW, copyH);
    }
    return el_canvas;
}
const fn_fix_basename=function(basename){
    return `T-${basename.replace(/\.@&/g, '-')}`;
}

const fn_psd_to_canvas=(psd_file)=>{
    return (async _=>{
        const psd = PSD.fromFile(psd_file);
        psd.parse();
        const png = psd.image.toPng();
        const image_data = new ImageData(new Uint8ClampedArray(png.data, 0, png.data.length), png.width, png.height);
        const el_canvas = document.createElement('canvas');
        el_canvas.width = png.width;
        el_canvas.height = png.height;
        const ctx = el_canvas.getContext('2d');
        ctx.putImageData(image_data, 0, 0);
        return el_canvas;
    })();

};
const fn_hide_all=(nodes)=>{
    (nodes||[]).forEach((node)=>{
        node.classList.add('hide');
    });
};
const fn_hide_right_all = () => {
    fn_hide_all(document.querySelectorAll('#right-container>.right-view-item'));
};

module.exports = { 
    isHiddenFile, isImageFile, 
    sortByName, cleanElement, getFileInfo,
    attachFileInfoToEl, parseFileInfoFromEl,
    readImage, getFileIcon,
    attachDataToEl, parseDataFromEl,
    draw18comic, fn_psd_to_canvas,
    fn_hide_all, fn_hide_right_all,
}