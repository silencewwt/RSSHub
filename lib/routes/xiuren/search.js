const utils = require('@/routes/xiuren/utils');

module.exports = async (ctx) => {
    const keyword = ctx.params.keyword;

    const rootUrl = utils.Host + `/plus/search/index.asp?keyword=${keyword}&searchtype=title`;

    ctx.state.data = await utils.Func(ctx, keyword, rootUrl);
};
