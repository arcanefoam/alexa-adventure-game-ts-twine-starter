import { ErrorHandler } from "ask-sdk-core";
import { ErrorTypes } from "./utils/constants";

/**
 * Handles unknown errors. Should be placed at the end, as it will catch
 * all errors.
 */
export const Unknown: ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
            .speak("Error handled")
            .reprompt("Error handled")
            .getResponse();
    },
};

/**
 * Handles ErrorTypes.Unexpected errors which should be thrown when something
 * unexpected happens.
 */
export const Unexpected: ErrorHandler = {
    canHandle(_, error) {
        return error.name === ErrorTypes.Unexpected;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
            .speak("Unexpected Error")
            .getResponse();
    },
};
