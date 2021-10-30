const got = require('@/utils/got');
const cheerio = require('cheerio');
const console = require('console');

const host = 'https://www.xrmn5.com';

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

module.exports = async (ctx, name, rootUrl) => {
    const response = await got({
        method: 'get',
        url: rootUrl,
        headers: {
            Referer: `https://www.xrmn5.com`,
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

    const out = await Promise.all(
        list.map((info) =>
            ctx.cache.tryGet('cache:' + info.link, async () => {
                const pages = calPages(info.title);
                const pageUrls = fetchAllPageUrls(info.link, pages);
                console.log('fetchPage ', info.link);
                const images = await Promise.all(pageUrls.map((pageUrl) => ctx.cache.tryGet(pageUrl, () => fetchPageImages(pageUrl))));

                info.description = '';
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
    );

    return {
        title: `秀人网 - ${name}`,
        link: rootUrl,
        item: out,
    };
};
