//对数据库查询的desc字段进行数据加工
const _ = require('lodash');
const axios = require('axios');

async function Filter(desc,client){

    //处理sub
    desc = await filterBySub(desc,client)

    //处理buff描述
    desc = await filterByBuffDesc(desc,client)

    //处理buff时间
    desc = await filterByBuffTime(desc,client)

    //处理其他类型的buff -- 基于skill@22635改进,2019/11/8
    desc = filterByBuffAt(desc)

    //处理额外附加攻击   -- 基于skill@22635改进,2019/11/8
    desc = filterByAdd(desc)

    //过滤其它<>
    desc = desc.replace(/\<.*?\>/g,'')

    //处理undefined
    desc = filterUndefined(desc)

    //替换回车符
    desc = desc.replace(/\\n/g,'<br/>')

    return desc

}

async function filterBySub(desc,client){
    let reg = new RegExp(/\<SUB (\d+?) (\d)\>/g)
    let subreg = new RegExp(/\<SUB (\d+?) (\d)\>/)
    let hasMatched = reg.test(desc)
    
    if(hasMatched){
        let arr = desc.match(reg)
        for(let i=0;i<arr.length;i++){
            let capture = subreg.exec(arr[i])
            let id = capture[1]
            let level = capture[2]

            let result = await get_resource('skill',id,client)
            let skill = {}
            _.each(result.data.list,function (obj,i){
                if(obj.Level == level) {
                    skill = obj
                    return
                }
            })

            if(skill.Desc){
                desc = desc.replace(arr[i],skill.Desc)
            }
            
        }
    }
    return desc
}
async function filterByBuffDesc(desc,client){
    let reg = new RegExp(/\<BUFF (\d+?) \d?\ desc>/)
    let hasMatched = reg.test(desc)
    if(hasMatched){
        let capture = reg.exec(desc)
        let id = capture[1]
        //let level = capture[2]
        let result = await get_resource('buff',id,client)
        let buff = result && result.data && result.data.list[0]

        if (buff) {
            desc = desc.replace(reg,buff.Desc)
        }
    }
    return desc
}
async function filterByBuffTime(desc,client){
    let reg = new RegExp(/\<BUFF (\d+?) (\d?)\ time>/)
    let buffTimeReg = new RegExp(/\<BUFF (\d+?) (\d?)\ time>/g)
    let hasMatched = reg.test(desc)
    if(hasMatched){
        let capture = reg.exec(desc)
        let id = capture[1]
        
        let result = await get_resource('buff',id,client)

        const _list = result.data.list
        
        // buff 持续时间 示例 持续1秒-5秒
        const _capture = desc.match(buffTimeReg)

        _capture.forEach(cap => {
            const tmp = reg.exec(cap)
            
            let buff = _list.find(item => item.Level === Number(tmp[2])) || result.data.list[0]
            if (!buff.Interval) buff = result.data.list[1]
            let time = parseInt(buff.Interval) / 16 * parseInt(buff.Count) + '秒'
            desc = desc.replace(reg,time)
        })
    }
    return desc
}
function get_resource(type,query,client = false){
    return axios.get('http://localhost:7002/' + `${type}/id/` + query,{
        params : {
            client : client || 'std'
        }
    })
}

//(+<SKILLEx {D0} {TotalPhysicsAP 0.3906}>)
function filterByAdd(desc){
    let reg = new RegExp(/\(\+\<SKILLEx.*?\>\)/g)
    let hasMatched = reg.test(desc)

    if(hasMatched){
        desc = desc.replace(reg,'')
    }
    return desc
}

//<BUFF atCallPhysicsDamage>
function filterByBuffAt(desc){
    let reg = new RegExp(/<BUFF at.*?>/g)
    let hasMatched = reg.test(desc)

    if(hasMatched){
        desc = desc.replace(reg,'')
    }
    return desc
}

function filterUndefined(desc){
    return desc.replace(/undefined/g,'*')
}

module.exports = Filter