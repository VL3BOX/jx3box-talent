/*
 * @Author: iRuxu
 * @Email : rx6@qq.com
 * @Date: 2022-05-29 10:11:59
 * @LastEditTime: 2022-07-23 16:04:21
 * @Description: 构建奇穴数据,order是重数,position是纵向位置！
 */
const path = require('path')
const fs = require('fs');
const { readTabFile, writeCsvFile, buildProgressBar, Logger, isNullOrZero } = require('./includes/utils')
const filter = require('./includes/filter.js');
const dateFormat = require('./includes/dateFormat');


(async () => {
    Logger.info("========== 开始构建奇穴数据 ==========");
    Logger.info('读取必要的raw数据......');
    const datas = {
        school_map: {
            //取ForceID
            0: "江湖",
            1: "少林",
            2: "万花",
            3: "天策",
            4: "纯阳",
            5: "七秀",
            6: "五毒",
            7: "唐门",
            8: "藏剑",
            9: "丐帮",
            10: "明教",
            21: "苍云",
            22: "长歌",
            23: "霸刀",
            24: "蓬莱",
            25: "凌雪",
            211: "衍天",
            212: "药宗",
        },
        kungfu_map: {
            //取KungfuID
            1: "洗髓经",
            2: "易筋经",
            3: "紫霞功",
            4: "太虚剑意",
            5: "花间游",
            6: "傲血战意",
            7: "离经易道",
            8: "铁牢律",
            9: "云裳心经",
            10: "冰心诀",
            11: "问水诀",
            12: "山居剑意",
            13: "毒经",
            14: "补天诀",
            15: "惊羽诀",
            16: "天罗诡道",
            17: "焚影圣诀",
            18: "明尊琉璃体",
            19: "笑尘诀",
            20: "铁骨衣",
            21: "分山劲",
            22: "莫问",
            23: "相知",
            24: "北傲诀",
            25: "凌海诀",
            26: "隐龙诀",
            27: "太玄经",
            28: "灵素",
            29: "无方",
        },
        xf: require('@jx3box/jx3box-data/data/xf/xf.json'),
        skill: [],
        skill_txt: (await readTabFile(path.join(__dirname, '../raw/skill.txt'))).reduce((acc, cur) => {
            let key = `${cur.SkillID}_${cur.Level}`;
            acc[key] = cur;
            return acc;
        }, {}),
        skill_tab: (await readTabFile(path.join(__dirname, '../raw/skills.tab'))).reduce((acc, cur) => {
            acc[cur.SkillID] = cur;
            return acc;
        }, {}),
        buff: [],
        buff_txt: (await readTabFile(path.join(__dirname, '../raw/buff.txt'))).reduce((acc, cur) => {
            let key = `${cur.BuffID}_${cur.Level}`;
            acc[key] = cur;
            return acc;
        }, {}),
        buff_tab: (await readTabFile(path.join(__dirname, '../raw/buff.tab'))).reduce((acc, cur) => {
            let key = `${cur.ID}_${cur.Level}`;
            cur.BuffID = cur.ID;
            cur.BuffName = cur.Name;
            delete cur.ID;
            delete cur.Name;
            acc[key] = cur;
            return acc;
        }, {}),
        points: await readTabFile(path.join(__dirname, '../raw/TenExtraPoint.tab')),
        temp: [],
        temp_title_map: {
            school: '门派',
            kungfu: '心法',
            order: '奇穴位置',
            name: '奇穴名',
            desc: '奇穴描述',
            skillID: '技能ID',
            position: '纵向位置'
        },
        talents: {},
        talent_null: require('./includes/null'),
        result: {},
    };
    Logger.info('合并需要用到的 skill 数据......');
    {
        let bar = await buildProgressBar(Object.keys(datas.skill_txt).length, '合并需要用到的 skill 数据');
        for (let k in datas.skill_txt) {
            let skill = datas.skill_txt[k];
            let _skill = datas.skill_tab[skill.SkillID];
            if (!_skill) _skill = {};
            skill = Object.assign(skill, _skill);
            _skill.__scan = true;
            datas.skill.push(skill);
            bar.tick();
        }
        let remain_skills = Object.values(datas.skill_tab).filter(t => !t.__scan);
        bar.total = bar.total + remain_skills.length;
        for (let skill of remain_skills) {
            datas.skill.push(skill);
            bar.tick();
        }
        bar.terminate();
    }
    Logger.info('合并需要用到的 buff 数据.....');
    {
        let bar = await buildProgressBar(Object.keys(datas.buff_tab).length, 'buff合表中...', '...');
        for (let buffid in datas.buff_tab) {
            let buff = datas.buff_tab[buffid];
            let _buff = datas.buff_txt[`${buff.BuffID}_${buff.Level}`];
            if (!_buff) _buff = {};
            buff = Object.assign(buff, _buff);
            _buff.__scan = true;
            datas.buff.push(buff);
            bar.tick();
        }
        let remain_buff = Object.values(datas.buff_txt).filter((buff) => !buff.__scan);
        bar.total = bar.total + remain_buff.length;
        for (let buff of remain_buff) {
            datas.buff.push(buff);
            bar.tick();
        }
        bar.terminate();
        Logger.info('构建镇派数据......');
    }
    Logger.info('生成中间表......')
    {
        for (let point of datas.points) {
            let school = datas.school_map[point.ForceID];
            let kungfu = datas.kungfu_map[point.KungFuID];
            let mountID = datas.xf[kungfu]['id'];

            let _talents = [];
            let _position = 1;
            for (let index of [1, 2, 3, 4, 5]) {
                let keys = [
                    point[`SkillID${index}`],
                    point[`SkillLevel${index}`]
                ];
                let skill = datas.skill_txt[`${keys[0]}_${keys[1]}`];
                if (!skill) skill = datas.skill_txt[`${keys[0]}_0`];
                if (skill) {
                    let order = ((~~point.PointID - 1) % 12) + 1;
                    datas.temp.push({
                        school,
                        kungfu,
                        order,
                        name: skill.Name,
                        desc: skill.Desc,
                        skillID: keys[0],
                        position: _position++
                    })

                    if (!datas.talents[mountID]) {
                        datas.talents[mountID] = [];
                    }
                    _talents.push(keys[0])
                }
            }
            datas.talents[mountID].push(_talents);
        }
    }
    //需要用到的方法
    const getSkill = qixue => {
        if (!qixue) return null;
        let skill = datas.skill.find((t) => t.SkillID == qixue.skillID);
        let desc = filter(qixue.desc, datas).replace(/\"/g, "'");
        let name = skill.Name;
        let icon = parseInt(skill.IconID);
        let order = `${qixue.order}`; //第几层
        let pos = qixue.position;  //某层的第几个
        let is_skill = !isNullOrZero(skill.HelpDesc) ? 1 : 0;
        let meta = skill['SpecialDesc'];
        let extend = skill['HelpDesc'];
        let id = qixue.skillID;

        return {
            name,
            icon,
            desc,
            order,
            pos,
            is_skill,
            meta,
            extend,
            id
        };
    }
    Logger.info('构建奇穴......')
    {
        let bar = await buildProgressBar(datas.temp.length, '奇穴构建');
        for (let item of datas.temp) {
            let { kungfu, order, position } = item;
            //心法不存在，创建心法
            if (!datas.result[kungfu]) datas.result[kungfu] = {};
            //奇穴位置不存在，建立奇穴位
            if (!datas.result[kungfu][order]) datas.result[kungfu][order] = {};
            let skill = getSkill(item)
            datas.result[kungfu][order][position] = skill;
            bar.tick(1, { doing: `${kungfu}-(${skill.id})${item.name}`, title: bar.title })
        }
        datas.result['其它'] = datas.talent_null;
        bar.terminate();
    }
    Logger.info('构建结束,开始输出...');
    fs.writeFileSync('./dist/talents.json', JSON.stringify(datas.talents));
    fs.writeFileSync(`./output/v${dateFormat(new Date())}.json`, JSON.stringify(datas.result));
    writeCsvFile('./dist/temp.csv', datas.temp.map(t => {
        for (let key in t) {
            t[datas.temp_title_map[key]] = t[key];
            delete t[key];
        }
        return t;
    }))
})();