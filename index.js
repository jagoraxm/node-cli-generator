#!/usr/bin/env node

import fs, { stat } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import shelljs from 'shelljs';
import chalk from 'chalk';

import render from './utils/templates.js';
//const render = require('./utils/templates').render();

// Obtener opciones de los templates
const {pathname: root} = new URL('templates', import.meta.url)
const TEMPLATE_OPTIONS = fs.readdirSync(root);

// console.log(TEMPLATE_OPTIONS);

const QUESTIONS = [
    {
        name: 'template',
        type: 'list',
        message: '¿Qué tipo de proyecto quires generar?',
        choices: TEMPLATE_OPTIONS
    },
    {
        name: 'proyecto',
        type: 'input',
        message: '¿Cuál es el nombre del proyecto?',
        validate: function(input) {
            if(/^([a-z@]{1}[a-z\-\.\\\/0-9]{0,213})+$/.test(input)){
                return true;
            }

            return 'El nombre del proyecto no coincide con las caracteristicas apropiadas.';
        }
    }
];

const DIR_ACTUAL = process.cwd();
inquirer.prompt(QUESTIONS).then(respuestas => {
    const { template, proyecto } = respuestas;

    const templatePath = path.join(root, template);
    const pathTarget = path.join(DIR_ACTUAL, proyecto);

    if(!createProject(pathTarget)) return;

    createDirectoriesFilesContent(templatePath, proyecto);

    postProccess(templatePath, pathTarget);
});

function createProject(projectPath) {
    // Comprobar que no existe el directorio
    if(fs.existsSync(projectPath)) {
        console.log(chalk.red('No puedes crear el directorio porque ya existe'));
        return false;
    }

    fs.mkdirSync(projectPath);
    return true;
}

function createDirectoriesFilesContent(templatePath, projectName) {
    // console.log('Directory created ......................> ',templatePath);
    const listFileDirectories = fs.readdirSync(templatePath);

    listFileDirectories.forEach( item => {

        // console.log('Item created .............> ',item);
        const originalPath = path.join(templatePath, item);

        const stats = fs.statSync(originalPath);

        const writePath = path.join(DIR_ACTUAL, projectName, item);

        if(stats.isFile()) {
            let contents = fs.readFileSync(originalPath, 'utf-8');
            contents = render(contents, {projectName});
            fs.writeFileSync(writePath, contents, 'utf-8');
            
            // Información adicional
            const CREATE = chalk.green('CREATE ');
            const SIZE = stats['size'];

            console.log(`${CREATE} ${originalPath} (${SIZE} bytes)`);
        } else if(stats.isDirectory()) {
            fs.mkdirSync(writePath);

            createDirectoriesFilesContent(path.join(templatePath, item), path.join(projectName, item));
        }
    })
}

function postProccess(templatePath, targetPath) {
    const isNode = fs.existsSync(path.join(templatePath, 'package.json'));

    if(isNode) {
        shelljs.cd(targetPath);
        console.log(chalk.green(`Instalando las dependencias en ${targetPath}`));

        const result = shelljs.exec('npm install');
        if(result != 0) {
            return false;
        }
    }
}