# Alexa with Typescript!!

The editable files are inside of `src`. If you want to transpile Typescript into Javascript you can do `npm run build` and a new folder `lambda` will be created. You can deploy the skill by doing `npm run deploy` in the project root, this will transpile the project, create a new commit and push on the master branch.

If you don't want to fight with Typescript you can also use Javascript files.

The `package.json` in the root file is for the typescript project. If you want to add packages for the alexa skills, you have to modify the `package.json` in the `src` folder.

## Remotes

Add this repository as another remote named `shared` in your alexa-skill repository by doing:

```
git remote add shared https://github.com/DomizianoScarcelli/voicefork-alexa-skill.git
```

You can update the code of your repository from the `shared` remote by doing
```
git pull shared:<branch-name>
```
And you can push the code on one `shared` branch by doing:

```
git push shared <local-branch>:<upstream-branch>
```

Adding the `-u` tag if the upstream branch has to be created.
For example if I want to push the code form my local `master` branch to a new `feature-1` branch on the `shared` repository, I can do:

```
git push -u shared master:feature-1
```
Of course the next time you will push on `feature-1` you don't have to put the `-u` flag because the upstream branch already exists.

BE CAREFUL: In order to pull and push from the `origin` branch, that is you alexa-skill branch, do that explicitly to avoid errors, so pull with `git pull origin master` and push with `git push origin master`. (Use `npm run deploy` instead of push to avoid even more errros!)

Have fun!
