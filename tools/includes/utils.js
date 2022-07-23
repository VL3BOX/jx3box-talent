const clc = require('cli-color');
const moment = require('moment');
const iconv = require('iconv-lite');
const ProgressBar = require('progress');
const fs = require('fs');
const papaparse = require('papaparse');

/** 输出格式化后的当前时间的方法
 * @param {String} format 格式化字符串
 */
const time_str = () => moment().format('YYYY-MM-DD HH:mm:ss');

/**
 * 输出到控制台的格式化类
 */
class Logger {
    static type_color_map = {
        info: clc.white,
        warn: clc.yellow,
        error: clc.red,
        success: clc.green
    }

    static content(message, type = 'info') {
        if (typeof message != 'string') message = JSON.stringify(message, null, 4);
        let str = [
            `[${time_str()}]`,
            `[${type.padStart(7).toUpperCase()}]`,
            ` ${message}`
        ].join('');
        return this.type_color_map[type](str);
    }
    static info(message) {
        console.log(this.content(message, 'info'));
    }
    static warn(message) {
        console.log(this.content(message, 'warn'));
    }
    static error(message, exit = true) {
        console.log(this.content(message, 'error'));
        if (exit) process.exit(1);
    }
    static success(message) {
        console.log(this.content(message, 'success'));
    }
}

/**
 * 在异步方法中暂停一段时间
 * @param {Number} time 暂停时间，单位ms
 */
const sleep = async (time) => new Promise(resolve => setTimeout(resolve, time));

/**
 * 读取指定路径的\t为分隔符的纯文本表格文件，并以对象数组的方式返回。
 * @param {String} file_path
 * @returns {Promise<Object[]>} 返回的对象数组
 */
const readTabFile = (file_path) => new Promise((resolve, reject) => {
    if (!fs.existsSync(file_path)) {
        Logger.warn(`文件${file_path}不存在，读取失败`);
        resolve([]);
    };
    papaparse.parse(iconv.decode(fs.readFileSync(file_path), 'gbk'), {
        complete: function (results) {
            let result = [];
            let data = results.data;
            let head = data.shift();
            data.pop();
            for (let d of data) {
                let obj = {};
                for (let i = 0; i < d.length; i++) {
                    if (d[i] === '' || d[i] === ' ') d[i] = null;
                    obj[head[i]] = d[i];
                }
                result.push(obj);
            }
            resolve(result);
        },
        delimiter: '\t'
    });
})

/** 写文件 */
const writeCsvFile = (file_path, data, options) => {
    let csv_data = papaparse.unparse(data, options);
    fs.writeFileSync(file_path, csv_data);
}
/**
 * 构建进度条
 * @param {Number} total 进度条总长度
 * @param {String} title 进度条标题
 * @param {String} doing 进度条当前正在做什么
 * @returns {ProgressBar}
 */
const buildProgressBar = async (total, title, doing = '进行中') => {
    let ansiEscapes = (await import('ansi-escapes')).default;
    let bar = new ProgressBar(':title [:bar] :current/:total :percent | :elapsed | :doing', {
        title: title,
        total,
        width: 30,
        stream: process.stdout,
    });
    bar.tick(0, { title, doing });
    bar.title = title;
    bar.clear = () => {
        process.stdout.write(ansiEscapes.eraseLine);
        process.stdout.write(ansiEscapes.cursorLeft);
    }
    return bar;
};

/**
 * 判断所给的值是否是空值或者0
 * @param {any} value
 * @returns {boolean} true: 空值或者0；false: 非空值或者非0
 */
const isNullOrZero = (value) => [null, undefined, 0, "0", '', ' '].includes(value);

/**
 * 判断所给的参数是否全都是空值或者0
 * @param  {...any} values
 * @returns
 */
const areAllNullOrZero = (...values) => values.every(isNullOrZero);

module.exports = {
    Logger,
    sleep,
    readTabFile,
    writeCsvFile,
    buildProgressBar,
    isNullOrZero,
    areAllNullOrZero
}
