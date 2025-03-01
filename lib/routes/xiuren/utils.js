const got = require('@/utils/got');
const cheerio = require('cheerio');
const console = require('console');

const host = 'https://xiu01.top';

function getCoverImage(link) {
    const match = link.match(/\/\d{4}\/\d{4}(\d{5}).html/);
    if (!match) {
        return '';
    }
    return `<img src="${host}/uploadfile/pic/${match[1]}.jpg">`;
}

function calPages(title) {
    // 从标题末尾解析出图片数量, 每页3张图片, 计算页数
    const substr = title.slice(-4, -1);
    const regex = /\d+/g;
    const found = substr.match(regex);
    return Math.ceil(parseInt(found[0]) / 3);
}

function fetchAllPageUrls(link, pages) {
    // 根据页数拼接处每一页的 url
    const mainUrl = link.slice(0, -5);
    const list = [link];
    for (let i = 1; i < pages; i++) {
        const pageUrl = `${mainUrl}_${i}.html`;
        list.push(pageUrl);
    }
    return list;
}

async function fetchPageImages(link) {
    // 获取每一页的图片url
    let response = null;
    try {
        response = await got.get(link);
    } catch (error) {
        if (error.response.statusCode === 404) {
            console.log('404 not found:', link);
            return '';
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
    return imageStr;
}

async function fetchAllWithCache(ctx, list) {
    return Promise.all(
        list.map((info) =>
            ctx.cache.tryGet('cache:' + info.link, async () => {
                const pages = calPages(info.title);
                const pageUrls = fetchAllPageUrls(info.link, pages);
                console.log('fetchPage ', info.link);
                const images = await Promise.all(pageUrls.map((pageUrl) =>
                    ctx.cache.tryGet(pageUrl, () => fetchPageImages(pageUrl))));

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
