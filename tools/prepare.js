const { parse } = require("csv");
const fs = require("fs-extra");
const iconv = require("iconv-lite");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const xf = require('@jx3box/jx3box-data/data/xf/xf.json')

const src = "./raw";
const dist = "./dist";

const schoolMap = {
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
};

const kungfuMap = {
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
};

function readCsvFile(file, isObj) {
    console.time(`reading ${file}`);
    return new Promise((resolve, reject) => {
        let keys = [];
        let keyRead = false;
        const tab = isObj ? {} : [];
        fs.createReadStream(file)
            .pipe(iconv.decodeStream("gb2312"))
            .pipe(iconv.encodeStream("utf8"))
            .pipe(parse({ delimiter: "\t", quote: null }))
            .on("data", function (row) {
                if (!keyRead) {
                    // 读取第一行
                    keyRead = 1;
                    keys = row;
                } else {
                    const item = row.reduce((acc, cur, i) => {
                        const keyName = keys[i];
                        acc[keyName] = cur;
                        return acc;
                    }, {});
                    if (isObj) {
                        tab[`${item.SkillID}-${item.Level}`] = item;
                    } else {
                        tab.push(item);
                    }
                }
            })
            .on("end", function () {
                console.timeEnd(`reading ${file}`);
                resolve(tab);
            });
    });
}

async function init() {
    const skills = await readCsvFile(`${src}/skill.txt`, true);
    const points = await readCsvFile(`${src}/TenExtraPoint.tab`);
    const result = [];
    const talents = {}
    for (const point of points) {
        const school = schoolMap[point.ForceID];
        const kungfu = kungfuMap[point.KungFuID];
        const mountID = xf[kungfu]['id']

        let _talents = [];

        [1, 2, 3, 4, 5]
            .map((v) => [`SkillID${v}`, `SkillLevel${v}`])
            .forEach(([id, level]) => {
                let skillId = `${point[id]}-${point[level]}`;
                let _skillId = `${point[id]}-0`; //取level为0
                let skill = skills[skillId];
                if (!skill) skill = skills[_skillId]; //特殊主动技能不存在level为1时，技能取level为0的项

                if (skill) {
                    const position = ((point.PointID - 1) % 12) + 1;
                    result.push({
                        name: skill.Name,
                        desc: skill.Desc, //重新过滤字段
                        position: position,
                        school,
                        kungfu,
                        skillID: point[id],
                    });

                    if (!talents[mountID]) {
                        talents[mountID] = []
                    }
                    _talents.push(point[id])

                }
            });
        talents[mountID].push(_talents)
    }
    // 生成 bps 奇穴
    fs.outputFileSync(`./dist/talents.json`, JSON.stringify(talents), 'utf-8')

    const csvWriter = createCsvWriter({
        path: `${dist}/temp.csv`,
        header: [
            { id: "school", title: "门派" },
            { id: "kungfu", title: "心法" },
            { id: "position", title: "奇穴位置" },
            { id: "name", title: "奇穴名" },
            { id: "desc", title: "描述" },
            { id: "skillID", title: "技能ID" },
        ],
    });
    csvWriter.writeRecords(result).then(() => {
        console.log(`done`);
    });
}

init();
