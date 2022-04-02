import ejs from 'ejs';

const render = (content, data) => {
    return ejs.render(content, data);
}

export default render;