import { SkillBuilders} from "ask-sdk-core";
import {
    AMAZONCancelIntentRequestHandler,
    AMAZONHelpIntentRequestHandler,
    AMAZONRepeatIntentRequestHandler,
    CompletelyExitReqeustHandler,
    FightRequestHandler,
    GoRequestHandler,
    LaunchRequestHandler,
    PageRequestHandler,
    RestartGameRequestHandler,
    ResumeGameRequestHandler,
    SessionEndedRequestHandler, ThrowRequestHandler,
    UnhandledHandler,
    WhereAmIRequestHandler,
} from "./game-intents";
import * as Errors from "./errors";

export let handler: any;
if ("undefined" === typeof process.env.DEBUG) {
     handler = SkillBuilders.custom()
        .addRequestHandlers(
            AMAZONCancelIntentRequestHandler,
            AMAZONHelpIntentRequestHandler,
            AMAZONRepeatIntentRequestHandler,
            CompletelyExitReqeustHandler,
            FightRequestHandler,
            GoRequestHandler,
            ThrowRequestHandler,
            LaunchRequestHandler,
            PageRequestHandler,
            RestartGameRequestHandler,
            ResumeGameRequestHandler,
            SessionEndedRequestHandler,
            UnhandledHandler,
            WhereAmIRequestHandler,
        )
        .addErrorHandlers(Errors.Unknown, Errors.Unexpected)
        .withSkillId("amzn1.ask.skill.fcc5e423-02b0-4673-a290-35bc0f774e88")
        .lambda();
} else {
    handler = SkillBuilders.custom()
        .addRequestHandlers(
            AMAZONCancelIntentRequestHandler,
            AMAZONHelpIntentRequestHandler,
            AMAZONRepeatIntentRequestHandler,
            CompletelyExitReqeustHandler,
            FightRequestHandler,
            GoRequestHandler,
            LaunchRequestHandler,
            PageRequestHandler,
            RestartGameRequestHandler,
            ResumeGameRequestHandler,
            SessionEndedRequestHandler,
            UnhandledHandler,
            WhereAmIRequestHandler,
        )
        .addErrorHandlers(Errors.Unknown, Errors.Unexpected)
        .lambda();
}
