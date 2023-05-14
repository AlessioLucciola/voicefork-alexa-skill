# Alexa with Typescript!!

The editable files are inside of `src`. If you want to transpile Typescript into Javascript you can do `npm run build` and a new folder `lambda` will be created. You can deploy the skill by doing `npm run deploy` in the project root, this will transpile the project, create a new commit and push on the master branch.

If you don't want to fight with Typescript you can also use Javascript files.

The `package.json` in the root file is for the typescript project. If you want to add packages for the alexa skills, you have to modify the `package.json` in the `src` folder.
