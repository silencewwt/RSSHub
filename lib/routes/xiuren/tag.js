const utils = require('./utils');

module.exports = async (ctx) => {
    const tags = {
        zx: '最近更新',
        tj: '站长推荐',
        rm: '热门精选',
    };

    const tag = ctx.params.tag || 'rm';

    const rootUrl = utils.Host + `/${tag}.html`;

    ctx.state.data = await utils.Func(ctx, tags[tag], rootUrl);
};
