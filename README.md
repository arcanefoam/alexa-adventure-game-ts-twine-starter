# Alexa Interactive Voice Game Skill starter project using AWS Lambda, Typescript, and Twine (with Twison)

This is an Alexa starter project for a basic Interactive Voice Game skill.
The skill is designed to work with a text adventure game created Twine 2 platform, using the Twison format.

If this is your first time working with this type of skill I recommend you read the guide on the [alexa-skill-sample-nodejs-adventure-game](https://github.com/alexa/skill-sample-nodejs-adventure-game/blob/master/instructions/0-intro.md).

##About

**Note**: The rest of this readme assumes you have your developer environment ready to go and that you have some familiarity with CLI (Command Line Interface) Tools, [AWS](https://aws.amazon.com/), and the [ASK Developer Portal](https://developer.amazon.com/alexa-skills-kit).

This starter project provides a TypeScript version of the [skill-sample-nodejs-adventure-game](https://github.com/alexa/skill-sample-nodejs-adventure-game) lambda code available from the Alexa project.
The code has also been modified to support the [Twison](https://github.com/lazerwalker/twison) story format for [Twine 2](http://twinery.org/2), which simply exports the story to JSON.
This simplifies the game parsing and, IMHO, makes it easier to understand (and this removes the dependency to an XML parser).
Typescript compiling is handled with [webpack](https://webpack.js.org).
Finally, a modified version of the per deploy [hooks](https://developer.amazon.com/docs/smapi/ask-cli-intro.html#hooks) is provided so development packages are not deployed when using the ask cli.

## Build commands

3 build scripts are provided:

* **clean**: removes the *build* directory
* **deploy**: deploy the skill to aws
* **build**: Compile to the build,

The rest combine these or provide alternative ask delpoy actions.

## Available intents

The code supports the intents listed in the models/en-GB.json model. If you want to add a new intent you need to add it to the model file and create a new RequestHandler in the game-intent.ts code and then import it in the index.ts.
Also remember to add your new slots (either for existing or new intents) to your model file.
The *deploy* script will publish both the model and the compiled lambda. If you only want to deploy the lambda use the *deploy-lambda* script.

## Local testing

I recommend using the [Alexa Skill Test](https://github.com/tlovett1/alexa-skill-test) library for local testing.  After building with webacpk, navigate to your **build** folder in your bash/cmd and execute:
    
    D:\Users\Alexa\Skills\ineractive-game\build
    λ   npx alexa-skill-test
   
This will launch an http server (port 3000 by default) that lets you test your intents.

You can also use the ask cli:

    D:\Users\Alexa\Skills\ineractive-game
    λ   ask dialog
    
**Note** For testing with the ask cli you need to have previously deployed your skill.


