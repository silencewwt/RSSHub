const got = require('@/utils/got');
const cheerio = require('cheerio');
const console = require('console');

const host = 'https://www.xiu01.top';

function getCoverImage(link) {
    const match = link.match(/\/\d{4}\/\d{4}(\d{5}).html/);
    if (!match) {
        return '';
    }
    return `<img src="${host}/uploadfile/pic/${match[1]}.jpg">`;
}

function getPageUrls($, link) {
    // Extract every numeric page link from the detail page pagination.
    const pageUrls = new Set([link]);
    $('.page a').each((_, ele) => {
        const text = $(ele).text().trim();
        const href = $(ele).attr('href');
        if (/^\d+$/.test(text) && href) {
            pageUrls.add(new URL(href, host).href);
        }
    });
    return [...pageUrls];
}

async function fetchPageImages(link) {
    // 获取每一页的图片url
    let response = null;
    try {
        response = await got.get(link);
    } catch (error) {
        const statusCode = error.response && error.response.statusCode;
        if (statusCode === 404) {
            console.log('404 Not Found:', link);
            return {
                images: '',
                pageUrls: [link],
            };
        }
        console.log(link, error);
        throw error;
    }

    const $ = cheerio.load(response.data);
    const images = $('.content_left img').get();
    let imageStr = '';
    for (const i of images) {
        imageStr += `<img src="${host + $(i).attr('src')}">`;
    }
    return {
        images: imageStr,
        pageUrls: getPageUrls($, link),
    };
}

async function fetchAllWithCache(ctx, list) {
    return Promise.all(
        list.map((info) =>
            ctx.cache.tryGet('cache:xiuren:' + info.link, async () => {
                console.log('fetchPage ', info.link);
                const firstPage = await ctx.cache.tryGet('page:xiuren:' + info.link, () => fetchPageImages(info.link));
                const pageUrls = firstPage.pageUrls.filter((pageUrl) => pageUrl !== info.link);
                const images = [
                    firstPage.images,
                    ...(await Promise.all(pageUrls.map((pageUrl) =>
                        ctx.cache.tryGet('page:xiuren:' + pageUrl, async () => {
                            const page = await fetchPageImages(pageUrl);
                            return page.images;
                        })))),
                ];

                info.description = '';
                info.description += getCoverImage(info.link);

                for (const i of images) {
                    info.description += i;
                }
                info.pubDate = new Date(info.date).toUTCString();

                const item = {
                    title: info.title,
                    link: info.link,
                    pubDate: new Date(info.date).toUTCString(),
                    description: info.description,
                };

                return Promise.resolve(item);
            })
        )
    )
}

async function hasKeywordInit(ctx, keyword) {
    return ctx.cache.get('keywordInit:' + keyword);
}

function setKeywordInit(ctx, keyword) {
    ctx.cache.set('keywordInit:' + keyword, 'true');
}

async function getKeywordList(ctx, keyword, rootUrl) {
    const firstPage = await getKeywordFirstPage(ctx, keyword, rootUrl);
    if (await hasKeywordInit(ctx, keyword)) {
        return firstPage.list;
    }
    const otherPages = []
    for (let i = 2; i <= Math.min(10, firstPage.pages); i++) {
        otherPages.push(rootUrl + `&p=${i}`);
    }
    responseList = await Promise.all(
        otherPages.map((url) => got(url))
    );
    const pageList = responseList.map((response) => {
        const $ = cheerio.load(response.data);
        return getKeywordPage($);
    }).flat();
    setKeywordInit(ctx, keyword);
    return firstPage.list.concat(pageList).slice(0, 100);
}

function getKeywordPage($) {
    return $('.sousuo').map(function () {
        const pairs = $(this).find('.title').text().trim().split('更新时间：');

        const info = {
            title: pairs[0].trim(),
            link: host + $(this).find('a').attr('href'),
            date: $(this).find('.description').text().match(/\d{4}.\d{2}.\d{2}/)[0],
        };
        return info;
    }).get();
}

async function getKeywordFirstPage(ctx, keyword, rootUrl) {
    const response = await got.get(rootUrl);
    const $ = cheerio.load(response.data);
    return {
        list: getKeywordPage($),
        pages: $('.page').children('a').length,
    }
}

module.exports.Host = host;

module.exports.Search = async (ctx, keyword, rootUrl) => {
    const list = await getKeywordList(ctx, keyword, rootUrl);
    const out = await fetchAllWithCache(ctx, list);

    return {
        title: `秀人网 - ${keyword}`,
        link: rootUrl,
        item: out,
    };
}

module.exports.Func = async (ctx, name, rootUrl) => {
    const response = await got({
        method: 'get',
        url: rootUrl,
        headers: {
            Referer: host,
        },
    });

    const $ = cheerio.load(response.data);

    const list = $('.update_area_lists li')
        .map(function () {
            const info = {
                title: $(this).find('.meta-title').text(),
                link: host + $(this).find('a').attr('href'),
                date: $(this).find('.meta-post').contents()[1].data,
            };
            return info;
        })
        .get()
        .slice(0, 100);

    const out = await fetchAllWithCache(ctx, list);

    return {
        title: `秀人网 - ${name}`,
        link: rootUrl,
        item: out,
    };
};
