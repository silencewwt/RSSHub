const utils = require('./utils');

module.exports = async (ctx) => {
    const girls = {
        zhouyanxi: '奶瓶土肥圆',
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
    };

    const girl = ctx.params.girl || 'yangchenchen';

    const rootUrl = `https://www.xrmn5.com/${girl}.html`;

    ctx.state.data = await utils(ctx, girls[girl], rootUrl);
};
