/*
 * @Author: iRuxu
 * @Date: 2022-05-29 10:11:59
 * @LastEditTime: 2022-07-17 03:31:23
 * @Description: 
 */
/* 
* Desc: 构建奇穴数据
* Author : iRuxu
* Email : rx6@qq.com
* Time : 
*/
const parse = require('csv-parse')
const fs = require('fs-extra');
const _ = require('lodash');
const axios = require('axios');
const filter = require('./includes/filter.js');
const qx_null = require('./includes/null.js');
const dateFormat = require('./includes/dateFormat')
const src = './dist/temp.csv'
const dist = './output'

//奇穴表
let qixue = {}

fs.readFile(src,function (err,originData){
    parse(originData,async function(err, output){

        //1.去除表头
        let data = output.slice(1)

        //2.填充数据
        let mark_xf = ''
        let mark_lv = ''
        let mark_pos = 1

        for(let i=0;i<data.length;i++){

            let item = data[i]
            
            //item[1] 心法名称，如果心法不存在，建立心法
            if(!qixue[item[1]]) qixue[item[1]] = {}

            //item[2] 奇穴重数，如果奇穴位不存在，建立奇穴位
            if(!qixue[item[1]][item[2]]) qixue[item[1]][item[2]] = {}

            //标记奇穴位置
            if(item[1] == mark_xf && item[2] == mark_lv){
                mark_pos += 1
            }else{
                mark_pos = 1
                mark_xf = item[1]
                mark_lv = item[2]
            }

            //获取技能信息
            let skillID = item[5]   //item[5] 技能ID
            let skill = await querySkill(skillID)

            //特殊字段处理
            let iconID = skill['IconID']                
            let desc = await filter(item[4])            //过滤后的奇穴描述
            desc = desc.replace(/"/g,"'")               //奇穴内容的"规范为单引号

            //是否为技能
            let is_skill = skill.HelpDesc ? 1 : 0
            let meta = skill['SpecialDesc']
            let extend = skill['HelpDesc']

            //插入奇穴条目
            qixue[item[1]][item[2]][mark_pos] = {
                "name": item[3],        //奇穴名
                "icon": iconID,         //奇穴图标ID
                "desc": desc,           //奇穴描述
                "order": item[2],       //奇穴重数
                "pos": mark_pos,        //奇穴纵向位 
                "is_skill": is_skill,   //是否为技能
                "meta": meta,           //技能上描述
                "extend": extend,       //技能下描述
                "id" : skillID         //奇穴技能ID
            }

            console.log(item[1],item[3],skillID)

        }

        qixue['其它'] = qx_null

        let json = JSON.stringify(qixue)

        fs.writeFile(`${dist}/v${dateFormat(new Date())}.json`,json,function (err){
            if(err) console.error(err)
        })

    })
})

async function querySkill(skillID){
    let res = await axios.get(`http://localhost:7002/skill/id/${skillID}`)
    return res.data.list[0]
}
