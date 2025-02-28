const utils = require('./utils');

module.exports = async (ctx) => {
    const girls = {
        zhouyanxi: '周妍希',
        yangchenchen: '女神杨晨晨',
        younisi: 'Egg_尤妮丝',
        azhu: '就是阿朱啊',
        daji: '妲己_Toxic',
        wangyuchun: '女神王雨纯',
        zhouyuxi: '周于希Sandy',
        zhukeer: '朱可儿Flower',
        zhizhi_Booty: '女神芝芝Booty',
        feiyueying: '绯月樱Cherry',
        gunainaijiang: 'Emily顾奈奈',
        nalu_Selena: '娜露Selena',
        luxuanxuan: '模特陆萱萱',
        wangxinyao: '王馨瑶yanni',
        tanganqi: '唐安琪',
        meitaojiang: '美桃酱',
        yuzijiang: '鱼子酱Fish',
        xiongxiaonuo: '熊小诺',
        wanwanmo: '婠婠么',
        jiangzhenzhen: '江真真',
        linshanshan: '林珊珊',
        lishi: '利世',
        yuanyuanjiang: '媛媛酱',
        xiaohaitun: '小海臀',
    };

    const girl = ctx.params.girl || 'yangchenchen';

    const rootUrl = utils.Host + `/${girl}.html`;

    ctx.state.data = await utils.Func(ctx, girls[girl], rootUrl);
};
