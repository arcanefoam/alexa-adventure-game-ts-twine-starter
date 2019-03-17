import {HandlerInput, RequestHandler} from "ask-sdk-core";
import {IntentRequest, Response, SessionEndedRequest, Slot} from "ask-sdk-model";
import * as fs from "fs";
import {loadTwison, Passage, Twison} from "./utils/twison";

const story = "Bettys Quest.json";
const linksRegex = /\[\[([^\|\]]*)\|?([^\]]*)\]\]/g;
const repromptRegex = /([^|]*)\|?([^|]*)/;
const TableName = null;

const c = fs.readFileSync(story, "utf8");
const twine: Twison = loadTwison(c);

export const LaunchRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "LaunchRequest";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`LaunchRequest`);
        const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
        if (sessionAttributes.room !== undefined) {
            const room = currentRoomData(sessionAttributes.room);
            console.log("Found room: ", room);
            let speechText = "Hello, you were playing before and got to the room called ${room.$.name}. " +
                "Would you like to resume? ";
            const reprompt = "Say, resume game, or, new game.";
            speechText = speechText + reprompt;
            const cardTitle = `Restart`;
            const cardContent = speechText;
            const imageObj = undefined;
            console.log(`LaunchRequest: ${JSON.stringify({
                card : {
                    content: cardContent,
                    imageObj,
                    title: cardTitle,
                },
                listen: reprompt,
                speak: speechText,
            })}`);
            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(reprompt)
                .withSimpleCard(cardTitle, cardContent)
                .getResponse();
        } else {
            return WhereAmIRequestHandler.handle(handlerInput);
        }
    },
};

export const ResumeGameRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "ResumeGame";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`ResumeGame`);
        return WhereAmIRequestHandler.handle(handlerInput);
    },
};

export const RestartGameRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "RestartGame";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`RestartGame`);
        const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
        // clear session attributes
        sessionAttributes.room = undefined;
        sessionAttributes.visited = [];
        await handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return WhereAmIRequestHandler.handle(handlerInput);
    },
};

export const WhereAmIRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AMAZON.RepeatIntent";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`Where am I?`);
        let speechOutput = "";
        const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
        if (sessionAttributes.room === undefined) {
            // you just started so you are in the first room
            sessionAttributes.room = twine.startnode;
            speechOutput = `Welcome to ${story.replace(".json", "")}. Lets start your game. `;
        }
        const room = currentRoomData(sessionAttributes.room);
        console.log(`WhereAmI: in ${sessionAttributes.room}`);

        // get displayable text
        // e.g "You are here. [[Go South|The Hall]]" -> "You are here. Go South"
        let displayableText = room.text;
        linksRegex.lastIndex = 0;
        let m = linksRegex.exec(displayableText);
        while (m !== null) {
            displayableText = displayableText.replace(m[0], m[1]);
            linksRegex.lastIndex = 0;
            m = linksRegex.exec(displayableText);
        }
        // strip html
        // displayableText = displayableText.replace(/<\/?[^>]+(>|$)/g, "");
        // displayableText = displayableText.replace("&amp;", "and");
        speechOutput = speechOutput + displayableText;

        // create reprompt from links: "You can go north or go south"
        let reprompt = "";
        for (const l of room.links) {
            m = repromptRegex.exec(l.link);
            console.log("reprompt ", l, m);
            if (m !== null) {
                console.log("match ", m[1]);
                if (reprompt === "") {
                    console.log("start ");
                    if (!m[1].toLowerCase().startsWith("if you")) {
                        reprompt = "You can";
                    }
                } else {
                    console.log(reprompt);
                    reprompt = `${reprompt} or`;
                }
                reprompt = `${reprompt} ${m[1]}`;
            }
        }

        const firstSentence = displayableText.split(".")[0];
        const lastSentence = displayableText.replace("\n", " ").split(". ").pop();
        const reducedContent = `${firstSentence}. ${reprompt}.`;

        // say less if you've been here before
        if (sessionAttributes.visited === undefined) {
            sessionAttributes.visited = [];
        }
        if (sessionAttributes.visited.includes(room.pid)) {
            console.log(`WhereAmI: player is revisiting`);
            speechOutput = reducedContent;
        } else {
            sessionAttributes.visited.push(room.pid);
        }

        const cardTitle = firstSentence;
        const cardContent = (reprompt > "") ? reprompt : lastSentence;
        const imageObj = undefined;
        console.log(`WhereAmI: ${JSON.stringify({
            card : {
                content: cardContent,
                imageObj,
                title: cardTitle,
            },
            listen: reprompt,
            speak: speechOutput,
        })}`);
        linksRegex.lastIndex = 0;
        if (room.links.length === 0) {
            // room has NO links leading out, so listen for further user input
            console.log(`WhereAmI: at the end of a branch. Game over.`);
            // clear session attributes
            sessionAttributes.room = undefined;
            sessionAttributes.visited = [];
            await handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(reprompt)
            .withSimpleCard(cardTitle, cardContent || "")
            .getResponse();
    },
};

