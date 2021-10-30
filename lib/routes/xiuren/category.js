const utils = require('./utils');

module.exports = async (ctx) => {
    const categories = {
        XiuRen: 'XiuRen秀人网',
        MFStar: 'MFStar模范学院',
        MiStar: 'MiStar魅妍社',
        MyGirl: 'MyGirl美媛馆',
        Imiss: 'Imiss爱蜜社',
        BoLoli: 'BoLoli兔几盟',
        YouWu: 'YouWu尤物馆',
        Uxing: 'Uxing优星馆',
        MiiTao: 'MiiTao蜜桃社',
        FeiLin: 'FeiLin嗲囡囡',
        WingS: 'WingS影私荟',
        Taste: 'Taste顽味生活',
        LeYuan: 'LeYuan星乐园',
        HuaYan: 'HuaYan花の颜',
        DKGirl: 'DKGirl御女郎',
        MintYe: 'MintYe薄荷叶',
        YouMi: 'YouMi尤蜜荟',
        Candy: 'Candy糖果画报',
        MTMeng: 'MTMeng模特联盟',
        Micat: 'Micat猫萌榜',
        HuaYang: 'HuaYang花漾',
        XingYan: 'XingYan星颜社',
        XiaoYu: 'XiaoYu画语界',
    };

    const category = ctx.params.category || 'XiuRen';

    const rootUrl = `https://www.xrmn5.com/${category}/`;

    ctx.state.data = await utils(ctx, categories[ctx.params.category], rootUrl);
};