export const GoRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "Go";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`Go`);
        const intentRequest = handlerInput.requestEnvelope.request as IntentRequest;
        const slotValues = getSlotValues(intentRequest.intent.slots);
        if (Object.keys(slotValues).length !== 0) {
            const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
            sessionAttributes.room = followLink(sessionAttributes.room,
                [slotValues.direction.resolved, slotValues.direction.synonym]);
            await handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        }
        return WhereAmIRequestHandler.handle(handlerInput);
    },
};

export const PageRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "Page";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        // old-school cyoa: "to go south turn to page 20"..you say, "page 20"
        console.log(`Page`);
        const intentRequest = handlerInput.requestEnvelope.request as IntentRequest;
        const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
        const slotValues = getSlotValues(intentRequest.intent.slots);
        if (intentRequest.intent.slots) {
            sessionAttributes.room =  followLink(sessionAttributes.room, slotValues.page.value);
            await handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        }
        return WhereAmIRequestHandler.handle(handlerInput);
    },
};

export const ThrowRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "Throw";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`Throw`);
        const intentRequest = handlerInput.requestEnvelope.request as IntentRequest;
        const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
        const slotValues = getSlotValues(intentRequest.intent.slots);
        if (intentRequest.intent.slots) {
            sessionAttributes.room =  followLink(sessionAttributes.room,
                [slotValues.item.value, "throw"]);
            await handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        }
        return WhereAmIRequestHandler.handle(handlerInput);
    },
};

export const FightRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "Fight";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`Fight`);
        const intentRequest = handlerInput.requestEnvelope.request as IntentRequest;
        const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
        if (intentRequest.intent.slots) {
            sessionAttributes.room =  followLink(sessionAttributes.room,
                [sessionAttributes.value, "fight"]);
            await handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        }
        return WhereAmIRequestHandler.handle(handlerInput);
    },
};

export const AMAZONHelpIntentRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        let speechOutput = "This is Bettys Quest Skill. ";
        const reprompt = "Say where am I, to hear me speak.";
        speechOutput = speechOutput + reprompt;
        const cardTitle = "Help.";
        const cardContent = speechOutput;
        const imageObj = undefined;
        console.log(`HelpIntent: ${JSON.stringify({
            card : {
                content: cardContent,
                imageObj,
                title: cardTitle,
            },
            listen: reprompt,
            speak: speechOutput,
        })}`);
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(reprompt)
            .withSimpleCard(cardTitle, cardContent)
            .getResponse();
    },
};

export const AMAZONCancelIntentRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AMAZON.CancelIntent";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        return CompletelyExitReqeustHandler.handle(handlerInput);
    },
};

export const CompletelyExitReqeustHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AMAZON.StopIntent";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`CompletelyExitIntent`);
        let speechOutput = "Goodbye.";
        if (TableName) {
            speechOutput = `Your progress has been saved. ${speechOutput}`;
        }
        const cardTitle = "Exit.";
        const cardContent = speechOutput;
        const imageObj = undefined;
        console.log(`CompletelyExit: ${JSON.stringify({
            card : {
                content: cardContent,
                imageObj,
                title: cardTitle,
            },
            listen: null,
            speak: speechOutput,
        })}`);
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withSimpleCard(cardTitle, cardContent)
            .getResponse();
    },
};

export const AMAZONRepeatIntentRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AMAZON.RepeatIntent";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`RepeatIntent`);
        return WhereAmIRequestHandler.handle(handlerInput);
    },
};

export const UnhandledHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "Unhandled";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        console.log(`Unhandled`);
        const intentRequest = handlerInput.requestEnvelope.request as IntentRequest;
        const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
        if (intentRequest.intent.slots) {
            sessionAttributes.room =  followLink(sessionAttributes.room, intentRequest.intent.name);
            await handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        }
        return WhereAmIRequestHandler.handle(handlerInput);
    },
};

export const SessionEndedRequestHandler: RequestHandler = {
    async canHandle(handlerInput: HandlerInput): Promise<boolean> {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "SessionEnded";
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        const endRequest = handlerInput.requestEnvelope.request as SessionEndedRequest;
        console.log(`Session ended: ${endRequest.reason}`);
        return new Promise((resolve) => { resolve(); });
    },
};

function currentRoomData(room: number): Passage {
    return twine.passages[room - 1];
}

/**
 *
 * @param room
 * @param directionOrArray      An array or resolved and synonyms
 */
function followLink(room: any, directionOrArray: string[] | string): any {
    let directions = [];
    if (directionOrArray instanceof Array) {
        directions = directionOrArray;
    } else {
        directions = [directionOrArray];
    }
    const roomData = currentRoomData(room);
    let nextRoom = room;
    let result: any;
    directions.every((direction, index, arr) => {
        console.log(`followLink: try '${direction}' from ${roomData.name}`);
        const directionRegex = new RegExp(`.*${direction}.*`, "i");
        for (const l of roomData.links) {
            console.log("link", l.link);
            result = l.link.match(directionRegex);
            console.log("dirMatch", result);
            if (result && l.target) {
                console.log(`followLink: That would be ${l.target}`);
                nextRoom = l.target;
                break;
            } else if (result) {
                const links = l.link.split("|");
                console.log("linkMatch", links);
                if (links.length > 1) {
                    const target = links[1];
                    console.log(`followLink: check ${links[0]} (${target}) for ${direction} => ${result} `);
                    if (result) {
                        for (const twineRoom of twine.passages) {
                            if (twineRoom.name.toLowerCase() === target.toLowerCase()) {
                                nextRoom = twineRoom.pid;
                                break;
                            }
                        }
                        console.log(`followLink: That would be ${nextRoom}`);
                        break;
                    }
                }
            }
        }
        return !result;
    });
    return nextRoom;
}

// COOKBOOK HELPER FUNCTIONS
function getSlotValues(filledSlots: {[key: string]: Slot} | undefined) {
    // given event.request.intent.slots, a slots values object so you have
    // what synonym the person said - .synonym
    // what that resolved to - .resolved
    // and if it's a word that is in your slot values - .isValidated
    const slotValues: {[key: string]: any} = {};
    console.log("The filled slots: " + JSON.stringify(filledSlots));
    if (filledSlots != null) {
        Object.keys(filledSlots).forEach((item) => {
            console.log("slot: " + item);
            const slot = filledSlots[item];
            if (slot !== null) {
                let found = false;
                let resolution = null;
                const name = slot.name;
                if (slot) {
                    const resolutions = filledSlots[item].resolutions;
                    if (resolutions != null) {
                        const perAuths = resolutions.resolutionsPerAuthority;
                        if (perAuths != null) {
                            resolution = perAuths[0];
                            if (resolution != null) {
                                if (resolution.status && resolution.status.code) {
                                    found = true;
                                }
                            }
                        }
                    }
                }
                if (found && resolution != null) {
                    switch (resolution.status.code) {
                        case "ER_SUCCESS_MATCH":
                            slotValues[name] = {
                                isValidated: true,
                                resolved: resolution.values[0].value.name,
                                synonym: slot.value,
                            };
                            break;
                        case "ER_SUCCESS_NO_MATCH":
                            slotValues[name] = {
                                isValidated: false,
                                resolved: slot.value,
                                synonym: slot.value,
                            };
                            break;
                    }
                } else {
                    slotValues[name] = {
                        isValidated: false,
                        resolved: filledSlots[item].value,
                        synonym: filledSlots[item].value,
                    };
                }
            }
        });
        console.log("slot values: " + JSON.stringify(slotValues));
    }
    return slotValues;
}
